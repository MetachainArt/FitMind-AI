import test from 'node:test';
import assert from 'node:assert/strict';
import { readCompletedResponse } from '../server/response-reader.mjs';

const message = () => ({ id: 'msg_one', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: '{"title":"건강 계획"}' }] });
const done = (item = message(), output_index = 0) => ({ type: 'response.output_item.done', output_index, item });
const completed = (output = []) => ({ type: 'response.completed', response: { id: 'response_one', status: 'completed', error: null, incomplete_details: null, output } });
const encode = (events) => events.map((event) => `event: ${event.type}\r\ndata: ${JSON.stringify(event)}\r\n\r\n`).join('');
function stream(text, chunkSize = 47, onCancel = () => {}) {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new Response(new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) { controller.close(); return; }
      controller.enqueue(bytes.slice(offset, offset + chunkSize)); offset += chunkSize;
    }, cancel: onCancel
  }), { headers: { 'Content-Type': 'text/event-stream' } });
}
const rejects = (response, options) => assert.rejects(readCompletedResponse(response, options), (error) => ['INCOMPLETE_AI_RESPONSE', 'AI_RESPONSE_TOO_LARGE'].includes(error.code));

test('SSE restores completed output items when terminal output is empty, including split Korean UTF-8', async () => {
  const events = [
    { type: 'response.created', response: { id: 'response_one', status: 'in_progress', output: [] } },
    { type: 'response.output_item.added', output_index: 0, item: { ...message(), status: 'in_progress', content: [] } },
    { type: 'response.output_text.delta', delta: 'not a complete plan' },
    done(), completed()
  ];
  const result = await readCompletedResponse(stream(`: heartbeat\r\n\r\n${encode(events)}data: [DONE]\n\n`, 1));
  assert.equal(result.status, 'completed'); assert.deepEqual(result.output, [message()]);
});

test('complete terminal output is accepted only when it agrees with completed streamed items', async () => {
  assert.deepEqual((await readCompletedResponse(stream(encode([done(), completed([message()])])))).output, [message()]);
  assert.deepEqual((await readCompletedResponse(stream(encode([completed([message()])])))).output, [message()]);
  const mismatch = message(); mismatch.content[0].text = 'different';
  await rejects(stream(encode([done(), completed([mismatch])])));
});

test('valid-looking text without a response.completed event never counts as completion', async () => {
  for (const events of [[], [done()], [{ type: 'response.output_text.done', text: message().content[0].text }], [done(), { type: 'response.incomplete', response: { status: 'incomplete' } }]]) await rejects(stream(encode(events)));
  await rejects(stream(`${encode([done()])}data: [DONE]\n\n`));
  await rejects(new Response(JSON.stringify({ status: 'completed', output: [message()] }), { headers: { 'Content-Type': 'application/json' } }));
});

test('failed, mixed responses and unfinished or duplicate output items are rejected', async () => {
  const invalidEvents = [
    [done(), { type: 'response.completed', response: { status: 'in_progress', output: [] } }],
    [done(), { type: 'response.completed', response: { status: 'completed', error: { code: 'failure' }, output: [] } }],
    [{ type: 'response.created', response: { id: 'different' } }, done(), completed()],
    [{ type: 'response.output_item.added', output_index: 1, item: { id: 'unfinished', type: 'message' } }, done(), completed()],
    [done(), done(), completed()],
    [done(message(), 1), completed()],
    [done(), completed(), completed()],
    [done(), { type: 'response.failed', response: { status: 'failed' } }],
    [done({ id: 'tool', type: 'function_call', name: 'execute' }), completed()],
    [done(), { type: 'error', code: 'failure' }]
  ];
  for (const events of invalidEvents) await rejects(stream(encode(events)));
});

test('malformed data and mismatched SSE event labels are rejected', async () => {
  await rejects(stream('event: response.completed\ndata: not-json\n\n'));
  await rejects(stream(`event: response.completed\ndata: ${JSON.stringify(done())}\n\n`));
  await rejects(stream(`${encode([done(), completed()])}data: [DONE]\n\n${encode([done()])}`));
});

test('stream, event and final output limits are enforced and oversized readers are canceled', async () => {
  let canceled = false;
  await rejects(stream(encode([done(), completed()]), 20, () => { canceled = true; }), { maxBytes: 25 });
  assert.equal(canceled, true);
  await rejects(stream(encode([done(), completed()])), { maxEventBytes: 20 });
  await rejects(stream(encode([done(), completed()])), { maxOutputBytes: 20 });
});
