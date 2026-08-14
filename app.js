"use strict";

const WEEKDAYS = [
  { code: "MON", short: "월", title: "월요일" },
  { code: "TUE", short: "화", title: "화요일" },
  { code: "WED", short: "수", title: "수요일" },
  { code: "THU", short: "목", title: "목요일" },
  { code: "FRI", short: "금", title: "금요일" },
  { code: "SAT", short: "토", title: "토요일" },
  { code: "SUN", short: "일", title: "일요일" }
];

const STORAGE_KEY = "fitmind_state_v1";
const PLAN_VERSION = "daily_fat_loss_hypertrophy_v10";
const RETIRED_EXERCISE_IDS = new Set();
const RETIRED_TEMPLATE_IDS = new Set();
const RETIRED_EXERCISE_NAME_PATTERNS = [];
const LEGACY_EXERCISE_REPLACEMENTS = {};
const ROUTINE_EXERCISE_UPGRADES = {};
const DEFAULT_EXERCISE_GUIDE = {
  howTo: "반동 없이 천천히 움직이고, 마지막 2회가 힘든 정도의 무게로 진행해.",
  machine: "좌석, 패드, 손잡이를 몸에 먼저 맞춘 뒤 관절이 편한 범위에서 시작해.",
  ball: "기구가 비어 있지 않으면 비슷한 머신, 케이블, 밴드로 같은 부위를 가볍게 대체해.",
  safety: "날카로운 통증, 어지러움, 자세 붕괴가 있으면 즉시 무게를 낮추거나 중단해.",
  mistake: "무게 욕심으로 반동을 쓰면 목표 근육 자극보다 관절 부담이 커져."
};

const EXERCISE_VIDEO_QUERY_OVERRIDES = {
  "leg-press": { howTo: "레그프레스 운동방법", machine: "레그프레스 기구 사용법" },
  "bulgarian-split-squat": { howTo: "불가리안 스플릿 스쿼트 운동방법", machine: "스미스머신 불가리안 스플릿 스쿼트 세팅" },
  "hip-abduction": { howTo: "힙 어브덕션 운동방법", machine: "힙 어브덕션 머신 사용법" },
  "hip-adduction": { howTo: "힙 어덕션 운동방법", machine: "힙 어덕션 머신 사용법" },
  "lying-leg-curl": { howTo: "라잉 레그컬 운동방법", machine: "라잉 레그컬 기구 사용법" },
  "standing-calf-raise": { howTo: "스탠딩 카프레이즈 운동방법", machine: "카프레이즈 머신 사용법" },
  "seated-calf-raise": { howTo: "시티드 카프레이즈 운동방법", machine: "시티드 카프레이즈 머신 사용법" },
  "straight-arm-pulldown": { howTo: "스트레이트 암 풀다운 운동방법", machine: "케이블 스트레이트 암 풀다운 사용법" },
  "lat-pulldown": { howTo: "랫풀다운 운동방법", machine: "랫풀다운 기구 사용법" },
  "assisted-pull-up": { howTo: "어시스트 풀업 머신 운동방법", machine: "어시스트 풀업 머신 사용법" },
  "negative-pull-up-deadhang": { howTo: "네거티브 풀업 데드행 운동방법", machine: "철봉 턱걸이 보조 운동" },
  "scapular-pull-up-deadhang": { howTo: "스캐풀라 풀업 데드행 운동방법", machine: "철봉 매달리기 턱걸이 보조" },
  "seated-row": { howTo: "시티드 로우 운동방법", machine: "시티드 로우 머신 사용법" },
  "vertical-row": { howTo: "버티컬 로우 운동방법", machine: "Vertical Row 머신 사용법" },
  "chest-supported-row": { howTo: "체스트 서포티드 로우 운동방법", machine: "체스트 서포티드 로우 머신 사용법" },
  "pullover-machine": { howTo: "풀오버 머신 운동방법", machine: "Pullover 머신 사용법" },
  "machine-biceps-curl": { howTo: "머신 바이셉 컬 운동방법", machine: "바이셉 컬 머신 사용법" },
  "cable-hammer-curl": { howTo: "케이블 해머 컬 운동방법", machine: "케이블 로프 컬 사용법" },
  "triceps-pushdown": { howTo: "트라이셉스 푸시다운 운동방법", machine: "케이블 푸시다운 기구 사용법" },
  "cable-crunch-mon": { howTo: "케이블 크런치 운동방법", machine: "케이블 크런치 로프 세팅" },
  "cable-crunch-wed": { howTo: "케이블 크런치 운동방법", machine: "케이블 크런치 로프 세팅" },
  "cable-crunch-fri": { howTo: "케이블 크런치 운동방법", machine: "케이블 크런치 로프 세팅" },
  "hanging-knee-raise-mon": { howTo: "행잉 니레이즈 운동방법", machine: "행잉 니레이즈 철봉 사용법" },
  "hanging-knee-raise-fri": { howTo: "행잉 니레이즈 운동방법", machine: "행잉 니레이즈 철봉 사용법" },
  "reverse-crunch-wed": { howTo: "리버스 크런치 운동방법", machine: "리버스 크런치 매트 운동" },
  "pallof-press-wed": { howTo: "팔로프 프레스 운동방법", machine: "케이블 팔로프 프레스 세팅" },
  "ab-wheel-fri": { howTo: "복근 롤아웃 AB wheel 운동방법", machine: "AB wheel 사용법" },
  "plank-mon": { howTo: "플랭크 자세 운동방법", machine: "플랭크 매트 사용법" },
  "cable-woodchop": { howTo: "케이블 우드찹 운동방법", machine: "케이블 머신 코어 회전 운동" },
  "cable-woodchop-sat": { howTo: "케이블 우드찹 운동방법", machine: "케이블 머신 코어 회전 운동" },
  "ab-crunch-machine": { howTo: "플랭크 복근 머신 대체 운동방법", machine: "복근 크런치 머신 선택 사용법" },
  "ab-crunch-machine-thu": { howTo: "플랭크 복근 머신 대체 운동방법", machine: "복근 크런치 머신 선택 사용법" },
  plank: { howTo: "플랭크 자세 운동방법", machine: "플랭크 매트 사용법" },
  "side-plank": { howTo: "사이드 플랭크 자세 운동방법", machine: "사이드 플랭크 매트 운동" },
  "side-plank-fri": { howTo: "사이드 플랭크 자세 운동방법", machine: "사이드 플랭크 매트 운동" },
  "side-plank-sat": { howTo: "사이드 플랭크 자세 운동방법", machine: "사이드 플랭크 매트 운동" },
  deadbug: { howTo: "데드버그 운동방법", machine: "데드버그 코어 운동" },
  "ab-slide-mon": { howTo: "AB 슬라이드 무릎 롤아웃 초보 운동방법", machine: "AB 슬라이드 복근 롤아웃 사용법" },
  "ab-slide-fri": { howTo: "AB 슬라이드 무릎 롤아웃 초보 운동방법", machine: "AB 슬라이드 복근 롤아웃 사용법" },
  "squat-machine": { howTo: "핵스쿼트 스미스머신 스쿼트 운동방법", machine: "핵스쿼트 머신 스미스머신 사용법" },
  "leg-extension": { howTo: "레그 익스텐션 운동방법", machine: "레그 익스텐션 기구 사용법" },
  "leg-curl-seated": { howTo: "시티드 레그컬 운동방법", machine: "시티드 레그컬 기구 사용법" },
  "hip-thrust": { howTo: "힙 쓰러스트 운동방법", machine: "힙쓰러스트 머신 사용법" },
  "calf-press": { howTo: "카프 프레스 운동방법", machine: "카프 프레스 기구 사용법" },
  "chest-press": { howTo: "체스트 프레스 운동방법", machine: "체스트 프레스 기구 사용법" },
  "smith-incline-press": { howTo: "스미스 인클라인 프레스 운동방법", machine: "스미스머신 인클라인 벤치 세팅" },
  "rear-delt-fly": { howTo: "리어델트 플라이 운동방법", machine: "리버스 펙덱 리어델트 머신 사용법" },
  "shoulder-press": { howTo: "숄더 프레스 운동방법", machine: "숄더 프레스 머신 사용법" },
  "single-arm-cable-curl": { howTo: "원암 케이블 컬 운동방법", machine: "케이블 바이셉 컬 사용법" },
  "lateral-raise": { howTo: "델토이드 레이즈 머신 운동방법", machine: "Deltoid Raise 머신 사용법" },
  "russian-twist": { howTo: "러시안 트위스트 운동방법", machine: "러시안 트위스트 도구 사용법" },
  "machine-row": { howTo: "버티컬 로우 운동방법", machine: "Vertical Row 머신 사용법" },
  "high-foot-leg-press": { howTo: "레그프레스 발 높게 운동방법", machine: "레그프레스 기구 사용법" },
  "romanian-deadlift": { howTo: "루마니안 데드리프트 RDL 운동방법", machine: "스미스머신 루마니안 데드리프트 세팅" },
  "face-pull": { howTo: "페이스풀 운동방법", machine: "케이블 페이스풀 사용법" },
  "pec-deck-machine": { howTo: "펙덱 머신 운동방법", machine: "펙덱 머신 사용법" },
  "leg-press-sat": { howTo: "레그프레스 운동방법", machine: "레그프레스 기구 사용법" },
  "chest-press-sat": { howTo: "체스트 프레스 운동방법", machine: "체스트 프레스 머신 사용법" },
  "seated-row-sat": { howTo: "버티컬 로우 운동방법", machine: "Vertical Row 머신 사용법" },
  "shoulder-press-sat": { howTo: "숄더 프레스 운동방법", machine: "숄더 프레스 머신 사용법" },
  "lateral-raise-sat": { howTo: "델토이드 레이즈 머신 운동방법", machine: "Deltoid Raise 머신 사용법" },
  "hip-abduction-sat": { howTo: "힙 어브덕션 운동방법", machine: "힙 어브덕션 머신 사용법" },
  "russian-twist-sat": { howTo: "러시안 트위스트 운동방법", machine: "러시안 트위스트 도구 사용법" },
  "farmers-walk": { howTo: "파머스 워크 운동방법", machine: "덤벨 파머스 워크 자세" }
};

const ANALYTICS_SCOPES = ["day", "week", "month"];
const INBODY_MAX_RECORDS = 12;
const INBODY_MAX_IMAGE_RECORDS = 6;
const INBODY_IMAGE_MAX_EDGE = 720;
const INBODY_IMAGE_QUALITY = 0.68;
const INBODY_MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const INBODY_MAX_DATA_URL_CHARS = 1200000;
const WORKOUT_PERSIST_INTERVAL_MS = 30000;
const FIT_GOALS = ["체중감량", "근육증가", "체력향상", "복근강화", "건강관리"];
const FIT_INJURY_AREAS = ["무릎", "허리", "어깨", "손목", "팔꿈치", "발목"];
const FIT_DAY_PARTS = ["하체", "등", "가슴/어깨", "하체 후면", "전신", "복근"];
const DEFAULT_GENERATOR_TEMPLATES = {
  exercises: [
    { id: "tpl-squat", name: "레그프레스 또는 스쿼트 머신", part: "하체", place: ["헬스장", "집"], equipment: ["머신", "맨몸"], goals: ["체중감량", "근육증가", "건강관리"], avoid: ["무릎"] },
    { id: "tpl-hip-hinge", name: "힙 쓰러스트 머신 또는 레그컬", part: "하체 후면", place: ["헬스장", "집"], equipment: ["머신", "밴드", "맨몸"], goals: ["근육증가", "체력향상"], avoid: ["허리"] },
    { id: "tpl-lat-pull", name: "랫풀다운 또는 보조 풀업 머신", part: "등", place: ["헬스장", "집"], equipment: ["머신", "밴드"], goals: ["근육증가", "풀업", "건강관리"], avoid: ["어깨"] },
    { id: "tpl-row", name: "버티컬 로우 또는 시티드 로우 머신", part: "등", place: ["헬스장", "집"], equipment: ["머신", "케이블", "밴드"], goals: ["근육증가", "체력향상", "풀업"], avoid: ["허리"] },
    { id: "tpl-pullover", name: "풀오버 머신", part: "등", place: ["헬스장"], equipment: ["머신"], goals: ["근육증가", "풀업"], avoid: ["어깨"] },
    { id: "tpl-push", name: "체스트 프레스 머신 또는 펙덱", part: "가슴/어깨", place: ["헬스장", "집", "야외"], equipment: ["머신", "맨몸"], goals: ["근육증가", "체력향상"], avoid: ["어깨", "손목"] },
    { id: "tpl-shoulder", name: "숄더 프레스 또는 델토이드 레이즈 머신", part: "가슴/어깨", place: ["헬스장", "집"], equipment: ["머신"], goals: ["근육증가"], avoid: ["어깨"] },
    { id: "tpl-plank", name: "플랭크", part: "복근", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["복근강화", "건강관리"], avoid: ["허리"] },
    { id: "tpl-side-plank", name: "사이드 플랭크", part: "복근", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["복근강화", "체중감량", "건강관리"], avoid: ["어깨"] },
    { id: "tpl-deadbug", name: "데드버그", part: "복근", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["복근강화", "건강관리"], avoid: [] },
    { id: "tpl-cable-crunch", name: "케이블 크런치", part: "복근", place: ["헬스장"], equipment: ["케이블"], goals: ["복근강화", "근육증가"], avoid: ["허리"] },
    { id: "tpl-hanging-knee-raise", name: "행잉 니레이즈", part: "복근", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["복근강화"], avoid: ["어깨", "허리"] },
    { id: "tpl-reverse-crunch", name: "리버스 크런치", part: "복근", place: ["헬스장", "집"], equipment: ["맨몸"], goals: ["복근강화"], avoid: ["허리"] },
    { id: "tpl-pallof-press", name: "Pallof press", part: "복근", place: ["헬스장", "집"], equipment: ["케이블", "밴드"], goals: ["복근강화", "건강관리"], avoid: [] },
    { id: "tpl-ab-wheel", name: "Ab wheel 무릎 롤아웃", part: "복근", place: ["헬스장", "집"], equipment: ["맨몸"], goals: ["복근강화"], avoid: ["허리", "어깨"] },
    { id: "tpl-cable-woodchop", name: "케이블 우드찹 또는 밴드 우드찹", part: "복근", place: ["헬스장", "집"], equipment: ["케이블", "밴드"], goals: ["복근강화", "체중감량", "건강관리"], avoid: ["허리"] },
    { id: "tpl-cardio", name: "대화 가능한 강도 유산소", part: "유산소", place: ["헬스장", "집", "야외"], equipment: ["러닝", "자전거", "맨몸"], goals: ["체중감량", "체력향상", "건강관리"], avoid: ["무릎"] },
    { id: "tpl-mobility", name: "관절 가동성 + 스트레칭", part: "회복", place: ["헬스장", "집", "야외"], equipment: ["맨몸"], goals: ["건강관리"], avoid: [] }
  ],
  meals: [
    { id: "meal-normal", name: "일반식 균형형", preference: "일반식", items: ["아침: 무가당 두유 250ml + 계란 2개 + 바나나 1개", "11시: 아몬드 10개, 커피는 아메리카노", "점심: 밥 반 공기 + 단백질 손바닥 1-1.5장 + 채소", "오후: 무가당 고단백 그릭요거트 200g", "운동 전후: 프로틴 + 무가당 두유, 강한 운동일만 바나나 1개", "저녁: 채소 + 계란/닭가슴살/두부/생선 중 하나"], note: "2주간 믹스커피 제거와 점심 밥 반 공기만 우선 적용하고 단백질은 줄이지 않습니다." },
    { id: "meal-protein", name: "고단백 근육형", preference: "고단백", items: ["아침: 그릭요거트 + 계란 + 과일", "점심: 밥 + 살코기/생선 + 채소", "저녁: 단백질 30g + 닭가슴살/두부 + 채소"], note: "매 끼니 단백질을 분산해서 근손실을 줄입니다." },
    { id: "meal-diet", name: "다이어트식 감량형", preference: "다이어트식", items: ["아침: 무가당 두유 250ml + 계란 2개 + 바나나 1개", "점심: 일반식에서 밥은 반 공기, 단백질과 채소 충분히", "오후: 무가당 고단백 그릭요거트 200g", "운동 전후: 프로틴 + 무가당 두유", "저녁: 단백질 식품 + 채소, 하체 운동일만 탄수화물 소량"], note: "믹스커피를 빼고, 쉬는 날 오후 바나나만 반 개 또는 생략합니다. 감량 중에도 단백질은 줄이지 않습니다." },
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
    theme: "가슴 · 어깨 · 삼두",
    trainingFocus: "가슴 두께와 어깨 폭을 우선하고, 모든 본세트는 자세를 지키며 RIR 1-3으로 끝낸다.",
    warmupMain: "어깨 가동성 + 가벼운 프레스",
    warmupTime: "5-7분",
    warmupNote: "첫 프레스 전에 가벼운 중량으로 2세트 준비하고 워밍업 세트는 본세트에 포함하지 않아.",
    cardioMain: "근력 후 경사 걷기",
    cardioTime: "25-30분",
    cardioPlan: "경사 5-10%, 4.5-5.5km/h의 대화 가능한 강도. 하루 총 8,000-10,000보에 이미 도달했다면 20분으로 줄여.",
    exercises: [
      exercise({ id: "smith-incline-press", name: "인클라인 체스트 프레스", sets: ["8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "chest-press", name: "플랫 체스트 프레스 · 현재보다 한 단계 증량 시험", sets: ["8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "pec-deck-machine", name: "펙덱 또는 케이블 플라이", sets: ["10-15회", "10-15회"], restSec: 75 }),
      exercise({ id: "shoulder-press", name: "숄더 프레스 · 40kg 시험", sets: ["8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "lateral-raise", name: "레터럴 레이즈", sets: ["12-20회", "12-20회", "12-20회"], restSec: 75 }),
      exercise({ id: "triceps-pushdown", name: "트라이셉스 푸시다운", sets: ["10-15회", "10-15회", "10-15회"], restSec: 75 })
    ]
  },
  TUE: {
    dayLabel: "TUE",
    theme: "하체 전면 · 둔근 · 복근",
    trainingFocus: "레그프레스를 주력으로 하고 무릎 정렬과 완전한 가동범위를 중량보다 우선한다.",
    warmupMain: "고관절/무릎/발목 워밍업",
    warmupTime: "5-7분",
    warmupNote: "레그프레스는 85kg 가벼운 준비 세트 후 다음 한 단계인 90-95kg를 시험해.",
    cardioMain: "회복성 평지 걷기",
    cardioTime: "30-40분 또는 하루 8,000-10,000보",
    cardioPlan: "하체 회복을 방해하지 않는 편한 속도. 걸음 수를 이미 채웠거나 다리가 무거우면 별도 유산소는 생략해.",
    exercises: [
      exercise({ id: "leg-press", name: "레그프레스 · 90-95kg 시험", sets: ["8-12회", "8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "leg-extension", name: "레그 익스텐션", sets: ["10-15회", "10-15회", "10-15회"], restSec: 75 }),
      exercise({ id: "bulgarian-split-squat", name: "불가리안 스플릿 스쿼트", sets: ["8-12회/쪽", "8-12회/쪽"], restSec: 90 }),
      exercise({ id: "hip-abduction", name: "힙 어브덕션 · 60kg", sets: ["12-20회", "12-20회", "12-20회"], restSec: 75 }),
      exercise({ id: "hip-adduction", name: "힙 어덕션 · 30kg", sets: ["10-15회", "10-15회"], restSec: 75 }),
      exercise({ id: "standing-calf-raise", name: "스탠딩 카프레이즈", sets: ["10-15회", "10-15회", "10-15회"], restSec: 60 }),
      exercise({ id: "cable-crunch-tue", name: "복근: 케이블 크런치", sets: ["10-15회", "10-15회", "10-15회"], restSec: 75 })
    ]
  },
  WED: {
    dayLabel: "WED",
    theme: "등 · 후면어깨 · 이두",
    trainingFocus: "수직 당기기와 수평 당기기를 균형 있게 진행하고 반동 없는 광배 수축을 우선한다.",
    warmupMain: "어깨 가동성 + 가벼운 밴드 로우",
    warmupTime: "5-7분",
    warmupNote: "랫풀다운은 50kg 준비 세트 후 55kg에서 8-12회를 시험해.",
    cardioMain: "근력 후 경사 걷기",
    cardioTime: "25-30분",
    cardioPlan: "경사 5-10%, 4.5-5.5km/h. 숨은 차지만 대화가 가능한 강도로 유지하고 하루 총 8,000-10,000보를 목표로 해.",
    exercises: [
      exercise({ id: "lat-pulldown", name: "랫풀다운 · 55kg 시험", sets: ["8-12회", "8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "seated-row", name: "시티드 로우", sets: ["8-12회", "8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "straight-arm-pulldown", name: "스트레이트 암 풀다운", sets: ["10-15회", "10-15회"], restSec: 75 }),
      exercise({ id: "rear-delt-fly", name: "리버스 펙덱", sets: ["12-20회", "12-20회", "12-20회"], restSec: 75 }),
      exercise({ id: "machine-biceps-curl", name: "머신 또는 EZ바 컬", sets: ["8-12회", "8-12회", "8-12회"], restSec: 75 }),
      exercise({ id: "cable-hammer-curl", name: "해머 컬", sets: ["10-15회", "10-15회"], restSec: 75 })
    ]
  },
  THU: {
    dayLabel: "THU",
    theme: "하체 후면 · 둔근 · 복근",
    trainingFocus: "RDL과 레그컬로 후면사슬을 훈련하되 허리 중립과 햄스트링 긴장을 우선한다.",
    warmupMain: "글루트 브릿지 + 가벼운 힙힌지",
    warmupTime: "5-7분",
    warmupNote: "RDL은 빈 봉이나 가벼운 중량으로 힙힌지와 허리 중립부터 확인해.",
    cardioMain: "회복성 평지 걷기",
    cardioTime: "30-40분 또는 하루 8,000-10,000보",
    cardioPlan: "하체 피로가 크면 별도 유산소를 생략하고 일상 걸음만 채워. 강한 경사와 인터벌은 하지 않아.",
    exercises: [
      exercise({ id: "romanian-deadlift", name: "루마니안 데드리프트 (RDL)", sets: ["6-10회", "6-10회", "6-10회"], restSec: 120 }),
      exercise({ id: "leg-curl-seated", name: "레그컬 (Leg Curl)", sets: ["10-12회", "10-12회", "10-12회", "10-12회"], restSec: 85 }),
      exercise({ id: "hip-thrust", name: "힙 쓰러스트", sets: ["8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "back-extension", name: "백 익스텐션", sets: ["10-15회", "10-15회"], restSec: 75 }),
      exercise({ id: "hip-abduction-thu", name: "힙 어브덕션", sets: ["15-20회", "15-20회"], restSec: 75 }),
      exercise({ id: "seated-calf-raise", name: "시티드 카프레이즈", sets: ["12-20회", "12-20회", "12-20회"], restSec: 60 }),
      exercise({ id: "hanging-knee-raise-thu", name: "복근: 행잉 니레이즈", sets: ["10-15회", "10-15회", "10-15회"], restSec: 75 })
    ]
  },
  FRI: {
    dayLabel: "FRI",
    theme: "어깨 · 팔 · 상부가슴",
    trainingFocus: "몸을 넓고 크게 보이게 하는 측면·후면 어깨와 상부가슴을 보강한다.",
    warmupMain: "밴드 외회전 + 가벼운 프레스",
    warmupTime: "5-7분",
    warmupNote: "월요일 기록이 떨어졌거나 어깨가 무거우면 숄더프레스 한 세트를 줄여.",
    cardioMain: "근력 후 경사 걷기",
    cardioTime: "20-30분 · 회복이 좋을 때만",
    cardioPlan: "경사 5-10%, 4.5-5.5km/h. 피로가 있거나 하루 8,000-10,000보를 채웠다면 생략해.",
    exercises: [
      exercise({ id: "shoulder-press-fri", name: "숄더 프레스 · 40kg 기준", sets: ["8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "lateral-raise-fri", name: "머신 레터럴 레이즈", sets: ["12-20회", "12-20회", "12-20회", "12-20회"], restSec: 75 }),
      exercise({ id: "rear-delt-fly-fri", name: "리버스 펙덱", sets: ["12-20회", "12-20회", "12-20회"], restSec: 75 }),
      exercise({ id: "smith-incline-press-fri", name: "인클라인 체스트 프레스", sets: ["8-12회", "8-12회", "8-12회"], restSec: 120 }),
      exercise({ id: "machine-biceps-curl-fri", name: "프리처 또는 머신 컬", sets: ["8-12회", "8-12회", "8-12회"], restSec: 75 }),
      exercise({ id: "triceps-pushdown-fri", name: "트라이셉스 푸시다운 또는 오버헤드 익스텐션", sets: ["10-15회", "10-15회", "10-15회"], restSec: 75 })
    ]
  },
  SAT: {
    dayLabel: "SAT",
    theme: "컨디셔닝 · 지방감량",
    trainingFocus: "HYROX와 인터벌을 겹치지 않고 한 가지만 선택해 주간 피로를 관리한다.",
    warmupMain: "전신 관절 가동 + 가벼운 걷기",
    warmupTime: "7-10분",
    warmupNote: "하체 통증이나 주간 중량 하락이 있으면 인터벌 대신 평지 걷기로 바꿔.",
    cardioMain: "HYROX 또는 3km 인터벌 중 하나",
    cardioTime: "약 40-60분",
    cardioPlan: "인터벌 선택 시 5분 워밍업 → 300m 7-8km/h + 200m 5-6km/h를 6회 → 5분 쿨다운. HYROX를 했다면 인터벌은 생략해.",
    exercises: [
      exercise({ id: "conditioning-choice", name: "컨디셔닝: HYROX 또는 3km 인터벌", sets: ["둘 중 하나 완료"], restSec: 0 }),
      exercise({ id: "cooldown-walk", name: "쿨다운 걷기 + 전신 스트레칭", sets: ["10분"], restSec: 0 })
    ]
  },
  SUN: {
    dayLabel: "SUN",
    theme: "회복 · 일상 활동",
    trainingFocus: "지방감량은 이어가되 강한 운동 없이 다음 주 근력 회복을 확보한다.",
    warmupMain: "가벼운 관절 가동",
    warmupTime: "3-5분",
    warmupNote: "통증과 피로가 있으면 운동하지 않고 완전히 쉬어도 돼.",
    cardioMain: "편안한 산책 또는 완전 휴식",
    cardioTime: "30-60분",
    cardioPlan: "하루 총 8,000-10,000보를 가볍게 채우되 피로하면 목표를 강제하지 않아. 숨이 차지 않는 회복 강도로 진행해.",
    exercises: [
      exercise({ id: "recovery-walk", name: "회복 산책", sets: ["30-60분 또는 완전 휴식"], restSec: 0 }),
      exercise({ id: "mobility-recovery", name: "가벼운 전신 스트레칭", sets: ["5-10분"], restSec: 0 })
    ]
  }
};

const ui = {
  todayLabel: document.getElementById("todayLabel"),
  storageNotice: document.getElementById("storageNotice"),
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
  quickExerciseSelect: document.getElementById("quickExerciseSelect"),
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
  exportDataBtn: document.getElementById("exportDataBtn"),
  importDataBtn: document.getElementById("importDataBtn"),
  importDataInput: document.getElementById("importDataInput"),
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
let lastWorkoutPersistMs = 0;
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
  window.addEventListener("pagehide", () => {
    applyWorkoutElapsedTick(getCurrentSession(), { forcePersist: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      applyWorkoutElapsedTick(getCurrentSession(), { forcePersist: true });
    }
  });

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
    const trigger = target.closest("[data-jump-exercise]");
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }
    const exerciseId = trigger.dataset.jumpExercise;
    if (!exerciseId) {
      return;
    }
    activateExercise(exerciseId);
  });

  ui.quickExerciseSelect.addEventListener("change", () => {
    activateExercise(ui.quickExerciseSelect.value);
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
    const setSaved = persistState();
    const isAllDone = getCompletedExerciseCount() >= getCurrentPlan().exercises.length;
    if (isAllDone) {
      saveCurrentSummary({ auto: true });
    }
    startRestTimer(active.restSec);
    renderAll();
    if (!setSaved) {
      announce("세트는 화면에 반영됐지만 저장하지 못했어. 데이터 백업 후 저장공간을 확인해 줘.");
    }
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
    const exerciseSaved = persistState();
    const isAllDone = getCompletedExerciseCount() >= getCurrentPlan().exercises.length;
    if (isAllDone) {
      saveCurrentSummary({ auto: true });
    }
    renderAll();
    announce(exerciseSaved
      ? "운동 완료 처리했어. 다음 운동으로 이어가자."
      : "운동 완료는 화면에 반영됐지만 저장하지 못했어. 저장공간을 확인해 줘.");
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
    const resetSaved = persistState();
    ui.saveMessage.textContent = "";
    ui.editorMessage.textContent = "";
    renderAll();
    announce(resetSaved
      ? "초기화 완료. 처음 세트부터 다시 시작할 수 있어."
      : "화면은 초기화됐지만 저장하지 못했어. 저장공간을 확인해 줘.");
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
    if (!persistState()) {
      setEditorMessage("저장공간 부족으로 운동 변경을 저장하지 못했어요.");
      return;
    }
    renderAll();
    setEditorMessage("세트 중량과 횟수를 이 기기에 저장했어요.");
    announce("세트 중량과 횟수를 이 기기에 저장했어.");
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
    if (!persistState()) {
      setEditorMessage("저장공간 부족으로 새 운동을 저장하지 못했어요.");
      return;
    }
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
    if (!persistState()) {
      setEditorMessage("저장공간 부족으로 삭제 결과를 저장하지 못했어요.");
      return;
    }
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
    if (!persistState()) {
      setEditorMessage("저장공간 부족으로 기본 루틴 복원을 저장하지 못했어요.");
      return;
    }
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
      if (file.size > INBODY_MAX_SOURCE_BYTES) {
        ui.inbodyMessage.textContent = "이미지가 너무 커요. 15MB 이하 JPG/PNG를 선택해 주세요.";
        ui.inbodyImageInput.value = "";
        pendingInbodyImageDataUrl = "";
        return;
      }
      ui.inbodyMessage.textContent = "이미지를 저장하기 좋게 줄이는 중...";
      try {
        pendingInbodyImageDataUrl = await compressImageFile(file);
        if (pendingInbodyImageDataUrl.length > INBODY_MAX_DATA_URL_CHARS) {
          throw new Error("compressed_image_too_large");
        }
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

  if (ui.inbodyHistoryList) {
    ui.inbodyHistoryList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const viewId = target.dataset.viewInbody;
      const deleteId = target.dataset.deleteInbody;
      const record = (state.inbodyRecords || []).find((item) => item.id === (viewId || deleteId));
      if (!record) {
        return;
      }
      if (viewId && record.imageDataUrl) {
        renderInbodyPreview(record.imageDataUrl);
        ui.inbodyMessage.textContent = `${record.date} 인바디 이미지를 표시했어요.`;
        return;
      }
      if (!deleteId || !window.confirm(`${record.date} 인바디 기록을 삭제할까요?`)) {
        return;
      }
      const previousRecords = state.inbodyRecords || [];
      state.inbodyRecords = previousRecords.filter((item) => item.id !== deleteId);
      if (!persistState()) {
        state.inbodyRecords = previousRecords;
        ui.inbodyMessage.textContent = "저장공간 문제로 삭제 결과를 저장하지 못했어요.";
        return;
      }
      renderInbodyPanel();
      ui.inbodyMessage.textContent = "인바디 기록을 삭제했어요.";
    });
  }

  if (ui.exportDataBtn) {
    ui.exportDataBtn.addEventListener("click", exportAppData);
  }

  if (ui.importDataBtn && ui.importDataInput) {
    ui.importDataBtn.addEventListener("click", () => ui.importDataInput.click());
    ui.importDataInput.addEventListener("change", importAppData);
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
      const saved = persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = saved
        ? "맞춤 운동·식단 계획을 생성했어요. 입력값을 바꾸고 다시 생성할 수 있습니다."
        : "계획은 생성했지만 저장공간 부족으로 이 기기에 보관하지 못했어요.";
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
      const didSave = persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = didSave
        ? "기본 템플릿으로 되돌렸어요."
        : "기본 템플릿은 화면에 반영됐지만 저장하지 못했어요.";
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

  if (fullText.includes("walk") || fullText.includes("cardio") || fullText.includes("유산소")) {
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
  if (
    fullText.includes("복근")
    || fullText.includes("ab-slide")
    || fullText.includes("rollout")
    || fullText.includes("슬라이드")
    || fullText.includes("plank")
    || fullText.includes("crunch")
    || fullText.includes("deadbug")
    || fullText.includes("woodchop")
    || fullText.includes("twist")
  ) {
    return "🧘";
  }
  if (fullText.includes("leg") || fullText.includes("squat") || fullText.includes("calf")) {
    return "🦵";
  }
  if (fullText.includes("press") || fullText.includes("shoulder") || fullText.includes("chest") || fullText.includes("raise") || fullText.includes("deltoid")) {
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
        <button
          class="queue-name"
          type="button"
          data-jump-exercise="${escapeHtml(item.id)}"
          aria-current="${current ? "true" : "false"}"
          ${done ? "disabled" : ""}
        >
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
  renderExerciseSwitcher(active);

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

function renderExerciseSwitcher(active) {
  const unfinished = getCurrentPlan().exercises.filter((item) => !isExerciseDone(item));
  if (!unfinished.length) {
    ui.quickExerciseSelect.innerHTML = '<option value="">오늘 운동 완료</option>';
    ui.quickExerciseSelect.disabled = true;
    return;
  }

  ui.quickExerciseSelect.innerHTML = unfinished.map((item) => {
    const doneSets = getSetDone(item.id);
    const label = `${getExerciseIcon(item)} ${item.name} (${doneSets}/${item.sets.length}세트)`;
    return `<option value="${escapeHtml(item.id)}">${escapeHtml(label)}</option>`;
  }).join("");
  ui.quickExerciseSelect.value = active?.id || unfinished[0].id;
  ui.quickExerciseSelect.disabled = unfinished.length <= 1;
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
  const saved = persistState();
  if (!saved) {
    ui.saveMessage.textContent = "저장공간 부족으로 오늘 요약을 저장하지 못했어요.";
    return null;
  }

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
    ui.inbodyHistoryList.innerHTML = `<li class="history-empty">아직 인바디 기록이 없습니다. 4주에 한 번 측정 후 JPG와 수치를 저장해 주세요.</li>`;
    return;
  }

  ui.inbodyHistoryList.innerHTML = records.map((record) => {
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
    const viewButton = record.imageDataUrl
      ? `<button class="btn ghost small" type="button" data-view-inbody="${escapeHtml(record.id)}">이미지 보기</button>`
      : "";
    return `
      <li class="history-item">
        <strong>${escapeHtml(record.date || "")}</strong>${imageLabel}<br>
        ${escapeHtml(parts.join(" | ") || "수치 미입력")}
        ${memo}
        <div class="history-actions">
          ${viewButton}
          <button class="btn ghost small danger" type="button" data-delete-inbody="${escapeHtml(record.id)}">기록 삭제</button>
        </div>
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
      ? "인바디 기록 저장 완료. 이번 4주 조정안을 업데이트했어요."
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
      "4주에 한 번 같은 시간대에 측정해 주세요. 첫 기록을 저장하면 다음 측정부터 내장지방, 허리둘레, 골격근량 변화를 우선 비교합니다.",
      "JPG만으로 자동 판독하지 않습니다. 체중, 골격근량, 체지방률을 입력해야 조정안이 정확해집니다."
    ];
  }

  const latest = records[0];
  const previous = records[1] || null;
  const messages = [];

  if (!hasCoreInbodyMetrics(latest)) {
    messages.push("이미지는 저장됐어요. 체중, 골격근량, 체지방률을 입력하면 운동·식단 조정안을 더 정확하게 만들 수 있습니다.");
    messages.push("현재는 하루 총 8,000-10,000보와 월·수·금 경사 걷기, 토요일 단일 컨디셔닝을 유지하고 저녁 단백질은 빼지 마세요.");
    return messages;
  }

  if (previous && hasCoreInbodyMetrics(previous)) {
    const weightDiff = latest.weightKg - previous.weightKg;
    const muscleDiff = latest.muscleKg - previous.muscleKg;
    const fatDiff = latest.bodyFatPercent - previous.bodyFatPercent;

    if (muscleDiff <= -0.5) {
      messages.push("골격근량이 줄었습니다. 경사·인터벌 강도를 낮추고 저녁에 닭가슴살/두부/생선과 하체 운동일 탄수화물을 반드시 넣으세요.");
    }
    if (fatDiff >= 1) {
      messages.push("체지방률이 올랐습니다. 저녁 바나나+프로틴만으로 끝내기보다 단백질 식품과 채소를 고정하고, 음료·간식·야식을 먼저 줄이세요.");
    }
    if (weightDiff <= -2 && muscleDiff < 0) {
      messages.push("4주 감량 속도가 빠르고 근육도 줄었습니다. 감량보다 근손실 방지가 우선이라 저녁 탄수화물을 조금 늘리세요.");
    }
    if (muscleDiff >= 0.3 && fatDiff <= -0.5) {
      messages.push("좋은 방향입니다. 현재 루틴을 유지하고 주요 머신 중량만 아주 천천히 올리세요.");
    }
    if (Math.abs(weightDiff) < 0.5 && fatDiff > 0 && muscleDiff <= 0) {
      messages.push("체중은 비슷한데 체지방이 늘고 근육이 정체입니다. 금요일 팔 볼륨과 월/목 하체 세트 품질을 우선 확인하세요.");
    }
  } else {
    messages.push("첫 인바디 기준선을 저장했습니다. 다음 4주 측정부터 체중보다 내장지방, 허리둘레, 골격근량 변화를 우선해서 조정합니다.");
  }

  if (Number.isFinite(latest.visceralFatLevel) && latest.visceralFatLevel >= 10) {
    messages.push("내장지방 레벨이 높습니다. 최우선은 야식·음주·단 음료 줄이기와 저녁 단백질+채소 고정입니다. 복통이나 대사질환 이력이 있으면 전문가 상담을 권장합니다.");
  }
  if (Number.isFinite(latest.waistCm) && latest.waistCm >= 90) {
    messages.push("허리둘레가 높습니다. 체중보다 주 1회 허리둘레 감소와 하체/등 중량 유지 여부를 더 중요하게 보세요.");
  }
  if (Number.isFinite(latest.bodyFatPercent) && latest.bodyFatPercent >= 25) {
    messages.push("체지방 감량 단계입니다. 매일 일상 걸음과 작은 열량 적자를 지키고, 계획된 경사 걷기와 토요일 단일 컨디셔닝 외에 강한 유산소를 더하지 마세요.");
  }
  if (Number.isFinite(latest.muscleKg) && latest.muscleKg < 30) {
    messages.push("골격근량을 더 올려야 합니다. 등·하체 운동에서 마지막 2회가 힘든 무게를 기록하고, 매주 한 종목만 소폭 증가시키세요.");
  }
  messages.push("복근운동은 코어와 복근 모양을 만드는 역할입니다. 복부 지방 감소는 매일의 식사 조절, 일상 걸음, 계획한 유산소와 전신 근력운동이 함께 맞아야 합니다.");

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

function exportAppData() {
  const payload = {
    app: "FitMind Gym Routine",
    version: PLAN_VERSION,
    exportedAt: new Date().toISOString(),
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fitmind-backup-${getTodayDateString()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  ui.inbodyMessage.textContent = "전체 운동·인바디 데이터를 JSON 파일로 백업했어요.";
}

async function importAppData() {
  const file = ui.importDataInput?.files?.[0];
  const previousState = state;
  let stateWasReplaced = false;
  if (!file) {
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    ui.inbodyMessage.textContent = "백업 파일이 너무 큽니다. 12MB 이하 JSON 파일만 복원할 수 있어요.";
    ui.importDataInput.value = "";
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const rawState = isPlainObject(parsed?.state) ? parsed.state : parsed;
    if (!isPlainObject(rawState) || !isPlainObject(rawState.sessions)) {
      throw new Error("invalid_backup");
    }
    if (!window.confirm("현재 기기의 데이터를 백업 파일 내용으로 교체할까요?")) {
      ui.importDataInput.value = "";
      return;
    }
    stopRestTimer();
    pauseWorkoutTimer();
    state = normalizeLoadedState(rawState);
    stateWasReplaced = true;
    prepareLoadedState();
    if (!persistState()) {
      throw new Error("storage_failed");
    }
    renderAll();
    ui.inbodyMessage.textContent = "백업 데이터를 복원했어요.";
  } catch (_error) {
    if (stateWasReplaced) {
      state = previousState;
      prepareLoadedState();
      renderAll();
    }
    ui.inbodyMessage.textContent = "백업 파일을 복원하지 못했어요. FitMind JSON 파일인지 확인해 주세요.";
  } finally {
    ui.importDataInput.value = "";
  }
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
  const injuryAreas = readCheckedValues("fitInjuryAreas").filter((area) => FIT_INJURY_AREAS.includes(area));
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
  if (![heightCm, weightKg, age].every(Number.isFinite) || !ui.fitSexSelect.value) {
    return { error: "키, 몸무게, 나이, 성별을 모두 입력해 주세요." };
  }
  const injury = (ui.fitInjuryInput.value || "").trim();
  if (injury && injuryAreas.length === 0) {
    return { error: "주의사항이 있다면 피해야 할 부위를 하나 이상 선택해 주세요." };
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
      injury,
      injuryAreas,
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
  const injuryAreas = new Set(normalizeStringArray(profile.injuryAreas));
  const place = profile.place;
  const equipmentText = profile.equipment.join(" ").toLowerCase();
  const placeAndInjuryPool = templates.filter((item) => {
    const placeOk = arrayIncludes(item.place, place) || arrayIncludes(item.place, "전체");
    const injuryOk = !item.avoid.some((tag) => {
      const normalizedTag = String(tag || "").trim();
      return normalizedTag && (injuryAreas.has(normalizedTag) || injuryText.includes(normalizedTag.toLowerCase()));
    });
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
  const fallbackPool = pool;
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
  if (allergyText) {
    return {
      name: `${meal.name} · 알레르기 안전 확인 필요`,
      items: [
        "아침: 알레르기 표시를 확인한 단백질 식품 + 안전한 과일/곡류",
        "점심: 원재료를 확인한 밥/곡류 + 단백질 식품 + 채소",
        "저녁: 알레르기 성분이 없는 것으로 확인된 단백질 식품 + 채소 + 탄수화물 소량"
      ],
      note: `피해야 할 음식(${profile.allergies.join(", ")})을 입력해 특정 식품 추천을 제한했습니다. 제품 원재료 표시를 직접 확인하세요.`,
      proteinNote: "알레르기 성분이 없는 것으로 확인된 단백질 식품을 끼니마다 나눠 드세요."
    };
  }
  const items = meal.items.map((item) => {
    return item;
  });
  const proteinFactor = profile.goals.includes("근육증가") ? 1.7 : profile.goals.includes("체중감량") ? 1.5 : 1.4;
  const proteinTarget = Number.isFinite(profile.weightKg) ? Math.round(profile.weightKg * proteinFactor) : null;
  return {
    name: meal.name,
    items,
    note: meal.note,
    proteinNote: proteinTarget
      ? `단백질은 하루 약 ${proteinTarget}g을 목표로 끼니마다 나눠 먹는 방향을 추천합니다.`
      : "단백질은 매 끼니 손바닥 1-2개 분량을 기준으로 잡아주세요."
  };
}

function buildGeneratedExplanation(profile) {
  const beginner = profile.experience === "초보" ? "초보 기준이라 실패지점까지 가지 않고 여유 2-3회를 남기도록 구성했습니다. " : "";
  const injury = profile.injuryAreas?.length
    ? `선택한 주의 부위(${profile.injuryAreas.join(", ")})가 금기 태그인 운동은 제외했습니다. `
    : "";
  return `${beginner}${injury}${profile.place}에서 가능한 장비와 ${profile.goals.join(", ")} 목표에 맞춰 규칙 기반으로 주간 스케줄과 식단 예시를 만들었습니다.`;
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
  const didSave = persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = didSave
    ? "맞춤 계획을 이 기기에 저장했어요."
    : "저장공간 부족으로 맞춤 계획을 저장하지 못했어요.";
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
  const didSave = persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = didSave
    ? "운동 템플릿을 저장했어요."
    : "저장공간 부족으로 운동 템플릿을 저장하지 못했어요.";
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
  const didSave = persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = didSave
    ? "식단 템플릿을 저장했어요."
    : "저장공간 부족으로 식단 템플릿을 저장하지 못했어요.";
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
  const didSave = persistState();
  renderGeneratorPanel();
  ui.generatorMessage.textContent = didSave
    ? "목표 템플릿을 추가했어요."
    : "저장공간 부족으로 목표 템플릿을 저장하지 못했어요.";
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
      const didSave = persistState();
      renderGeneratorPanel();
      ui.generatorMessage.textContent = didSave
        ? "목표 템플릿을 삭제했어요."
        : "목표 템플릿 삭제를 저장하지 못했어요.";
    }
    return;
  }
  if (deleteId) {
    templates[key] = templates[key].filter((item) => item.id !== deleteId);
    state.generatorTemplates = templates;
    const didSave = persistState();
    renderGeneratorPanel();
    ui.generatorMessage.textContent = didSave
      ? "템플릿을 삭제했어요."
      : "템플릿 삭제를 저장하지 못했어요.";
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
  const exercises = Array.isArray(raw.exercises)
    ? raw.exercises.map(normalizeExerciseTemplate).filter(Boolean).filter((item) => !isRetiredExerciseTemplate(item))
    : fallback.exercises;
  const meals = Array.isArray(raw.meals) ? raw.meals.map(normalizeMealTemplate).filter(Boolean) : fallback.meals;
  return {
    exercises: exercises.length ? exercises : fallback.exercises,
    meals: meals.length ? meals : fallback.meals
  };
}

function isRetiredExerciseTemplate(item) {
  const id = String(item?.id || "");
  const name = String(item?.name || "");
  return RETIRED_TEMPLATE_IDS.has(id) || RETIRED_EXERCISE_NAME_PATTERNS.some((pattern) => pattern.test(name));
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

function applyWorkoutElapsedTick(session, { forcePersist = false } = {}) {
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
  if (forcePersist || now - lastWorkoutPersistMs >= WORKOUT_PERSIST_INTERVAL_MS) {
    if (persistState()) {
      lastWorkoutPersistMs = now;
    }
  }
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

function activateExercise(exerciseId) {
  const target = getCurrentPlan().exercises.find((item) => item.id === exerciseId);
  if (!target) {
    return;
  }
  if (isExerciseDone(target)) {
    announce("이미 완료한 운동이야. 미완료 운동을 선택해 줘.");
    return;
  }

  const session = getCurrentSession();
  session.activeExerciseId = target.id;
  session.updatedAt = new Date().toISOString();
  stopRestTimer();
  const saved = persistState();
  renderCurrentExercise();
  renderQueue();
  renderTimer();
  announce(saved
    ? `${target.name}, 이 운동부터 먼저 진행하자.`
    : "운동은 바꿨지만 순서를 저장하지 못했어. 저장공간을 확인해 줘.");
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
  const exercises = sourceExercises.map((item, index) => cloneExerciseItem(item, index));

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
    exercises: replaceRetiredExercises(exercises, dayCode)
  };
}

function replaceRetiredExercises(exercises, dayCode) {
  const replacementMap = LEGACY_EXERCISE_REPLACEMENTS[dayCode] || {};
  const upgradeMap = ROUTINE_EXERCISE_UPGRADES[dayCode] || {};
  const seenIds = new Set();
  return exercises
    .map((item, index) => {
      const replacementId = isRetiredExercise(item)
        ? (replacementMap[item.id] || replacementMap.fallback || "plank")
        : upgradeMap[item.id];
      if (!replacementId) {
        return item;
      }
      const replacement = findBaseExercise(dayCode, replacementId);
      return replacement ? cloneExerciseItem(replacement, index) : null;
    })
    .filter(Boolean)
    .filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
}

function isRetiredExercise(item) {
  const id = String(item?.id || "");
  const name = String(item?.name || "");
  return RETIRED_EXERCISE_IDS.has(id) || RETIRED_EXERCISE_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

function findBaseExercise(dayCode, exerciseId) {
  const plan = ROUTINE_PLAN[dayCode] || ROUTINE_PLAN.MON;
  return plan.exercises.find((item) => item.id === exerciseId) || null;
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
    setStorageNotice("");
    return true;
  } catch (_error) {
    setStorageNotice("이 기기의 저장공간이 부족해 변경사항을 저장하지 못했습니다. 데이터 백업 후 오래된 인바디 기록을 정리해 주세요.");
    return false;
  }
}

function setStorageNotice(message) {
  if (!ui.storageNotice) {
    return;
  }
  ui.storageNotice.textContent = message || "";
  ui.storageNotice.hidden = !message;
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
      return "SUN";
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
