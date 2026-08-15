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

test("all seven days include a sustainable fat-loss activity plan", () => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  days.forEach((day, index) => {
    const block = dayBlock(day, days[index + 1]);
    assert.match(block, /cardioMain:/, `${day} cardio title`);
    assert.match(block, /cardioTime:/, `${day} cardio duration`);
    assert.match(block, /cardioPlan:/, `${day} cardio guidance`);
  });

  assert.match(app, /하루 총 8,000-10,000보/);
  assert.match(dayBlock("SUN"), /편안한 산책 또는 완전 휴식/);
  assert.match(app, /if \(day === 6\) \{[\s\S]*?return "SAT";[\s\S]*?return "SUN";/);
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
  assert.match(app, /const ROUTINE_EXERCISE_UPGRADES = \{\};/);
  assert.equal(app.match(/const ROUTINE_EXERCISE_UPGRADES = ([^;]+);/)?.[1], "{}");
});

test("reported working weights and double-progression ranges are in the plan", () => {
  const mon = dayBlock("MON", "TUE");
  const wed = dayBlock("WED", "THU");
  const fri = dayBlock("FRI", "SAT");
  const tue = dayBlock("TUE", "WED");

  assert.match(mon, /숄더 프레스 · 40kg 시험[\s\S]*?8-12회/);
  assert.match(wed, /랫풀다운 · 55kg 시험[\s\S]*?8-12회/);
  assert.match(tue, /레그프레스 · 90-95kg 시험[\s\S]*?8-12회/);
  assert.match(tue, /힙 어브덕션 · 60kg[\s\S]*?12-20회/);
  assert.match(tue, /힙 어덕션 · 30kg[\s\S]*?10-15회/);
  assert.match(fri, /숄더 프레스 · 40kg 기준/);
  assert.match(html, /12\/12\/12와 RIR 1-2/);
  assert.match(html, /단백질 하루 120-140g/);
});

test("weekly split matches the updated hypertrophy and recovery plan", () => {
  const mon = dayBlock("MON", "TUE");
  const tue = dayBlock("TUE", "WED");
  const wed = dayBlock("WED", "THU");
  const thu = dayBlock("THU", "FRI");
  const fri = dayBlock("FRI", "SAT");
  const sat = dayBlock("SAT", "SUN");

  const monOrder = [
    "smith-incline-press",
    "chest-press",
    "pec-deck-machine",
    "shoulder-press",
    "lateral-raise",
    "triceps-pushdown"
  ];
  monOrder.reduce((previousIndex, id) => {
    const index = mon.indexOf(`id: "${id}"`);
    assert.ok(index > previousIndex, `${id} must stay in the recommended Monday order`);
    return index;
  }, -1);

  assert.match(tue, /id: "leg-press"/);
  assert.match(wed, /id: "lat-pulldown"/);
  assert.match(wed, /id: "seated-row"/);
  assert.match(thu, /id: "romanian-deadlift"/);
  assert.match(fri, /어깨 · 팔 · 상부가슴/);
  assert.match(sat, /HYROX 또는 3km 인터벌 중 하나/);
  assert.doesNotMatch(sat, /레그프레스 \(가벼운 펌핑\)|파머스 워크/);
});

test("pull-up and dip supersets use assisted ten-rep rounds twice weekly", () => {
  const wed = dayBlock("WED", "THU");
  const sat = dayBlock("SAT", "SUN");

  assert.match(wed, /id: "pullup-dip-superset-wed"/);
  assert.equal((wed.match(/턱걸이 10회 → 딥스 10회/g) || []).length >= 3, true);
  assert.match(wed, /총 3라운드/);
  assert.match(wed, /restSec: 120/);
  assert.match(sat, /id: "pullup-dip-superset-sat"/);
  assert.equal((sat.match(/턱걸이 10회 → 딥스 10회/g) || []).length >= 2, true);
  assert.match(sat, /총 2라운드/);
  assert.match(app, /맨몸 10회가 안 되면 어시스트/);
  assert.match(html, /턱걸이 10 · 딥스 10/);
});

test("strong cardio is limited while daily recovery activity remains", () => {
  const tue = dayBlock("TUE", "WED");
  const thu = dayBlock("THU", "FRI");
  const sat = dayBlock("SAT", "SUN");
  const sun = dayBlock("SUN");

  assert.match(tue, /회복성 평지 걷기/);
  assert.match(thu, /회복성 평지 걷기/);
  assert.match(sat, /HYROX를 했다면 인터벌은 생략/);
  assert.match(sun, /회복 강도/);
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
