import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { once } from 'node:events';
import { createServer } from '../server/index.mjs';
import { validateRequest, validatePlan } from '../server/ai-validation.mjs';

const source = (await readFile(new URL('../ai-coach.js', import.meta.url), 'utf8')).split('/* UI wiring:')[0];
const context = vm.createContext({ Date, Map, Set });
vm.runInContext(source, context);
const helpers = vm.runInContext('FitMindAdaptation', context);
const plain = (value) => JSON.parse(JSON.stringify(value));
const profile = { goals: ['건강관리'], days: ['월'], timeMin: 30, heightCm: 170, weightKg: 70, age: 35, sex: '남성', experience: '초보', place: '집', equipment: ['맨몸'], injury: '', injuryAreas: [], dietPreference: '일반식', allergies: [] };
const original = { id: 'original_plan', title: '기존 계획', explanation: '기존 조건', schedule: [{ day: '월', part: '전신', cardio: '걷기 5분', exercises: [{ name: '의자 앉았다 일어나기', sets: 2, reps: '8-10', restSec: 45 }] }], meal: { name: '균형 식단', items: ['밥과 채소'], proteinNote: '단백질 음식 포함', note: '원재료 확인' } };
const resultPlan = { ...original, title: '조정 계획', changeReasons: ['실제 기록이 부족해 기존 운동량을 유지하고, 사용자가 어려워한 시간대만 검토했습니다.'] };
function body() {
  return { requestId: 'adapt_request_123', model: 'gpt-test', reasoningEffort: 'low', profile: structuredClone(profile), inbodyRecords: [], goalDetails: '규칙적으로 운동하기',
    adaptation: { periodDays: 7, fromDate: '2026-09-15', toDate: '2026-09-21', difficulty: '운동 시간을 지키기 어려웠어요', basePlan: plain(helpers.basePlan(original)),
      performance: { records: [], recordedDays: 0, unrecordedDays: 7, omittedSessions: 0, omittedActualSets: 0 } } };
}

test('InBody comparison uses real date gaps and only paired, non-missing numbers', () => {
  const rows = [
    { date: '2026-09-21', weightKg: 69, muscleKg: null, bodyFatPercent: 19 },
    { date: '2026-09-01', weightKg: 70, muscleKg: 30, bodyFatPercent: 20 },
    { date: '2026-09-10', weightKg: null, muscleKg: 31, bodyFatPercent: null }
  ];
  const result = plain(helpers.compareInbody(rows));
  assert.deepEqual(result.find((item) => item.key === 'weightKg'), { key: 'weightKg', comparable: true, fromDate: '2026-09-01', toDate: '2026-09-21', days: 20, from: 70, to: 69, change: -1 });
  assert.equal(result.find((item) => item.key === 'muscleKg').days, 9);
  assert.equal(result.find((item) => item.key === 'waistCm').comparable, false);
  const cleaned = plain(helpers.cleanInbody({ date: '2026-09-21', muscleKg: null, imageDataUrl: 'private', memo: '사용자 메모' }));
  assert.equal(cleaned.weightKg, null); assert.equal('imageDataUrl' in cleaned, false);
});

test('single, invalid and duplicate-date InBody data never creates an invented trend', () => {
  assert.equal(helpers.compareInbody([{ date: '2026-09-21', weightKg: 70 }])[0].comparable, false);
  assert.equal(helpers.compareInbody([{ date: '2026-02-30', weightKg: 70 }, { date: '2026-09-21', weightKg: 69 }])[0].comparable, false);
  assert.equal(helpers.compareInbody([{ date: '2026-09-01', weightKg: 70 }, { date: '2026-09-01', weightKg: 72 }, { date: '2026-09-21', weightKg: 69 }])[0].comparable, false);
});

test('performance preserves unknown days and real sets separately from completion marks', () => {
  const saved = { history: [{ sessionKey: '2026-09-20_SUN', date: '2026-09-20', dayCode: 'SUN', setDone: 2, setTotal: 3, completionRate: 67, workoutElapsedSec: 1200 }], sessions: {
    '2026-09-20_SUN': { dayCode: 'SUN', sourcePlanId: 'original_plan', exerciseNamesById: { squat: '스쿼트' }, actualSetsByExercise: { squat: [{ load: '40', reps: '8', rir: 0, recordedAt: '2026-09-20T03:00:00Z' }] } },
    '2026-09-21_MON': { dayCode: 'MON', actualSetsByExercise: { row: [{ load: '', reps: '10', rir: null, recordedAt: '2026-09-21T03:00:00Z' }] } },
    '2026-09-01_TUE': { actualSetsByExercise: { old: [{ load: '99', reps: '99' }] } }
  } };
  const result = plain(helpers.performance(saved, 7, '2026-09-21'));
  assert.equal(result.fromDate, '2026-09-15'); assert.equal(result.recordedDays, 2); assert.equal(result.unrecordedDays, 5);
  assert.equal(result.records[0].completionRate, null); assert.equal(result.records[0].actualSetCount, 1);
  assert.equal(result.records[1].actualSets[0].rir, 0); assert.equal(result.records[1].actualSets[0].name, '스쿼트');
  assert.equal(result.records[0].actualSets[0].name, '');
  assert.equal(plain(helpers.performance({ history: [], sessions: {} }, 28, '2026-09-21')).fromDate, '2026-08-25');
});

test('large performance histories disclose omitted actual details and preserve total counts', () => {
  const rows = Array.from({ length: 90 }, (_, i) => ({ load: '20', reps: String(i + 1), rir: null, recordedAt: '2026-09-21T00:00:00Z' }));
  const result = plain(helpers.performance({ sessions: { '2026-09-21_MON': { dayCode: 'MON', actualSetsByExercise: { exercise: rows } } } }, 7, '2026-09-21'));
  assert.equal(result.records[0].actualSetCount, 90); assert.equal(result.records[0].actualSets.length, 80); assert.equal(result.omittedActualSets, 10);
});

test('partial sessions count as recorded without a saved summary or optional actual weight entries', () => {
  const result = plain(helpers.performance({ sessions: {
    '2026-09-21_MON': { dayCode: 'MON', setDoneByExercise: { squat: 2 }, workoutElapsedSec: 400 },
    '2026-09-20_SUN': { dayCode: 'SUN', setDoneByExercise: { row: 1 }, planSnapshot: { exercises: [{ id: 'row', sets: ['10회', '10회'] }] } },
    '2026-09-19_SAT': { dayCode: 'SAT', workoutElapsedSec: 200 },
    '2026-09-18_FRI': { dayCode: 'FRI', workoutElapsedSec: 0 }
  } }, 7, '2026-09-21'));
  assert.equal(result.recordedDays, 3); assert.equal(result.unrecordedDays, 4);
  assert.equal(result.records[0].setDone, 2); assert.equal(result.records[0].setTotal, null); assert.equal(result.records[0].completionRate, null);
  assert.equal(result.records[1].completionRate, 0); assert.equal(result.records[2].setDone, null);
});

test('today replacement progress excludes retired exercise marks but preserves their actual measurements', () => {
  const result = plain(helpers.performance({ sessions: {
    '2026-09-21_MON': { dayCode: 'MON', setDoneByExercise: { retired: 2, replacement: 0 }, completedExerciseMap: {},
      planSnapshot: { exercises: [{ id: 'replacement', sets: ['10회'] }] },
      actualSetsByExercise: { retired: [{ load: '40', reps: '8', rir: 2, recordedAt: '2026-09-21T00:00:00Z' }] } }
  } }, 7, '2026-09-21'));
  const record = result.records[0];
  assert.equal(record.setDone, 0); assert.equal(record.setTotal, 1); assert.equal(record.completionRate, 0);
  assert.equal(record.actualSets[0].exerciseId, 'retired'); assert.equal(record.actualSetCount, 1);
  const request = body(); request.adaptation.performance = result;
  assert.equal(validateRequest(request).adaptation.performance.records[0].setDone, 0);
});

test('partial snapshot completion uses completed exercises, not the proportion of completed sets', () => {
  const result = plain(helpers.performance({ sessions: {
    '2026-09-21_MON': { dayCode: 'MON', setDoneByExercise: { first: 99, second: 1, retired: 20 },
      planSnapshot: { exercises: [{ id: 'first', sets: ['10회', '10회', '10회'] }, { id: 'second', sets: ['10회', '10회'] }] } }
  } }, 7, '2026-09-21'));
  assert.equal(result.records[0].setDone, 4); assert.equal(result.records[0].setTotal, 5);
  assert.equal(result.records[0].completionRate, 50);
});

test('adaptation validation derives recorded-day counts and rejects invalid intervals, unsafe RIR or absent evidence', () => {
  const request = body(); request.adaptation.performance.recordedDays = 7;
  assert.equal(validateRequest(request).adaptation.performance.recordedDays, 0);
  const missing = body(); missing.adaptation.difficulty = '';
  assert.throws(() => validateRequest(missing), /수행 기록이나/);
  const range = body(); range.adaptation.fromDate = '2026-09-14';
  assert.throws(() => validateRequest(range), /기간이 일치/);
  const unsafe = body(); unsafe.adaptation.performance.records = [{ date: '2026-09-20', dayCode: 'SUN', actualSetCount: 1, actualSets: [{ exerciseId: 'squat', setIndex: 1, load: '40', reps: '10', rir: 11 }] }];
  assert.throws(() => validateRequest(unsafe), /잔여 반복/);
  assert.throws(() => validatePlan(original, profile, { requireChangeReasons: true }), /검증/);
  assert.deepEqual(validatePlan(resultPlan, profile, { requireChangeReasons: true }).changeReasons, resultPlan.changeReasons);
});

test('saved-plan identity and original conditions remain distinct from current adjustment conditions', () => {
  const saved = { ...original, id: 'saved_123', originPlanId: 'original_ai_123', profile: { ...profile, timeMin: 60, injury: '무릎 주의', injuryAreas: ['무릎'], allergies: ['땅콩'], equipment: ['밴드'] },
    inputSnapshot: { goalDetails: '무릎 부담 없이 체력 기르기', adaptation: { recursivelyNested: 'must not copy' } } };
  const base = plain(helpers.basePlan(saved));
  assert.equal(base.id, 'original_ai_123'); assert.equal(base.profile.timeMin, 60);
  assert.equal(base.inputSnapshot.goalDetails, '무릎 부담 없이 체력 기르기'); assert.equal('adaptation' in base.inputSnapshot, false);
  const request = body(); request.adaptation.basePlan = base;
  const validated = validateRequest(request);
  assert.equal(validated.profile.timeMin, 30); assert.equal(validated.adaptation.basePlan.profile.timeMin, 60);
  assert.deepEqual(validated.adaptation.basePlan.profile.allergies, ['땅콩']); assert.equal(validated.adaptation.basePlan.profile.injury, '무릎 주의');
});

test('AI time metadata is derived from validated exercise/cardio values rather than trusting generated metadata', () => {
  const answer = structuredClone(resultPlan);
  Object.assign(answer.schedule[0], { warmupSec: 999, cardioSec: 0, estimatedTotalSec: 1 });
  const day = validatePlan(answer, profile).schedule[0];
  assert.equal(day.warmupSec, 180); assert.equal(day.cardioSec, 300); assert.equal(day.estimatedTotalSec, 645);
  assert.equal(day.cardio, '걷기 5분'); assert.equal(day.exercises[0].sets, 2);
});

test('adaptation endpoint forwards sanitized original/evidence and requires change reasons without retry', async (t) => {
  const calls = [];
  let answer = structuredClone(resultPlan);
  const server = createServer({ bridge: { baseUrl: 'http://127.0.0.1:1', listModels: async () => [{ id: 'gpt-test', reasoningEfforts: ['low'] }] },
    fetchImpl: async (url, options) => {
      calls.push(JSON.parse(options.body));
      const output = { id: 'message', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(answer) }] };
      const events = [{ type: 'response.output_item.done', output_index: 0, item: output }, { type: 'response.completed', response: { status: 'completed', output: [] } }];
      return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
    } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const send = (request) => fetch(`http://127.0.0.1:${server.address().port}/api/ai/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-FitMind-Request': '1' }, body: JSON.stringify(request) });
  const request = body(); request.adaptation.basePlan.secret = 'do not send';
  const response = await send(request);
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).plan.changeReasons, resultPlan.changeReasons);
  const forwarded = JSON.parse(calls[0].input[1].content);
  assert.equal(forwarded.adaptation.basePlan.id, 'original_plan'); assert.equal('secret' in forwarded.adaptation.basePlan, false);
  assert.equal(forwarded.adaptation.performance.unrecordedDays, 7);
  delete answer.changeReasons;
  assert.equal((await send({ ...body(), requestId: 'missing_reason_123' })).status, 422);
  assert.equal(calls.length, 2);
});
