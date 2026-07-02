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
  ball: "기구가 비어 있지 않으면 비슷한 머신, 케이블, 밴드로 같은 부위를 가볍게 대체해.",
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
  "assisted-pull-up": { howTo: "어시스트 풀업 머신 운동방법", machine: "어시스트 풀업 머신 사용법" },
  "negative-pull-up-deadhang": { howTo: "네거티브 풀업 데드행 운동방법", machine: "철봉 턱걸이 보조 운동" },
  "scapular-pull-up-deadhang": { howTo: "스캐풀라 풀업 데드행 운동방법", machine: "철봉 매달리기 턱걸이 보조" },
  "seated-row": { howTo: "시티드 로우 운동방법", machine: "시티드 로우 머신 사용법" },
  "machine-biceps-curl": { howTo: "머신 바이셉 컬 운동방법", machine: "바이셉 컬 머신 사용법" },
  "cable-hammer-curl": { howTo: "케이블 해머 컬 운동방법", machine: "케이블 로프 컬 사용법" },
  "triceps-pushdown": { howTo: "트라이셉스 푸시다운 운동방법", machine: "케이블 푸시다운 기구 사용법" },
  "cable-woodchop": { howTo: "케이블 우드찹 운동방법", machine: "케이블 머신 코어 회전 운동" },
  "cable-woodchop-sat": { howTo: "케이블 우드찹 운동방법", machine: "케이블 머신 코어 회전 운동" },
  "ab-crunch-machine": { howTo: "복근 머신 크런치 운동방법", machine: "복근 크런치 머신 사용법" },
  "ab-crunch-machine-thu": { howTo: "복근 머신 크런치 운동방법", machine: "복근 크런치 머신 사용법" },
  plank: { howTo: "플랭크 자세 운동방법", machine: "플랭크 매트 사용법" },
  "side-plank": { howTo: "사이드 플랭크 자세 운동방법", machine: "사이드 플랭크 매트 운동" },
  "side-plank-sat": { howTo: "사이드 플랭크 자세 운동방법", machine: "사이드 플랭크 매트 운동" },
  "squat-machine": { howTo: "스쿼트 머신 운동방법", machine: "스쿼트 머신 사용법" },
  "leg-extension": { howTo: "레그 익스텐션 운동방법", machine: "레그 익스텐션 기구 사용법" },
  "leg-curl-seated": { howTo: "시티드 레그컬 운동방법", machine: "시티드 레그컬 기구 사용법" },
  "hip-thrust": { howTo: "힙 쓰러스트 운동방법", machine: "힙쓰러스트 머신 사용법" },
  "calf-press": { howTo: "카프 프레스 운동방법", machine: "카프 프레스 기구 사용법" },
  "chest-press": { howTo: "체스트 프레스 운동방법", machine: "체스트 프레스 기구 사용법" },
  "shoulder-press": { howTo: "숄더 프레스 운동방법", machine: "숄더 프레스 머신 사용법" },
  "lateral-raise": { howTo: "레터럴 레이즈 머신 운동방법", machine: "레터럴 레이즈 머신 사용법" },
  "russian-twist": { howTo: "러시안 트위스트 운동방법", machine: "러시안 트위스트 도구 사용법" },
  "machine-row": { howTo: "머신 로우 운동방법", machine: "머신 로우 기구 사용법" },
  "high-foot-leg-press": { howTo: "레그프레스 발 높게 운동방법", machine: "레그프레스 기구 사용법" },
  "face-pull": { howTo: "페이스풀 운동방법", machine: "케이블 페이스풀 사용법" },
  "pec-deck-machine": { howTo: "펙덱 머신 운동방법", machine: "펙덱 머신 사용법" },
  "leg-press-sat": { howTo: "레그프레스 운동방법", machine: "레그프레스 기구 사용법" },
  "chest-press-sat": { howTo: "체스트 프레스 운동방법", machine: "체스트 프레스 머신 사용법" },
  "seated-row-sat": { howTo: "시티드 로우 운동방법", machine: "시티드 로우 머신 사용법" },
  "shoulder-press-sat": { howTo: "숄더 프레스 운동방법", machine: "숄더 프레스 머신 사용법" },
  "lateral-raise-sat": { howTo: "레터럴 레이즈 머신 운동방법", machine: "레터럴 레이즈 머신 사용법" },
  "hip-abduction-sat": { howTo: "힙 어브덕션 운동방법", machine: "힙 어브덕션 머신 사용법" },
  "russian-twist-sat": { howTo: "러시안 트위스트 운동방법", machine: "러시안 트위스트 도구 사용법" }
};

const ANALYTICS_SCOPES = ["day", "week", "month"];
const INBODY_MAX_RECORDS = 12;
const INBODY_MAX_IMAGE_RECORDS = 6;
const INBODY_IMAGE_MAX_EDGE = 900;
const INBODY_IMAGE_QUALITY = 0.72;
const FIT_GOALS = ["체중감량", "근육증가", "체력향상", "복근강화", "건강관리"];
const FIT_DAY_PARTS = ["하체", "등", "가슴/어깨", "하체 후면", "전신", "복근"];
const DEFAULT_GENERATOR_TEMPLATES = {
  exercises: [
    { id: "tpl-squat", name: "레그프레스 또는 스쿼트 머신", part: "하체", place: ["헬스장", "집"], equipment: ["머신", "맨몸"], goals: ["체중감량", "근육증가", "건강관리"], avoid: ["무릎"] },
    { id: "tpl-hip-hinge", name: "힙 쓰러스트 머신 또는 레그컬", part: "하체 후면", place: ["헬스장", "집"], equipment: ["머신", "밴드", "맨몸"], goals: ["근육증가", "체력향상"], avoid: ["허리"] },
    { id: "tpl-lat-pull", name: "랫풀다운 또는 밴드 풀다운", part: "등", place: ["헬스장", "집"], equipment: ["머신", "밴드"], goals: ["근육증가", "풀업", "건강관리"], avoid: ["어깨"] },
    { id: "tpl-row", name: "시티드 로우 머신 또는 케이블 로우", part: "등", place: ["헬스장", "집"], equipment: ["머신", "케이블", "밴드"], goals: ["근육증가", "체력향상"], avoid: ["허리"] },
    { id: "tpl-push", name: "체스트 프레스 머신 또는 펙덱", part: "가슴/어깨", place: ["헬스장", "집", "야외"], equipment: ["머신", "맨몸"], goals: ["근육증가", "체력향상"], avoid: ["어깨", "손목"] },
    { id: "tpl-shoulder", name: "숄더 프레스 머신", part: "가슴/어깨", place: ["헬스장", "집"], equipment: ["머신"], goals: ["근육증가"], avoid: ["어깨"] },
    { id: "tpl-plank", name: "플랭크", part: "복근", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["복근강화", "건강관리"], avoid: ["허리"] },
    { id: "tpl-side-plank", name: "사이드 플랭크", part: "복근", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["복근강화", "체중감량", "건강관리"], avoid: ["어깨"] },
    { id: "tpl-cable-woodchop", name: "케이블 우드찹 또는 밴드 우드찹", part: "복근", place: ["헬스장", "집"], equipment: ["케이블", "밴드"], goals: ["복근강화", "체중감량", "건강관리"], avoid: ["허리"] },
    { id: "tpl-cardio", name: "대화 가능한 강도 유산소", part: "유산소", place: ["헬스장", "집", "야외"], equipment: ["러닝", "자전거", "맨몸"], goals: ["체중감량", "체력향상", "건강관리"], avoid: ["무릎"] },
    { id: "tpl-mobility", name: "관절 가동성 + 스트레칭", part: "회복", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["건강관리"], avoid: [] }
  ],
  meals: [
    { id: "meal-normal", name: "일반식 균형형", preference: "일반식", items: ["아침: 계란 2개 + 과일 + 두유", "점심: 밥 반-1공기 + 단백질 반찬 + 채소", "저녁: 닭가슴살/생선/두부 + 채소 + 고구마 소량"], note: "일반식을 유지하되 단백질과 채소를 먼저 고정합니다." },
    { id: "meal-protein", name: "고단백 근육형", preference: "고단백", items: ["아침: 그릭요거트 + 계란 + 과일", "점심: 밥 + 살코기/생선 + 채소", "저녁: 단백질 30g + 닭가슴살/두부 + 채소"], note: "매 끼니 단백질을 분산해서 근손실을 줄입니다." },
    { id: "meal-diet", name: "다이어트식 감량형", preference: "다이어트식", items: ["아침: 계란 + 두유 + 과일 소량", "점심: 일반식에서 밥은 반 공기", "저녁: 단백질 식품 + 채소, 하체 운동일만 탄수화물 소량"], note: "감량 중에도 저녁 단백질은 빼지 않습니다." },
    { id: "meal-vegan", name: "채식 단백질형", preference: "채식", items: ["아침: 두유 + 두부/콩류 + 과일", "점심: 잡곡밥 + 콩/두부/템페 + 채소", "저녁: 두부/콩고기 + 채소 + 고구마 소량"], note: "채식에서는 두부, 콩류, 두유로 단백질을 확보합니다." }
  ]
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
      exercise({
        id: "ab-crunch-machine",
        name: "복근: 복근 머신 크런치 또는 플랭크",
        sets: ["머신 12-15회", "머신 12-15회", "플랭크 45초"],
        restSec: 60,
        howTo: "복근 머신이 있으면 등 패드에 몸을 고정하고 배를 말아 접는 느낌으로 천천히 움직여. 머신이 불편하면 플랭크로 대체해.",
        machine: "복근 크런치 머신을 사용해. 무게는 가볍게 시작하고 허리가 꺾이지 않게 배를 먼저 조여.",
        ball: "복근 머신이 없거나 불편하면 플랭크 3세트로 대체해.",
        safety: "허리 통증이 있으면 즉시 멈추고 플랭크 시간을 줄여.",
        mistake: "목과 팔로 당기거나 반동으로 접으면 복근보다 허리에 부담이 커져."
      }),
      exercise({ id: "plank", name: "복근: 플랭크 (Plank)", sets: ["45-60초", "45-60초"], restSec: 60 })
    ]
  },
  TUE: {
    dayLabel: "TUE",
    theme: "등 · 풀업 입문 · 이두 · 복근",
    trainingFocus: "팔이 얇은 체형 보완과 턱걸이 1개 달성을 위해 등 당기기와 보조 풀업을 함께 진행.",
    warmupMain: "밴드 로우 + 어깨 가동성",
    warmupTime: "5-7분",
    warmupNote: "하체 운동 다음날 조깅은 속도 욕심 내지 말고 회복을 우선해.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "근력 전에는 가벼운 관절 워밍업만 진행.",
    exercises: [
      exercise({ id: "lat-pulldown", name: "랫풀다운 (Lat Pulldown)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({
        id: "assisted-pull-up",
        name: "턱걸이 입문: 어시스트 풀업 머신/밴드 풀업",
        sets: ["보조 크게 3-5회", "보조 크게 3-5회", "보조 크게 3-5회"],
        restSec: 120,
        howTo: "가슴을 살짝 들고 어깨를 귀에서 멀리 내린 뒤, 턱보다 가슴을 바에 가까이 보낸다는 느낌으로 당겨.",
        machine: "어시스트 풀업 머신이 있으면 체중을 많이 보조하는 무게부터 시작해. 없으면 밴드나 발 받침으로 도움을 받아.",
        ball: "기구가 없으면 스미스머신 낮은 바에서 인버티드 로우 3세트로 대체해.",
        safety: "반동으로 뛰어오르지 말고 어깨 앞쪽 통증이 있으면 즉시 중단해.",
        mistake: "목만 빼서 턱을 넘기려 하면 등이 아니라 목과 팔꿈치에 부담이 커져."
      }),
      exercise({ id: "seated-row", name: "시티드 로우 (Seated Row)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 90 }),
      exercise({ id: "machine-row", name: "머신 로우 (Machine Row)", sets: ["10-12회", "10-12회", "10-12회"], restSec: 80 }),
      exercise({ id: "machine-biceps-curl", name: "머신 바이셉 컬 또는 케이블 컬", sets: ["10-12회", "10-12회", "10-12회"], restSec: 70 }),
      exercise({ id: "cable-hammer-curl", name: "케이블 해머 컬 (로프)", sets: ["12회", "12회", "12회"], restSec: 70 }),
      exercise({ id: "plank", name: "복근: 플랭크 (Plank)", sets: ["35-50초", "35-50초", "35-50초"], restSec: 60 })
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
      exercise({ id: "lateral-raise", name: "레터럴 레이즈 머신 (Lateral Raise Machine)", sets: ["12-15회", "12-15회", "12-15회", "12-15회"], restSec: 70 }),
      exercise({ id: "triceps-pushdown", name: "트라이셉스 푸시다운 (Triceps Pushdown)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 70 }),
      exercise({ id: "pec-deck-machine", name: "펙덱 머신 또는 체스트 프레스 보조", sets: ["10-12회", "10-12회", "10-12회"], restSec: 75 }),
      exercise({
        id: "cable-woodchop",
        name: "복근: 케이블 우드찹 (Cable Woodchop)",
        sets: ["12회/쪽", "12회/쪽", "12회/쪽"],
        restSec: 60,
        howTo: "케이블을 가슴 높이에 맞추고 골반은 고정한 채 몸통으로 대각선 회전을 만들어. 팔로만 당기지 말고 옆구리와 복부로 버텨.",
        machine: "케이블 머신 손잡이를 사용해. 무게는 가볍게 시작하고 좌우 같은 횟수로 진행해.",
        ball: "케이블이 없으면 밴드 우드찹이나 플랭크로 대체해.",
        safety: "허리가 꺾이거나 통증이 있으면 회전 범위를 줄이고 무게를 낮춰.",
        mistake: "무거운 무게로 팔만 휘두르면 복근보다 허리와 어깨에 부담이 커져."
      }),
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
      exercise({ id: "side-plank", name: "복근: 사이드 플랭크 (Side Plank)", sets: ["20-30초/쪽", "20-30초/쪽"], restSec: 60 }),
      exercise({
        id: "ab-crunch-machine-thu",
        name: "복근: 복근 머신 크런치 또는 플랭크",
        sets: ["머신 12-15회", "머신 12-15회", "플랭크 45초"],
        restSec: 60,
        howTo: "복근 머신은 허리를 꺾지 않고 갈비뼈를 골반 쪽으로 말아내리는 느낌으로 진행해. 불편하면 플랭크로 바로 바꿔.",
        machine: "복근 크런치 머신을 사용해. 좌석과 패드를 먼저 몸에 맞춘 뒤 가벼운 무게로 시작해.",
        ball: "복근 머신이 없으면 플랭크 3세트로 대체해.",
        safety: "허리나 목이 아프면 무게를 낮추거나 플랭크로 바꿔.",
        mistake: "손잡이를 팔로 당기면 복근 자극이 줄고 허리 부담이 커져."
      })
    ]
  },
  FRI: {
    dayLabel: "FRI",
    theme: "등 · 풀업 보강 · 팔 볼륨 · 복근",
    trainingFocus: "등과 팔을 한 번 더 자극하고, 턱걸이 0개에서 1개로 가는 내려오기/매달리기 힘을 만든다.",
    warmupMain: "가벼운 풀다운 + 팔꿈치/손목 가동",
    warmupTime: "5-7분",
    warmupNote: "팔 운동은 반동보다 느린 내림 동작을 우선해.",
    cardioMain: "아침 6km 조깅 기준",
    cardioTime: "헬스장 추가 유산소 없음",
    cardioPlan: "근력 회복이 떨어지면 금요일 팔 세트를 1세트 줄여.",
    exercises: [
      exercise({ id: "lat-pulldown", name: "랫풀다운 (Lat Pulldown)", sets: ["12회", "12회", "12회"], restSec: 85 }),
      exercise({
        id: "negative-pull-up-deadhang",
        name: "턱걸이 입문: 네거티브 풀업 + 데드행",
        sets: ["천천히 내려오기 3회", "천천히 내려오기 3회", "데드행 15-30초"],
        restSec: 120,
        howTo: "박스나 발판을 밟고 위 자세에서 시작해 3-5초 동안 천천히 내려와. 마지막 세트는 어깨를 내린 상태로 매달려 버텨.",
        machine: "철봉, 스미스머신 바, 풀업 스테이션을 사용해. 발판 높이는 점프하지 않아도 위 자세에 닿는 정도가 좋아.",
        ball: "철봉이 부담되면 랫풀다운을 천천히 내리는 템포 3세트로 대체해.",
        safety: "어깨가 귀 쪽으로 으쓱 올라가거나 팔꿈치 통증이 있으면 시간을 줄여.",
        mistake: "버티려고 몸을 비틀거나 떨어지듯 내려오면 턱걸이 힘보다 관절 부담이 커져."
      }),
      exercise({ id: "seated-row", name: "시티드 로우 (Seated Row)", sets: ["12회", "12회", "12회"], restSec: 85 }),
      exercise({ id: "face-pull", name: "페이스풀 또는 리어델트 머신", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "machine-biceps-curl", name: "머신 바이셉 컬 또는 케이블 컬", sets: ["10-12회", "10-12회", "10-12회"], restSec: 70 }),
      exercise({ id: "cable-hammer-curl", name: "케이블 해머 컬 (로프)", sets: ["12회", "12회", "12회"], restSec: 70 }),
      exercise({ id: "triceps-pushdown", name: "트라이셉스 푸시다운 (Triceps Pushdown)", sets: ["12회", "12회", "12회"], restSec: 70 }),
      exercise({ id: "plank", name: "복근: 플랭크 (Plank)", sets: ["40-60초", "40-60초", "40-60초"], restSec: 60 })
    ]
  },
  SAT: {
    dayLabel: "SAT",
    theme: "전신 보강 · 풀업 기술 · 복근",
    trainingFocus: "내장지방 관리는 완주율, 풀업은 짧은 기술 연습, 복근은 플랭크와 회전 자극으로 마무리.",
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
      exercise({
        id: "scapular-pull-up-deadhang",
        name: "풀업 보강: 스캐풀라 풀업 + 데드행",
        sets: ["어깨 내리기 8회", "어깨 내리기 8회", "데드행 20-30초"],
        restSec: 90,
        howTo: "팔을 편 채 매달려 어깨를 귀에서 멀리 내렸다가 천천히 풀어. 팔꿈치를 굽히지 말고 등으로 몸을 살짝 들어올리는 느낌만 익혀.",
        machine: "풀업 바나 어시스트 풀업 머신 손잡이를 사용해. 발이 바닥에 닿아도 괜찮으니 어깨 위치를 먼저 익혀.",
        ball: "철봉이 없으면 랫풀다운에서 팔을 편 상태로 견갑만 내리는 연습 2세트로 대체해.",
        safety: "손아귀가 먼저 풀리거나 어깨 앞쪽이 찌르면 즉시 내려와.",
        mistake: "팔 힘으로 당기려고 팔꿈치를 굽히면 스캐풀라 연습이 아니라 불완전한 턱걸이가 돼."
      }),
      exercise({ id: "shoulder-press-sat", name: "숄더 프레스 (Shoulder Press)", sets: ["10회", "10회", "10회"], restSec: 85 }),
      exercise({ id: "lateral-raise-sat", name: "레터럴 레이즈 머신 (Lateral Raise Machine)", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "hip-abduction-sat", name: "힙 어브덕션 (Hip Abduction)", sets: ["15회", "15회", "15회"], restSec: 70 }),
      exercise({ id: "side-plank-sat", name: "복근: 사이드 플랭크 (Side Plank)", sets: ["20-30초/쪽", "20-30초/쪽"], restSec: 60 }),
      exercise({
        id: "cable-woodchop-sat",
        name: "복근: 케이블 우드찹 (Cable Woodchop)",
        sets: ["12회/쪽", "12회/쪽", "12회/쪽"],
        restSec: 60,
        howTo: "케이블을 잡고 배에 힘을 준 상태로 몸통을 대각선으로 회전해. 허리만 비틀지 말고 갈비뼈와 골반 사이를 단단히 잡아.",
        machine: "케이블 머신 또는 밴드를 사용해. 좌우 균형을 맞춰 같은 횟수로 진행해.",
        ball: "기구가 없으면 사이드 플랭크 또는 플랭크로 대체해.",
        safety: "허리 통증이 있으면 즉시 중단하고 플랭크로 바꿔.",
        mistake: "반동으로 휘두르면 배보다 허리에 부담이 커져."
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
  editorMessage: document.getElementById("editorMessage"),
  inbodyForm: document.getElementById("inbodyForm"),
  inbodyDateInput: document.getElementById("inbodyDateInput"),
  inbodyImageInput: document.getElementById("inbodyImageInput"),
  inbodyWeightInput: document.getElementById("inbodyWeightInput"),
  inbodyMuscleInput: document.getElementById("inbodyMuscleInput"),
  inbodyBodyFatInput: document.getElementById("inbodyBodyFatInput"),
  inbodyVisceralInput: document.getElementById("inbodyVisceralInput"),
  inbodyWaistInput: document.getElementById("inbodyWaistInput"),
  inbodyMemoInput: document.getElementById("inbodyMemoInput"),
  saveInbodyBtn: document.getElementById("saveInbodyBtn"),
  clearInbodyImageBtn: document.getElementById("clearInbodyImageBtn"),
  inbodyMessage: document.getElementById("inbodyMessage"),
  inbodyPreview: document.getElementById("inbodyPreview"),
  inbodyPreviewEmpty: document.getElementById("inbodyPreviewEmpty"),
  inbodyRecommendationList: document.getElementById("inbodyRecommendationList"),
  inbodyHistoryList: document.getElementById("inbodyHistoryList"),
  generatorForm: document.getElementById("generatorForm"),
  fitTimeInput: document.getElementById("fitTimeInput"),
  fitHeightInput: document.getElementById("fitHeightInput"),
  fitWeightInput: document.getElementById("fitWeightInput"),
  fitAgeInput: document.getElementById("fitAgeInput"),
  fitSexSelect: document.getElementById("fitSexSelect"),
  fitExperienceSelect: document.getElementById("fitExperienceSelect"),
  fitPlaceSelect: document.getElementById("fitPlaceSelect"),
  fitDietSelect: document.getElementById("fitDietSelect"),
  fitGoalOptions: document.getElementById("fitGoalOptions"),
  fitEquipmentInput: document.getElementById("fitEquipmentInput"),
  fitInjuryInput: document.getElementById("fitInjuryInput"),
  fitAllergyInput: document.getElementById("fitAllergyInput"),
  saveGeneratedPlanBtn: document.getElementById("saveGeneratedPlanBtn"),
  generatorMessage: document.getElementById("generatorMessage"),
  generatedPlanResult: document.getElementById("generatedPlanResult"),
  savedGeneratedPlansList: document.getElementById("savedGeneratedPlansList"),
  goalTemplateForm: document.getElementById("goalTemplateForm"),
  templateGoalName: document.getElementById("templateGoalName"),
  goalTemplateList: document.getElementById("goalTemplateList"),
  exerciseTemplateForm: document.getElementById("exerciseTemplateForm"),
  exerciseTemplateId: document.getElementById("exerciseTemplateId"),
  templateExerciseName: document.getElementById("templateExerciseName"),
  templateExercisePart: document.getElementById("templateExercisePart"),
  templateExercisePlace: document.getElementById("templateExercisePlace"),
  templateExerciseEquipment: document.getElementById("templateExerciseEquipment"),
  templateExerciseGoals: document.getElementById("templateExerciseGoals"),
  templateExerciseAvoid: document.getElementById("templateExerciseAvoid"),
  exerciseTemplateList: document.getElementById("exerciseTemplateList"),
  mealTemplateForm: document.getElementById("mealTemplateForm"),
  mealTemplateId: document.getElementById("mealTemplateId"),
  templateMealName: document.getElementById("templateMealName"),
  templateMealPreference: document.getElementById("templateMealPreference"),
  templateMealItems: document.getElementById("templateMealItems"),
  templateMealNote: document.getElementById("templateMealNote"),
  mealTemplateList: document.getElementById("mealTemplateList"),
  resetGeneratorTemplatesBtn: document.getElementById("resetGeneratorTemplatesBtn")
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
let pendingInbodyImageDataUrl = "";

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

  if (ui.inbodyImageInput) {
    ui.inbodyImageInput.addEventListener("change", async () => {
      const file = ui.inbodyImageInput.files && ui.inbodyImageInput.files[0];
      if (!file) {
        pendingInbodyImageDataUrl = "";
        renderInbodyPreview(getLatestInbodyImage());
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        ui.inbodyMessage.textContent = "JPG 또는 PNG 파일만 넣을 수 있어요.";
        ui.inbodyImageInput.value = "";
        pendingInbodyImageDataUrl = "";
        return;
      }
      ui.inbodyMessage.textContent = "이미지를 저장하기 좋게 줄이는 중...";
      try {
        pendingInbodyImageDataUrl = await compressImageFile(file);
        renderInbodyPreview(pendingInbodyImageDataUrl);
        ui.inbodyMessage.textContent = "이미지 준비 완료. 수치를 입력하고 저장해 주세요.";
      } catch (_error) {
        pendingInbodyImageDataUrl = "";
        ui.inbodyImageInput.value = "";
        renderInbodyPreview(getLatestInbodyImage());
        ui.inbodyMessage.textContent = "이미지를 읽지 못했어요. 다른 JPG/PNG로 다시 시도해 주세요.";
      }
    });
  }

  if (ui.clearInbodyImageBtn) {
    ui.clearInbodyImageBtn.addEventListener("click", () => {
      pendingInbodyImageDataUrl = "";
      if (ui.inbodyImageInput) {
        ui.inbodyImageInput.value = "";
      }
      renderInbodyPreview(getLatestInbodyImage());
      ui.inbodyMessage.textContent = "선택한 이미지를 제거했어요. 저장된 기록은 그대로 둡니다.";
    });
  }

  if (ui.inbodyForm) {
    ui.inbodyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveInbodyRecord();
    });
  }

  if (ui.generatorForm) {
    ui.generatorForm.addEventListener("change", enforceGoalLimit);
    ui.generatorForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const profile = readGeneratorProfile();
      if (profile.error) {
        ui.generatorMessage.textContent = profile.error;
        return;
      }
      state.generatedPlanDraft = generateAdaptivePlan(profile.value);
      persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = "맞춤 운동·식단 계획을 생성했어요. 입력값을 바꾸고 다시 생성할 수 있습니다.";
    });
  }

  if (ui.saveGeneratedPlanBtn) {
    ui.saveGeneratedPlanBtn.addEventListener("click", () => {
      saveGeneratedPlanDraft();
    });
  }

  if (ui.savedGeneratedPlansList) {
    ui.savedGeneratedPlansList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const planId = target.dataset.loadGeneratedPlan;
      if (!planId) {
        return;
      }
      const plan = (state.generatedPlans || []).find((item) => item.id === planId);
      if (!plan) {
        return;
      }
      state.generatedPlanDraft = plan;
      persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = "저장한 맞춤 계획을 불러왔어요.";
    });
  }

  if (ui.exerciseTemplateForm) {
    ui.exerciseTemplateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      upsertExerciseTemplate();
    });
  }

  if (ui.goalTemplateForm) {
    ui.goalTemplateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addGoalTemplate();
    });
  }

  if (ui.mealTemplateForm) {
    ui.mealTemplateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      upsertMealTemplate();
    });
  }

  if (ui.exerciseTemplateList) {
    ui.exerciseTemplateList.addEventListener("click", (event) => {
      handleTemplateListClick(event, "exercise");
    });
  }

  if (ui.goalTemplateList) {
    ui.goalTemplateList.addEventListener("click", (event) => {
      handleTemplateListClick(event, "goal");
    });
  }

  if (ui.mealTemplateList) {
    ui.mealTemplateList.addEventListener("click", (event) => {
      handleTemplateListClick(event, "meal");
    });
  }

  if (ui.resetGeneratorTemplatesBtn) {
    ui.resetGeneratorTemplatesBtn.addEventListener("click", () => {
      const ok = window.confirm("운동/식단 템플릿을 기본값으로 되돌릴까요?");
      if (!ok) {
        return;
      }
      state.generatorTemplates = cloneGeneratorTemplates(DEFAULT_GENERATOR_TEMPLATES);
      clearTemplateForms();
      persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = "기본 템플릿으로 되돌렸어요.";
    });
  }
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
  renderInbodyPanel();
  renderGeneratorPanel();
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
  if (fullText.includes("pull-up") || fullText.includes("pullup") || fullText.includes("풀업") || fullText.includes("턱걸이")) {
    return "🧗";
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

function renderInbodyPanel() {
  if (!ui.inbodyHistoryList || !ui.inbodyRecommendationList) {
    return;
  }
  if (ui.inbodyDateInput && !ui.inbodyDateInput.value) {
    ui.inbodyDateInput.value = getTodayDateString();
  }

  state.inbodyRecords = trimInbodyRecords(state.inbodyRecords || []);
  const records = getSortedInbodyRecords();
  renderInbodyPreview(pendingInbodyImageDataUrl || getLatestInbodyImage());
  renderInbodyRecommendations(records);
  renderInbodyHistory(records);
}

function renderInbodyPreview(imageDataUrl) {
  if (!ui.inbodyPreview || !ui.inbodyPreviewEmpty) {
    return;
  }
  if (imageDataUrl) {
    ui.inbodyPreview.src = imageDataUrl;
    ui.inbodyPreview.hidden = false;
    ui.inbodyPreviewEmpty.hidden = true;
    return;
  }
  ui.inbodyPreview.removeAttribute("src");
  ui.inbodyPreview.hidden = true;
  ui.inbodyPreviewEmpty.hidden = false;
}

function renderInbodyRecommendations(records) {
  const messages = buildInbodyRecommendations(records);
  ui.inbodyRecommendationList.innerHTML = messages
    .map((message) => `<li>${escapeHtml(message)}</li>`)
    .join("");
}

function renderInbodyHistory(records) {
  if (records.length === 0) {
    ui.inbodyHistoryList.innerHTML = `<li class="history-empty">아직 인바디 기록이 없습니다. 한 달에 한 번 측정 후 JPG와 수치를 저장해 주세요.</li>`;
    return;
  }

  ui.inbodyHistoryList.innerHTML = records.slice(0, 6).map((record) => {
    const parts = [];
    if (Number.isFinite(record.weightKg)) {
      parts.push(`체중 ${formatMetric(record.weightKg)}kg`);
    }
    if (Number.isFinite(record.muscleKg)) {
      parts.push(`골격근량 ${formatMetric(record.muscleKg)}kg`);
    }
    if (Number.isFinite(record.bodyFatPercent)) {
      parts.push(`체지방률 ${formatMetric(record.bodyFatPercent)}%`);
    }
    if (Number.isFinite(record.visceralFatLevel)) {
      parts.push(`내장지방 ${Math.round(record.visceralFatLevel)}레벨`);
    }
    if (Number.isFinite(record.waistCm)) {
      parts.push(`허리 ${formatMetric(record.waistCm)}cm`);
    }
    const imageLabel = record.imageDataUrl ? " | 이미지 저장됨" : "";
    const memo = record.memo ? `<br><span class="muted">${escapeHtml(record.memo)}</span>` : "";
    return `
      <li class="history-item">
        <strong>${escapeHtml(record.date || "")}</strong>${imageLabel}<br>
        ${escapeHtml(parts.join(" | ") || "수치 미입력")}
        ${memo}
      </li>
    `;
  }).join("");
}

function saveInbodyRecord() {
  const date = ui.inbodyDateInput.value || getTodayDateString();
  if (!isDateKey(date)) {
    ui.inbodyMessage.textContent = "측정일을 올바르게 선택해 주세요.";
    return;
  }

  const record = {
    id: `inbody_${date}_${Date.now().toString(36)}`,
    date,
    weightKg: readOptionalNumber(ui.inbodyWeightInput),
    muscleKg: readOptionalNumber(ui.inbodyMuscleInput),
    bodyFatPercent: readOptionalNumber(ui.inbodyBodyFatInput),
    visceralFatLevel: readOptionalNumber(ui.inbodyVisceralInput),
    waistCm: readOptionalNumber(ui.inbodyWaistInput),
    memo: (ui.inbodyMemoInput.value || "").trim().slice(0, 220),
    imageDataUrl: pendingInbodyImageDataUrl || "",
    createdAt: new Date().toISOString()
  };

  const hasMetrics = [
    record.weightKg,
    record.muscleKg,
    record.bodyFatPercent,
    record.visceralFatLevel,
    record.waistCm
  ].some((value) => Number.isFinite(value));
  if (!hasMetrics && !record.imageDataUrl) {
    ui.inbodyMessage.textContent = "이미지나 핵심 수치 중 하나는 넣어 주세요.";
    return;
  }

  const nextRecords = (state.inbodyRecords || []).filter((item) => item.date !== record.date);
  nextRecords.unshift(record);
  state.inbodyRecords = trimInbodyRecords(nextRecords);

  let saved = persistState();
  if (!saved && record.imageDataUrl) {
    record.imageDataUrl = "";
    state.inbodyRecords = trimInbodyRecords(state.inbodyRecords);
    saved = persistState();
    ui.inbodyMessage.textContent = saved
      ? "브라우저 저장공간이 부족해 수치만 저장했어요. 이미지는 더 작은 파일로 다시 시도해 주세요."
      : "브라우저 저장공간이 부족해 저장하지 못했어요. 오래된 기록을 정리해야 합니다.";
  } else {
    ui.inbodyMessage.textContent = saved
      ? "인바디 기록 저장 완료. 이번 달 조정안을 업데이트했어요."
      : "브라우저 저장공간이 부족해 저장하지 못했어요.";
  }

  if (saved) {
    pendingInbodyImageDataUrl = "";
    if (ui.inbodyImageInput) {
      ui.inbodyImageInput.value = "";
    }
    renderInbodyPanel();
    announce("인바디 기록을 저장하고 조정안을 업데이트했어.");
  }
}

function buildInbodyRecommendations(records) {
  if (records.length === 0) {
    return [
      "한 달에 한 번 같은 시간대에 측정해 주세요. 첫 기록을 저장하면 다음 달부터 내장지방, 허리둘레, 골격근량 변화를 우선 비교합니다.",
      "JPG만으로 자동 판독하지 않습니다. 체중, 골격근량, 체지방률을 입력해야 조정안이 정확해집니다."
    ];
  }

  const latest = records[0];
  const previous = records[1] || null;
  const messages = [];

  if (!hasCoreInbodyMetrics(latest)) {
    messages.push("이미지는 저장됐어요. 체중, 골격근량, 체지방률을 입력하면 운동·식단 조정안을 더 정확하게 만들 수 있습니다.");
    messages.push("현재는 기존 6km 조깅 + 월-토 근력 루틴을 유지하고, 저녁 단백질은 빼지 마세요.");
    return messages;
  }

  if (previous && hasCoreInbodyMetrics(previous)) {
    const weightDiff = latest.weightKg - previous.weightKg;
    const muscleDiff = latest.muscleKg - previous.muscleKg;
    const fatDiff = latest.bodyFatPercent - previous.bodyFatPercent;

    if (muscleDiff <= -0.5) {
      messages.push("골격근량이 줄었습니다. 조깅 속도를 낮추고 저녁에 닭가슴살/두부/생선과 하체 운동일 탄수화물을 반드시 넣으세요.");
    }
    if (fatDiff >= 1) {
      messages.push("체지방률이 올랐습니다. 저녁 바나나+프로틴만으로 끝내기보다 단백질 식품과 채소를 고정하고, 음료·간식·야식을 먼저 줄이세요.");
    }
    if (weightDiff <= -2 && muscleDiff < 0) {
      messages.push("한 달 감량 속도가 빠르고 근육도 줄었습니다. 감량보다 근손실 방지가 우선이라 저녁 탄수화물을 조금 늘리세요.");
    }
    if (muscleDiff >= 0.3 && fatDiff <= -0.5) {
      messages.push("좋은 방향입니다. 현재 루틴을 유지하고 주요 머신 중량만 아주 천천히 올리세요.");
    }
    if (Math.abs(weightDiff) < 0.5 && fatDiff > 0 && muscleDiff <= 0) {
      messages.push("체중은 비슷한데 체지방이 늘고 근육이 정체입니다. 금요일 팔 볼륨과 월/목 하체 세트 품질을 우선 확인하세요.");
    }
  } else {
    messages.push("첫 인바디 기준선을 저장했습니다. 다음 달부터 체중보다 내장지방, 허리둘레, 골격근량 변화를 우선해서 조정합니다.");
  }

  if (Number.isFinite(latest.visceralFatLevel) && latest.visceralFatLevel >= 10) {
    messages.push("내장지방 레벨이 높습니다. 최우선은 야식·음주·단 음료 줄이기와 저녁 단백질+채소 고정입니다. 복통이나 대사질환 이력이 있으면 전문가 상담을 권장합니다.");
  }
  if (Number.isFinite(latest.waistCm) && latest.waistCm >= 90) {
    messages.push("허리둘레가 높습니다. 체중보다 주 1회 허리둘레 감소와 하체/등 중량 유지 여부를 더 중요하게 보세요.");
  }
  if (Number.isFinite(latest.bodyFatPercent) && latest.bodyFatPercent >= 25) {
    messages.push("마른비만 개선 단계입니다. 헬스장 추가 유산소는 넣지 말고 근력운동 완주율과 저녁 단백질을 우선하세요.");
  }
  if (Number.isFinite(latest.muscleKg) && latest.muscleKg < 30) {
    messages.push("골격근량을 더 올려야 합니다. 등·하체 운동에서 마지막 2회가 힘든 무게를 기록하고, 매주 한 종목만 소폭 증가시키세요.");
  }
  messages.push("복근운동은 코어와 복근 모양을 만드는 역할입니다. 내장지방 감소는 식단, 6km 조깅, 전신 근력운동 완주가 같이 맞아야 합니다.");

  messages.push("이 조정안은 의료 판단이 아니라 운동·식단 기록 보조입니다. 통증, 어지러움, 과피로가 있으면 강도를 낮추세요.");
  return dedupeMessages(messages).slice(0, 7);
}

function hasCoreInbodyMetrics(record) {
  return Boolean(record)
    && Number.isFinite(record.weightKg)
    && Number.isFinite(record.muscleKg)
    && Number.isFinite(record.bodyFatPercent);
}

function dedupeMessages(messages) {
  return Array.from(new Set(messages.filter(Boolean)));
}

function getSortedInbodyRecords() {
  return (state.inbodyRecords || [])
    .filter((record) => isPlainObject(record))
    .map(normalizeInbodyRecord)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function normalizeInbodyRecord(record) {
  return {
    id: typeof record.id === "string" ? record.id : `inbody_${Date.now().toString(36)}`,
    date: isDateKey(record.date) ? record.date : getTodayDateString(),
    weightKg: normalizeOptionalNumber(record.weightKg),
    muscleKg: normalizeOptionalNumber(record.muscleKg),
    bodyFatPercent: normalizeOptionalNumber(record.bodyFatPercent),
    visceralFatLevel: normalizeOptionalNumber(record.visceralFatLevel),
    waistCm: normalizeOptionalNumber(record.waistCm),
    memo: typeof record.memo === "string" ? record.memo.slice(0, 220) : "",
    imageDataUrl: typeof record.imageDataUrl === "string" && record.imageDataUrl.startsWith("data:image/") ? record.imageDataUrl : "",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString()
  };
}

function trimInbodyRecords(records) {
  const normalized = (Array.isArray(records) ? records : [])
    .filter((record) => isPlainObject(record))
    .map(normalizeInbodyRecord)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, INBODY_MAX_RECORDS);

  return normalized.map((record, index) => {
    if (index >= INBODY_MAX_IMAGE_RECORDS) {
      return { ...record, imageDataUrl: "" };
    }
    return record;
  });
}

function getLatestInbodyImage() {
  const found = getSortedInbodyRecords().find((record) => record.imageDataUrl);
  return found ? found.imageDataUrl : "";
}

function readOptionalNumber(input) {
  if (!input) {
    return null;
  }
  const raw = String(input.value || "").trim();
  if (!raw) {
    return null;
  }
  return normalizeOptionalNumber(raw);
}

function normalizeOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(1)) : null;
}

function formatMetric(value) {
  return Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, "") : "-";
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.onload = () => {
        const scale = Math.min(1, INBODY_IMAGE_MAX_EDGE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas_failed"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", INBODY_IMAGE_QUALITY));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function renderGeneratorPanel() {
  if (!ui.generatedPlanResult || !ui.savedGeneratedPlansList) {
    return;
  }
  ensureGeneratorState();
  renderGeneratorGoalOptions();
  renderGeneratedPlanResult(state.generatedPlanDraft);
  renderSavedGeneratedPlans();
  renderTemplateLists();
}

function renderGeneratorGoalOptions() {
  if (!ui.fitGoalOptions) {
    return;
  }
  const current = new Set(readCheckedValues("fitGoals"));
  if (current.size === 0 && state.generatedPlanDraft?.profile?.goals) {
    state.generatedPlanDraft.profile.goals.forEach((goal) => current.add(goal));
  }
  ui.fitGoalOptions.innerHTML = state.generatorGoals.map((goal) => {
    const checked = current.has(goal) ? "checked" : "";
    return `<label><input type="checkbox" name="fitGoals" value="${escapeHtml(goal)}" ${checked}> ${escapeHtml(goal)}</label>`;
  }).join("");
}

function renderGeneratedPlanResult(plan) {
  if (!plan) {
    ui.generatedPlanResult.innerHTML = `<p class="history-empty">입력값을 채우고 맞춤 계획 생성을 눌러주세요.</p>`;
    return;
  }

  const scheduleHtml = plan.schedule.map((day) => {
    const exercises = day.exercises.map((item) => {
      return `<li>${escapeHtml(item.name)} · ${item.sets}세트 x ${escapeHtml(item.reps)} · 휴식 ${item.restSec}초</li>`;
    }).join("");
    return `
      <article class="generated-day-card">
        <h4>${escapeHtml(day.day)}요일 · ${escapeHtml(day.part)}</h4>
        <p class="muted">${escapeHtml(day.cardio)}</p>
        <ul>${exercises}</ul>
      </article>
    `;
  }).join("");

  ui.generatedPlanResult.innerHTML = `
    <div class="generated-summary">
      <strong>${escapeHtml(plan.title)}</strong>
      <p>${escapeHtml(plan.explanation)}</p>
      <p class="muted">건강 참고용 계획입니다. 통증, 어지러움, 질환 이력이 있으면 강도를 낮추고 전문가 상담을 우선하세요.</p>
    </div>
    <div class="generated-schedule">${scheduleHtml}</div>
    <article class="generated-meal-card">
      <h4>하루 식단 예시 · ${escapeHtml(plan.meal.name)}</h4>
      <ul>${plan.meal.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p>${escapeHtml(plan.meal.proteinNote)}</p>
      <p class="muted">${escapeHtml(plan.meal.note)}</p>
    </article>
  `;
}

function renderSavedGeneratedPlans() {
  const plans = Array.isArray(state.generatedPlans) ? state.generatedPlans : [];
  if (plans.length === 0) {
    ui.savedGeneratedPlansList.innerHTML = `<li class="history-empty">아직 저장한 맞춤 계획이 없습니다.</li>`;
    return;
  }
  ui.savedGeneratedPlansList.innerHTML = plans.slice(0, 8).map((plan) => {
    return `
      <li class="history-item">
        <strong>${escapeHtml(plan.savedLabel || plan.title || "맞춤 계획")}</strong><br>
        ${escapeHtml((plan.profile?.goals || []).join(", "))} · ${escapeHtml((plan.profile?.days || []).join("/"))}
        <button class="btn ghost small template-action" type="button" data-load-generated-plan="${escapeHtml(plan.id)}">보기</button>
      </li>
    `;
  }).join("");
}

function renderTemplateLists() {
  const templates = getGeneratorTemplates();
  if (ui.goalTemplateList) {
    ui.goalTemplateList.innerHTML = state.generatorGoals.map((goal) => {
      return `
        <li>
          <span>${escapeHtml(goal)}</span>
          <button class="btn ghost small danger" type="button" data-delete-template="${escapeHtml(goal)}">삭제</button>
        </li>
      `;
    }).join("");
  }
  if (ui.exerciseTemplateList) {
    ui.exerciseTemplateList.innerHTML = templates.exercises.map((item) => {
      return `
        <li>
          <span>${escapeHtml(item.name)} · ${escapeHtml(item.part)} · ${escapeHtml(toCsv(item.place))}</span>
          <button class="btn ghost small" type="button" data-edit-template="${escapeHtml(item.id)}">수정</button>
          <button class="btn ghost small danger" type="button" data-delete-template="${escapeHtml(item.id)}">삭제</button>
        </li>
      `;
    }).join("");
  }
  if (ui.mealTemplateList) {
    ui.mealTemplateList.innerHTML = templates.meals.map((item) => {
      return `
        <li>
          <span>${escapeHtml(item.name)} · ${escapeHtml(item.preference)}</span>
          <button class="btn ghost small" type="button" data-edit-template="${escapeHtml(item.id)}">수정</button>
          <button class="btn ghost small danger" type="button" data-delete-template="${escapeHtml(item.id)}">삭제</button>
        </li>
      `;
    }).join("");
  }
}

function enforceGoalLimit(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.name !== "fitGoals") {
    return;
  }
  const checked = readCheckedValues("fitGoals");
  if (checked.length <= 3) {
    return;
  }
  target.checked = false;
  ui.generatorMessage.textContent = "목표는 최대 3개까지 선택할 수 있어요.";
}

function readGeneratorProfile() {
  const goals = readCheckedValues("fitGoals");
  const days = readCheckedValues("fitDays");
  const timeMin = readNumberFromInput(ui.fitTimeInput, 70);
  const heightCm = readNumberFromInput(ui.fitHeightInput, null);
  const weightKg = readNumberFromInput(ui.fitWeightInput, null);
  const age = readNumberFromInput(ui.fitAgeInput, null);

  if (goals.length === 0) {
    return { error: "목표를 1개 이상 선택해 주세요." };
  }
  if (goals.length > 3) {
    return { error: "목표는 최대 3개까지 선택해 주세요." };
  }
  if (days.length === 0) {
    return { error: "운동 가능 요일을 1개 이상 선택해 주세요." };
  }
  if (!Number.isFinite(timeMin) || timeMin < 15) {
    return { error: "하루 운동 가능 시간은 15분 이상으로 입력해 주세요." };
  }

  return {
    value: {
      goals,
      days,
      timeMin,
      heightCm,
      weightKg,
      age,
      sex: ui.fitSexSelect.value || "미입력",
      experience: ui.fitExperienceSelect.value || "초보",
      place: ui.fitPlaceSelect.value || "헬스장",
      equipment: splitCsv(ui.fitEquipmentInput.value || ""),
      injury: (ui.fitInjuryInput.value || "").trim(),
      dietPreference: ui.fitDietSelect.value || "일반식",
      allergies: splitCsv(ui.fitAllergyInput.value || "")
    }
  };
}

function generateAdaptivePlan(profile) {
  const templates = getGeneratorTemplates();
  const intensity = getIntensityByExperience(profile.experience);
  const dayParts = buildDayParts(profile);
  const schedule = profile.days.map((day, index) => {
    const part = dayParts[index % dayParts.length];
    const exercises = selectGeneratedExercises(part, profile, templates.exercises, intensity);
    const cardio = getCardioPlan(profile, part);
    return { day, part, cardio, exercises };
  });
  const meal = buildGeneratedMeal(profile, templates.meals);
  const title = `${profile.goals.slice(0, 3).join(" · ")} 맞춤 ${profile.days.length}일 계획`;
  return {
    id: `generated_${Date.now().toString(36)}`,
    title,
    profile,
    schedule,
    meal,
    explanation: buildGeneratedExplanation(profile),
    createdAt: new Date().toISOString()
  };
}

function buildDayParts(profile) {
  if (profile.days.length <= 2) {
    return profile.goals.includes("복근강화") ? ["전신", "복근"] : ["전신", "하체"];
  }
  const parts = profile.goals.includes("근육증가")
    ? ["하체", "등", "가슴/어깨", "하체 후면", "전신"]
    : ["전신", "하체", "등", "가슴/어깨"];
  if (profile.goals.includes("복근강화")) {
    parts.push("복근");
  }
  return parts;
}

function selectGeneratedExercises(part, profile, templates, intensity) {
  const injuryText = `${profile.injury || ""}`.toLowerCase();
  const place = profile.place;
  const equipmentText = profile.equipment.join(" ").toLowerCase();
  const placeAndInjuryPool = templates.filter((item) => {
    const placeOk = arrayIncludes(item.place, place) || arrayIncludes(item.place, "전체");
    const injuryOk = !item.avoid.some((tag) => tag && injuryText.includes(String(tag).toLowerCase()));
    return placeOk && injuryOk;
  });
  const equipmentPool = placeAndInjuryPool.filter((item) => {
    if (profile.equipment.length === 0 || item.equipment.length === 0) {
      return true;
    }
    return item.equipment.some((tool) => {
      const normalized = String(tool).toLowerCase();
      return normalized === "맨몸" || equipmentText.includes(normalized);
    });
  });
  const pool = equipmentPool.length ? equipmentPool : placeAndInjuryPool;
  const partPool = pool.filter((item) => item.part === part || (part === "전신" && item.part !== "회복"));
  const fallbackPool = pool.length ? pool : templates;
  const targetCount = profile.timeMin < 40 ? 3 : profile.timeMin < 70 ? 4 : 5;
  const selected = uniqueById(partPool.concat(fallbackPool))
    .sort((a, b) => getTemplateGoalScore(b, profile.goals) - getTemplateGoalScore(a, profile.goals))
    .slice(0, targetCount);

  return selected.map((item) => {
    const isCardio = item.part === "유산소";
    return {
      name: item.name,
      sets: isCardio ? 1 : intensity.sets,
      reps: isCardio ? getCardioDuration(profile) : intensity.reps,
      restSec: isCardio ? 0 : intensity.restSec
    };
  });
}

function getTemplateGoalScore(template, goals) {
  return normalizeStringArray(template.goals).filter((goal) => goals.includes(goal)).length;
}

function getIntensityByExperience(experience) {
  if (experience === "고급") {
    return { sets: 4, reps: "6-12회", restSec: 90 };
  }
  if (experience === "중급") {
    return { sets: 3, reps: "8-12회", restSec: 75 };
  }
  return { sets: 2, reps: "10-12회", restSec: 60 };
}

function getCardioPlan(profile, part) {
  const shouldInclude = profile.goals.some((goal) => ["체중감량", "체력향상", "건강관리"].includes(goal));
  if (!shouldInclude) {
    return "유산소 선택: 컨디션이 좋으면 5-10분 가볍게";
  }
  if (part === "하체" || part === "하체 후면") {
    return "유산소 포함: 하체 피로를 고려해 5-10분 아주 가볍게";
  }
  return `유산소 포함: ${getCardioDuration(profile)} 대화 가능한 강도`;
}

function getCardioDuration(profile) {
  if (profile.timeMin < 40) {
    return "8-12분";
  }
  if (profile.timeMin < 70) {
    return "12-18분";
  }
  return "15-25분";
}

function buildGeneratedMeal(profile, mealTemplates) {
  const meal = mealTemplates.find((item) => item.preference === profile.dietPreference)
    || mealTemplates.find((item) => item.preference === "일반식")
    || mealTemplates[0];
  const allergyText = profile.allergies.join(" ").toLowerCase();
  const items = meal.items.map((item) => {
    const hasAllergy = profile.allergies.some((tag) => tag && item.toLowerCase().includes(tag.toLowerCase()));
    return hasAllergy ? `${item} (피해야 할 음식 확인 후 대체)` : item;
  });
  const proteinFactor = profile.goals.includes("근육증가") ? 1.7 : profile.goals.includes("체중감량") ? 1.5 : 1.4;
  const proteinTarget = Number.isFinite(profile.weightKg) ? Math.round(profile.weightKg * proteinFactor) : null;
  const allergyNote = allergyText ? ` 피해야 할 음식: ${profile.allergies.join(", ")}.` : "";
  return {
    name: meal.name,
    items,
    note: `${meal.note}${allergyNote}`,
    proteinNote: proteinTarget
      ? `단백질은 하루 약 ${proteinTarget}g을 목표로 끼니마다 나눠 먹는 방향을 추천합니다.`
      : "단백질은 매 끼니 손바닥 1-2개 분량을 기준으로 잡아주세요."
  };
}

function buildGeneratedExplanation(profile) {
  const beginner = profile.experience === "초보" ? "초보 기준이라 실패지점까지 가지 않고 여유 2-3회를 남기도록 구성했습니다. " : "";
  const injury = profile.injury ? `주의사항에 적은 "${profile.injury}" 부위는 관련 운동을 피하거나 강도를 낮추도록 안내했습니다. ` : "";
  return `${beginner}${injury}${profile.place}에서 가능한 장비와 ${profile.goals.join(", ")} 목표에 맞춰 주간 스케줄과 단백질 중심 식단을 생성했습니다.`;
}

function saveGeneratedPlanDraft() {
  if (!state.generatedPlanDraft) {
    ui.generatorMessage.textContent = "먼저 맞춤 계획을 생성해 주세요.";
    return;
  }
  if (!Array.isArray(state.generatedPlans)) {
    state.generatedPlans = [];
  }
  const saved = {
    ...state.generatedPlanDraft,
    id: `saved_${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
    savedLabel: `${formatDateLabel(new Date())} ${state.generatedPlanDraft.title}`
  };
  state.generatedPlans.unshift(saved);
  state.generatedPlans = state.generatedPlans.slice(0, 12);
  persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = "맞춤 계획을 이 기기에 저장했어요.";
}

function upsertExerciseTemplate() {
  const name = (ui.templateExerciseName.value || "").trim();
  const part = (ui.templateExercisePart.value || "").trim();
  if (!name || !part) {
    ui.generatorMessage.textContent = "운동 템플릿 이름과 부위를 입력해 주세요.";
    return;
  }
  const templates = getGeneratorTemplates();
  const id = ui.exerciseTemplateId.value || `tpl-custom-${Date.now().toString(36)}`;
  const next = {
    id,
    name,
    part,
    place: splitCsv(ui.templateExercisePlace.value || "헬스장"),
    equipment: splitCsv(ui.templateExerciseEquipment.value || ""),
    goals: splitCsv(ui.templateExerciseGoals.value || ""),
    avoid: splitCsv(ui.templateExerciseAvoid.value || "")
  };
  templates.exercises = templates.exercises.filter((item) => item.id !== id).concat(next);
  state.generatorTemplates = templates;
  clearTemplateForms();
  persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = "운동 템플릿을 저장했어요.";
}

function upsertMealTemplate() {
  const name = (ui.templateMealName.value || "").trim();
  const preference = (ui.templateMealPreference.value || "").trim();
  const items = splitCsv(ui.templateMealItems.value || "");
  if (!name || !preference || items.length === 0) {
    ui.generatorMessage.textContent = "식단 템플릿 이름, 선호, 항목을 입력해 주세요.";
    return;
  }
  const templates = getGeneratorTemplates();
  const id = ui.mealTemplateId.value || `meal-custom-${Date.now().toString(36)}`;
  const next = {
    id,
    name,
    preference,
    items,
    note: (ui.templateMealNote.value || "").trim() || "단백질과 채소를 우선합니다."
  };
  templates.meals = templates.meals.filter((item) => item.id !== id).concat(next);
  state.generatorTemplates = templates;
  clearTemplateForms();
  persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = "식단 템플릿을 저장했어요.";
}

function addGoalTemplate() {
  const goal = (ui.templateGoalName.value || "").trim();
  if (!goal) {
    ui.generatorMessage.textContent = "추가할 목표 이름을 입력해 주세요.";
    return;
  }
  ensureGeneratorState();
  if (!state.generatorGoals.includes(goal)) {
    state.generatorGoals.push(goal);
  }
  ui.templateGoalName.value = "";
  persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = "목표 템플릿을 추가했어요.";
}

function handleTemplateListClick(event, type) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const editId = target.dataset.editTemplate;
  const deleteId = target.dataset.deleteTemplate;
  if (!editId && !deleteId) {
    return;
  }
  const templates = getGeneratorTemplates();
  const key = type === "exercise" ? "exercises" : "meals";
  if (type === "goal") {
    if (deleteId) {
      state.generatorGoals = state.generatorGoals.filter((goal) => goal !== deleteId);
      if (state.generatorGoals.length === 0) {
        state.generatorGoals = [...FIT_GOALS];
      }
      persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = "목표 템플릿을 삭제했어요.";
    }
    return;
  }
  if (deleteId) {
    templates[key] = templates[key].filter((item) => item.id !== deleteId);
    state.generatorTemplates = templates;
    persistState();
    renderGeneratorPanel();
    ui.generatorMessage.textContent = "템플릿을 삭제했어요.";
    return;
  }
  const item = templates[key].find((entry) => entry.id === editId);
  if (!item) {
    return;
  }
  if (type === "exercise") {
    ui.exerciseTemplateId.value = item.id;
    ui.templateExerciseName.value = item.name;
    ui.templateExercisePart.value = item.part;
    ui.templateExercisePlace.value = toCsv(item.place);
    ui.templateExerciseEquipment.value = toCsv(item.equipment);
    ui.templateExerciseGoals.value = toCsv(item.goals);
    ui.templateExerciseAvoid.value = toCsv(item.avoid);
  } else {
    ui.mealTemplateId.value = item.id;
    ui.templateMealName.value = item.name;
    ui.templateMealPreference.value = item.preference;
    ui.templateMealItems.value = toCsv(item.items);
    ui.templateMealNote.value = item.note || "";
  }
  ui.generatorMessage.textContent = "템플릿을 불러왔어요. 수정 후 저장을 눌러주세요.";
}

function clearTemplateForms() {
  if (ui.exerciseTemplateForm) {
    ui.exerciseTemplateForm.reset();
    ui.exerciseTemplateId.value = "";
  }
  if (ui.mealTemplateForm) {
    ui.mealTemplateForm.reset();
    ui.mealTemplateId.value = "";
  }
}

function ensureGeneratorState() {
  if (!isPlainObject(state.generatorTemplates)) {
    state.generatorTemplates = cloneGeneratorTemplates(DEFAULT_GENERATOR_TEMPLATES);
  }
  state.generatorTemplates = normalizeGeneratorTemplates(state.generatorTemplates);
  if (!Array.isArray(state.generatorGoals) || state.generatorGoals.length === 0) {
    state.generatorGoals = [...FIT_GOALS];
  }
  state.generatorGoals = normalizeStringArray(state.generatorGoals);
  if (!Array.isArray(state.generatedPlans)) {
    state.generatedPlans = [];
  }
}

function getGeneratorTemplates() {
  ensureGeneratorState();
  return cloneGeneratorTemplates(state.generatorTemplates);
}

function normalizeGeneratorTemplates(raw) {
  const fallback = cloneGeneratorTemplates(DEFAULT_GENERATOR_TEMPLATES);
  if (!isPlainObject(raw)) {
    return fallback;
  }
  const exercises = Array.isArray(raw.exercises) ? raw.exercises.map(normalizeExerciseTemplate).filter(Boolean) : fallback.exercises;
  const meals = Array.isArray(raw.meals) ? raw.meals.map(normalizeMealTemplate).filter(Boolean) : fallback.meals;
  return {
    exercises: exercises.length ? exercises : fallback.exercises,
    meals: meals.length ? meals : fallback.meals
  };
}

function normalizeExerciseTemplate(item) {
  if (!isPlainObject(item) || typeof item.name !== "string" || typeof item.part !== "string") {
    return null;
  }
  return {
    id: typeof item.id === "string" ? item.id : `tpl-${Date.now().toString(36)}`,
    name: item.name,
    part: item.part,
    place: normalizeStringArray(item.place),
    equipment: normalizeStringArray(item.equipment),
    goals: normalizeStringArray(item.goals),
    avoid: normalizeStringArray(item.avoid)
  };
}

function normalizeMealTemplate(item) {
  if (!isPlainObject(item) || typeof item.name !== "string" || typeof item.preference !== "string") {
    return null;
  }
  return {
    id: typeof item.id === "string" ? item.id : `meal-${Date.now().toString(36)}`,
    name: item.name,
    preference: item.preference,
    items: normalizeStringArray(item.items),
    note: typeof item.note === "string" ? item.note : ""
  };
}

function cloneGeneratorTemplates(templates) {
  return {
    exercises: (templates.exercises || []).map((item) => ({
      ...item,
      place: normalizeStringArray(item.place),
      equipment: normalizeStringArray(item.equipment),
      goals: normalizeStringArray(item.goals),
      avoid: normalizeStringArray(item.avoid)
    })),
    meals: (templates.meals || []).map((item) => ({
      ...item,
      items: normalizeStringArray(item.items)
    }))
  };
}

function readCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

function readNumberFromInput(input, fallback) {
  const raw = String(input?.value || "").trim();
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function splitCsv(value) {
  return String(value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCsv(value) {
  return normalizeStringArray(value).join(", ");
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return splitCsv(value);
}

function arrayIncludes(list, value) {
  return normalizeStringArray(list).includes(value);
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
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
    customPlans: {},
    inbodyRecords: [],
    generatedPlans: [],
    generatedPlanDraft: null,
    generatorGoals: [...FIT_GOALS],
    generatorTemplates: cloneGeneratorTemplates(DEFAULT_GENERATOR_TEMPLATES)
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

  if (Array.isArray(parsed.inbodyRecords)) {
    initial.inbodyRecords = trimInbodyRecords(parsed.inbodyRecords);
  }

  if (Array.isArray(parsed.generatedPlans)) {
    initial.generatedPlans = parsed.generatedPlans
      .filter((entry) => isPlainObject(entry))
      .map((entry) => ({ ...entry }))
      .slice(0, 12);
  }

  if (isPlainObject(parsed.generatedPlanDraft)) {
    initial.generatedPlanDraft = { ...parsed.generatedPlanDraft };
  }

  if (isPlainObject(parsed.generatorTemplates)) {
    initial.generatorTemplates = normalizeGeneratorTemplates(parsed.generatorTemplates);
  }

  if (Array.isArray(parsed.generatorGoals)) {
    const goals = normalizeStringArray(parsed.generatorGoals);
    initial.generatorGoals = goals.length ? goals : [...FIT_GOALS];
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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (_error) {
    return false;
  }
}

function prepareLoadedState() {
  selectedDay = selectInitialDay();
  analyticsScope = ANALYTICS_SCOPES.includes(state.analyticsScope) ? state.analyticsScope : "week";
  normalizeCustomPlans();
  ensureGeneratorState();
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
