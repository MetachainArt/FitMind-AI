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

test("core routine stays at 15 direct sets without cable crunch", () => {
  const expected = { MON: 3, TUE: 3, WED: 2, THU: 3, FRI: 2, SAT: 2 };
  const days = Object.keys(expected);
  let total = 0;

  days.forEach((day, index) => {
    const block = dayBlock(day, days[index + 1]);
    assert.equal(block.includes("케이블 크런치"), false);
    const coreExercises = [...block.matchAll(/name: "복근:[\s\S]*?sets: \[([^\]]+)\]/g)];
    const setCount = coreExercises.reduce((sum, match) => sum + (match[1].match(/"/g)?.length || 0) / 2, 0);
    assert.equal(setCount, expected[day], `${day} core set count`);
    total += setCount;
  });

  assert.equal(total, 15);
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
  assert.match(app, /"cable-hammer-curl": "single-arm-cable-curl"/);
});

test("upper-body upgrades and conservative ab-slide volume are in the routine", () => {
  const mon = dayBlock("MON", "TUE");
  const wed = dayBlock("WED", "THU");
  const fri = dayBlock("FRI", "SAT");

  assert.match(wed, /스미스 인클라인 프레스/);
  assert.match(wed, /밴드 외회전/);
  assert.match(fri, /원암 케이블 컬/);
  assert.doesNotMatch(fri, /케이블 해머 컬/);
  assert.match(mon, /AB 슬라이드 입문/);
  assert.match(fri, /AB 슬라이드 입문/);
  assert.doesNotMatch(`${mon}\n${fri}`, /sets: \[[^\]]*100회/);
  assert.match(html, /매일 100회보다/);
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
