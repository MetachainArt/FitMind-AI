import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = (await readFile(new URL('../app.js', import.meta.url), 'utf8')).replace(/^bootstrap\(\);$/m, '');

function app({ raw = null, readError = false, writeError = false } = {}) {
  const elements = new Map();
  const storage = { raw, writes: 0 };
  const windowListeners = {};
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', innerHTML: '', hidden: false, dataset: {}, files: [],
      listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; },
      querySelectorAll() { return []; }, querySelector() { return null; },
      classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {},
      appendChild() {}, focus() {}, scrollIntoView() {}
    });
    return elements.get(id);
  }
  const context = vm.createContext({
    console, Date, setTimeout, clearTimeout,
    document: { getElementById: element, querySelectorAll: () => [], addEventListener() {} },
    window: { confirm: () => true, addEventListener(type, callback) { windowListeners[type] = callback; }, setInterval: () => 1, clearInterval() {},
      localStorage: { getItem() { if (readError) throw new Error('SecurityError'); return storage.raw; },
        setItem(key, value) { if (writeError) throw new Error('QuotaExceededError'); storage.raw = value; storage.writes++; } } }
  });
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  run('selectedDay = "MON"; ensureSession(selectedDay);');
  return { run, context, element, storage, windowListeners };
}

test('BUG-001 malformed generated backups cannot replace existing memory or disk', async () => {
  for (const draft of [{}, { schedule: [], meal: {} }, { schedule: [{ exercises: null }], meal: { items: [] } }]) {
    const a = app();
    a.run('state.history = [{ sessionKey: "old", date: "2026-01-01" }]; persistState(); renderAll = () => renderGeneratedPlanResult(state.generatedPlanDraft);');
    const before = a.storage.raw;
    a.element('importDataInput').files = [{ size: 100, text: async () => JSON.stringify({ sessions: {}, generatedPlanDraft: draft }) }];
    await a.run('importAppData()');
    assert.equal(a.storage.raw, before);
    assert.equal(a.run('state.history[0].sessionKey'), 'old');
    assert.match(a.element('inbodyMessage').textContent, /복원하지 못/);
  }
});

test('BUG-002 reset works for running, paused and empty sessions and removes the same summary', () => {
  for (const running of [true, false]) {
    const a = app();
    a.run(`renderAll = () => {}; bindEvents(); getCurrentSession().workoutTimerRunning = ${running}; getCurrentSession().workoutElapsedSec = 42; getCurrentSession().setDoneByExercise.test = 1; state.history = [{sessionKey:state.currentSessionKey}];`);
    assert.doesNotThrow(() => a.element('resetSessionBtn').listeners.click());
    assert.equal(a.run('getCurrentSession().workoutElapsedSec'), 0);
    assert.equal(a.run('Object.keys(getCurrentSession().setDoneByExercise).length'), 0);
    assert.equal(a.run('state.history.length'), 0);
  }
});

test('BUG-003 missing metrics stay null through save and reload; explicit zero is preserved', () => {
  const a = app();
  for (const value of ['null', 'undefined', '""', '"  "']) assert.equal(a.run(`normalizeOptionalNumber(${value})`), null);
  assert.equal(a.run('normalizeOptionalNumber(0)'), 0);
  a.run('renderInbodyPanel = () => {};');
  a.element('inbodyWeightInput').value = '70';
  a.run('saveInbodyRecord(); state = loadState();');
  assert.equal(a.run('state.inbodyRecords[0].muscleKg'), null);
  assert.equal(a.run('hasCoreInbodyMetrics(state.inbodyRecords[0])'), false);
});

test('BUG-004 increasing a completed target reopens the exercise and decreasing clamps progress', () => {
  const a = app();
  a.run('const target = getCurrentPlan().exercises[0]; getCurrentSession().setDoneByExercise[target.id] = target.sets.length; getCurrentSession().completedExerciseMap[target.id] = true; state.history = [buildCurrentSummary()]; state.customPlans.MON = {...getCurrentPlan(), exercises:getCurrentPlan().exercises.map(e => ({...e, sets:[...e.sets, "10회"]}))}; syncSessionToCurrentPlan();');
  assert.equal(a.run('isExerciseDone(getCurrentPlan().exercises[0])'), false);
  assert.equal(a.run('state.history[0].completionRate'), a.run('getCompletionRate()'));
  assert.equal(a.run('state.history[0].setTotal'), a.run('getTotalSetCount()'));
  a.run('state.customPlans.MON.exercises[0].sets = ["10회"]; syncSessionToCurrentPlan();');
  assert.equal(a.run('getSetDone(target.id)'), 1);
  assert.equal(a.run('isExerciseDone(getCurrentPlan().exercises[0])'), true);
});

test('BUG-005 image quota fallback removes the candidate image and total failure restores prior records', () => {
  for (const allFail of [false, true]) {
    const a = app();
    a.run(`renderInbodyPanel = () => {}; const imagesAttempted = []; state.inbodyRecords = [{date:"2026-01-01", weightKg:65}]; const oldRecords = JSON.stringify(state.inbodyRecords); pendingInbodyImageDataUrl = "data:image/jpeg;base64,AAAA"; persistState = () => { imagesAttempted.push(state.inbodyRecords[0].imageDataUrl); return ${allFail} ? false : !state.inbodyRecords[0].imageDataUrl; };`);
    a.element('inbodyWeightInput').value = '70';
    a.run('saveInbodyRecord();');
    assert.equal(a.run('imagesAttempted[1]'), '');
    if (allFail) assert.equal(a.run('JSON.stringify(state.inbodyRecords)'), a.run('oldRecords'));
    else assert.equal(a.run('state.inbodyRecords[0].weightKg'), 70);
  }
});

const profile = { goals: ['근육증가'], days: ['월', '수', '금'], timeMin: 70, experience: '초보', place: '집', equipment: ['맨몸'], injury: '', injuryAreas: [], dietPreference: '일반식', allergies: [], weightKg: 70 };

test('BUG-006 home bodyweight plans do not contain machines or silently change the target body part', () => {
  const a = app();
  a.context.profile = profile;
  const plan = a.run('generateAdaptivePlan(profile)');
  for (const day of plan.schedule) for (const exercise of day.exercises) {
    assert.doesNotMatch(exercise.name, /머신|레그프레스|랫풀다운|케이블/);
    assert.equal(exercise.part, day.part);
  }
  a.context.profile = { ...profile, equipment: ['없는장비'], place: '없는장소' };
  assert.equal(a.run('generateAdaptivePlan(profile).schedule[0].exercises.length'), 0);
  assert.match(a.run('generateAdaptivePlan(profile).schedule[0].notice'), /부족|없/);
});

test('BUG-007 every generated day budgets warmup, set performance, transitions, rest and cardio within available time', () => {
  const a = app();
  for (const timeMin of [15, 30, 70, 180]) for (const experience of ['초보', '중급', '고급']) {
    a.context.profile = { ...profile, timeMin, experience, goals: ['체중감량'], place: '헬스장', equipment: ['머신', '케이블'] };
    const plan = a.run('generateAdaptivePlan(profile)');
    for (const day of plan.schedule) {
      const seconds = day.warmupSec + day.cardioSec + day.exercises.reduce((sum, e) => sum + e.sets * 45 + Math.max(0, e.sets - 1) * e.restSec + 60, 0);
      assert.ok(seconds <= timeMin * 60, `${timeMin} ${experience}: ${seconds}`);
      assert.equal(day.estimatedTotalSec, seconds);
    }
  }
});

test('BUG-008 comparison states the actual gap and does not call six months four weeks', () => {
  const a = app();
  const messages = a.run('buildInbodyRecommendations([{date:"2026-09-07",weightKg:78,muscleKg:29,bodyFatPercent:20},{date:"2026-03-07",weightKg:81,muscleKg:30,bodyFatPercent:21}]).join(" ")');
  assert.doesNotMatch(messages, /4주 감량 속도가 빠/);
  assert.match(messages, /184일/);
});

test('BUG-009 summaries keep the session start date across midnight, month and year boundaries', () => {
  const a = app();
  for (const [from, to] of [['2026-09-07', '2026-09-08'], ['2026-09-30', '2026-10-01'], ['2026-12-31', '2027-01-01']]) {
    a.run(`getTodayDateString = () => "${from}"; ensureSession("MON"); getTodayDateString = () => "${to}";`);
    assert.equal(a.run('buildCurrentSummary().date'), from);
  }
});

test('BUG-010 final set and exercise completion stop timers before the summary is saved', () => {
  for (const button of ['completeSetBtn', 'markExerciseDoneBtn']) {
    const a = app();
    a.run('renderAll = () => {}; renderHistory = () => {}; renderAnalytics = () => {}; bindEvents(); const all = getCurrentPlan().exercises; all.forEach(e => {getCurrentSession().setDoneByExercise[e.id] = e.sets.length; getCurrentSession().completedExerciseMap[e.id] = true;}); const last = all[all.length - 1]; getCurrentSession().activeExerciseId = last.id; getCurrentSession().setDoneByExercise[last.id]--; delete getCurrentSession().completedExerciseMap[last.id]; startWorkoutTimer();');
    a.element(button).listeners.click();
    assert.equal(a.run('workoutTimer.running'), false);
    assert.equal(a.run('getCurrentSession().workoutTimerRunning'), false);
    assert.equal(a.run('restTimer.running'), false);
    assert.equal(a.run('state.history[0].workoutElapsedSec'), a.run('getWorkoutElapsedSec(getCurrentSession())'));
  }
});

test('BUG-011 failed storage reads and corrupted JSON allow temporary use without overwriting original data', () => {
  for (const options of [{ readError: true, raw: 'existing' }, { raw: '{broken' }]) {
    let a;
    assert.doesNotThrow(() => { a = app(options); });
    assert.equal(a.run('persistState()'), false);
    assert.equal(a.storage.raw, options.raw);
    assert.equal(a.storage.writes, 0);
    assert.equal(a.element('storageNotice').hidden, false);
  }
});

test('backup restore succeeds for legacy state and preserves AI plan metadata and preferences on reload', async () => {
  const a = app();
  a.context.profile = profile;
  const plan = a.run('generateAdaptivePlan(profile)');
  const snapshot = { goalDetails: '등 근력 키우기', inbodyRecords: [{ date: '2026-09-07', weightKg: 70, muscleKg: null }] };
  const data = { sessions: {}, generatedPlanDraft: { ...plan, source: 'codex-oauth', model: 'gpt-test', inputSnapshot: snapshot }, aiCoachPreferences: { model: 'gpt-test', goalDetails: '등 근력 키우기', inbodyId: 'measurement-1' } };
  a.run('renderAll = () => renderGeneratedPlanResult(state.generatedPlanDraft);');
  a.element('importDataInput').files = [{ size: 100, text: async () => JSON.stringify(data) }];
  await a.run('importAppData()');
  assert.match(a.element('inbodyMessage').textContent, /복원했/);
  const loaded = a.run('loadState()');
  assert.equal(loaded.generatedPlanDraft.source, 'codex-oauth');
  assert.equal(loaded.generatedPlanDraft.model, 'gpt-test');
  assert.equal(JSON.stringify(loaded.generatedPlanDraft.inputSnapshot), JSON.stringify(snapshot));
  assert.equal(loaded.aiCoachPreferences.inbodyId, 'measurement-1');
  a.element('importDataInput').files = [{ size: 100, text: async () => JSON.stringify({ sessions: {} }) }];
  await a.run('importAppData()');
  assert.match(a.element('inbodyMessage').textContent, /복원했/);
});

test('cancelled, over-limit, rendering-failed and storage-failed imports preserve existing records', async () => {
  for (const mode of ['cancel', 'large', 'render', 'quota']) {
    const a = app();
    a.run('state.history = [{sessionKey:"old"}]; persistState(); renderAll = () => {};');
    const before = a.storage.raw;
    if (mode === 'cancel') a.context.window.confirm = () => false;
    if (mode === 'render') a.run('let rendered = false; renderAll = () => { if (!rendered) { rendered = true; throw new Error("render_failed"); } };');
    if (mode === 'quota') a.context.window.localStorage.setItem = () => { throw new Error('quota'); };
    a.element('importDataInput').files = [{ size: mode === 'large' ? 13 * 1024 * 1024 : 100, text: async () => JSON.stringify({ sessions: {}, history: [] }) }];
    await a.run('importAppData()');
    assert.equal(a.storage.raw, before, mode);
    assert.equal(a.run('state.history[0].sessionKey'), 'old', mode);
  }
});

test('legacy default equipment tags migrate while edited names and templates remain intact', () => {
  const a = app();
  const machine = a.run('normalizeExerciseTemplate({ id:"tpl-squat", name:"레그프레스 또는 스쿼트 머신", part:"하체", place:["헬스장","집"], equipment:["머신","맨몸"],goals:["내 목표"], avoid:["무릎"] })');
  assert.equal(JSON.stringify(machine.equipment), '["머신"]');
  assert.equal(JSON.stringify(machine.place), '["헬스장"]');
  assert.equal(machine.goals[0], '내 목표');
  const custom = a.run('normalizeExerciseTemplate({ id:"tpl-squat", name:"내 맨몸 스쿼트", part:"하체", place:["집"], equipment:["맨몸"], goals:[], avoid:[] })');
  assert.equal(custom.name, '내 맨몸 스쿼트');
  assert.equal(custom.equipment[0], '맨몸');
  const migrated = a.run('const oldDefault = cloneGeneratorTemplates(DEFAULT_GENERATOR_TEMPLATES); oldDefault.exercises = oldDefault.exercises.filter(e => !["tpl-bodyweight-squat","tpl-glute-bridge","tpl-push-up","tpl-band-row"].includes(e.id)).map(e => ({...e, ...(LEGACY_GENERATOR_TAGS[e.id] || {})})); normalizeGeneratorTemplates(oldDefault);');
  assert.ok(migrated.exercises.some(e => e.id === 'tpl-push-up'));
});

test('every default selected exercise respects place, equipment and injury constraints', () => {
  const a = app();
  for (const place of ['집', '야외', '헬스장']) for (const equipment of [[], ['맨몸'], ['밴드'], ['머신'], ['케이블']]) {
    a.context.profile = { ...profile, place, equipment, goals: ['복근강화', '체중감량'], injuryAreas: ['허리', '어깨'] };
    const plan = a.run('generateAdaptivePlan(profile)');
    for (const day of plan.schedule) for (const item of day.exercises) {
      const template = a.run(`getGeneratorTemplates().exercises.find(e => e.name === ${JSON.stringify(item.name)})`);
      assert.ok(template.place.includes(place));
      assert.ok(template.equipment.length === 0 || template.equipment.some(tool => tool === '맨몸' || equipment.includes(tool)));
      assert.ok(!template.avoid.some(tag => ['허리', '어깨'].includes(tag)));
    }
  }
});

test('RISK-001 stale timer writes preserve another tab records and retain local progress for backup', () => {
  const a = app();
  a.run('persistState(); getCurrentSession().workoutTimerRunning = true; getCurrentSession().workoutLastTickMs = Date.now() - 40000;');
  const fromOtherTab = JSON.parse(a.storage.raw);
  fromOtherTab.inbodyRecords = [{ date: '2026-09-07', weightKg: 70, muscleKg: null }];
  a.storage.raw = JSON.stringify(fromOtherTab);
  const remoteRaw = a.storage.raw;
  a.run('applyWorkoutElapsedTick(getCurrentSession(), {forcePersist:true});');
  assert.equal(a.storage.raw, remoteRaw);
  assert.equal(a.run('getCurrentSession().workoutElapsedSec >= 40'), true);
  assert.equal(a.run('persistState()'), false);
  assert.match(a.element('storageNotice').textContent, /다른 탭/);
  assert.match(a.element('storageNotice').textContent, /백업/);
});

test('RISK-001 storage events show a sticky conflict including remote deletion', () => {
  for (const remoteRaw of ['{"sessions":{}}', null]) {
    const a = app();
    a.run('bindEvents(); persistState();');
    a.storage.raw = remoteRaw;
    a.windowListeners.storage({ key: 'fitmind_state_v1', newValue: remoteRaw });
    assert.equal(a.element('storageNotice').hidden, false);
    assert.match(a.element('storageNotice').textContent, /다른 탭/);
    assert.equal(a.run('persistState()'), false);
    assert.equal(a.storage.raw, remoteRaw);
  }
});

test('RISK-001 sequential own writes and loading the latest state remain writable', () => {
  const a = app();
  assert.equal(a.run('persistState()'), true);
  assert.equal(a.run('getCurrentSession().searchCount++; persistState()'), true);
  const other = JSON.parse(a.storage.raw);
  other.inbodyRecords = [{ date: '2026-09-07', weightKg: 70 }];
  a.storage.raw = JSON.stringify(other);
  const refreshed = app({ raw: a.storage.raw });
  assert.equal(refreshed.run('persistState()'), true);
  assert.equal(JSON.parse(refreshed.storage.raw).inbodyRecords[0].weightKg, 70);
});

test('RISK-001 confirmed backup restore resolves conflict but a change during confirmation cancels the write', async () => {
  for (const concurrentChange of [false, true]) {
    const a = app();
    a.run('persistState(); renderAll = () => {};');
    a.storage.raw = JSON.stringify({ sessions: {}, history: [{ sessionKey: 'remote' }] });
    a.run('persistState();');
    a.context.window.confirm = () => {
      if (concurrentChange) a.storage.raw = JSON.stringify({ sessions: {}, history: [{ sessionKey: 'even-newer' }] });
      return true;
    };
    a.element('importDataInput').files = [{ size: 100, text: async () => JSON.stringify({ sessions: {}, history: [{ sessionKey: 'confirmed-backup' }] }) }];
    await a.run('importAppData()');
    assert.equal(JSON.parse(a.storage.raw).history[0].sessionKey, concurrentChange ? 'even-newer' : 'confirmed-backup');
    if (concurrentChange) assert.match(a.element('storageNotice').textContent, /다른 탭/);
    else assert.equal(a.run('persistState()'), true);
  }
});
