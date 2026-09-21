import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';

const core = (await readFile(new URL('../app.js', import.meta.url), 'utf8')).replace(/^bootstrap\(\);$/m, '');
const client = await readFile(new URL('../ai-coach.js', import.meta.url), 'utf8');
const plan = { title: '검증용 계획', explanation: '입력 조건 확인', schedule: [{ day: '월', part: '전신', cardio: '걷기 5분', exercises: [{ name: '의자 스쿼트', sets: 2, reps: '8-10', restSec: 60 }] }], meal: { name: '일반식', items: ['단백질과 채소'], proteinNote: '나눠 섭취', note: '알레르기 확인' } };

async function fixture({ reply, persistedModel = '', persistedEffort = 'low', writeOk = true } = {}) {
  const elements = new Map(), requests = [];
  let disk = '';
  const makeElement = () => ({
    value: '', textContent: '', innerHTML: '', disabled: false, hidden: false, checked: false, listeners: {}, options: [], children: [], style: {},
    set id(value) { this._id = value; elements.set(value, this); }, get id() { return this._id; },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    replaceChildren(...items) { this.options = items; this.children = items; this.value = items[0]?.value || ''; },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    insertBefore(child) { return this.appendChild(child); },
    add(item) { this.options.push(item); }, setAttribute() {}, closest() { return this; },
    reportValidity() { return true; }, querySelectorAll() { return []; }, classList: { toggle() {} }
  });
  function element(id) {
    if (!elements.has(id)) { const node = makeElement(); node.id = id; node.parentNode = makeElement(); }
    return elements.get(id);
  }
  const context = vm.createContext({
    console, Date, URL, crypto: webcrypto, AbortController, AbortSignal,
    setInterval: () => 1, clearInterval() {},
    Option: function(text, value) { this.text = text; this.value = value; },
    MutationObserver: class { observe() {} },
    location: { protocol: 'http:', hostname: '127.0.0.1' },
    document: { getElementById: element, querySelectorAll: () => [], createElement: makeElement, createTextNode: (textContent) => ({ textContent }) },
    window: { addEventListener() {}, localStorage: { getItem: () => disk || null, setItem(key, value) { if (!writeOk) throw Error('quota'); disk = value; } } },
    fetch: async (url, options) => {
      if (url.endsWith('/status')) return Response.json({ status: 'ready', models: [{ id: 'gpt-test-a', reasoningEfforts: ['low', 'medium'] }, { id: 'gpt-test-b', reasoningEfforts: ['low', 'medium', 'high', 'xhigh'] }] });
      requests.push({ url, body: JSON.parse(options.body), headers: options.headers });
      return reply ? reply(url, options) : Response.json({ plan });
    }
  });
  vm.runInContext(core, context);
  vm.runInContext(`state.aiCoachPreferences.model=${JSON.stringify(persistedModel)}; state.aiCoachPreferences.reasoningEffort=${JSON.stringify(persistedEffort)}; readGeneratorProfile=()=>({value:{goals:['근육증가'],days:['월'],timeMin:60,weightKg:70}}); renderGeneratorPanel=()=>{};`, context);
  vm.runInContext(client, context);
  await new Promise((resolve) => setImmediate(resolve));
  const select = element('aiModelSelect');
  const choose = async () => { select.value = 'gpt-test-b'; await select.listeners.change(); };
  return { element, context, requests, choose, disk: () => disk, run: (s) => vm.runInContext(s, context) };
}

test('AI client sends selected GPT model, goals and only selected Inbody values; stores result metadata', async () => {
  const a = await fixture();
  await a.choose();
  a.element('aiReasoningSelect').value = 'high';
  await a.element('aiReasoningSelect').listeners.change();
  a.run(`state.inbodyRecords=[{id:'selected',date:'2026-09-07',weightKg:70,muscleKg:null,imageDataUrl:'data:image/jpeg;base64,private',memo:'테스트'}];`);
  a.element('aiInbodySelect').value = 'selected';
  a.element('aiGoalDetails').value = '근육을 유지하고 싶어요';
  await a.element('aiRecommendBtn').listeners.click();
  const body = a.requests[0].body;
  assert.equal(body.model, 'gpt-test-b');
  assert.equal(body.reasoningEffort, 'high');
  assert.equal(body.goalDetails, '근육을 유지하고 싶어요');
  assert.equal(body.inbodyRecords[0].muscleKg, null);
  assert.equal('imageDataUrl' in body.inbodyRecords[0], false);
  assert.equal(a.requests[0].headers['X-FitMind-Request'], '1');
  assert.equal(a.run('state.generatedPlanDraft.model'), 'gpt-test-b');
  assert.equal(a.run('state.generatedPlanDraft.source'), 'codex-oauth');
  assert.equal(a.run('state.generatedPlanDraft.reasoningEffort'), 'high');
  assert.equal(JSON.parse(a.disk()).aiCoachPreferences.reasoningEffort, 'high');
  assert.equal(JSON.parse(a.disk()).generatedPlanDraft.inputSnapshot.goalDetails, body.goalDetails);
});

test('reasoning selection restores and unsupported model switches require explicit reselection', async () => {
  const a = await fixture({ persistedModel: 'gpt-test-b', persistedEffort: 'xhigh' });
  assert.equal(a.element('aiReasoningSelect').value, 'xhigh');
  assert.equal(a.element('aiRecommendBtn').disabled, false);
  a.element('aiModelSelect').value = 'gpt-test-a';
  await a.element('aiModelSelect').listeners.change();
  assert.equal(a.element('aiReasoningSelect').value, '');
  assert.equal(a.element('aiRecommendBtn').disabled, true);
  assert.match(a.element('aiRequestStatus').textContent, /강도를 직접 선택/);
  await a.element('aiRefreshBtn').listeners.click();
  assert.equal(a.element('aiReasoningSelect').value, '');
  assert.equal(a.element('aiRecommendBtn').disabled, true);
  await a.element('aiRecommendBtn').listeners.click();
  assert.equal(a.requests.length, 0);
  a.element('aiReasoningSelect').value = 'medium';
  await a.element('aiReasoningSelect').listeners.change();
  await a.element('aiRecommendBtn').listeners.click();
  assert.equal(a.requests[0].body.reasoningEffort, 'medium');
});

test('reasoning settings survive backup normalization and reject unexpected stored values', async () => {
  const a = await fixture();
  assert.equal(a.run('normalizeLoadedState({aiCoachPreferences:{reasoningEffort:"max"}}).aiCoachPreferences.reasoningEffort'), 'max');
  assert.equal(a.run('normalizeLoadedState({aiCoachPreferences:{reasoningEffort:"bogus"}}).aiCoachPreferences.reasoningEffort'), 'low');
  assert.equal(a.run('normalizeLoadedState({}).aiCoachPreferences.reasoningEffort'), 'low');
});

test('AI client does not replace a missing saved model with a different model silently', async () => {
  const a = await fixture({ persistedModel: 'gpt-unavailable' });
  assert.equal(a.element('aiModelSelect').value, '');
  assert.equal(a.element('aiRecommendBtn').disabled, true);
  assert.match(a.element('aiRequestStatus').textContent, /직접 선택/);
});

test('AI error and malformed result preserve the previous draft', async () => {
  for (const response of [Response.json({ error: { code: 'AUTH_REQUIRED', message: '로그인 필요' } }, { status: 401 }), Response.json({ plan: {} })]) {
    const a = await fixture({ reply: async () => response });
    await a.choose();
    a.run('state.generatedPlanDraft={title:"이전 결과"};');
    await a.element('aiRecommendBtn').listeners.click();
    assert.equal(a.run('state.generatedPlanDraft.title'), '이전 결과');
    assert.equal(a.element('aiCancelBtn').hidden, true);
    assert.equal(a.element('generatePlanBtn').disabled, false);
  }
});

test('AI duplicate click and cancellation do not create another request or save an answer', async () => {
  const a = await fixture({ reply: (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })) });
  await a.choose();
  const pending = a.element('aiRecommendBtn').listeners.click();
  await a.element('aiRecommendBtn').listeners.click();
  a.element('aiCancelBtn').listeners.click();
  await pending;
  assert.equal(a.requests.length, 1);
  assert.equal(a.run('state.generatedPlanDraft'), null);
  assert.match(a.element('aiRequestStatus').textContent, /계속될 수/);
  assert.equal(a.element('aiRecommendBtn').disabled, true);
});

test('AI completion cannot overwrite a plan loaded while waiting', async () => {
  let finish;
  const a = await fixture({ reply: () => new Promise((resolve) => { finish = resolve; }) });
  await a.choose();
  const pending = a.element('aiRecommendBtn').listeners.click();
  a.run('state.generatedPlanDraft={title:"새로 연 계획"};');
  finish(Response.json({ plan }));
  await pending;
  assert.equal(a.run('state.generatedPlanDraft.title'), '새로 연 계획');
  assert.match(a.element('aiRequestStatus').textContent, /덮어쓰지/);
});

test('AI storage failure is reported without a false saved message', async () => {
  const a = await fixture({ writeOk: false });
  await a.choose();
  await a.element('aiRecommendBtn').listeners.click();
  assert.match(a.element('aiRequestStatus').textContent, /저장하지 못/);
  assert.equal(a.disk(), '');
});

test('multiple InBody selections send only checked records and allow an explicit empty selection', async () => {
  const a = await fixture(); await a.choose();
  a.run(`state.inbodyRecords=[{id:'first',date:'2026-09-01',weightKg:70,muscleKg:null},{id:'second',date:'2026-09-21',weightKg:69,muscleKg:30,imageDataUrl:'private'}];`);
  a.element('aiInbodySelect').value = 'first'; await a.element('aiInbodySelect').listeners.change();
  let boxes = a.element('aiCompareRecords').children.map((label) => label.children[0]);
  const unchecked = boxes.find((checkbox) => !checkbox.checked); unchecked.checked = true; unchecked.listeners.change();
  await a.element('aiRecommendBtn').listeners.click();
  assert.equal(a.requests[0].body.inbodyRecords.length, 2);
  assert.equal(a.requests[0].body.inbodyRecords[0].muscleKg, null);
  assert.equal(a.requests[0].body.inbodyRecords.some((record) => 'imageDataUrl' in record), false);
  for (let i = 0; i < 2; i++) {
    boxes = a.element('aiCompareRecords').children.map((label) => label.children[0]);
    const checked = boxes.find((checkbox) => checkbox.checked); checked.checked = false; checked.listeners.change();
  }
  await a.element('aiRecommendBtn').listeners.click();
  assert.deepEqual(a.requests[1].body.inbodyRecords, []);
  assert.deepEqual(JSON.parse(a.disk()).aiCoachPreferences.inbodyIds, []);
  assert.equal(a.element('aiInbodySelect').value, 'first');
});

test('weekly adjustment sends original and evidence preview and preserves change reasons in backup', async () => {
  const a = await fixture({ reply: async () => Response.json({ plan: { ...plan, changeReasons: ['시간 제약을 반영했습니다.'] } }) });
  await a.choose();
  a.run(`state.generatedPlanDraft=${JSON.stringify({ ...plan, id: 'original_123' })};`);
  a.element('aiAdaptDifficulty').value = '이번 주는 운동 시간이 부족했어요';
  await a.element('aiAdaptDifficulty').listeners.change();
  await a.element('aiAdaptBtn').listeners.click();
  const request = a.requests[0].body;
  assert.equal(request.adaptation.periodDays, 7); assert.equal(request.adaptation.basePlan.id, 'original_123');
  assert.equal(request.adaptation.performance.recordedDays, 0); assert.equal(request.adaptation.performance.unrecordedDays, 7);
  const persisted = JSON.parse(a.disk());
  assert.equal(persisted.generatedPlanDraft.inputSnapshot.adaptation.basePlan.id, 'original_123');
  assert.deepEqual(persisted.generatedPlanDraft.inputSnapshot.changeReasons, ['시간 제약을 반영했습니다.']);
  assert.match(a.element('aiChangeReasons').textContent, /시간 제약/);
});

test('adjustment with no evidence or missing change reasons preserves original and never reports success', async () => {
  const a = await fixture(); await a.choose();
  a.run(`state.generatedPlanDraft=${JSON.stringify({ ...plan, id: 'original_123' })};`);
  await a.element('aiAdaptBtn').listeners.click();
  assert.equal(a.requests.length, 0); assert.match(a.element('aiRequestStatus').textContent, /수행 기록이 없습니다/);
  a.element('aiAdaptDifficulty').value = '시간이 부족합니다';
  await a.element('aiAdaptBtn').listeners.click();
  assert.equal(a.requests.length, 1); assert.equal(a.run('state.generatedPlanDraft.id'), 'original_123');
  assert.match(a.element('aiRequestStatus').textContent, /변경 이유가 누락/);
});
