import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ApiError } from './ai-validation.mjs';
import { enrichReasoningModels, readReasoningMetadata } from './reasoning-models.mjs';

const run = promisify(execFile);
async function readModels(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing model response');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) { await reader.cancel(); throw new Error('Model response too large'); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { reader.releaseLock(); }
}
export function loopbackUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('FITMIND_OAUTH_URL must be a loopback HTTP URL.'); }
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || !['/', '/v1', '/v1/'].includes(url.pathname)) {
    throw new Error('FITMIND_OAUTH_URL must be a loopback HTTP URL without credentials.');
  }
  return url.origin;
}

async function codexBinary() {
  if (process.env.FITMIND_CODEX_BIN) {
    const candidate = process.env.FITMIND_CODEX_BIN;
    if (!path.isAbsolute(candidate) || !/codex(?:\.exe)?$/i.test(path.basename(candidate))) throw new ApiError(503, 'CODEX_NOT_FOUND', 'FITMIND_CODEX_BIN에 설치된 Codex 실행 파일의 절대 경로를 지정해 주세요.');
    await access(candidate);
    return candidate;
  }
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const root = path.join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin');
    for (const entry of (await readdir(root, { withFileTypes: true }).catch(() => [])).reverse()) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(root, entry.name, 'codex.exe');
      try { await access(candidate); return candidate; } catch { /* Try the next installed version. */ }
    }
  }
  // No package installation or npx fallback: only an existing executable is allowed.
  if (process.platform !== 'win32') return 'codex';
  throw new ApiError(503, 'CODEX_NOT_FOUND', '설치된 Codex CLI를 찾지 못했습니다. FITMIND_CODEX_BIN 경로를 확인해 주세요.');
}

export function createOAuthBridge({ upstreamUrl, referenceRoot, fetchImpl = fetch, statusTimeoutMs = 7000, startupTimeoutMs = 25000, modelsCachePath } = {}) {
  let baseUrl = loopbackUrl(upstreamUrl ?? process.env.FITMIND_OAUTH_URL ?? 'http://127.0.0.1:10541');
  const root = referenceRoot ?? process.env.FITMIND_REFERENCE_ROOT ?? 'F:\\06_DavValult\\REEDO_StockImage\\ima2-gen-reedo';
  let proxyProcess = null, connectPromise = null, loginProcess = null, loginUrl = null;

  async function listModels(signal) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}/v1/models`, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(statusTimeoutMs)]) : AbortSignal.timeout(statusTimeoutMs), redirect: 'error' });
    } catch {
      throw new ApiError(503, 'OAUTH_OFFLINE', 'Codex OAuth 연결 또는 모델 조회가 응답하지 않습니다. 연결 상태를 확인해 주세요.');
    }
    if (!response.ok) await response.body?.cancel();
    if (response.status === 401 || response.status === 403) throw new ApiError(401, 'AUTH_REQUIRED', 'Codex 로그인이 필요합니다. 로그인 후 연결 상태를 다시 확인해 주세요.');
    if (!response.ok) throw new ApiError(502, 'OAUTH_UNAVAILABLE', 'OAuth 모델 조회에 실패했습니다. 네트워크와 Codex 로그인 상태를 확인해 주세요.');
    let data;
    try { data = await readModels(response); } catch { throw new ApiError(502, 'INVALID_MODELS', 'OAuth 모델 목록 응답을 읽을 수 없습니다.'); }
    const models = Array.isArray(data.data) ? data.data.filter((item) => typeof item?.id === 'string' && /^gpt-[a-zA-Z0-9._-]+$/.test(item.id) && item.id.length <= 150) : [];
    if (!models.length) throw new ApiError(502, 'NO_MODELS', '현재 OAuth 계정에서 조회된 GPT 모델이 없습니다.');
    const metadata = models.some((model) => !Object.hasOwn(model, 'supported_reasoning_levels')) ? await readReasoningMetadata(modelsCachePath) : new Map();
    return enrichReasoningModels([...new Map(models.map((item) => [item.id, item])).values()], metadata);
  }
  async function status() {
    const loginState = () => ({ loginPending: Boolean(loginProcess), ...(loginUrl ? { loginUrl } : {}) });
    try { return { status: 'ready', models: await listModels(), message: 'Codex OAuth 모델 목록을 확인했습니다.', ...loginState() }; }
    catch (error) { return { status: error.code === 'AUTH_REQUIRED' ? 'auth_required' : 'offline', models: [], message: error.message, ...loginState() }; }
  }
  async function connect() {
    if (connectPromise) return connectPromise;
    connectPromise = (async () => {
      // Never terminate or restart an already-running proxy owned by another project.
      try {
        const health = await fetchImpl(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000), redirect: 'error' });
        await health.body?.cancel();
        if (health.ok) return status();
      } catch { /* Start only the installed bridge when no healthy bridge responds. */ }
      if (proxyProcess && proxyProcess.exitCode === null) return { status: 'offline', models: [], message: 'OAuth 연결을 시작하는 중입니다. 잠시 후 상태를 다시 확인해 주세요.' };
      const entry = path.join(root, 'node_modules', 'openai-oauth', 'dist', 'cli.js');
      try { await access(entry); } catch { throw new ApiError(503, 'BRIDGE_NOT_INSTALLED', '참조 프로젝트의 openai-oauth가 설치되어 있지 않습니다. FITMIND_REFERENCE_ROOT 경로를 확인해 주세요.'); }
      const binary = await codexBinary();
      let version;
      try { version = /\b(\d+\.\d+\.\d+)\b/.exec((await run(binary, ['--version'], { timeout: 5000, windowsHide: true, maxBuffer: 4096 })).stdout)?.[1]; } catch { /* Report a stable message without exposing child output. */ }
      if (!version) throw new ApiError(503, 'CODEX_NOT_FOUND', 'Codex CLI 버전을 확인할 수 없습니다.');
      const preferred = new URL(baseUrl);
      proxyProcess = spawn(process.execPath, [entry, '--host', '127.0.0.1', '--port', preferred.port || '10541', '--codex-version', version], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const child = proxyProcess;
      let output = '';
      // Child output may contain auth details; never forward or log it.
      child.stderr.on('data', () => {});
      await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error) => {
          if (settled) return;
          settled = true; clearTimeout(timer);
          error ? reject(error) : resolve();
        };
        const timer = setTimeout(() => finish(), startupTimeoutMs);
        child.stdout.on('data', (chunk) => {
          output = (output + chunk.toString()).slice(-8000);
          const match = /http:\/\/127\.0\.0\.1:(\d+)\/v1/.exec(output.replace(/\x1b\[[0-9;]*m/g, ''));
          if (match) { baseUrl = loopbackUrl(`http://127.0.0.1:${match[1]}`); finish(); }
        });
        child.once('error', () => finish(new ApiError(503, 'BRIDGE_START_FAILED', 'OAuth 연결 프로세스를 시작하지 못했습니다.')));
        child.once('exit', () => {
          if (proxyProcess === child) proxyProcess = null;
          finish(new ApiError(503, 'BRIDGE_START_FAILED', 'OAuth 연결에 실패했습니다. Codex 로그인과 네트워크 상태를 확인해 주세요.'));
        });
      });
      return status();
    })();
    try { return await connectPromise; } finally { connectPromise = null; }
  }
  async function login() {
    if (loginProcess) return { status: 'login_pending', ...(loginUrl ? { loginUrl } : {}), message: '진행 중인 Codex 브라우저 로그인을 완료한 뒤 연결을 확인해 주세요.' };
    const binary = await codexBinary();
    loginUrl = null;
    const child = spawn(binary, ['login'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    loginProcess = child;
    let output = '';
    const inspect = (chunk) => {
      output = (output + chunk.toString()).slice(-12000);
      for (const match of output.matchAll(/https:\/\/auth\.openai\.com\/[^\s<>"']+/g)) {
        try { const url = new URL(match[0]); if (url.hostname === 'auth.openai.com') loginUrl = url.href; } catch { /* Incomplete chunk. */ }
      }
    };
    child.stdout.on('data', inspect); child.stderr.on('data', inspect);
    const timer = setTimeout(() => { if (loginProcess === child) child.kill(); }, 10 * 60 * 1000);
    timer.unref();
    child.once('exit', () => { clearTimeout(timer); if (loginProcess === child) { loginProcess = null; loginUrl = null; } });
    child.once('error', () => { clearTimeout(timer); if (loginProcess === child) loginProcess = null; });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 700);
      child.once('error', () => { clearTimeout(timer); reject(new ApiError(503, 'LOGIN_START_FAILED', 'Codex 로그인 프로세스를 시작하지 못했습니다.')); });
      child.once('exit', (code) => { clearTimeout(timer); code ? reject(new ApiError(503, 'LOGIN_FAILED', 'Codex 로그인에 실패했습니다. CLI 로그인 상태를 확인해 주세요.')) : resolve(); });
    });
    return { status: 'login_pending', ...(loginUrl ? { loginUrl } : {}), message: 'Codex 브라우저 로그인을 완료한 후 OAuth 연결을 눌러 주세요.' };
  }
  return {
    status, connect, login, listModels,
    get baseUrl() { return baseUrl; },
    close() { proxyProcess?.kill(); loginProcess?.kill(); }
  };
}
