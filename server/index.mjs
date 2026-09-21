import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ApiError, SYSTEM_PROMPT, validateRequest, validatePlan } from './ai-validation.mjs';
import { createOAuthBridge } from './oauth-bridge.mjs';
import { readCompletedResponse } from './response-reader.mjs';

const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const STATIC_FILES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']], ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/ai-coach.js', ['ai-coach.js', 'text/javascript; charset=utf-8']],
  ['/routine-planner.js', ['routine-planner.js', 'text/javascript; charset=utf-8']], ['/workout-journal.js', ['workout-journal.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
]);

function send(res, status, body) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
async function readJson(req) {
  if (!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type'] ?? '')) throw new ApiError(415, 'JSON_REQUIRED', 'JSON 요청만 사용할 수 있습니다.');
  if (Number(req.headers['content-length']) > 65536) {
    req.resume();
    throw new ApiError(413, 'BODY_TOO_LARGE', '입력 데이터가 너무 큽니다. 최근 인바디 기록 30개 이하로 줄여 주세요.');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 65536) { req.resume(); throw new ApiError(413, 'BODY_TOO_LARGE', '입력 데이터가 너무 큽니다. 최근 인바디 기록 30개 이하로 줄여 주세요.'); }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ApiError(400, 'INVALID_JSON', '요청 데이터를 읽을 수 없습니다.'); }
}
export function createServer({ root = DEFAULT_ROOT, upstreamUrl, referenceRoot, fetchImpl = fetch, bridge: providedBridge, requestTimeoutMs = 180000, statusTimeoutMs = 7000, cooldownMs = 60000, modelsCachePath } = {}) {
  const bridge = providedBridge ?? createOAuthBridge({ upstreamUrl, referenceRoot, fetchImpl, statusTimeoutMs, modelsCachePath });
  let active = null, cooldownUntil = 0;
  const completedIds = new Map();
  const busy = () => Boolean(active) || Date.now() < cooldownUntil;
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    try {
      const port = server.address()?.port;
      const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
      if (!hosts.has(req.headers.host) || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) || req.headers['sec-fetch-site'] === 'cross-site') {
        throw new ApiError(403, 'ORIGIN_REJECTED', '같은 로컬 FitMind 화면에서만 요청할 수 있습니다.');
      }
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname.startsWith('/api/')) {
        if (req.method === 'GET' && url.pathname === '/api/ai/status') {
          const status = await bridge.status();
          send(res, 200, { ...status, busy: busy(), ...(Date.now() < cooldownUntil ? { retryAfterSec: Math.ceil((cooldownUntil - Date.now()) / 1000) } : {}) });
          return;
        }
        if (req.method !== 'POST') throw new ApiError(405, 'METHOD_NOT_ALLOWED', '지원하지 않는 요청 방식입니다.');
        if (req.headers['x-fitmind-request'] !== '1') throw new ApiError(403, 'REQUEST_HEADER_REQUIRED', 'FitMind 요청 확인 헤더가 필요합니다.');
        const body = await readJson(req);
        if (url.pathname === '/api/ai/connect') { send(res, 200, { ...await bridge.connect(), busy: busy() }); return; }
        if (url.pathname === '/api/ai/login') {
          if (busy()) throw new ApiError(409, 'AI_BUSY', '진행 중인 AI 요청이 끝난 후 로그인해 주세요.');
          send(res, 200, await bridge.login()); return;
        }
        if (url.pathname !== '/api/ai/recommend') throw new ApiError(404, 'NOT_FOUND', '요청한 API가 없습니다.');
        const input = validateRequest(body);
        for (const [id, time] of completedIds) if (Date.now() - time > 10 * 60 * 1000) completedIds.delete(id);
        if (completedIds.has(input.requestId) || active?.requestId === input.requestId) throw new ApiError(409, 'DUPLICATE_REQUEST', '이미 처리 중이거나 처리한 요청입니다. 새 요청으로 다시 시도해 주세요.');
        if (busy()) throw new ApiError(409, 'AI_BUSY', '이전 AI 요청이 아직 처리 중입니다. 취소해도 OAuth 서버 생성은 계속될 수 있으므로 잠시 후 연결 상태를 확인해 주세요.');
        active = { requestId: input.requestId };
        let submitted = false;
        const controller = new AbortController();
        active.controller = controller;
        const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), requestTimeoutMs);
        // openai-oauth 1.0.2 does not forward client disconnect cancellation to
        // generation. Keep the job guard until completion instead of duplicating
        // a still-running request when the browser stops waiting.
        try {
          const models = await bridge.listModels(controller.signal);
          const selectedModel = models.find(({ id }) => id === input.model);
          if (!selectedModel) throw new ApiError(400, 'MODEL_NOT_AVAILABLE', '현재 OAuth 모델 목록에 없는 모델입니다. 연결 상태를 새로 확인해 주세요.');
          if (!selectedModel.reasoningEfforts?.includes(input.reasoningEffort)) throw new ApiError(400, 'REASONING_NOT_AVAILABLE', '선택한 모델에서 지원하는 추론 강도가 아닙니다. 모델과 추론 강도를 다시 확인해 주세요.');
          if (res.destroyed) return;
          completedIds.set(input.requestId, Date.now());
          if (completedIds.size > 1000) completedIds.delete(completedIds.keys().next().value);
          submitted = true;
          const response = await fetchImpl(`${bridge.baseUrl}/v1/responses`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, redirect: 'error', signal: controller.signal,
            body: JSON.stringify({ model: input.model, stream: true, store: false, tools: [], reasoning: { effort: input.reasoningEffort },
              input: [{ role: 'developer', content: SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ profile: input.profile, inbodyRecords: input.inbodyRecords, goalDetails: input.goalDetails,
                ...(input.adaptation ? { adaptation: input.adaptation } : {}) }) }]
            })
          });
          if (!response.ok) await response.body?.cancel();
          if (response.status === 401 || response.status === 403) throw new ApiError(401, 'AUTH_REQUIRED', 'Codex 인증이 만료되었거나 모델 권한이 없습니다. 로그인과 모델 선택을 확인해 주세요.');
          if (response.status === 429) throw new ApiError(429, 'AI_RATE_LIMIT', 'OAuth 사용량 한도 또는 요청 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.');
          if (!response.ok) throw new ApiError(502, 'AI_UPSTREAM_FAILED', 'OAuth AI 요청에 실패했습니다. 연결 상태를 확인해 주세요.');
          const data = await readCompletedResponse(response);
          // Use the native Responses completion marker. The installed proxy's
          // Chat adapter loses finish_reason with its bundled AI SDK version.
          // Never infer completion merely from parseable text.
          const output = data.output;
          const messages = Array.isArray(output) ? output.filter((item) => item?.type === 'message') : [];
          if (data.status !== 'completed' || data.error || data.incomplete_details || !Array.isArray(output) || output.some((item) => !['reasoning', 'message'].includes(item?.type)) || messages.length !== 1) throw new ApiError(422, 'INCOMPLETE_AI_RESPONSE', 'AI 응답이 잘렸거나 유효한 계획을 반환하지 않았습니다. 저장하지 않았습니다.');
          const message = messages[0];
          if (message.role !== 'assistant' || message.status !== 'completed' || message.refusal || message.tool_calls?.length || !Array.isArray(message.content) || !message.content.length || message.content.some((item) => item?.type !== 'output_text' || typeof item.text !== 'string' || item.refusal)) throw new ApiError(422, 'INCOMPLETE_AI_RESPONSE', 'AI 응답이 거절되었거나 완성된 텍스트 계획이 아닙니다. 저장하지 않았습니다.');
          const content = message.content.map((item) => item.text).join('');
          let parsed;
          try { parsed = JSON.parse(content); } catch { throw new ApiError(422, 'INVALID_AI_JSON', 'AI가 올바른 JSON 계획을 반환하지 않았습니다. 저장하지 않았습니다.'); }
          const plan = validatePlan(parsed, input.profile, { requireChangeReasons: Boolean(input.adaptation) });
          send(res, 200, { plan, model: input.model, reasoningEffort: input.reasoningEffort, requestId: input.requestId });
        } catch (error) {
          if (controller.signal.aborted) {
            if (submitted) cooldownUntil = Date.now() + cooldownMs;
            throw new ApiError(504, 'AI_TIMEOUT', 'AI 응답 시간이 초과되었습니다. OAuth 서버에서 생성이 계속될 수 있어 1분간 새 요청을 제한합니다.');
          }
          if (error instanceof ApiError) throw error;
          throw new ApiError(502, 'AI_CONNECTION_FAILED', 'OAuth AI 연결이 끊겼습니다. 연결 상태를 확인해 주세요.');
        } finally { clearTimeout(timer); active = null; }
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new ApiError(405, 'METHOD_NOT_ALLOWED', '지원하지 않는 요청 방식입니다.');
      const file = STATIC_FILES.get(url.pathname);
      if (!file) throw new ApiError(404, 'NOT_FOUND', '파일을 찾을 수 없습니다.');
      let content;
      try { content = await readFile(path.join(root, file[0])); } catch { throw new ApiError(404, 'NOT_FOUND', '파일을 찾을 수 없습니다.'); }
      res.writeHead(200, { 'Content-Type': file[1] });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const expected = error instanceof ApiError;
      send(res, expected ? error.status : 500, { error: { code: expected ? error.code : 'INTERNAL_ERROR', message: expected ? error.message : '서버에서 요청을 처리하지 못했습니다.' } });
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.on('close', () => { active?.controller?.abort(); bridge.close?.(); });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.FITMIND_PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('FITMIND_PORT must be between 1 and 65535.');
  const server = createServer();
  server.on('error', () => { console.error('FitMind 로컬 서버를 시작하지 못했습니다. 포트 사용 상태를 확인해 주세요.'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`FitMind: http://127.0.0.1:${port}`));
  const stop = () => { server.close(); server.closeAllConnections(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
