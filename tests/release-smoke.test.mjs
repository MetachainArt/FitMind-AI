import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

function dayBlock(day, nextDay) {
  const start = app.indexOf(`  ${day}: {`, app.indexOf("const ROUTINE_PLAN"));
  const end = nextDay ? app.indexOf(`  ${nextDay}: {`, start) : app.indexOf("\n};", start);
  assert.ok(start >= 0 && end > start, `${day} routine block must exist`);
  return app.slice(start, end);
}

test("direct ab work follows the Monday Wednesday Friday plan", () => {
  const expected = { MON: 7, TUE: 0, WED: 6, THU: 0, FRI: 4, SAT: 0 };
  const days = Object.keys(expected);
  let total = 0;

  days.forEach((day, index) => {
    const block = dayBlock(day, days[index + 1]);
    const coreExercises = [...block.matchAll(/name: "복근:[\s\S]*?sets: \[([^\]]+)\]/g)];
    const setCount = coreExercises.reduce((sum, match) => sum + (match[1].match(/"/g)?.length || 0) / 2, 0);
    assert.equal(setCount, expected[day], `${day} core set count`);
    total += setCount;
  });

  assert.equal(total, 17);
});

test("release copy is honest about the rule-based generator", () => {
  assert.match(html, /규칙 기반 맞춤 코치/);
  assert.doesNotMatch(html, /건강 참고용 AI 코치/);
  assert.match(app, /injuryAreas/);
  assert.match(app, /알레르기 안전 확인 필요/);
});

test("custom plans survive plan version upgrades", () => {
  assert.match(app, /if \(isPlainObject\(parsed\.customPlans\)\)/);
  assert.doesNotMatch(app, /!shouldRefreshRoutine && isPlainObject\(parsed\.customPlans\)/);
  assert.match(app, /ROUTINE_EXERCISE_UPGRADES/);
  assert.match(app, /"pec-deck-machine": "smith-incline-press"/);
  assert.match(app, /"chest-supported-row": "seated-row"/);
  assert.match(app, /"single-arm-cable-curl": "machine-biceps-curl"/);
});

test("upper-body upgrades and requested three-day ab routine are in the plan", () => {
  const mon = dayBlock("MON", "TUE");
  const wed = dayBlock("WED", "THU");
  const fri = dayBlock("FRI", "SAT");

  assert.match(wed, /스미스 인클라인 프레스/);
  assert.match(wed, /밴드 외회전/);
  assert.match(fri, /머신 바이셉 컬/);
  assert.doesNotMatch(fri, /원암 케이블 컬|케이블 해머 컬/);
  assert.match(mon, /복근: 케이블 크런치[\s\S]*?10-15회/);
  assert.match(mon, /복근: 행잉 니레이즈[\s\S]*?10-15회/);
  assert.match(mon, /복근: 플랭크[\s\S]*?45-60초/);
  assert.match(wed, /복근: 케이블 크런치[\s\S]*?10-12회/);
  assert.match(wed, /복근: 리버스 크런치[\s\S]*?12-15회/);
  assert.match(wed, /복근: Pallof press[\s\S]*?12회\/쪽/);
  assert.match(fri, /복근: Ab wheel 무릎 롤아웃[\s\S]*?6-12회/);
  assert.doesNotMatch(fri, /복근: 행잉 니레이즈/);
  assert.match(html, /월 7·수 6·금 4세트, 주 17세트/);
  assert.match(html, /믹스커피는 중단/);
  assert.match(html, /밥은 반 공기로 고정/);
});

test("coach feedback routine upgrades are applied without duplicating face pull", () => {
  const mon = dayBlock("MON", "TUE");
  const tue = dayBlock("TUE", "WED");
  const wed = dayBlock("WED", "THU");
  const thu = dayBlock("THU", "FRI");
  const fri = dayBlock("FRI", "SAT");
  const sat = dayBlock("SAT");
  const routine = app.slice(app.indexOf("const ROUTINE_PLAN"), app.indexOf("\nconst ui"));

  const monOrder = [
    "squat-machine",
    "leg-press",
    "bulgarian-split-squat",
    "hip-abduction",
    "leg-extension",
    "standing-calf-raise",
    "cable-crunch-mon",
    "hanging-knee-raise-mon",
    "plank-mon"
  ];
  monOrder.reduce((previousIndex, id) => {
    const index = mon.indexOf(`id: "${id}"`);
    assert.ok(index > previousIndex, `${id} must stay in the recommended Monday order`);
    return index;
  }, -1);

  assert.match(tue, /id: "straight-arm-pulldown"/);
  assert.ok(tue.indexOf('id: "straight-arm-pulldown"') < tue.indexOf('id: "lat-pulldown"'));
  assert.match(tue, /id: "seated-row"/);
  assert.doesNotMatch(tue, /id: "chest-supported-row"|id: "vertical-row"/);

  assert.match(wed, /id: "rear-delt-fly"/);
  assert.match(thu, /id: "romanian-deadlift"/);
  assert.ok(thu.indexOf('id: "hip-thrust"') < thu.indexOf('id: "romanian-deadlift"'));
  assert.doesNotMatch(thu, /id: "high-foot-leg-press"/);

  assert.match(sat, /id: "farmers-walk"/);
  assert.match(sat, /300m 7km\/h \+ 200m 5km\/h를 6회/);

  assert.match(fri, /id: "face-pull"/);
  assert.equal((routine.match(/id: "face-pull"/g) || []).length, 1);
});

test("calves stay at two weekly sessions with four sets each", () => {
  const mon = dayBlock("MON", "TUE");
  const thu = dayBlock("THU", "FRI");
  const sat = dayBlock("SAT");

  assert.match(mon, /id: "standing-calf-raise"[\s\S]*?sets: \["12-15회", "12-15회", "12-15회", "12-15회"\]/);
  assert.match(thu, /id: "seated-calf-raise"[\s\S]*?sets: \["15-20회", "15-20회", "15-20회", "15-20회"\]/);
  assert.doesNotMatch(sat, /calf|카프/i);
});

test("mobile workflow and data recovery controls are present", () => {
  assert.match(html, /id="currentWorkoutPanel"/);
  assert.match(html, /id="quickExerciseSelect"/);
  assert.match(html, /<details class="routine-editor">/);
  assert.match(html, /id="exportDataBtn"/);
  assert.match(html, /id="importDataBtn"/);
});

test("workout order can change without losing saved loads", () => {
  assert.match(app, /target\.closest\("\[data-jump-exercise\]"\)/);
  assert.match(app, /function activateExercise\(exerciseId\)/);
  assert.match(app, /세트 중량과 횟수를 이 기기에 저장했어요/);
  assert.match(app, /window\.localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\)/);
});

test("production security headers are configured", () => {
  const headers = vercel.headers.flatMap((entry) => entry.headers);
  const names = new Set(headers.map((header) => header.key));
  assert.ok(names.has("Content-Security-Policy"));
  assert.ok(names.has("X-Content-Type-Options"));
  assert.ok(names.has("Referrer-Policy"));
  assert.ok(names.has("Permissions-Policy"));
});
