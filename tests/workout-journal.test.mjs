import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../workout-journal.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ fail = false, mount = false } = {}) {
  const context = vm.createContext({ Date, console });
  vm.runInContext(source, context);
  const api = context.WorkoutJournal;
  const base = { theme: '기본', exercises: [{ id: 'press', name: '체스트 프레스', sets: ['40kg x10회', '40kg x10회'], restSec: 60, howTo: '원래 운동 설명' }] };
  const session = { sessionKey: '2026-09-21_MON', activeExerciseId: 'press', setDoneByExercise: {}, completedExerciseMap: {} };
  const state = { sessions: { [session.sessionKey]: session }, history: [{ sessionKey: session.sessionKey, setDone: 0 }] };
  let writes = 0;
  let persisted = null;
  let restStops = 0;
  let pauses = 0;
  const fields = new Map();
  const element = mount ? {
    innerHTML: '', addEventListener() {},
    querySelector(selector) {
      if (!fields.has(selector)) fields.set(selector, { value: '', textContent: '' });
      return fields.get(selector);
    }
  } : null;
  const journal = api.create({
    mount: element,
    getState: () => state, getSession: () => session, getPlan: () => session.planSnapshot || base,
    persist: () => { writes++; if (!fail) persisted = plain(state); return !fail; }, render() {},
    getElapsed: () => 125,
    syncSummary: () => { state.history[0].setDone = session.setDoneByExercise.press || 0; },
    stopRest: () => { restStops++; }, pauseWorkout: () => { pauses++; }
  });
  return { api, journal, state, session, base, element, fields, persisted: () => persisted, counts: () => ({ writes, restStops, pauses }) };
}

test('actual sets preserve text/BW/time and stay separate from target/completion', () => {
  const a = fixture();
  const original = plain(a.base);
  assert.equal(a.journal.saveSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index: 1, load: '맨몸', reps: '30초', rir: '' }), true);
  assert.equal(a.session.actualSetsByExercise.press[0].recordedAt, '');
  assert.equal(a.session.actualSetsByExercise.press[1].load, '맨몸');
  assert.equal(a.session.actualSetsByExercise.press[1].rir, null);
  assert.equal(a.session.exerciseNamesById.press, '체스트 프레스');
  assert.deepEqual(a.base, original);
  assert.deepEqual(a.session.setDoneByExercise, {});
});

test('invalid actual inputs never mutate the session or write storage', () => {
  const a = fixture();
  for (const value of [{ load: '50kg', reps: '' }, { reps: '10', rir: 11 }, { reps: '10', rir: 'not number' }, { reps: '10', rir: 1.5 }]) {
    assert.equal(a.journal.saveSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index: 0, ...value }), false);
  }
  assert.equal(a.session.actualSetsByExercise, undefined);
  assert.equal(a.counts().writes, 0);
});

test('storage failure rolls back actual records and summary without stopping timers', () => {
  const a = fixture({ fail: true });
  const before = plain(a.state);
  assert.equal(a.journal.saveSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index: 0, load: '40kg', reps: '10', rir: 2 }), false);
  assert.deepEqual(plain(a.state), before);
  assert.deepEqual(a.counts(), { writes: 1, restStops: 0, pauses: 0 });
});

test('same-name records match across changing plan IDs, excluding other exercises/future dates', () => {
  const a = fixture();
  a.state.sessions['2026-09-14_MON'] = { sessionKey: '2026-09-14_MON', exerciseNamesById: { ai123: '체스트 프레스', other: '랫풀다운' }, actualSetsByExercise: { ai123: [{ load: '40kg', reps: '8회', rir: 2, recordedAt: '2026-09-14T01:00:00Z' }], other: [{ reps: '10', recordedAt: '2026-09-14T01:00:00Z' }] } };
  a.state.sessions['2026-10-01_THU'] = { exerciseNamesById: { press: '체스트 프레스' }, actualSetsByExercise: { press: [{ reps: '15', recordedAt: '2026-10-01T00:00:00Z' }] } };
  const rows = a.api.previousSets(a.state, a.session, a.base.exercises[0]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].exerciseId, 'ai123');
  assert.equal(a.journal.saveSet({ sessionKey: rows[0].sessionKey, exerciseId: 'ai123', index: 0, load: '40kg', reps: '9회', rir: 1 }), true);
  assert.equal(a.state.sessions['2026-09-14_MON'].actualSetsByExercise.ai123[0].reps, '9회');
  assert.equal(a.journal.deleteSet(rows[0]), true);
  assert.equal(a.api.previousSets(a.state, a.session, a.base.exercises[0]).length, 0);
});

test('deleting an actual set does not shift the remaining set numbers', () => {
  const a = fixture();
  for (const index of [0, 1]) a.journal.saveSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index, reps: `${index + 8}회` });
  assert.equal(a.journal.deleteSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index: 0 }), true);
  assert.equal(a.session.actualSetsByExercise.press.length, 2);
  assert.equal(a.session.actualSetsByExercise.press[0].recordedAt, '');
  assert.equal(a.session.actualSetsByExercise.press[1].reps, '9회');
});

test('completion capture validates input and undo restores actual values, count and summary', () => {
  const a = fixture({ mount: true });
  a.journal.render();
  a.element.querySelector('[data-journal-load]').value = '45kg';
  assert.equal(a.journal.captureSet(a.base.exercises[0], 0), false);
  assert.equal(a.session.journalLastCompletion, undefined);
  a.element.querySelector('[data-journal-reps]').value = '8회';
  a.element.querySelector('[data-journal-rir]').value = '2';
  assert.equal(a.journal.captureSet(a.base.exercises[0], 0), true);
  a.session.setDoneByExercise.press = 1;
  assert.equal(a.session.actualSetsByExercise.press[0].load, '45kg');
  assert.equal(a.journal.undoLastCompletion(), true);
  assert.equal(a.session.setDoneByExercise.press, 0);
  assert.equal(a.session.actualSetsByExercise.press.length, 0);
  assert.equal(a.state.history[0].setDone, 0);
  assert.deepEqual(a.counts(), { writes: 1, restStops: 1, pauses: 1 });
});

test('whole-exercise completion undo returns to its prior partial progress', () => {
  const a = fixture();
  a.session.workoutTimerRunning = true;
  a.session.workoutLastTickMs = Date.now();
  a.session.setDoneByExercise.press = 1;
  a.journal.captureCompletion(a.base.exercises[0], 'exercise');
  a.session.setDoneByExercise.press = 2;
  a.session.completedExerciseMap.press = true;
  assert.equal(a.journal.undoLastCompletion(), true);
  assert.equal(a.session.setDoneByExercise.press, 1);
  assert.equal(a.session.completedExerciseMap.press, undefined);
  assert.equal(a.persisted().sessions[a.session.sessionKey].workoutTimerRunning, false);
  assert.equal(a.persisted().sessions[a.session.sessionKey].workoutLastTickMs, null);
  assert.equal(a.persisted().sessions[a.session.sessionKey].workoutElapsedSec, 125);
  assert.equal(a.journal.undoLastCompletion(), false);
});

test('manual actual-record corrections invalidate undo so it cannot discard the correction', () => {
  const a = fixture();
  a.journal.captureCompletion(a.base.exercises[0]);
  a.session.setDoneByExercise.press = 2;
  a.journal.saveSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index: 0, load: '45kg', reps: '9회' });
  assert.equal(a.journal.undoLastCompletion(), false);
  assert.equal(a.session.actualSetsByExercise.press[0].reps, '9회');
});

test('undo rejects a changed set target instead of restoring count beyond the target', () => {
  const a = fixture();
  a.session.setDoneByExercise.press = 1;
  a.journal.captureCompletion(a.base.exercises[0]);
  a.session.setDoneByExercise.press = 2;
  a.base.exercises[0].sets = ['10회'];
  a.session.setDoneByExercise.press = 1;
  assert.equal(a.journal.undoLastCompletion(), false);
  assert.equal(a.session.setDoneByExercise.press, 1);
  assert.equal(a.counts().writes, 0);
});

test('a mismatched input and whole-exercise completion cannot silently discard unsaved actual inputs', () => {
  const a = fixture({ mount: true });
  a.journal.render();
  a.element.querySelector('[data-journal-reps]').value = '8회';
  assert.equal(a.journal.captureSet({ ...a.base.exercises[0], id: 'different' }, 0), false);
  assert.equal(a.journal.captureCompletion(a.base.exercises[0]), false);
  assert.equal(a.session.journalLastCompletion, undefined);
});

test('failed undo preserves completion and running timers', () => {
  const a = fixture({ fail: true });
  a.journal.captureCompletion(a.base.exercises[0]);
  a.session.setDoneByExercise.press = 2;
  a.session.completedExerciseMap.press = true;
  const before = plain(a.state);
  assert.equal(a.journal.undoLastCompletion(), false);
  assert.deepEqual(plain(a.state), before);
  assert.deepEqual(a.counts(), { writes: 1, restStops: 0, pauses: 0 });
});

test('today replacement snapshots the plan, retains actual history and does not copy stale instructions', () => {
  const a = fixture();
  const original = plain(a.base);
  a.journal.saveSet({ sessionKey: a.session.sessionKey, exerciseId: 'press', index: 0, load: '40kg', reps: '10회' });
  assert.equal(a.journal.replaceToday({ exerciseId: 'press', name: '푸시업', sets: ['맨몸 x8회', '맨몸 x6회'], restSec: 45 }), true);
  assert.deepEqual(a.base, original);
  assert.equal(a.session.planSnapshot.exercises[0].name, '푸시업');
  assert.notEqual(a.session.planSnapshot.exercises[0].id, 'press');
  assert.notEqual(a.session.planSnapshot.exercises[0].howTo, '원래 운동 설명');
  assert.equal(a.session.actualSetsByExercise.press[0].reps, '10회');
  assert.equal(a.session.exerciseNamesById.press, '체스트 프레스');
  assert.equal(a.session.setDoneByExercise[a.session.activeExerciseId], undefined);
  assert.equal(a.session.replacements.length, 1);
});

test('failed replacement restores snapshot and prior active exercise without timer side effects', () => {
  const a = fixture({ fail: true });
  const before = plain(a.state);
  assert.equal(a.journal.replaceToday({ exerciseId: 'press', name: '푸시업', sets: ['맨몸 x8회'], restSec: 45 }), false);
  assert.deepEqual(plain(a.state), before);
  assert.deepEqual(a.counts(), { writes: 1, restStops: 0, pauses: 0 });
});

test('backup normalization keeps empty slots, text values and valid RIR without fabricating records', () => {
  const a = fixture();
  const result = a.api.normalizeActualSets({ press: [null, { load: 'BW', reps: '30초', rir: null, recordedAt: '2026-09-14T01:00:00Z' }, { reps: '10', rir: 99, recordedAt: '2026-09-14T01:00:00Z' }] });
  assert.equal(result.press.length, 3);
  assert.equal(result.press[0].recordedAt, '');
  assert.equal(result.press[1].load, 'BW');
  assert.equal(result.press[1].rir, null);
  assert.equal(result.press[2].recordedAt, '');
});
