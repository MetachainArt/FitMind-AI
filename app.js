"use strict";

const WEEKDAYS = [
  { code: "MON", short: "월", title: "월요일" },
  { code: "TUE", short: "화", title: "화요일" },
  { code: "WED", short: "수", title: "수요일" },
  { code: "THU", short: "목", title: "목요일" },
  { code: "FRI", short: "금", title: "금요일" }
];

const STORAGE_KEY = "fitmind_state_v1";
const DEFAULT_EXERCISE_GUIDE = {
  howTo: "Control the tempo and keep each rep strict.",
  machine: "Align seat and pads so joint axis matches machine axis.",
  ball: "If machine is busy, use dumbbells or bands with similar motion.",
  safety: "If pain is sharp, stop and reduce load immediately.",
  mistake: "Using momentum instead of target-muscle tension."
};

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
  return { id, name, sets, restSec, howTo, machine, ball, safety, mistake };
}

const ROUTINE_PLAN = {
  MON: {
    dayLabel: "MON",
    theme: "Lower Body & Glutes",
    trainingFocus: "Training Focus: Legs, Glutes, Fat burn",
    warmupMain: "Dynamic warm-up (hip/ankle/knee)",
    warmupTime: "5 min",
    warmupNote: "가볍게 관절 풀기 + 엉덩이 활성화",
    cardioMain: "Incline Walk 5.8~6.3 km/h",
    cardioTime: "40 min",
    cardioPlan: "0-5' 6% -> 5-15' 8% -> 15-30' 10% -> 30-35' 8% -> 35-40' 6%",
    exercises: [
      exercise({
        id: "leg-press",
        name: "레그프레스 (Leg Press)",
        sets: ["50kg x12", "50kg x12", "50kg x12", "50kg x12"],
        restSec: 90,
        howTo: "발은 골반 너비로 두고, 내릴 때 2초, 밀 때 1초로 일정하게 진행해.",
        machine: "등받이를 고정하고 허리가 뜨지 않게 밀착. 발판은 발 중앙으로 눌러.",
        ball: "대체: 짐볼 월 스쿼트 12회 x 3세트.",
        safety: "무릎을 끝까지 잠그지 말고 발끝과 무릎 방향을 맞춰.",
        mistake: "반동으로 빠르게 밀면 무릎과 허리에 부담이 커져."
      }),
      exercise({
        id: "hip-abduction",
        name: "힙 어브덕션 (Hip Abduction, 벌리기)",
        sets: ["35kg x15", "35kg x15", "35kg x15"],
        restSec: 70,
        howTo: "허리를 세우고 무릎으로 바깥쪽을 밀어 엉덩이 옆쪽을 조여.",
        machine: "등받이에 밀착하고 패드 위치를 무릎 바깥에 맞춘 뒤 가동범위를 일정하게 유지.",
        ball: "대체: 미니밴드 사이드 스텝 15회 x 3세트.",
        safety: "반동 없이 천천히 벌리고 모아. 허리 과신전 금지.",
        mistake: "상체를 흔들어 밀면 중둔근 자극이 줄어."
      }),
      exercise({
        id: "hip-adduction",
        name: "힙 어덕션 (Hip Adduction, 조이기)",
        sets: ["30kg x15", "30kg x15", "30kg x15"],
        restSec: 70,
        howTo: "골반을 고정하고 허벅지 안쪽 힘으로 패드를 조여.",
        machine: "등을 붙이고 좌석 깊이를 맞춘 뒤 양쪽 다리 각도를 대칭으로 유지.",
        ball: "대체: 짐볼/요가볼 무릎 사이 조이기 15회 x 3세트.",
        safety: "사타구니 통증이 있으면 가동범위를 줄여서 진행.",
        mistake: "힘으로 빠르게 닫으면 내전근 긴장만 올라가고 자극이 분산돼."
      }),
      exercise({
        id: "lying-leg-curl",
        name: "라잉 레그컬 (Lying Leg Curl)",
        sets: ["25kg x12", "25kg x12", "25kg x12"],
        restSec: 75,
        howTo: "발목 패드를 뒤꿈치 위에 맞추고 햄스트링 수축에 집중해.",
        machine: "무릎 축과 기계 회전축을 일치시키고 배를 벤치에 붙여.",
        ball: "대체: 짐볼 햄스트링 컬 12회 x 3세트.",
        safety: "허리를 과하게 꺾지 말고 천천히 내려와.",
        mistake: "엉덩이가 들리면 햄스트링 자극이 줄어들어."
      }),
      exercise({
        id: "standing-calf-raise",
        name: "스탠딩 카프레이즈 (Standing Calf Raise)",
        sets: ["BW x20", "BW x20", "BW x20", "BW x20"],
        restSec: 60,
        howTo: "발끝으로 천천히 올라가서 1초 정지, 천천히 내려와.",
        machine: "어깨 패드를 안정적으로 고정하고 발의 앞쪽만 발판에 올려.",
        ball: "대체: 짐볼 벽 짚고 단일 다리 카프레이즈 15회 x 3세트.",
        safety: "발목을 바깥으로 꺾지 말고 정면을 유지해.",
        mistake: "반동만 쓰면 종아리 자극이 약해져."
      })
    ]
  },
  TUE: {
    dayLabel: "TUE",
    theme: "Back & Arms",
    trainingFocus: "Training Focus: Back, Biceps, Fat loss",
    warmupMain: "Band row + shoulder mobility",
    warmupTime: "5 min",
    warmupNote: "등/어깨 관절 가동 + 등 활성화",
    cardioMain: "Incline Walk 6.0~6.5 km/h",
    cardioTime: "40 min",
    cardioPlan: "0-5' 6% -> 5-10' 8% -> 10-20' 10% -> 20-30' 12%(힘들면 10%) -> 30-35' 8% -> 35-40' 6%",
    exercises: [
      exercise({
        id: "lat-pulldown",
        name: "랫풀다운 (Lat Pulldown)",
        sets: ["45kg x12", "45kg x12", "45kg x12", "45kg x12"],
        restSec: 90,
        howTo: "가슴을 살짝 세우고 팔꿈치를 아래로 당겨 광배 수축을 느껴.",
        machine: "무릎 패드로 하체를 고정하고 바는 어깨보다 약간 넓게 잡아.",
        ball: "대체: 짐볼 랫 풀오버 12회 x 3세트.",
        safety: "목 뒤로 당기지 말고 쇄골 앞쪽으로 당겨.",
        mistake: "상체를 과하게 젖히면 허리에 부담이 생겨."
      }),
      exercise({
        id: "seated-row",
        name: "시티드 로우 (Seated Row)",
        sets: ["40kg x12", "40kg x12", "40kg x12"],
        restSec: 80,
        howTo: "당길 때 어깨를 내리고, 끝지점에서 날개뼈를 모아.",
        machine: "손잡이 높이는 명치 라인, 발판은 무릎이 살짝 굽혀지는 위치.",
        ball: "대체: 밴드 로우 또는 짐볼 체스트서포트 로우 12회 x 3세트.",
        safety: "허리를 둥글게 말지 말고 중립 유지.",
        mistake: "팔로만 당기면 등 자극이 줄어들어."
      }),
      exercise({
        id: "barbell-curl",
        name: "바벨 컬 (Barbell Curl)",
        sets: ["25kg x10", "25kg x10", "25kg x10"],
        restSec: 70,
        howTo: "팔꿈치는 몸통 옆에 고정하고, 위에서 1초 멈춰.",
        machine: "기구 없음. 손목이 꺾이지 않게 바를 균등하게 잡아.",
        ball: "대체: 짐볼 시팅 덤벨 컬 12회 x 3세트.",
        safety: "허리 반동을 줄이고 코어 힘으로 버텨.",
        mistake: "몸을 젖혀서 들면 이두에 집중이 흐려져."
      }),
      exercise({
        id: "hammer-curl",
        name: "해머 컬 (Hammer Curl)",
        sets: ["12kg x12", "12kg x12", "12kg x12"],
        restSec: 70,
        howTo: "엄지 위로 향한 그립으로 팔꿈치를 고정해 천천히 들어.",
        machine: "기구 없음. 덤벨 시작 위치는 허벅지 옆.",
        ball: "대체: 짐볼 시팅 해머 컬 12회 x 3세트.",
        safety: "손목을 꺾지 말고 중립 유지.",
        mistake: "무게 욕심으로 템포가 빨라지면 자극이 사라져."
      }),
      exercise({
        id: "triceps-pushdown",
        name: "트라이셉스 푸시다운 (Triceps Pushdown)",
        sets: ["35kg x12", "35kg x12", "35kg x12"],
        restSec: 70,
        howTo: "팔꿈치 고정, 아래에서 1초 멈추고 천천히 복귀.",
        machine: "케이블 높이는 상단, 손잡이는 손목이 편한 타입 선택.",
        ball: "대체: 짐볼 오버헤드 트라이셉 익스텐션 12회 x 3세트.",
        safety: "어깨가 말리지 않게 가슴을 펴.",
        mistake: "팔꿈치가 앞뒤로 흔들리면 삼두 집중이 깨져."
      })
    ]
  },
  WED: {
    dayLabel: "WED",
    theme: "Abs & Cardio",
    trainingFocus: "Training Focus: Belly fat destruction",
    warmupMain: "Easy walk + trunk activation",
    warmupTime: "5 min",
    warmupNote: "복압/호흡 잡고 코어 깨우기",
    cardioMain: "Incline Walk 5.8~6.2 km/h",
    cardioTime: "40 min",
    cardioPlan: "0-5' 6% -> 5-25' 10% 유지 -> 25-35' 12%(심박 과하면 10%) -> 35-40' 6%",
    exercises: [
      exercise({
        id: "hanging-leg-raise",
        name: "행잉 레그레이즈 (Hanging Leg Raise)",
        sets: ["10", "10", "10"],
        restSec: 75,
        howTo: "골반을 말아 올린다는 느낌으로 다리를 들어.",
        machine: "철봉/딥스 스테이션에서 어깨를 끌어내리고 버텨.",
        ball: "대체: 짐볼 니턱 12회 x 3세트.",
        safety: "상체 흔들림을 최소화하고 반동 금지.",
        mistake: "다리만 드는 동작으로 끝내면 복부 개입이 약해져."
      }),
      exercise({
        id: "cable-crunch",
        name: "케이블 크런치 (Cable Crunch)",
        sets: ["15", "15", "15"],
        restSec: 60,
        howTo: "갈비뼈를 골반 쪽으로 접는 느낌으로 말아 내려와.",
        machine: "케이블 로프를 머리 옆에 고정하고 무릎 고정.",
        ball: "대체: 짐볼 크런치 15회 x 3세트.",
        safety: "허리를 꺾지 말고 복부 수축으로만 움직여.",
        mistake: "팔 힘으로 당기면 복부 자극이 떨어져."
      }),
      exercise({
        id: "plank",
        name: "플랭크 (Plank)",
        sets: ["60s", "60s", "60s"],
        restSec: 60,
        howTo: "머리-골반-발뒤꿈치가 일직선. 배꼽을 끌어당겨 유지해.",
        machine: "기구 없음. 팔꿈치는 어깨 아래 정렬.",
        ball: "대체: 짐볼 플랭크 30~45초 x 3세트.",
        safety: "허리가 꺼지지 않게 엉덩이를 살짝 말아.",
        mistake: "버티는 시간만 늘리면 자세가 먼저 무너져."
      })
    ]
  },
  THU: {
    dayLabel: "THU",
    theme: "Legs Volume",
    trainingFocus: "Training Focus: Thighs, Glutes",
    warmupMain: "Lower-body prep (glute bridge/air squat)",
    warmupTime: "5 min",
    warmupNote: "무릎/고관절 안정화 위주",
    cardioMain: "Incline Walk 5.8~6.3 km/h",
    cardioTime: "40 min",
    cardioPlan: "0-5' 6% -> 5-20' 8% -> 20-30' 10% -> 30-35' 8% -> 35-40' 6%",
    exercises: [
      exercise({
        id: "squat-machine",
        name: "스쿼트 머신 (Squat Machine)",
        sets: ["40kg x10", "40kg x10", "40kg x10", "40kg x10"],
        restSec: 90,
        howTo: "발은 어깨너비, 엉덩이를 뒤로 보내며 내려갔다가 밀어 올려.",
        machine: "어깨 패드 높이를 맞추고 발 위치를 너무 앞뒤로 치우치지 않게.",
        ball: "대체: 짐볼 월 스쿼트 12회 x 3세트.",
        safety: "무릎이 안쪽으로 붕괴되지 않게 집중해.",
        mistake: "상체가 과하게 숙여지면 허리 부담이 커져."
      }),
      exercise({
        id: "leg-extension",
        name: "레그 익스텐션 (Leg Extension)",
        sets: ["35kg x12", "35kg x12", "35kg x12"],
        restSec: 75,
        howTo: "정점에서 1초 멈추고 천천히 내려와 전면 허벅지에 집중.",
        machine: "무릎 축 정렬, 패드는 발목 위에 고정.",
        ball: "대체: 짐볼 스쿼트 홀드 30초 x 3세트.",
        safety: "무릎 통증이 느껴지면 가동범위를 줄여.",
        mistake: "다리를 툭 차듯 올리면 관절 부담이 커져."
      }),
      exercise({
        id: "leg-curl-seated",
        name: "레그 컬 (Leg Curl)",
        sets: ["30kg x12", "30kg x12", "30kg x12"],
        restSec: 75,
        howTo: "햄스트링 수축을 느끼며 끝점에서 짧게 멈춰.",
        machine: "좌석 깊이와 발목 패드 위치를 먼저 맞춰.",
        ball: "대체: 짐볼 햄스트링 컬 12회 x 3세트.",
        safety: "허벅지가 들리지 않게 고정해.",
        mistake: "빠르게 반동으로 움직이면 자극이 분산돼."
      }),
      exercise({
        id: "hip-thrust",
        name: "힙 쓰러스트 (Hip Thrust)",
        sets: ["40kg x12", "40kg x12", "40kg x12"],
        restSec: 90,
        howTo: "상단에서 엉덩이를 꽉 조이고 1초 멈춰.",
        machine: "등 상단은 벤치에 고정, 발은 무릎 90도 근처.",
        ball: "대체: 짐볼 글루트 브릿지 15회 x 3세트.",
        safety: "허리를 꺾지 말고 골반 후방경사를 만들어.",
        mistake: "목을 과하게 젖히면 코어가 풀려."
      }),
      exercise({
        id: "calf-press",
        name: "카프 프레스 (Calf Press)",
        sets: ["40kg x20", "40kg x20", "40kg x20", "40kg x20"],
        restSec: 60,
        howTo: "종아리 수축을 느끼며 짧게 멈춘 뒤 천천히 내려.",
        machine: "발 앞꿈치 중심으로 발판에 위치해 가동범위를 확보.",
        ball: "대체: 짐볼 벽 짚고 카프레이즈 20회 x 3세트.",
        safety: "발목이 꺾이지 않게 정렬 유지.",
        mistake: "너무 짧은 가동범위로 하면 자극이 줄어."
      })
    ]
  },
  FRI: {
    dayLabel: "FRI",
    theme: "Chest, Shoulders & Abs",
    trainingFocus: "Training Focus: Upper body, Core",
    warmupMain: "Shoulder warm-up (band pull-apart/light press)",
    warmupTime: "5 min",
    warmupNote: "어깨 가동 + 가슴/견갑 안정",
    cardioMain: "Incline Walk 6.0~6.5 km/h",
    cardioTime: "40 min",
    cardioPlan: "0-5' 6% -> 5-15' 8% -> 15-25' 10% -> 25-35' 12% -> 35-40' 6%",
    exercises: [
      exercise({
        id: "chest-press",
        name: "체스트 프레스 (Chest Press)",
        sets: ["40kg x12", "40kg x12", "40kg x12", "40kg x12"],
        restSec: 90,
        howTo: "가슴을 펴고 손잡이를 밀 때 팔꿈치를 완전히 잠그지 않아.",
        machine: "시트 높이는 손잡이가 가슴 중앙에 오도록 맞춰.",
        ball: "대체: 짐볼 푸시업 10~12회 x 3세트.",
        safety: "어깨가 으쓱 올라가지 않게 내려 고정해.",
        mistake: "반동으로 밀면 가슴 자극보다 관절 부담이 커져."
      }),
      exercise({
        id: "shoulder-press",
        name: "숄더 프레스 (Shoulder Press)",
        sets: ["25kg x10", "25kg x10", "25kg x10"],
        restSec: 85,
        howTo: "팔꿈치는 손목 아래, 밀어 올릴 때 코어를 단단히 유지.",
        machine: "좌석 높이는 손잡이가 턱~귀 라인에서 시작하도록.",
        ball: "대체: 짐볼 시팅 덤벨 프레스 10~12회 x 3세트.",
        safety: "허리를 과신전하지 말고 갈비뼈를 닫아.",
        mistake: "목 앞으로 밀면 어깨 전면에 과부하가 와."
      }),
      exercise({
        id: "lateral-raise",
        name: "레터럴 레이즈 (Lateral Raise)",
        sets: ["8kg x15", "8kg x15", "8kg x15"],
        restSec: 70,
        howTo: "팔꿈치를 살짝 굽힌 상태로 어깨높이까지만 들어.",
        machine: "덤벨 사용. 손목과 팔꿈치 높이를 일정하게 유지.",
        ball: "대체: 짐볼 시팅 레터럴 레이즈 15회 x 3세트.",
        safety: "승모로 들지 말고 어깨 측면으로 들어올려.",
        mistake: "팔을 너무 높이 들면 어깨 충돌 위험이 커져."
      }),
      exercise({
        id: "cable-crunch-fri",
        name: "케이블 크런치 (Cable Crunch)",
        sets: ["15", "15", "15"],
        restSec: 60,
        howTo: "복부를 둥글게 말며 천천히 수축해.",
        machine: "케이블 로프를 머리 옆에 고정하고 코어 유지.",
        ball: "대체: 짐볼 크런치 15회 x 3세트.",
        safety: "목을 당기지 말고 시선은 바닥 전방.",
        mistake: "허리만 접으면 복부 자극이 약해져."
      }),
      exercise({
        id: "russian-twist",
        name: "러시안 트위스트 (Russian Twist)",
        sets: ["20", "20", "20"],
        restSec: 60,
        howTo: "상체를 길게 세운 채 몸통 회전으로 좌우를 터치해.",
        machine: "기구 없음. 필요하면 가벼운 플레이트 사용.",
        ball: "짐볼 활용: 짐볼 잡고 좌우 회전 20회 x 3세트.",
        safety: "허리 통증 시 가동범위를 줄이고 천천히.",
        mistake: "팔만 흔들면 복사근 자극이 줄어."
      })
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

const state = loadState();
let selectedDay = selectInitialDay();
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
  normalizeCustomPlans();
  ensureSession(selectedDay);
  restoreWorkoutTimerIfNeeded();
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
      announce("운동 시간 측정을 잠깐 멈췄어.");
    } else {
      startWorkoutTimer();
      announce("좋아, 운동 시간 측정 시작.");
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
    const session = getCurrentSession();
    const summary = {
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

    state.history = (state.history || []).filter((entry) => entry.sessionKey !== summary.sessionKey);
    state.history.unshift(summary);
    state.history = state.history.slice(0, 20);
    session.lastSavedAt = summary.savedAt;
    session.updatedAt = summary.savedAt;
    persistState();
    ui.saveMessage.textContent = "오늘 요약을 저장했어.";
    renderHistory();
  });

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
    const currentSets = readEditorSetValues({ includeEmpty: true });
    const nextSets = currentSets.length ? currentSets : [""];
    nextSets.push("");
    renderEditorSetRows(nextSets);
    const lastInput = ui.editorSetRows.querySelector(`[data-set-input-index="${nextSets.length - 1}"]`);
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
    const currentSets = readEditorSetValues({ includeEmpty: true });
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
  renderHistory();
  renderTimer();
}

function renderHeader() {
  const weekday = weekdayByCode(selectedDay);
  const dateLabel = formatDateLabel(new Date());
  const isWeekend = !["MON", "TUE", "WED", "THU", "FRI"].includes(getTodayCode());
  const weekendHint = isWeekend ? " | 주말이라 월요일 루틴을 기본 추천 중" : "";
  ui.todayLabel.textContent = `${dateLabel} | 선택 루틴: ${weekday.title}${weekendHint}`;
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
        <button class="queue-name" data-jump-exercise="${item.id}">${escapeHtml(item.name)}</button>
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
    const optionLabel = `${index + 1}. ${item.name}`;
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
    ui.currentExerciseTitle.textContent = "오늘 루틴 완료";
    ui.currentExerciseTarget.textContent = "좋아, 계획한 운동은 전부 끝났어.";
    ui.targetSetList.innerHTML = "";
    ui.guideHowTo.textContent = "마무리 스트레칭 5분 진행하고 수분 보충해.";
    ui.guideMachine.textContent = "오늘 사용한 기구 높이/무게를 다음 루틴을 위해 메모해.";
    ui.guideBall.textContent = "짐볼 코어 스트레칭 2세트를 추가하면 회복에 좋아.";
    ui.guideSafety.textContent = "무리해서 추가 세트를 더 하지 말고 회복에 집중해.";
    ui.guideMistake.textContent = "다음 운동 전, 통증이 남으면 강도를 조정해.";
    ui.completeSetBtn.disabled = true;
    ui.markExerciseDoneBtn.disabled = true;
    return;
  }

  ui.completeSetBtn.disabled = false;
  ui.markExerciseDoneBtn.disabled = false;
  ui.currentExerciseTitle.textContent = active.name;
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
  ui.workoutTimerToggleBtn.textContent = workoutTimer.running ? "운동 시간 일시정지" : "운동 시간 시작";
  ui.anxietyRange.value = String(session.anxietyScore);
  ui.anxietyValue.textContent = `${session.anxietyScore}/5`;
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
    return `
      <li class="history-item">
        <strong>${item.date} ${weekday.short}</strong><br>
        완주율 ${item.completionRate}% | 운동시간 ${toDurationClock(elapsedSec)} | 검색 ${item.searchCount}회 | 불안도 ${item.anxietyScore}/5
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

function renderEditorSetRows(sets) {
  const normalizedSets = Array.isArray(sets) && sets.length
    ? sets.map((entry) => String(entry))
    : [""];
  const canRemove = normalizedSets.length > 1;
  ui.editorSetRows.innerHTML = normalizedSets.map((setText, index) => {
    return `
      <div class="editor-set-row">
        <span class="editor-set-index">${index + 1}세트</span>
        <input
          class="editor-input"
          type="text"
          data-set-input-index="${index}"
          value="${escapeHtml(setText)}"
          placeholder="예: 50kg x12"
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

function readEditorSetValues({ includeEmpty = false } = {}) {
  const setInputs = Array.from(ui.editorSetRows.querySelectorAll("[data-set-input-index]"));
  const rawValues = setInputs.map((input) => {
    if (!(input instanceof HTMLInputElement)) {
      return "";
    }
    return input.value;
  });
  if (includeEmpty) {
    return rawValues;
  }
  return rawValues.map((value) => value.trim()).filter(Boolean);
}

function readEditorDraft() {
  const name = (ui.editorExerciseName.value || "").trim();
  const rawRestSec = Number(ui.editorRestSec.value);
  const sets = readEditorSetValues();

  if (!name) {
    return { error: "운동 이름을 입력해 주세요." };
  }
  if (!Number.isFinite(rawRestSec)) {
    return { error: "휴식 시간(초)을 숫자로 입력해 주세요." };
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
    selectedDay: null,
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
