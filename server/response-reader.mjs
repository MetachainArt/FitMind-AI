import { isDeepStrictEqual } from 'node:util';
import { ApiError } from './ai-validation.mjs';

const invalid = () => new ApiError(422, 'INCOMPLETE_AI_RESPONSE', 'AI 스트림이 완성되지 않았거나 완료 항목이 일치하지 않습니다. 저장하지 않았습니다.');
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);

// Codex may omit output from the terminal response envelope. Keep only complete
// output_item.done items, never infer a complete plan from text deltas.
export async function readCompletedResponse(response, { maxBytes = 2 * 1024 * 1024, maxEventBytes = 262144, maxOutputBytes = 262144 } = {}) {
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) throw invalid();
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let buffer = '', bytes = 0, completed = null, responseId = null, sawEnd = false;
  const added = new Map(), done = new Map();
  function consume(block) {
    if (!block.trim()) return;
    if (Buffer.byteLength(block, 'utf8') > maxEventBytes) throw new ApiError(502, 'AI_RESPONSE_TOO_LARGE', 'AI 스트림 이벤트가 크기 제한을 초과했습니다.');
    let eventName = '';
    const lines = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) lines.push(line.slice(5).trimStart());
    }
    if (!lines.length) return;
    const text = lines.join('\n');
    if (text === '[DONE]') { if (!completed) throw invalid(); sawEnd = true; return; }
    if (sawEnd) throw invalid();
    let event;
    try { event = JSON.parse(text); } catch { throw invalid(); }
    if (!record(event) || typeof event.type !== 'string' || (eventName && eventName !== event.type)) throw invalid();
    if (['error', 'response.failed', 'response.incomplete'].includes(event.type)) throw invalid();
    if (completed) throw invalid();
    if (event.type === 'response.created' || event.type === 'response.in_progress') {
      if (event.response?.id) {
        if (responseId && responseId !== event.response.id) throw invalid();
        responseId = event.response.id;
      }
    }
    if (event.type === 'response.output_item.added' || event.type === 'response.output_item.done') {
      const index = event.output_index, item = event.item;
      if (!Number.isInteger(index) || index < 0 || index > 30 || !record(item) || typeof item.id !== 'string' || !item.id || !['reasoning', 'message'].includes(item.type)) throw invalid();
      if (event.type === 'response.output_item.added') {
        if (added.has(index) || done.has(index)) throw invalid();
        added.set(index, { id: item.id, type: item.type });
      } else {
        if (done.has(index) || (added.has(index) && (added.get(index).id !== item.id || added.get(index).type !== item.type))) throw invalid();
        if ([...done.values()].some((previous) => previous.id === item.id)) throw invalid();
        done.set(index, item);
      }
    }
    if (event.type === 'response.completed') {
      if (!record(event.response) || event.response.status !== 'completed' || event.response.error || event.response.incomplete_details || (responseId && event.response.id !== responseId)) throw invalid();
      completed = event.response;
    }
  }
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) throw new ApiError(502, 'AI_RESPONSE_TOO_LARGE', 'AI 스트림 전체 크기가 제한을 초과했습니다.');
      buffer += decoder.decode(chunk.value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      for (const block of blocks) consume(block);
      if (Buffer.byteLength(buffer, 'utf8') > maxEventBytes) throw new ApiError(502, 'AI_RESPONSE_TOO_LARGE', 'AI 스트림 이벤트가 크기 제한을 초과했습니다.');
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
    if (!completed || !Array.isArray(completed.output)) throw invalid();
    for (const index of added.keys()) if (!done.has(index)) throw invalid();
    const ordered = [...done.entries()].sort(([left], [right]) => left - right);
    if (ordered.some(([index], expected) => index !== expected)) throw invalid();
    const items = ordered.map(([, item]) => item);
    if (completed.output.length && items.length && !isDeepStrictEqual(completed.output, items)) throw invalid();
    const output = completed.output.length ? completed.output : items;
    if (!output.length) throw invalid();
    if (Buffer.byteLength(JSON.stringify(output), 'utf8') > maxOutputBytes) throw new ApiError(502, 'AI_RESPONSE_TOO_LARGE', 'AI 계획 결과가 크기 제한을 초과했습니다.');
    return { ...completed, output };
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof ApiError || error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
    throw invalid();
  } finally { reader.releaseLock(); }
}
