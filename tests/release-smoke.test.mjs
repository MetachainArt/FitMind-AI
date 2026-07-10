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
});

test("mobile workflow and data recovery controls are present", () => {
  assert.match(html, /id="currentWorkoutPanel"/);
  assert.match(html, /<details class="routine-editor">/);
  assert.match(html, /id="exportDataBtn"/);
  assert.match(html, /id="importDataBtn"/);
});

test("production security headers are configured", () => {
  const headers = vercel.headers.flatMap((entry) => entry.headers);
  const names = new Set(headers.map((header) => header.key));
  assert.ok(names.has("Content-Security-Policy"));
  assert.ok(names.has("X-Content-Type-Options"));
  assert.ok(names.has("Referrer-Policy"));
  assert.ok(names.has("Permissions-Policy"));
});
