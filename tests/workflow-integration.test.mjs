import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const sources = await Promise.all(['workout-journal.js', 'routine-planner.js', 'app.js'].map(async file =>
  (await readFile(new URL(`../${file}`, import.meta.url), 'utf8')).replace(/^bootstrap\(\);$/m, '')));
function fixture() {
  let disk = null, reject = false;
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', textContent: '', hidden: false, files: [],
      querySelectorAll: () => [], addEventListener() {}, classList: { toggle() {} } });
    return nodes.get(id);
  };
  const context = vm.createContext({ console, Date, setTimeout, clearTimeout,
    document: { getElementById: element, querySelectorAll: () => [] },
    window: { setInterval: () => 1, clearInterval() {}, localStorage: {
      getItem: () => disk, setItem(key, value) { if (reject) throw Error('quota'); disk = value; }
    } }
  });
  sources.forEach(source => vm.runInContext(source, context));
  const run = code => vm.runInContext(code, context);
  run(`selectedDay='MON'; state.selectedDay='MON'; ensureSession('MON'); renderAll=()=>{};
    workoutJournal=window.WorkoutJournal.create({getState:()=>state,getSession:getCurrentSession,getPlan:getCurrentPlan,persist:persistState,render:renderAll,
      getElapsed:getWorkoutElapsedSec,stopRest:stopRestTimer,pauseWorkout:()=>pauseWorkoutTimer({persist:false}),syncSummary:syncExistingSummary,announce});
    routinePlanner=window.RoutinePlanner.create({getState:()=>state,getRoutine:getPlanByDay,normalize:normalizePlanForDay,sync:syncSessionToCurrentPlan,persist:persistState,render:renderAll,announce});
    state.generatedPlanDraft=generateAdaptivePlan({goals:['근육증가'],days:['월','수'],timeMin:45,heightCm:175,weightKg:70,age:35,sex:'남성',experience:'초보',place:'집',equipment:['맨몸'],injury:'',injuryAreas:[],dietPreference:'일반식',allergies:[]});`);
  return { run, element, disk: () => disk, fail: () => { reject = true; } };
}

test('apply only selected days, then reload and restore the exact prior routine', () => {
  const a = fixture();
  const old = a.run('JSON.stringify(getPlanByDay("MON"))');
  const wed = a.run('JSON.stringify(getPlanByDay("WED"))');
  assert.equal(a.run('routinePlanner.prepare(["MON"]) && routinePlanner.apply()'), true);
  assert.notEqual(a.run('JSON.stringify(getCurrentPlan())'), old);
  assert.equal(a.run('JSON.stringify(getPlanByDay("WED"))'), wed);
  assert.equal(a.run('getCurrentPlan().sourcePlanId'), a.run('state.generatedPlanDraft.id'));
  a.run('state=loadState(); prepareLoadedState({restoreTimer:false});');
  assert.equal(a.run('routinePlanner.restore()'), true);
  assert.equal(a.run('JSON.stringify(getCurrentPlan())'), old);
});

test('applying a recommendation preserves in-progress exercise counts and actual sets across reload', () => {
  const a = fixture();
  a.run(`const ex=getActiveExercise(); workoutJournal.saveSet({sessionKey:state.currentSessionKey,exerciseId:ex.id,index:0,load:'40kg',reps:'12회',rir:2}); completeCurrentExercise('set');`);
  const old = a.run('JSON.stringify(getCurrentPlan())');
  const sets = a.run('JSON.stringify(getCurrentSession().actualSetsByExercise)');
  assert.equal(a.run('routinePlanner.prepare(["MON"]) && routinePlanner.apply()'), true);
  assert.equal(a.run('JSON.stringify(getCurrentPlan())'), old);
  assert.notEqual(a.run('JSON.stringify(getPlanByDay("MON"))'), old);
  a.run('state=loadState(); prepareLoadedState({restoreTimer:false});');
  assert.equal(a.run('getDoneSetCount()'), 1);
  assert.equal(a.run('JSON.stringify(getCurrentSession().actualSetsByExercise)'), sets);
  assert.equal(a.run('routinePlanner.restore()'), true);
  assert.equal(a.run('getDoneSetCount()'), 1);
});

test('stale preview, double apply and edited routines cannot silently replace authored changes', () => {
  const a = fixture();
  a.run('routinePlanner.prepare(["MON"]); ensureCustomPlan("MON").theme="직접 수정";');
  assert.equal(a.run('routinePlanner.apply()'), false);
  assert.equal(a.run('getPlanByDay("MON").theme'), '직접 수정');
  assert.equal(a.run('routinePlanner.prepare(["MON"]) && routinePlanner.apply()'), true);
  assert.equal(a.run('routinePlanner.apply()'), false);
  a.run('state.customPlans.MON.exercises[0].name="직접 이름 수정";');
  assert.equal(a.run('routinePlanner.restore()'), false);
  assert.equal(a.run('getPlanByDay("MON").exercises[0].name'), '직접 이름 수정');
});

test('storage failures roll back recommendation changes and set completion with no phantom timer', () => {
  const a = fixture();
  a.run('persistState();');
  const before = a.disk();
  const session = a.run('JSON.stringify(getCurrentSession())');
  a.fail();
  assert.equal(a.run('routinePlanner.prepare(["MON"]) && routinePlanner.apply()'), false);
  assert.equal(a.run('Object.keys(state.customPlans).length'), 0);
  a.run('completeCurrentExercise("set");');
  assert.equal(a.run('JSON.stringify(getCurrentSession())'), session);
  assert.equal(a.run('workoutTimer.running'), false);
  assert.equal(a.disk(), before);
});

test('undo completion updates persisted summary and remains paused after reload', () => {
  const a = fixture();
  a.run(`state.customPlans.MON=normalizePlanForDay({exercises:[{id:'test',name:'테스트',sets:['10회'],restSec:10}]},'MON'); syncSessionToCurrentPlan(); completeCurrentExercise('set');`);
  assert.equal(a.run('state.history[0].completionRate'), 100);
  assert.equal(a.run('workoutJournal.undoLastCompletion()'), true);
  assert.equal(a.run('state.history[0].completionRate'), 0);
  assert.equal(a.run('state.history[0].setDone'), 0);
  assert.equal(a.run('getCurrentSession().workoutTimerRunning'), false);
  a.run('state=loadState(); prepareLoadedState({restoreTimer:false});');
  assert.equal(a.run('getCurrentSession().workoutTimerRunning'), false);
  assert.equal(a.run('getDoneSetCount()'), 0);
});

test('today-only replacement pauses timer, preserves actual records and never edits the weekly routine', () => {
  const a = fixture();
  const routine = a.run('JSON.stringify(getPlanByDay("MON"))');
  a.run(`const ex=getActiveExercise(); workoutJournal.saveSet({sessionKey:state.currentSessionKey,exerciseId:ex.id,index:0,load:'맨몸',reps:'30초',rir:null}); completeCurrentExercise('set');`);
  assert.equal(a.run(`workoutJournal.replaceToday({exerciseId:ex.id,name:'오늘만 대체',sets:['맨몸 x10','맨몸 x10'],restSec:30})`), true);
  assert.equal(a.run('JSON.stringify(getPlanByDay("MON"))'), routine);
  assert.equal(a.run('getCurrentSession().actualSetsByExercise[ex.id][0].reps'), '30초');
  a.run('state=loadState(); prepareLoadedState({restoreTimer:false});');
  assert.equal(a.run('getCurrentPlan().exercises[0].name'), '오늘만 대체');
  assert.equal(a.run('getCurrentSession().workoutTimerRunning'), false);
  assert.equal(a.run('JSON.stringify(getPlanByDay("MON"))'), routine);
});

test('backup normalization preserves new preferences, original snapshots and sparse recorded set indexes', () => {
  const a = fixture();
  a.run(`state.aiCoachPreferences.inbodyIds=['a','b']; state.aiCoachPreferences.adaptationDays=28;
    state.aiCoachPreferences.adaptationDifficulty='시간이 부족함';
    const ex=getActiveExercise(); workoutJournal.saveSet({sessionKey:state.currentSessionKey,exerciseId:ex.id,index:2,load:'보조 20kg',reps:'8회',rir:0});
    const backup=JSON.stringify({state}); state=normalizeLoadedState(JSON.parse(backup).state); prepareLoadedState({restoreTimer:false});`);
  assert.equal(a.run('state.aiCoachPreferences.adaptationDays'), 28);
  assert.equal(a.run('state.aiCoachPreferences.inbodyIds.join(",")'), 'a,b');
  assert.equal(a.run('getCurrentSession().actualSetsByExercise[ex.id][0].recordedAt'), '');
  assert.equal(a.run('getCurrentSession().actualSetsByExercise[ex.id][2].rir'), 0);
});

test('saved copies retain a stable origin identity for applied routine evidence', () => {
  const a = fixture();
  a.run('const originalId=state.generatedPlanDraft.id; renderGeneratorPanel=()=>{}; saveGeneratedPlanDraft(); state.generatedPlanDraft=state.generatedPlans[0];');
  assert.notEqual(a.run('state.generatedPlanDraft.id'), a.run('originalId'));
  assert.equal(a.run('state.generatedPlanDraft.originPlanId'), a.run('originalId'));
  assert.equal(a.run('routinePlanner.prepare(["MON"]) && routinePlanner.apply()'), true);
  assert.equal(a.run('getPlanByDay("MON").sourcePlanId'), a.run('originalId'));
  a.run('state=loadState(); prepareLoadedState({restoreTimer:false});');
  assert.equal(a.run('state.generatedPlanDraft.originPlanId'), a.run('originalId'));
});

test('reopening plan conditions restores allergies, injuries, equipment and all profile fields', () => {
  const a = fixture();
  a.element('fitAllergyInput').value = '이전 폼 값';
  a.run(`const p=state.generatedPlanDraft; p.profile.injury='무릎 주의'; p.profile.injuryAreas=['무릎']; p.profile.allergies=['견과류'];
    p.inputSnapshot={goalDetails:'저장했던 상세 목표'}; const injuryCheckbox={value:'무릎',checked:false};
    document.querySelectorAll=selector=>selector.includes('fitInjuryAreas')?[injuryCheckbox]:[];
    restoreGeneratorProfile(p,{includeGoalDetails:true});`);
  assert.equal(a.element('fitAllergyInput').value, '견과류');
  assert.equal(a.element('fitInjuryInput').value, '무릎 주의');
  assert.equal(a.element('fitEquipmentInput').value, '맨몸');
  assert.equal(a.element('fitAgeInput').value, '35');
  assert.equal(a.element('aiGoalDetails').value, '저장했던 상세 목표');
  assert.equal(a.run('injuryCheckbox.checked'), true);
  a.element('fitAllergyInput').value = '';
  a.run('persistState(); state=loadState(); prepareLoadedState({restoreTimer:false});');
  assert.equal(a.element('fitAllergyInput').value, '견과류');
});
