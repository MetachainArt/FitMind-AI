"use strict";

const WEEKDAYS = [
  { code: "MON", short: "월", title: "월요일" },
  { code: "TUE", short: "화", title: "화요일" },
  { code: "WED", short: "수", title: "수요일" },
  { code: "THU", short: "목", title: "목요일" },
  { code: "FRI", short: "금", title: "금요일" },
  { code: "SAT", short: "토", title: "토요일" }
];

const STORAGE_KEY = "fitmind_state_v1";
const PLAN_VERSION = "daily_6km_strength_v1";
const DEFAULT_EXERCISE_GUIDE = {
  howTo: "반동 없이 천천히 움직이고, 마지막 2회가 힘든 정도의 무게로 진행해.",
  machine: "좌석, 패드, 손잡이를 몸에 먼저 맞춘 뒤 관절이 편한 범위에서 시작해.",
  ball: "기구가 비어 있지 않으면 덤벨, 밴드, 짐볼로 같은 부위를 가볍게 대체해.",
  safety: "날카로운 통증, 어지러움, 자세 붕괴가 있으면 즉시 무게를 낮추거나 중단해.",
  mistake: "무게 욕심으로 반동을 쓰면 목표 근육 자극보다 관절 부담이 커져."
};

const EXERCISE_VIDEO_QUERY_OVERRIDES = {
  "leg-press": { howTo: "레그프레스 운동방법", machine: "레그프레스 기구 사용법" },
  "hip-abduction": { howTo: "힙 어브덕션 운동방법", machine: "힙 어브덕션 머신 사용법" },
  "hip-adduction": { howTo: "힙 어덕션 운동방법", machine: "힙 어덕션 머신 사용법" },
  "lying-leg-curl": { howTo: "라잉 레그컬 운동방법", machine: "라잉 레그컬 기구 사용법" },
  "standing-calf-raise": { howTo: "스탠딩 카프레이즈 운동방법", machine: "카프레이즈 머신 사용법" },
  "lat-pulldown": { howTo: "랫풀다운 운동방법", machine: "랫풀다운 기구 사용법" },
  "seated-row": { howTo: "시티드 로우 운동방법", machine: "시티드 로우 머신 사용법" },
  "barbell-curl": { howTo: "바벨 컬 운동방법", machine: "바벨 컬 그립 사용법" },
  "hammer-curl": { howTo: "해머 컬 운동방법", machine: "덤벨 해머 컬 자세" },
  "triceps-pushdown": { howTo: "트라이셉스 푸시다운 운동방법", machine: "케이블 푸시다운 기구 사용법" },
  "hanging-leg-raise": { howTo: "행잉 레그레이즈 운동방법", machine: "철봉 딥스 스테이션 사용법" },
  "cable-crunch": { howTo: "케이블 크런치 운동방법", machine: "케이블 머신 사용법 복근" },
  plank: { howTo: "플랭크 자세 운동방법", machine: "플랭크 매트 사용법" },
  "squat-machine": { howTo: "스쿼트 머신 운동방법", machine: "스쿼트 머신 사용법" },
  "leg-extension": { howTo: "레그 익스텐션 운동방법", machine: "레그 익스텐션 기구 사용법" },
  "leg-curl-seated": { howTo: "시티드 레그컬 운동방법", machine: "시티드 레그컬 기구 사용법" },
  "hip-thrust": { howTo: "힙 쓰러스트 운동방법", machine: "힙쓰러스트 머신 사용법" },
  "calf-press": { howTo: "카프 프레스 운동방법", machine: "카프 프레스 기구 사용법" },
  "chest-press": { howTo: "체스트 프레스 운동방법", machine: "체스트 프레스 기구 사용법" },
  "shoulder-press": { howTo: "숄더 프레스 운동방법", machine: "숄더 프레스 머신 사용법" },
  "lateral-raise": { howTo: "레터럴 레이즈 운동방법", machine: "덤벨 레터럴 레이즈 자세" },
  "cable-crunch-fri": { howTo: "케이블 크런치 운동방법", machine: "케이블 머신 사용법 복근" },
  "russian-twist": { howTo: "러시안 트위스트 운동방법", machine: "러시안 트위스트 도구 사용법" },
  "machine-row": { howTo: "머신 로우 운동방법", machine: "머신 로우 기구 사용법" },
  "high-foot-leg-press": { howTo: "레그프레스 발 높게 운동방법", machine: "레그프레스 기구 사용법" },
  "face-pull": { howTo: "페이스풀 운동방법", machine: "케이블 페이스풀 사용법" },
  "push-up-db-press": { howTo: "푸시업 덤벨 프레스 운동방법", machine: "덤벨 프레스 자세" },
  "deadbug": { howTo: "데드버그 운동방법", machine: "데드버그 코어 운동" },
  "leg-press-sat": { howTo: "레그프레스 운동방법", machine: "레그프레스 기구 사용법" },
  "chest-press-sat": { howTo: "체스트 프레스 운동방법", machine: "체스트 프레스 머신 사용법" },
  "seated-row-sat": { howTo: "시티드 로우 운동방법", machine: "시티드 로우 머신 사용법" },
  "shoulder-press-sat": { howTo: "숄더 프레스 운동방법", machine: "숄더 프레스 머신 사용법" },
  "lateral-raise-sat": { howTo: "레터럴 레이즈 운동방법", machine: "덤벨 레터럴 레이즈 자세" },
  "hip-abduction-sat": { howTo: "힙 어브덕션 운동방법", machine: "힙 어브덕션 머신 사용법" },
  "cable-crunch-sat": { howTo: "케이블 크런치 운동방법", machine: "케이블 머신 사용법 복근" },
  "russian-twist-sat": { howTo: "러시안 트위스트 운동방법", machine: "러시안 트위스트 도구 사용법" }
};

const ANALYTICS_SCOPES = ["day", "week", "month"];

function exercise({
  id,
  name,
  sets,
  restSec = 75,
  howTo,
  machine,
  ball,
  safety,
  mistake
}) {
  const item = { id, name, sets, restSec, howTo, machine, ball, safety, mistake };
  fillGuideDefaults(item);
  return item;
}

const ROUTINE_PLAN = {
  MON: {
    dayLabel: "MON",
    theme: "하체 전면 · 엉덩이 · 복근",
    trainingFocus: "아침 6km 조깅은 고정. 헬스장에서는 근력 65-70분 + 복근 8-10분.",
    warmupMain: "고관절/무릎/발목 워밍업",
    warmupTime: "5-7분",
    warmupNote: "하체 첫날은 무릎 정렬과 엉덩이 활성화를 먼저 잡아.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "대화 가능한 강도로 조깅. 하체 피로가 심하면 조깅 속도를 낮춰.",
    exercises: [
      exercise({ id: "leg-press", name: "레그프레스 (Leg Press)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 105 }),
      exercise({ id: "squat-machine", name: "스쿼트 머신 (Squat Machine)", sets: ["8-10회", "8-10회", "8-10회"], restSec: 105 }),
      exercise({ id: "leg-extension", name: "레그 익스텐션 (Leg Extension)", sets: ["12-15회", "12-15회", "12-15회"], restSec: 75 }),
      exercise({ id: "hip-abduction", name: "힙 어브덕션 (Hip Abduction)", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "standing-calf-raise", name: "카프레이즈 (Calf Raise)", sets: ["15-20회", "15-20회", "15-20회"], restSec: 60 }),
      exercise({ id: "cable-crunch", name: "복근: 케이블 크런치 (Cable Crunch)", sets: ["12-15회", "12-15회", "12-15회"], restSec: 60 }),
      exercise({ id: "plank", name: "복근: 플랭크 (Plank)", sets: ["45-60초", "45-60초"], restSec: 60 })
    ]
  },
  TUE: {
    dayLabel: "TUE",
    theme: "등 · 이두 · 복근",
    trainingFocus: "팔이 얇은 체형 보완을 위해 등 당기기와 이두 볼륨을 확보.",
    warmupMain: "밴드 로우 + 어깨 가동성",
    warmupTime: "5-7분",
    warmupNote: "하체 운동 다음날 조깅은 속도 욕심 내지 말고 회복을 우선해.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "근력 전에는 가벼운 관절 워밍업만 진행.",
    exercises: [
      exercise({ id: "lat-pulldown", name: "랫풀다운 (Lat Pulldown)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({ id: "seated-row", name: "시티드 로우 (Seated Row)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({ id: "machine-row", name: "머신 로우 (Machine Row)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 80 }),
      exercise({ id: "barbell-curl", name: "바벨 컬 (Barbell Curl)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 70 }),
      exercise({ id: "hammer-curl", name: "해머 컬 (Hammer Curl)", sets: ["12회", "12회", "12회"], restSec: 70 }),
      exercise({ id: "hanging-leg-raise", name: "복근: 행잉 레그레이즈 (Hanging Leg Raise)", sets: ["8-12회", "8-12회", "8-12회"], restSec: 70 })
    ]
  },
  WED: {
    dayLabel: "WED",
    theme: "가슴 · 어깨 · 삼두 · 복근",
    trainingFocus: "상체 밀기 운동으로 가슴/어깨/삼두 근육량을 만든다.",
    warmupMain: "밴드 풀어파트 + 가벼운 프레스",
    warmupTime: "5-7분",
    warmupNote: "어깨가 말리지 않게 견갑을 먼저 안정화해.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "마운틴/경사 걷기는 제외. 근력운동 품질에 집중.",
    exercises: [
      exercise({ id: "chest-press", name: "체스트 프레스 (Chest Press)", sets: ["8-12회", "8-12회", "8-12회", "8-12회"], restSec: 90 }),
      exercise({ id: "shoulder-press", name: "숄더 프레스 (Shoulder Press)", sets: ["8-10회", "8-10회", "8-10회"], restSec: 90 }),
      exercise({ id: "lateral-raise", name: "레터럴 레이즈 (Lateral Raise)", sets: ["12-15회", "12-15회", "12-15회", "12-15회"], restSec: 70 }),
      exercise({ id: "triceps-pushdown", name: "트라이셉스 푸시다운 (Triceps Pushdown)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 70 }),
      exercise({ id: "push-up-db-press", name: "푸시업 또는 덤벨 프레스", sets: ["10-12회", "10-12회", "10-12회"], restSec: 75 }),
      exercise({ id: "russian-twist", name: "복근: 러시안 트위스트 (Russian Twist)", sets: ["20회", "20회", "20회"], restSec: 60 }),
      exercise({ id: "plank", name: "복근: 플랭크 (Plank)", sets: ["45-60초", "45-60초"], restSec: 60 })
    ]
  },
  THU: {
    dayLabel: "THU",
    theme: "하체 후면 · 허벅지 보강 · 복근",
    trainingFocus: "햄스트링/엉덩이/허벅지 보강. 피로가 심하면 하체 세트 1개씩 감량.",
    warmupMain: "글루트 브릿지 + 에어 스쿼트",
    warmupTime: "5-7분",
    warmupNote: "조깅으로 다리가 무거우면 첫 운동 무게를 낮춰 시작해.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "하체 후면 운동일이므로 운동 후 정리 스트레칭을 충분히.",
    exercises: [
      exercise({ id: "hip-thrust", name: "힙 쓰러스트 (Hip Thrust)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 105 }),
      exercise({ id: "leg-curl-seated", name: "레그컬 (Leg Curl)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 85 }),
      exercise({ id: "high-foot-leg-press", name: "레그프레스 발 높게", sets: ["12회", "12회", "12회"], restSec: 90 }),
      exercise({ id: "hip-adduction", name: "힙 어덕션 (Hip Adduction)", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "calf-press", name: "카프 프레스 (Calf Press)", sets: ["15-20회", "15-20회", "15-20회"], restSec: 60 }),
      exercise({ id: "cable-crunch", name: "복근: 케이블 크런치 (Cable Crunch)", sets: ["12-15회", "12-15회", "12-15회"], restSec: 60 }),
      exercise({ id: "deadbug", name: "복근: 데드버그 (Dead Bug)", sets: ["10회/쪽", "10회/쪽", "10회/쪽"], restSec: 60 })
    ]
  },
  FRI: {
    dayLabel: "FRI",
    theme: "등 · 팔 볼륨 · 복근",
    trainingFocus: "등과 팔을 한 번 더 자극해 얇은 팔과 상체 볼륨을 보완.",
    warmupMain: "가벼운 풀다운 + 팔꿈치/손목 가동",
    warmupTime: "5-7분",
    warmupNote: "팔 운동은 반동보다 느린 내림 동작을 우선해.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "근력 회복이 떨어지면 금요일 팔 세트를 1세트 줄여.",
    exercises: [
      exercise({ id: "lat-pulldown", name: "랫풀다운 (Lat Pulldown)", sets: ["12회", "12회", "12회"], restSec: 85 }),
      exercise({ id: "seated-row", name: "시티드 로우 (Seated Row)", sets: ["12회", "12회", "12회"], restSec: 85 }),
      exercise({ id: "face-pull", name: "페이스풀 또는 리어델트 머신", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "barbell-curl", name: "바벨 컬 (Barbell Curl)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 70 }),
      exercise({ id: "hammer-curl", name: "해머 컬 (Hammer Curl)", sets: ["12회", "12회", "12회"], restSec: 70 }),
      exercise({ id: "triceps-pushdown", name: "트라이셉스 푸시다운 (Triceps Pushdown)", sets: ["12회", "12회", "12회"], restSec: 70 }),
      exercise({ id: "hanging-leg-raise", name: "복근: 행잉 레그레이즈 (Hanging Leg Raise)", sets: ["8-12회", "8-12회", "8-12회"], restSec: 70 })
    ]
  },
  SAT: {
    dayLabel: "SAT",
    theme: "전신 보강 · 약점 개선 · 복근",
    trainingFocus: "한 주 마무리 전신 보강. 피곤하면 무게보다 자세와 완주율을 우선.",
    warmupMain: "전신 관절 가동 + 가벼운 머신 1세트",
    warmupTime: "5-7분",
    warmupNote: "월-금 피로가 쌓였다면 모든 운동을 1세트씩 줄여도 좋아.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "일요일도 조깅한다면 아주 천천히 회복 조깅으로 둬.",
    exercises: [
      exercise({ id: "leg-press-sat", name: "레그프레스 (Leg Press)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({ id: "chest-press-sat", name: "체스트 프레스 (Chest Press)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({ id: "seated-row-sat", name: "시티드 로우 (Seated Row)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({ id: "shoulder-press-sat", name: "숄더 프레스 (Shoulder Press)", sets: ["10회", "10회", "10회"], restSec: 85 }),
      exercise({ id: "lateral-raise-sat", name: "레터럴 레이즈 (Lateral Raise)", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "hip-abduction-sat", name: "힙 어브덕션 (Hip Abduction)", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "cable-crunch-sat", name: "복근: 케이블 크런치 (Cable Crunch)", sets: ["12-15회", "12-15회", "12-15회"], restSec: 60 }),
      exercise({ id: "russian-twist-sat", name: "복근: 러시안 트위스트 (Russian Twist)", sets: ["20회", "20회", "20회"], restSec: 60 })
    ]
  }
};

const ui = {
  todayLabel: document.getElementById("todayLabel"),
  resetSessionBtn: document.getElementById("resetSessionBtn"),
  dayTabs: document.getElementById("dayTabs"),
  dayTitle: document.getElementById("dayTitle"),
  dayFocus: document.getElementById("dayFocus"),
  dayTrainingFocus: document.getElementById("dayTrainingFocus"),
  warmupMain: document.getElementById("warmupMain"),
  warmupTime: document.getElementById("warmupTime"),
  warmupNote: document.getElementById("warmupNote"),
  cardioMain: document.getElementById("cardioMain"),
  cardioTime: document.getElementById("cardioTime"),
  cardioPlan: document.getElementById("cardioPlan"),
  exerciseQueue: document.getElementById("exerciseQueue"),
  currentExerciseTitle: document.getElementById("currentExerciseTitle"),
  currentExerciseTarget: document.getElementById("currentExerciseTarget"),
  coachMessage: document.getElementById("coachMessage"),
  targetSetList: document.getElementById("targetSetList"),
  startWorkoutBtn: document.getElementById("startWorkoutBtn"),
  completeSetBtn: document.getElementById("completeSetBtn"),
  markExerciseDoneBtn: document.getElementById("markExerciseDoneBtn"),
  restTimerText: document.getElementById("restTimerText"),
  timerToggleBtn: document.getElementById("timerToggleBtn"),
  timerSkipBtn: document.getElementById("timerSkipBtn"),
  guideHowTo: document.getElementById("guideHowTo"),
  guideMachine: document.getElementById("guideMachine"),
  guideBall: document.getElementById("guideBall"),
  guideSafety: document.getElementById("guideSafety"),
  guideMistake: document.getElementById("guideMistake"),
  videoLinkNote: document.getElementById("videoLinkNote"),
  howToVideoLink: document.getElementById("howToVideoLink"),
  machineVideoLink: document.getElementById("machineVideoLink"),
  completionRate: document.getElementById("completionRate"),
  exerciseDoneCount: document.getElementById("exerciseDoneCount"),
  setDoneCount: document.getElementById("setDoneCount"),
  searchCount: document.getElementById("searchCount"),
  elapsedTime: document.getElementById("elapsedTime"),
  workoutTimerToggleBtn: document.getElementById("workoutTimerToggleBtn"),
  workoutTimerResetBtn: document.getElementById("workoutTimerResetBtn"),
  searchHitBtn: document.getElementById("searchHitBtn"),
  anxietyRange: document.getElementById("anxietyRange"),
  anxietyValue: document.getElementById("anxietyValue"),
  saveSummaryBtn: document.getElementById("saveSummaryBtn"),
  saveMessage: document.getElementById("saveMessage"),
  analyticsTabs: document.getElementById("analyticsTabs"),
  analyticsPeriodLabel: document.getElementById("analyticsPeriodLabel"),
  analyticsWorkoutDays: document.getElementById("analyticsWorkoutDays"),
  analyticsSessionCount: document.getElementById("analyticsSessionCount"),
  analyticsTotalTime: document.getElementById("analyticsTotalTime"),
  analyticsAvgCompletion: document.getElementById("analyticsAvgCompletion"),
  analyticsList: document.getElementById("analyticsList"),
  historyList: document.getElementById("historyList"),
  editorExerciseSelect: document.getElementById("editorExerciseSelect"),
  editorExerciseName: document.getElementById("editorExerciseName"),
  editorRestSec: document.getElementById("editorRestSec"),
  editorSetRows: document.getElementById("editorSetRows"),
  addSetRowBtn: document.getElementById("addSetRowBtn"),
  saveExerciseBtn: document.getElementById("saveExerciseBtn"),
  addExerciseBtn: document.getElementById("addExerciseBtn"),
  deleteExerciseBtn: document.getElementById("deleteExerciseBtn"),
  resetDayPlanBtn: document.getElementById("resetDayPlanBtn"),
  editorMessage: document.getElementById("editorMessage")
};

let state = loadState();
let selectedDay = selectInitialDay();
let analyticsScope = ANALYTICS_SCOPES.includes(state.analyticsScope) ? state.analyticsScope : "week";
let restTimer = {
  intervalId: null,
  remainingSec: 0,
  running: false
};
let workoutTimer = {
  intervalId: null,
  running: false
};
let editorSelectedExerciseId = null;

bootstrap();

function bootstrap() {
  prepareLoadedState();
  bindEvents();
  renderAll();
  announce("좋아, 오늘 순서대로 하나씩 진행해보자.");
}

function bindEvents() {
  ui.dayTabs.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const code = target.dataset.day;
    if (!code || !ROUTINE_PLAN[code]) {
      return;
    }
    if (code === selectedDay) {
      return;
    }
    stopRestTimer();
    pauseWorkoutTimer();
    selectedDay = code;
    state.selectedDay = code;
    editorSelectedExerciseId = null;
    ensureSession(code);
    restoreWorkoutTimerIfNeeded();
    persistState();
    ui.saveMessage.textContent = "";
    renderAll();
    announce(`좋아, ${weekdayByCode(code).title} 루틴으로 바꿨어.`);
  });

  ui.exerciseQueue.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const exerciseId = target.dataset.jumpExercise;
    if (!exerciseId) {
      return;
    }
    const session = getCurrentSession();
    session.activeExerciseId = exerciseId;
    session.updatedAt = new Date().toISOString();
    persistState();
    renderCurrentExercise();
    renderQueue();
    announce("좋아, 이 운동부터 바로 진행하자.");
  });

  ui.startWorkoutBtn.addEventListener("click", () => {
    const plan = getCurrentPlan();
    const allDone = getCompletedExerciseCount() >= plan.exercises.length;
    if (allDone) {
      announce("오늘 루틴은 이미 완료됐어. 필요하면 시간 초기화 후 다시 시작해.");
      return;
    }
    if (workoutTimer.running) {
      announce("이미 운동 진행 중이야. 세트 완료를 눌러 계속 진행하자.");
      return;
    }
    startWorkoutTimer();
    renderSummary();
    announce("운동 시작. 1세트 후 '세트 완료' 버튼을 눌러줘.");
  });

  ui.completeSetBtn.addEventListener("click", () => {
    const active = getActiveExercise();
    if (!active) {
      return;
    }
    const session = getCurrentSession();
    const done = getSetDone(active.id);
    const target = active.sets.length;

    if (done >= target) {
      announce("이 운동은 이미 목표 세트를 다 했어. 다음으로 넘어가자.");
      return;
    }

    session.setDoneByExercise[active.id] = done + 1;
    maybeStartWorkoutTimer();
    if (done + 1 >= target) {
      session.completedExerciseMap[active.id] = true;
      moveActiveToNextIncomplete();
      announce("좋아, 이 운동 끝! 다음 운동으로 넘어가자.");
    } else {
      announce(`좋아, ${done + 1}세트 완료. 잠깐 쉬고 다음 세트 가자.`);
    }
    session.updatedAt = new Date().toISOString();
    persistState();
    const isAllDone = getCompletedExerciseCount() >= getCurrentPlan().exercises.length;
    if (isAllDone) {
      saveCurrentSummary({ auto: true });
    }
    startRestTimer(active.restSec);
    renderAll();
  });

  ui.markExerciseDoneBtn.addEventListener("click", () => {
    const active = getActiveExercise();
    if (!active) {
      return;
    }
    maybeStartWorkoutTimer();
    const session = getCurrentSession();
    session.setDoneByExercise[active.id] = active.sets.length;
    session.completedExerciseMap[active.id] = true;
    session.updatedAt = new Date().toISOString();
    moveActiveToNextIncomplete();
    persistState();
    const isAllDone = getCompletedExerciseCount() >= getCurrentPlan().exercises.length;
    if (isAllDone) {
      saveCurrentSummary({ auto: true });
    }
    renderAll();
    announce("운동 완료 처리했어. 다음 운동으로 이어가자.");
  });

  ui.timerToggleBtn.addEventListener("click", () => {
    if (restTimer.remainingSec <= 0) {
      return;
    }
    if (restTimer.running) {
      pauseRestTimer();
      announce("휴식 타이머를 잠깐 멈췄어.");
    } else {
      resumeRestTimer();
      announce("휴식 타이머 다시 시작.");
    }
  });

  ui.timerSkipBtn.addEventListener("click", () => {
    stopRestTimer();
    renderTimer();
    announce("좋아, 휴식 건너뛰고 바로 진행하자.");
  });

  ui.searchHitBtn.addEventListener("click", () => {
    const session = getCurrentSession();
    session.searchCount += 1;
    session.updatedAt = new Date().toISOString();
    persistState();
    renderSummary();
    announce("괜찮아. 다음에는 카드만 보고 바로 시작해보자.");
  });

  ui.workoutTimerToggleBtn.addEventListener("click", () => {
    if (workoutTimer.running) {
      pauseWorkoutTimer();
      announce("타이머를 잠깐 멈췄어.");
    } else {
      startWorkoutTimer();
      announce("타이머 시작. 세트 완료 버튼으로 진행해.");
    }
    renderSummary();
  });

  ui.workoutTimerResetBtn.addEventListener("click", () => {
    const hasTime = getCurrentSession().workoutElapsedSec > 0;
    if (hasTime) {
      const ok = window.confirm("운동 시간을 0으로 초기화할까요?");
      if (!ok) {
        return;
      }
    }
    resetWorkoutTimer();
    renderSummary();
    announce("운동 시간을 초기화했어.");
  });

  ui.anxietyRange.addEventListener("input", () => {
    const score = Number(ui.anxietyRange.value);
    const session = getCurrentSession();
    session.anxietyScore = score;
    session.updatedAt = new Date().toISOString();
    persistState();
    renderSummary();
  });

  ui.saveSummaryBtn.addEventListener("click", () => {
    saveCurrentSummary({ manual: true });
  });

  if (ui.analyticsTabs) {
    ui.analyticsTabs.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const scope = target.dataset.analyticsScope;
      if (!scope || !ANALYTICS_SCOPES.includes(scope)) {
        return;
      }
      if (scope === analyticsScope) {
        return;
      }
      analyticsScope = scope;
      state.analyticsScope = scope;
      persistState();
      renderAnalytics();
    });
  }

  ui.resetSessionBtn.addEventListener("click", () => {
    const ok = window.confirm("현재 요일의 오늘 기록을 초기화할까요?");
    if (!ok) {
      return;
    }
    const key = makeSessionKey(selectedDay);
    delete state.sessions[key];
    stopRestTimer();
    pauseWorkoutTimer();
    editorSelectedExerciseId = null;
    ensureSession(selectedDay);
    persistState();
    ui.saveMessage.textContent = "";
    ui.editorMessage.textContent = "";
    renderAll();
    announce("초기화 완료. 처음 세트부터 다시 시작할 수 있어.");
  });

  ui.editorExerciseSelect.addEventListener("change", () => {
    editorSelectedExerciseId = ui.editorExerciseSelect.value || null;
    ui.editorMessage.textContent = "";
    renderRoutineEditor();
  });

  ui.addSetRowBtn.addEventListener("click", () => {
    const currentSets = readEditorSetRows({ includeEmpty: true });
    const nextSets = currentSets.length ? currentSets : [{ load: "", reps: "" }];
    nextSets.push({ load: "", reps: "" });
    renderEditorSetRows(nextSets);
    const lastInput = ui.editorSetRows.querySelector(`[data-set-load-index="${nextSets.length - 1}"]`);
    if (lastInput instanceof HTMLInputElement) {
      lastInput.focus();
    }
    ui.editorMessage.textContent = "";
  });

  ui.editorSetRows.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const removeIndex = Number(target.dataset.removeSetIndex);
    if (!Number.isInteger(removeIndex)) {
      return;
    }
    const currentSets = readEditorSetRows({ includeEmpty: true });
    if (currentSets.length <= 1) {
      return;
    }
    currentSets.splice(removeIndex, 1);
    renderEditorSetRows(currentSets);
    ui.editorMessage.textContent = "";
  });

  ui.saveExerciseBtn.addEventListener("click", () => {
    const draft = readEditorDraft();
    if (draft.error) {
      setEditorMessage(draft.error);
      return;
    }

    const plan = ensureCustomPlan(selectedDay);
    const target = plan.exercises.find((item) => item.id === editorSelectedExerciseId);
    if (!target) {
      setEditorMessage("운동을 먼저 선택해 주세요.");
      return;
    }

    target.name = draft.value.name;
    target.restSec = draft.value.restSec;
    target.sets = draft.value.sets;
    fillGuideDefaults(target);

    syncSessionToCurrentPlan();
    persistState();
    renderAll();
    setEditorMessage("선택한 운동을 저장했어요.");
    announce("선택한 운동을 저장했어.");
  });

  ui.addExerciseBtn.addEventListener("click", () => {
    const draft = readEditorDraft();
    if (draft.error) {
      setEditorMessage(draft.error);
      return;
    }

    const plan = ensureCustomPlan(selectedDay);
    const existingIds = new Set(plan.exercises.map((item) => item.id));
    const newExercise = {
      id: createExerciseId(draft.value.name, existingIds),
      name: draft.value.name,
      sets: draft.value.sets,
      restSec: draft.value.restSec,
      howTo: DEFAULT_EXERCISE_GUIDE.howTo,
      machine: DEFAULT_EXERCISE_GUIDE.machine,
      ball: DEFAULT_EXERCISE_GUIDE.ball,
      safety: DEFAULT_EXERCISE_GUIDE.safety,
      mistake: DEFAULT_EXERCISE_GUIDE.mistake
    };

    plan.exercises.push(newExercise);
    editorSelectedExerciseId = newExercise.id;
    syncSessionToCurrentPlan();
    persistState();
    renderAll();
    setEditorMessage("새 운동을 추가했어요.");
    announce("새 운동을 추가했어.");
  });

  ui.deleteExerciseBtn.addEventListener("click", () => {
    if (!editorSelectedExerciseId) {
      setEditorMessage("운동을 먼저 선택해 주세요.");
      return;
    }

    const plan = ensureCustomPlan(selectedDay);
    const hasTarget = plan.exercises.some((item) => item.id === editorSelectedExerciseId);
    if (!hasTarget) {
      setEditorMessage("운동을 먼저 선택해 주세요.");
      return;
    }

    const ok = window.confirm("선택한 운동을 삭제할까요?");
    if (!ok) {
      return;
    }

    plan.exercises = plan.exercises.filter((item) => item.id !== editorSelectedExerciseId);
    editorSelectedExerciseId = plan.exercises[0] ? plan.exercises[0].id : null;
    syncSessionToCurrentPlan();
    persistState();
    renderAll();
    setEditorMessage("운동을 삭제했어요.");
    announce("선택한 운동을 삭제했어.");
  });

  ui.resetDayPlanBtn.addEventListener("click", () => {
    if (!state.customPlans[selectedDay]) {
      setEditorMessage("이미 기본 루틴을 사용 중이에요.");
      return;
    }

    const ok = window.confirm("이 요일 루틴을 기본값으로 되돌릴까요?");
    if (!ok) {
      return;
    }

    delete state.customPlans[selectedDay];
    editorSelectedExerciseId = null;
    syncSessionToCurrentPlan();
    persistState();
    renderAll();
    setEditorMessage("기본 루틴으로 되돌렸어요.");
    announce("이 요일 루틴을 기본값으로 되돌렸어.");
  });
}

function renderAll() {
  renderHeader();
  renderDayTabs();
  renderDayInfo();
  renderQueue();
  renderRoutineEditor();
  renderCurrentExercise();
  renderSummary();
  renderAnalytics();
  renderHistory();
  renderTimer();
}

function renderHeader() {
  const weekday = weekdayByCode(selectedDay);
  const dateLabel = formatDateLabel(new Date());
  const isSunday = new Date().getDay() === 0;
  const weekendHint = isSunday ? " | 일요일은 회복일이라 월요일 루틴을 기본 추천 중" : "";
  ui.todayLabel.textContent = `${dateLabel} | 선택 루틴: ${weekday.title}${weekendHint}`;
}

function getExerciseIcon(exercise) {
  const idText = String(exercise?.id || "").toLowerCase();
  const nameText = String(exercise?.name || "").toLowerCase();
  const fullText = `${idText} ${nameText}`;

  if (fullText.includes("walk") || fullText.includes("cardio") || fullText.includes("incline")) {
    return "🚶";
  }
  if (fullText.includes("hip") || fullText.includes("glute") || fullText.includes("thrust")) {
    return "🍑";
  }
  if (fullText.includes("lat") || fullText.includes("row") || fullText.includes("pulldown")) {
    return "🪢";
  }
  if (fullText.includes("curl") || fullText.includes("triceps") || fullText.includes("biceps") || fullText.includes("hammer")) {
    return "💪";
  }
  if (fullText.includes("plank") || fullText.includes("crunch") || fullText.includes("raise") || fullText.includes("twist")) {
    return "🧘";
  }
  if (fullText.includes("leg") || fullText.includes("squat") || fullText.includes("calf")) {
    return "🦵";
  }
  if (fullText.includes("press") || fullText.includes("shoulder") || fullText.includes("chest")) {
    return "🏋️";
  }
  return "✨";
}

function renderDayTabs() {
  ui.dayTabs.innerHTML = WEEKDAYS.map((item) => {
    const activeClass = item.code === selectedDay ? "active" : "";
    return `<button class="day-btn ${activeClass}" data-day="${item.code}" aria-label="${item.title} 루틴">${item.short}</button>`;
  }).join("");
}

function renderDayInfo() {
  const plan = getCurrentPlan();
  ui.dayTitle.textContent = `${weekdayByCode(selectedDay).title} (${plan.dayLabel})`;
  ui.dayFocus.textContent = `메인 부위: ${plan.theme}`;
  ui.dayTrainingFocus.textContent = plan.trainingFocus;
  ui.warmupMain.textContent = plan.warmupMain;
  ui.warmupTime.textContent = plan.warmupTime;
  ui.warmupNote.textContent = plan.warmupNote || "";
  ui.cardioMain.textContent = plan.cardioMain;
  ui.cardioTime.textContent = plan.cardioTime;
  ui.cardioPlan.textContent = plan.cardioPlan || "";
}

function renderQueue() {
  const exercises = getCurrentPlan().exercises;
  const active = getActiveExercise();
  ui.exerciseQueue.innerHTML = exercises.map((item) => {
    const doneSets = getSetDone(item.id);
    const totalSets = item.sets.length;
    const done = isExerciseDone(item);
    const current = active && active.id === item.id && !done;
    const classNames = [
      "queue-item",
      done ? "done" : "",
      current ? "current" : ""
    ].join(" ").trim();

    return `
      <li class="${classNames}">
        <button class="queue-name" data-jump-exercise="${item.id}">
          <span class="queue-icon" aria-hidden="true">${getExerciseIcon(item)}</span>
          <span class="queue-text">${escapeHtml(item.name)}</span>
        </button>
        <span class="queue-meta">${doneSets}/${totalSets}세트</span>
      </li>
    `;
  }).join("");
}

function renderRoutineEditor() {
  const plan = getCurrentPlan();
  const exercises = plan.exercises;

  if (!Array.isArray(exercises) || exercises.length === 0) {
    editorSelectedExerciseId = null;
    ui.editorExerciseSelect.innerHTML = "";
    ui.editorExerciseName.value = "";
    ui.editorRestSec.value = "75";
    renderEditorSetRows([""]);
    ui.saveExerciseBtn.disabled = true;
    ui.deleteExerciseBtn.disabled = true;
    ui.addSetRowBtn.disabled = true;
    return;
  }

  if (!editorSelectedExerciseId || !exercises.some((item) => item.id === editorSelectedExerciseId)) {
    editorSelectedExerciseId = exercises[0].id;
  }

  ui.editorExerciseSelect.innerHTML = exercises.map((item, index) => {
    const optionLabel = `${index + 1}. ${getExerciseIcon(item)} ${item.name}`;
    return `<option value="${escapeHtml(item.id)}">${escapeHtml(optionLabel)}</option>`;
  }).join("");
  ui.editorExerciseSelect.value = editorSelectedExerciseId;

  const current = exercises.find((item) => item.id === editorSelectedExerciseId) || exercises[0];
  ui.editorExerciseName.value = current.name;
  ui.editorRestSec.value = String(Number.isFinite(current.restSec) ? current.restSec : 75);
  renderEditorSetRows(Array.isArray(current.sets) ? current.sets : []);
  ui.saveExerciseBtn.disabled = false;
  ui.deleteExerciseBtn.disabled = false;
  ui.addSetRowBtn.disabled = false;
}

function renderCurrentExercise() {
  const plan = getCurrentPlan();
  const allDone = getCompletedExerciseCount() >= plan.exercises.length;
  const active = getActiveExercise();

  if (!active || allDone) {
    ui.currentExerciseTitle.textContent = "🎉 오늘 루틴 완료";
    ui.currentExerciseTarget.textContent = "좋아, 계획한 운동은 전부 끝났어.";
    ui.targetSetList.innerHTML = "";
    ui.guideHowTo.textContent = "마무리 스트레칭 5분 진행하고 수분 보충해.";
    ui.guideMachine.textContent = "오늘 사용한 기구 높이/무게를 다음 루틴을 위해 메모해.";
    ui.guideBall.textContent = "짐볼 코어 스트레칭 2세트를 추가하면 회복에 좋아.";
    ui.guideSafety.textContent = "무리해서 추가 세트를 더 하지 말고 회복에 집중해.";
    ui.guideMistake.textContent = "다음 운동 전, 통증이 남으면 강도를 조정해.";
    ui.startWorkoutBtn.disabled = true;
    ui.startWorkoutBtn.textContent = "운동 완료";
    ui.completeSetBtn.disabled = true;
    ui.markExerciseDoneBtn.disabled = true;
    renderExerciseVideoLinks(null);
    return;
  }

  ui.startWorkoutBtn.disabled = workoutTimer.running;
  ui.startWorkoutBtn.textContent = workoutTimer.running ? "운동 진행중" : "운동 시작";
  ui.completeSetBtn.disabled = false;
  ui.markExerciseDoneBtn.disabled = false;
  ui.currentExerciseTitle.textContent = `${getExerciseIcon(active)} ${active.name}`;
  ui.currentExerciseTarget.textContent = `목표 ${active.sets.length}세트 | 기본 휴식 ${active.restSec}초`;

  const done = getSetDone(active.id);
  ui.targetSetList.innerHTML = active.sets.map((setText, index) => {
    const isDone = index < done;
    return `
      <li class="set-item ${isDone ? "done" : ""}">
        <span class="set-index">${index + 1}세트</span>
        <span class="set-target">${escapeHtml(setText)}</span>
        <span class="set-status">${isDone ? "완료" : "대기"}</span>
      </li>
    `;
  }).join("");

  ui.guideHowTo.textContent = active.howTo;
  ui.guideMachine.textContent = active.machine;
  ui.guideBall.textContent = active.ball;
  ui.guideSafety.textContent = active.safety;
  ui.guideMistake.textContent = `자주 하는 실수: ${active.mistake}`;
  renderExerciseVideoLinks(active);
}

function renderSummary() {
  const session = getCurrentSession();
  const exerciseTotal = getCurrentPlan().exercises.length;
  const exerciseDone = getCompletedExerciseCount();
  const setTotal = getTotalSetCount();
  const setDone = getDoneSetCount();
  const completion = getCompletionRate();

  ui.completionRate.textContent = `${completion}%`;
  ui.exerciseDoneCount.textContent = `${exerciseDone}/${exerciseTotal}`;
  ui.setDoneCount.textContent = `${setDone}/${setTotal}`;
  ui.searchCount.textContent = `${session.searchCount}회`;
  ui.elapsedTime.textContent = toDurationClock(getWorkoutElapsedSec(session));
  ui.workoutTimerToggleBtn.textContent = workoutTimer.running ? "타이머 일시정지" : "타이머 시작";
  if (exerciseDone >= exerciseTotal) {
    ui.startWorkoutBtn.disabled = true;
    ui.startWorkoutBtn.textContent = "운동 완료";
  } else {
    ui.startWorkoutBtn.disabled = workoutTimer.running;
    ui.startWorkoutBtn.textContent = workoutTimer.running ? "운동 진행중" : "운동 시작";
  }
  ui.anxietyRange.value = String(session.anxietyScore);
  ui.anxietyValue.textContent = `${session.anxietyScore}/5`;
}

function buildCurrentSummary() {
  const session = getCurrentSession();
  return {
    sessionKey: session.sessionKey,
    date: getTodayDateString(),
    dayCode: selectedDay,
    completionRate: getCompletionRate(),
    exerciseDone: getCompletedExerciseCount(),
    exerciseTotal: getCurrentPlan().exercises.length,
    setDone: getDoneSetCount(),
    setTotal: getTotalSetCount(),
    searchCount: session.searchCount,
    workoutElapsedSec: getWorkoutElapsedSec(session),
    anxietyScore: session.anxietyScore,
    savedAt: new Date().toISOString()
  };
}

function upsertHistorySummary(summary) {
  if (!Array.isArray(state.history)) {
    state.history = [];
  }
  state.history = state.history.filter((entry) => entry.sessionKey !== summary.sessionKey);
  state.history.unshift(summary);
  state.history = state.history.slice(0, 365);
}

function saveCurrentSummary({ manual = false, auto = false } = {}) {
  const summary = buildCurrentSummary();
  const hasProgress = summary.setDone > 0 || summary.workoutElapsedSec > 0 || summary.searchCount > 0;
  if (auto && !hasProgress) {
    return null;
  }

  upsertHistorySummary(summary);
  const session = getCurrentSession();
  session.lastSavedAt = summary.savedAt;
  session.updatedAt = summary.savedAt;
  persistState();

  if (manual) {
    ui.saveMessage.textContent = "오늘 요약을 이 기기에 저장했어.";
  } else if (auto) {
    ui.saveMessage.textContent = `운동 완료 기록 이 기기에 저장됨 (${summary.date})`;
  }
  renderHistory();
  renderAnalytics();
  return summary;
}

function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateKey(value) {
  if (!isDateKey(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map((item) => Number(item));
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStartDate(date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  return weekStart;
}

function getPeriodKeyByScope(dateKey, scope) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return null;
  }
  if (scope === "day") {
    return dateKey;
  }
  if (scope === "week") {
    return toDateKey(getWeekStartDate(date));
  }
  if (scope === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return dateKey;
}

function formatPeriodLabel(periodKey, scope) {
  if (scope === "day") {
    return `${periodKey} 일별`;
  }
  if (scope === "week") {
    const start = parseDateKey(periodKey);
    if (!start) {
      return `${periodKey} 주별`;
    }
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    end.setDate(end.getDate() + 6);
    return `${periodKey} 주별 (${toDateKey(start)}~${toDateKey(end)})`;
  }
  if (scope === "month") {
    return `${periodKey} 월별`;
  }
  return periodKey;
}

function aggregateHistoryByScope(scope) {
  const source = Array.isArray(state.history) ? state.history : [];
  const grouped = {};

  source.forEach((item) => {
    const dateKey = isDateKey(item.date) ? item.date : "";
    if (!dateKey) {
      return;
    }
    const periodKey = getPeriodKeyByScope(dateKey, scope);
    if (!periodKey) {
      return;
    }
    if (!grouped[periodKey]) {
      grouped[periodKey] = {
        periodKey,
        sessionCount: 0,
        workoutSec: 0,
        completionSum: 0,
        completionCount: 0,
        workoutDateMap: {}
      };
    }

    const target = grouped[periodKey];
    target.sessionCount += 1;
    target.workoutDateMap[dateKey] = true;
    const elapsed = Number(item.workoutElapsedSec);
    if (Number.isFinite(elapsed)) {
      target.workoutSec += Math.max(0, Math.floor(elapsed));
    }
    const completion = Number(item.completionRate);
    if (Number.isFinite(completion)) {
      target.completionSum += completion;
      target.completionCount += 1;
    }
  });

  return Object.values(grouped)
    .map((item) => {
      return {
        periodKey: item.periodKey,
        sessionCount: item.sessionCount,
        workoutDays: Object.keys(item.workoutDateMap).length,
        workoutSec: item.workoutSec,
        avgCompletion: item.completionCount > 0 ? Math.round(item.completionSum / item.completionCount) : 0
      };
    })
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

function renderAnalyticsTabs() {
  const labelByScope = {
    day: "일별",
    week: "주별",
    month: "월별"
  };
  ui.analyticsTabs.innerHTML = ANALYTICS_SCOPES.map((scope) => {
    const activeClass = scope === analyticsScope ? "active" : "";
    return `<button class="btn ghost analytics-tab-btn ${activeClass}" data-analytics-scope="${scope}">${labelByScope[scope]}</button>`;
  }).join("");
}

function renderAnalytics() {
  if (!ui.analyticsTabs || !ui.analyticsList) {
    return;
  }

  renderAnalyticsTabs();
  const groups = aggregateHistoryByScope(analyticsScope);
  const currentPeriodKey = getPeriodKeyByScope(getTodayDateString(), analyticsScope);
  const current = groups.find((item) => item.periodKey === currentPeriodKey) || {
    periodKey: currentPeriodKey || "-",
    sessionCount: 0,
    workoutDays: 0,
    workoutSec: 0,
    avgCompletion: 0
  };

  ui.analyticsPeriodLabel.textContent = `현재 기준: ${formatPeriodLabel(current.periodKey, analyticsScope)}`;
  ui.analyticsWorkoutDays.textContent = `${current.workoutDays}일`;
  ui.analyticsSessionCount.textContent = `${current.sessionCount}회`;
  ui.analyticsTotalTime.textContent = toDurationClock(current.workoutSec);
  ui.analyticsAvgCompletion.textContent = `${current.avgCompletion}%`;

  if (groups.length === 0) {
    ui.analyticsList.innerHTML = `<li class="history-empty">기록이 없어서 아직 집계를 만들 수 없어. 먼저 오늘 요약 저장을 눌러줘.</li>`;
    return;
  }

  ui.analyticsList.innerHTML = groups.slice(0, 8).map((item) => {
    return `
      <li class="history-item">
        <strong>${escapeHtml(formatPeriodLabel(item.periodKey, analyticsScope))}</strong><br>
        운동일수 ${item.workoutDays}일 | 저장 ${item.sessionCount}회 | 운동시간 ${toDurationClock(item.workoutSec)} | 평균 완주율 ${item.avgCompletion}%
      </li>
    `;
  }).join("");
}

function renderHistory() {
  const history = (state.history || []).slice(0, 7);
  if (history.length === 0) {
    ui.historyList.innerHTML = `<li class="history-empty">아직 저장된 요약이 없어. 운동 끝나고 한 번 저장해봐.</li>`;
    return;
  }
  ui.historyList.innerHTML = history.map((item) => {
    const weekday = weekdayByCode(item.dayCode);
    const elapsedSec = Number.isFinite(item.workoutElapsedSec) ? item.workoutElapsedSec : 0;
    const completionRate = Number.isFinite(Number(item.completionRate)) ? Number(item.completionRate) : 0;
    const searchCount = Number.isFinite(Number(item.searchCount)) ? Number(item.searchCount) : 0;
    const anxietyScore = Number.isFinite(Number(item.anxietyScore)) ? Number(item.anxietyScore) : 3;
    return `
      <li class="history-item">
        <strong>${escapeHtml(item.date || "")} ${escapeHtml(weekday.short)}</strong><br>
        완주율 ${completionRate}% | 운동시간 ${toDurationClock(elapsedSec)} | 검색 ${searchCount}회 | 불안도 ${anxietyScore}/5
      </li>
    `;
  }).join("");
}

function renderTimer() {
  ui.restTimerText.textContent = restTimer.remainingSec > 0 ? toClock(restTimer.remainingSec) : "--:--";
  ui.timerToggleBtn.disabled = restTimer.remainingSec <= 0;
  ui.timerSkipBtn.disabled = restTimer.remainingSec <= 0;
  ui.timerToggleBtn.textContent = restTimer.running ? "일시정지" : "재시작";
}

function startRestTimer(seconds) {
  const sec = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  if (sec <= 0) {
    stopRestTimer();
    renderTimer();
    return;
  }
  stopRestTimer();
  restTimer.remainingSec = sec;
  restTimer.running = true;
  restTimer.intervalId = window.setInterval(() => {
    restTimer.remainingSec -= 1;
    if (restTimer.remainingSec <= 0) {
      stopRestTimer();
      renderTimer();
      announce("휴식 끝. 바로 다음 세트 가자.");
      return;
    }
    renderTimer();
  }, 1000);
  renderTimer();
}

function pauseRestTimer() {
  if (!restTimer.running) {
    return;
  }
  if (restTimer.intervalId) {
    window.clearInterval(restTimer.intervalId);
  }
  restTimer.intervalId = null;
  restTimer.running = false;
  renderTimer();
}

function resumeRestTimer() {
  if (restTimer.running || restTimer.remainingSec <= 0) {
    return;
  }
  restTimer.running = true;
  restTimer.intervalId = window.setInterval(() => {
    restTimer.remainingSec -= 1;
    if (restTimer.remainingSec <= 0) {
      stopRestTimer();
      renderTimer();
      announce("휴식 끝. 리듬 이어가자.");
      return;
    }
    renderTimer();
  }, 1000);
  renderTimer();
}

function stopRestTimer() {
  if (restTimer.intervalId) {
    window.clearInterval(restTimer.intervalId);
  }
  restTimer.intervalId = null;
  restTimer.running = false;
  restTimer.remainingSec = 0;
}

function maybeStartWorkoutTimer() {
  const session = getCurrentSession();
  if (!workoutTimer.running && session.workoutElapsedSec === 0) {
    startWorkoutTimer();
  }
}

function restoreWorkoutTimerIfNeeded() {
  const session = getCurrentSession();
  if (!session.workoutTimerRunning) {
    return;
  }
  applyWorkoutElapsedTick(session);
  startWorkoutTimer();
}

function startWorkoutTimer() {
  const session = getCurrentSession();
  if (workoutTimer.running) {
    return;
  }
  session.workoutTimerRunning = true;
  session.workoutLastTickMs = Date.now();
  workoutTimer.running = true;
  workoutTimer.intervalId = window.setInterval(() => {
    applyWorkoutElapsedTick(getCurrentSession());
    renderSummary();
  }, 1000);
  persistState();
}

function pauseWorkoutTimer() {
  const session = getCurrentSession();
  applyWorkoutElapsedTick(session);
  if (workoutTimer.intervalId) {
    window.clearInterval(workoutTimer.intervalId);
  }
  workoutTimer.intervalId = null;
  workoutTimer.running = false;
  session.workoutTimerRunning = false;
  session.workoutLastTickMs = null;
  session.updatedAt = new Date().toISOString();
  persistState();
}

function resetWorkoutTimer() {
  pauseWorkoutTimer();
  const session = getCurrentSession();
  session.workoutElapsedSec = 0;
  session.workoutTimerRunning = false;
  session.workoutLastTickMs = null;
  session.updatedAt = new Date().toISOString();
  persistState();
}

function applyWorkoutElapsedTick(session) {
  if (!session || !session.workoutTimerRunning) {
    return;
  }
  const now = Date.now();
  const lastTick = Number.isFinite(session.workoutLastTickMs) ? session.workoutLastTickMs : now;
  const deltaSec = Math.floor((now - lastTick) / 1000);
  if (deltaSec <= 0) {
    return;
  }
  session.workoutElapsedSec += deltaSec;
  session.workoutLastTickMs = lastTick + deltaSec * 1000;
  session.updatedAt = new Date().toISOString();
  persistState();
}

function getWorkoutElapsedSec(session) {
  if (!session) {
    return 0;
  }
  if (!session.workoutTimerRunning) {
    return Number.isFinite(session.workoutElapsedSec) ? session.workoutElapsedSec : 0;
  }
  const now = Date.now();
  const lastTick = Number.isFinite(session.workoutLastTickMs) ? session.workoutLastTickMs : now;
  const deltaSec = Math.max(0, Math.floor((now - lastTick) / 1000));
  return (Number.isFinite(session.workoutElapsedSec) ? session.workoutElapsedSec : 0) + deltaSec;
}

function moveActiveToNextIncomplete() {
  const session = getCurrentSession();
  const next = getCurrentPlan().exercises.find((item) => !isExerciseDone(item));
  session.activeExerciseId = next ? next.id : null;
}

function getActiveExercise() {
  const session = getCurrentSession();
  const exercises = getCurrentPlan().exercises;
  if (!exercises.length) {
    return null;
  }

  if (session.activeExerciseId) {
    const found = exercises.find((item) => item.id === session.activeExerciseId);
    if (found && !isExerciseDone(found)) {
      return found;
    }
  }

  const firstIncomplete = exercises.find((item) => !isExerciseDone(item));
  if (firstIncomplete) {
    session.activeExerciseId = firstIncomplete.id;
    return firstIncomplete;
  }

  session.activeExerciseId = exercises[exercises.length - 1].id;
  return exercises[exercises.length - 1];
}

function getSetDone(exerciseId) {
  const session = getCurrentSession();
  const count = session.setDoneByExercise[exerciseId];
  return Number.isFinite(count) ? count : 0;
}

function isExerciseDone(exerciseItem) {
  const session = getCurrentSession();
  return Boolean(session.completedExerciseMap[exerciseItem.id]) || getSetDone(exerciseItem.id) >= exerciseItem.sets.length;
}

function getCompletedExerciseCount() {
  return getCurrentPlan().exercises.filter((item) => isExerciseDone(item)).length;
}

function getTotalSetCount() {
  return getCurrentPlan().exercises.reduce((acc, item) => acc + item.sets.length, 0);
}

function getDoneSetCount() {
  return getCurrentPlan().exercises.reduce((acc, item) => {
    const done = getSetDone(item.id);
    return acc + Math.min(done, item.sets.length);
  }, 0);
}

function getCompletionRate() {
  const total = getCurrentPlan().exercises.length;
  if (total === 0) {
    return 0;
  }
  return Math.round((getCompletedExerciseCount() / total) * 100);
}

function normalizeCustomPlans() {
  if (!state.customPlans || typeof state.customPlans !== "object") {
    state.customPlans = {};
    return;
  }

  const normalized = {};
  Object.keys(ROUTINE_PLAN).forEach((dayCode) => {
    if (state.customPlans[dayCode]) {
      normalized[dayCode] = normalizePlanForDay(state.customPlans[dayCode], dayCode);
    }
  });
  state.customPlans = normalized;
}

function normalizePlanForDay(rawPlan, dayCode) {
  const base = ROUTINE_PLAN[dayCode] || ROUTINE_PLAN.MON;
  const source = rawPlan && typeof rawPlan === "object" ? rawPlan : {};
  const hasCustomExerciseList = Array.isArray(source.exercises);
  const sourceExercises = hasCustomExerciseList ? source.exercises : base.exercises;

  return {
    dayLabel: typeof source.dayLabel === "string" ? source.dayLabel : base.dayLabel,
    theme: typeof source.theme === "string" ? source.theme : base.theme,
    trainingFocus: typeof source.trainingFocus === "string" ? source.trainingFocus : base.trainingFocus,
    warmupMain: typeof source.warmupMain === "string" ? source.warmupMain : base.warmupMain,
    warmupTime: typeof source.warmupTime === "string" ? source.warmupTime : base.warmupTime,
    warmupNote: typeof source.warmupNote === "string" ? source.warmupNote : (base.warmupNote || ""),
    cardioMain: typeof source.cardioMain === "string" ? source.cardioMain : base.cardioMain,
    cardioTime: typeof source.cardioTime === "string" ? source.cardioTime : base.cardioTime,
    cardioPlan: typeof source.cardioPlan === "string" ? source.cardioPlan : (base.cardioPlan || ""),
    exercises: sourceExercises.map((item, index) => cloneExerciseItem(item, index))
  };
}

function cloneExerciseItem(item, index) {
  const source = item && typeof item === "object" ? item : {};
  const name = typeof source.name === "string" && source.name.trim()
    ? source.name.trim()
    : `Exercise ${index + 1}`;
  const safeId = typeof source.id === "string" && source.id.trim()
    ? source.id.trim()
    : `exercise-${index + 1}-${slugifyToken(name) || "item"}`;
  const sets = Array.isArray(source.sets)
    ? source.sets.map((entry) => String(entry).trim()).filter(Boolean)
    : [];
  const restCandidate = Number(source.restSec);
  const cloned = {
    id: safeId,
    name,
    sets: sets.length ? sets : ["BW x12"],
    restSec: Number.isFinite(restCandidate) ? Math.max(0, Math.floor(restCandidate)) : 75,
    howTo: source.howTo,
    machine: source.machine,
    ball: source.ball,
    safety: source.safety,
    mistake: source.mistake
  };
  fillGuideDefaults(cloned);
  return cloned;
}

function fillGuideDefaults(exerciseItem) {
  exerciseItem.howTo = typeof exerciseItem.howTo === "string" && exerciseItem.howTo.trim()
    ? exerciseItem.howTo
    : DEFAULT_EXERCISE_GUIDE.howTo;
  exerciseItem.machine = typeof exerciseItem.machine === "string" && exerciseItem.machine.trim()
    ? exerciseItem.machine
    : DEFAULT_EXERCISE_GUIDE.machine;
  exerciseItem.ball = typeof exerciseItem.ball === "string" && exerciseItem.ball.trim()
    ? exerciseItem.ball
    : DEFAULT_EXERCISE_GUIDE.ball;
  exerciseItem.safety = typeof exerciseItem.safety === "string" && exerciseItem.safety.trim()
    ? exerciseItem.safety
    : DEFAULT_EXERCISE_GUIDE.safety;
  exerciseItem.mistake = typeof exerciseItem.mistake === "string" && exerciseItem.mistake.trim()
    ? exerciseItem.mistake
    : DEFAULT_EXERCISE_GUIDE.mistake;
}

function ensureCustomPlan(dayCode) {
  if (!state.customPlans[dayCode]) {
    state.customPlans[dayCode] = normalizePlanForDay(getPlanByDay(dayCode), dayCode);
  }
  return state.customPlans[dayCode];
}

function getPlanByDay(dayCode) {
  if (state.customPlans && state.customPlans[dayCode]) {
    return state.customPlans[dayCode];
  }
  return ROUTINE_PLAN[dayCode] || ROUTINE_PLAN.MON;
}

function getCurrentPlan() {
  return getPlanByDay(selectedDay);
}

function buildYoutubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} 한국어`)}`;
}

function toExerciseVideoKeyword(exerciseName) {
  const raw = String(exerciseName || "").trim();
  if (!raw) {
    return "헬스 운동";
  }
  const withoutParen = raw.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return withoutParen || raw;
}

function getExerciseVideoQueries(exerciseItem) {
  if (!exerciseItem || !exerciseItem.id) {
    return {
      howTo: "운동 마무리 스트레칭",
      machine: "헬스장 기구 세팅 사용법"
    };
  }
  const override = EXERCISE_VIDEO_QUERY_OVERRIDES[exerciseItem.id];
  if (override) {
    return override;
  }
  const keyword = toExerciseVideoKeyword(exerciseItem.name);
  return {
    howTo: `${keyword} 운동방법`,
    machine: `${keyword} 기구 사용법`
  };
}

function renderExerciseVideoLinks(exerciseItem) {
  if (!ui.videoLinkNote || !ui.howToVideoLink || !ui.machineVideoLink) {
    return;
  }
  const queries = getExerciseVideoQueries(exerciseItem);
  if (!exerciseItem) {
    ui.videoLinkNote.textContent = "루틴 완료 기준 | 마무리/기구 세팅 영상";
    ui.howToVideoLink.textContent = "마무리 스트레칭 영상 보기";
    ui.machineVideoLink.textContent = "기구 세팅/정리 영상 보기";
  } else {
    ui.videoLinkNote.textContent = `선택 운동: ${exerciseItem.name} | 한국어 영상`;
    ui.howToVideoLink.textContent = "운동방법 영상 보기";
    ui.machineVideoLink.textContent = "기구사용법 영상 보기";
  }
  ui.howToVideoLink.href = buildYoutubeSearchUrl(queries.howTo);
  ui.machineVideoLink.href = buildYoutubeSearchUrl(queries.machine);
}

function splitSetTarget(setText) {
  const raw = String(setText || "").trim();
  if (!raw) {
    return { load: "", reps: "" };
  }
  const matched = raw.match(/^(.*?)\s*[xX×]\s*(.+)$/);
  if (!matched) {
    return { load: "", reps: raw };
  }
  return {
    load: matched[1].trim(),
    reps: matched[2].trim()
  };
}

function composeSetTarget(load, reps) {
  const cleanLoad = String(load || "").trim();
  const cleanReps = String(reps || "").trim();
  if (!cleanReps) {
    return "";
  }
  return cleanLoad ? `${cleanLoad} x${cleanReps}` : cleanReps;
}

function renderEditorSetRows(sets) {
  const normalizedSets = Array.isArray(sets) && sets.length
    ? sets.map((entry) => {
      if (isPlainObject(entry)) {
        return {
          load: String(entry.load || ""),
          reps: String(entry.reps || "")
        };
      }
      return splitSetTarget(entry);
    })
    : [{ load: "", reps: "" }];
  const canRemove = normalizedSets.length > 1;
  ui.editorSetRows.innerHTML = normalizedSets.map((setRow, index) => {
    return `
      <div class="editor-set-row">
        <span class="editor-set-index">${index + 1}세트</span>
        <input
          class="editor-input"
          type="text"
          data-set-load-index="${index}"
          value="${escapeHtml(setRow.load)}"
          placeholder="중량/BW"
        >
        <input
          class="editor-input editor-set-reps"
          type="text"
          data-set-reps-index="${index}"
          value="${escapeHtml(setRow.reps)}"
          placeholder="횟수"
        >
        <button
          class="btn ghost small"
          type="button"
          data-remove-set-index="${index}"
          ${canRemove ? "" : "disabled"}
        >삭제</button>
      </div>
    `;
  }).join("");
}

function readEditorSetRows({ includeEmpty = false } = {}) {
  const loadInputs = Array.from(ui.editorSetRows.querySelectorAll("[data-set-load-index]"));
  const repsInputs = Array.from(ui.editorSetRows.querySelectorAll("[data-set-reps-index]"));
  const rows = loadInputs.map((loadInput, index) => {
    const repsInput = repsInputs[index];
    const loadValue = loadInput instanceof HTMLInputElement ? loadInput.value.trim() : "";
    const repsValue = repsInput instanceof HTMLInputElement ? repsInput.value.trim() : "";
    return {
      load: loadValue,
      reps: repsValue
    };
  });
  if (includeEmpty) {
    return rows;
  }
  return rows.filter((row) => row.load || row.reps);
}

function readEditorDraft() {
  const name = (ui.editorExerciseName.value || "").trim();
  const rawRestSec = Number(ui.editorRestSec.value);
  const setRows = readEditorSetRows({ includeEmpty: true });
  const filledRows = setRows.filter((row) => row.load || row.reps);
  const invalidRowIndex = filledRows.findIndex((row) => !row.reps);
  const sets = filledRows
    .map((row) => composeSetTarget(row.load, row.reps))
    .filter(Boolean);

  if (!name) {
    return { error: "운동 이름을 입력해 주세요." };
  }
  if (!Number.isFinite(rawRestSec)) {
    return { error: "휴식 시간(초)을 숫자로 입력해 주세요." };
  }
  if (invalidRowIndex >= 0) {
    return { error: `${invalidRowIndex + 1}세트 횟수를 입력해 주세요.` };
  }
  if (sets.length === 0) {
    return { error: "세트를 하나 이상 입력해 주세요." };
  }

  return {
    value: {
      name,
      restSec: Math.max(0, Math.min(600, Math.floor(rawRestSec))),
      sets
    }
  };
}

function setEditorMessage(message) {
  ui.editorMessage.textContent = message || "";
}

function slugifyToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function createExerciseId(name, existingIds) {
  const base = slugifyToken(name) || "exercise";
  const stamp = Date.now().toString(36);
  let counter = 0;
  let candidate = "";
  do {
    const suffix = counter === 0 ? stamp : `${stamp}-${counter}`;
    candidate = `custom-${base}-${suffix}`;
    counter += 1;
  } while (existingIds.has(candidate));
  return candidate;
}

function syncSessionToCurrentPlan(dayCode = selectedDay) {
  const session = getCurrentSession();
  if (!session) {
    return;
  }
  const plan = getPlanByDay(dayCode);
  const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
  const nextSetDone = {};
  const nextCompleted = {};

  exercises.forEach((item) => {
    const rawDone = Number(session.setDoneByExercise[item.id]);
    const done = Number.isFinite(rawDone) ? Math.max(0, Math.floor(rawDone)) : 0;
    const clamped = Math.min(done, item.sets.length);
    if (clamped > 0) {
      nextSetDone[item.id] = clamped;
    }
    if (Boolean(session.completedExerciseMap[item.id]) || clamped >= item.sets.length) {
      nextCompleted[item.id] = true;
    }
  });

  session.setDoneByExercise = nextSetDone;
  session.completedExerciseMap = nextCompleted;
  if (!session.activeExerciseId || !exercises.some((item) => item.id === session.activeExerciseId)) {
    session.activeExerciseId = exercises[0] ? exercises[0].id : null;
  }
  session.updatedAt = new Date().toISOString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeSessionKey(dayCode) {
  return `${getTodayDateString()}_${dayCode}`;
}

function createEmptySession(dayCode) {
  return {
    sessionKey: makeSessionKey(dayCode),
    dayCode,
    setDoneByExercise: {},
    completedExerciseMap: {},
    searchCount: 0,
    workoutElapsedSec: 0,
    workoutTimerRunning: false,
    workoutLastTickMs: null,
    anxietyScore: 3,
    activeExerciseId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSavedAt: null
  };
}

function ensureSession(dayCode) {
  const key = makeSessionKey(dayCode);
  if (!isPlainObject(state.sessions)) {
    state.sessions = {};
  }
  if (!isPlainObject(state.sessions[key])) {
    state.sessions[key] = createEmptySession(dayCode);
  }
  state.currentSessionKey = key;
  const session = state.sessions[key];
  if (!isPlainObject(session.setDoneByExercise)) {
    session.setDoneByExercise = {};
  }
  if (!isPlainObject(session.completedExerciseMap)) {
    session.completedExerciseMap = {};
  }
  if (!Number.isFinite(session.searchCount)) {
    session.searchCount = 0;
  }
  if (!Number.isFinite(session.workoutElapsedSec)) {
    session.workoutElapsedSec = 0;
  }
  if (typeof session.workoutTimerRunning !== "boolean") {
    session.workoutTimerRunning = false;
  }
  if (!Number.isFinite(session.workoutLastTickMs)) {
    session.workoutLastTickMs = null;
  }
  if (!Number.isFinite(session.anxietyScore)) {
    session.anxietyScore = 3;
  }
  syncSessionToCurrentPlan(dayCode);
  return session;
}

function getCurrentSession() {
  return state.sessions[state.currentSessionKey];
}

function createInitialState() {
  return {
    planVersion: PLAN_VERSION,
    selectedDay: null,
    analyticsScope: "week",
    currentSessionKey: null,
    sessions: {},
    history: [],
    customPlans: {}
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeLoadedState(parsed) {
  const initial = createInitialState();
  if (!isPlainObject(parsed)) {
    return initial;
  }

  initial.selectedDay = typeof parsed.selectedDay === "string" ? parsed.selectedDay : null;
  initial.planVersion = PLAN_VERSION;
  initial.analyticsScope = ANALYTICS_SCOPES.includes(parsed.analyticsScope) ? parsed.analyticsScope : "week";
  initial.currentSessionKey = typeof parsed.currentSessionKey === "string" ? parsed.currentSessionKey : null;

  if (isPlainObject(parsed.sessions)) {
    Object.keys(parsed.sessions).forEach((sessionKey) => {
      const session = parsed.sessions[sessionKey];
      if (isPlainObject(session)) {
        initial.sessions[sessionKey] = { ...session };
      }
    });
  }

  if (Array.isArray(parsed.history)) {
    initial.history = parsed.history
      .filter((entry) => isPlainObject(entry))
      .map((entry) => ({ ...entry }));
  }

  if (isPlainObject(parsed.customPlans)) {
    initial.customPlans = { ...parsed.customPlans };
  }

  return initial;
}

function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialState();
  }
  try {
    return normalizeLoadedState(JSON.parse(raw));
  } catch (_error) {
    return createInitialState();
  }
}

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function prepareLoadedState() {
  selectedDay = selectInitialDay();
  analyticsScope = ANALYTICS_SCOPES.includes(state.analyticsScope) ? state.analyticsScope : "week";
  normalizeCustomPlans();
  state.analyticsScope = analyticsScope;
  editorSelectedExerciseId = null;
  ensureSession(selectedDay);
  restoreWorkoutTimerIfNeeded();
}

function selectInitialDay() {
  if (state.selectedDay && ROUTINE_PLAN[state.selectedDay]) {
    return state.selectedDay;
  }
  return getTodayCode();
}

function getTodayCode() {
  const day = new Date().getDay();
  if (day === 1) {
    return "MON";
  }
  if (day === 2) {
    return "TUE";
  }
  if (day === 3) {
    return "WED";
  }
  if (day === 4) {
    return "THU";
  }
  if (day === 5) {
    return "FRI";
  }
  if (day === 6) {
    return "SAT";
  }
  return "MON";
}

function weekdayByCode(code) {
  return WEEKDAYS.find((item) => item.code === code) || WEEKDAYS[0];
}

function announce(message) {
  ui.coachMessage.textContent = message;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayName = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${year}-${month}-${day} (${dayName})`;
}

function toClock(totalSec) {
  const minutes = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const seconds = String(totalSec % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function toDurationClock(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
