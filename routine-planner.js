"use strict";

// A saved recommendation and an in-progress workout have separate lifetimes.
(function (root) {
  const DAYS = { 월: "MON", 화: "TUE", 수: "WED", 목: "THU", 금: "FRI", 토: "SAT", 일: "SUN" };
  const copy = value => JSON.parse(JSON.stringify(value));
  const html = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function buildRoutine(plan, dayCode, normalize) {
    const days = plan?.schedule?.filter(day => DAYS[day.day] === dayCode) || [];
    if (days.length !== 1) throw new Error("요일이 중복되거나 올바르지 않은 계획은 적용할 수 없습니다.");
    const day = days[0];
    if (!day.exercises.length) throw new Error("운동이 없는 요일은 적용할 수 없습니다.");
    if (day.exercises.length > 30) throw new Error("한 요일에 적용할 운동이 너무 많습니다.");
    const exercises = day.exercises.map((item, index) => {
      if (!item.name?.trim() || !Number.isInteger(item.sets) || item.sets < 1 || item.sets > 100
        || typeof item.reps !== "string" || !item.reps.trim() || !Number.isFinite(item.restSec) || item.restSec < 0 || item.restSec > 600) {
        throw new Error("운동 이름, 세트, 반복 횟수와 휴식 시간을 확인해 주세요.");
      }
      return { id: `recommended-${dayCode}-${index}-${encodeURIComponent(item.name).slice(0, 180)}`,
        name: item.name, sets: Array.from({ length: item.sets }, () => item.reps), restSec: item.restSec };
    });
    const routine = normalize({ dayLabel: `${day.day}요일`, theme: day.part,
      trainingFocus: `${plan.title} · ${day.part}`, warmupMain: "워밍업",
      warmupTime: Number.isFinite(day.warmupSec) ? `${Math.ceil(day.warmupSec / 60)}분` : "계획에 시간 미기재",
      warmupNote: "관절과 몸 상태를 확인하며 준비해 주세요.", cardioMain: day.cardio || "계획에 유산소 미기재",
      cardioTime: Number.isFinite(day.cardioSec) ? `${Math.ceil(day.cardioSec / 60)}분` : "", cardioPlan: day.cardio || "", exercises }, dayCode);
    routine.sourcePlanId = plan.originPlanId || plan.id;
    routine.sourcePlanTitle = plan.title;
    return routine;
  }

  function hasProgress(session) {
    return session.workoutTimerRunning || session.workoutElapsedSec > 0 || session.lastSavedAt
      || Object.values(session.setDoneByExercise || {}).some(count => count > 0)
      || Object.values(session.actualSetsByExercise || {}).some(sets => Array.isArray(sets) && sets.some(set => set?.recordedAt));
  }

  function create(api) {
    const mount = api.mount;
    let preview = null;
    let displayedPlan = "";
    let message = "";
    if (mount) mount.addEventListener("click", event => {
      if (event.target.closest("[data-plan-preview]")) {
        const selected = Array.from(mount.querySelectorAll("[data-apply-day]:checked"), input => input.value);
        prepare(selected);
      } else if (event.target.closest("[data-plan-apply]")) apply();
      else if (event.target.closest("[data-plan-restore]")) restore();
    });
    if (mount) mount.addEventListener("change", event => {
      if (event.target.matches("[data-apply-day]")) {
        preview = null;
        mount.querySelector("[data-plan-diff]").innerHTML = "";
      }
    });

    function prepare(codes) {
      try {
        const state = api.getState(), plan = state.generatedPlanDraft;
        const selected = [...new Set(codes)];
        if (!plan || !selected.length) throw new Error("적용할 요일을 하나 이상 선택해 주세요.");
        const changes = selected.map(code => {
          if (!Object.values(DAYS).includes(code)) throw new Error("지원하지 않는 요일입니다.");
          return { code, before: copy(api.getRoutine(code)), after: buildRoutine(plan, code, api.normalize) };
        });
        preview = { source: JSON.stringify(plan), changes };
        message = "변경 내용을 확인한 뒤 적용해 주세요. 오늘 진행 중인 운동은 유지됩니다.";
      } catch (error) { preview = null; message = error.message; }
      render();
      return Boolean(preview);
    }

    function preserveSessions(state, code, routine) {
      Object.values(state.sessions || {}).forEach(session => {
        if (session.dayCode === code && !session.planSnapshot && hasProgress(session)) {
          session.planSnapshot = copy(routine);
          session.sourcePlanId = routine.sourcePlanId || "";
        }
      });
    }

    function apply() {
      if (!preview) { message = "먼저 변경 내용을 미리 확인해 주세요."; render(); return false; }
      const state = api.getState();
      if (JSON.stringify(state.generatedPlanDraft) !== preview.source
        || preview.changes.some(change => JSON.stringify(api.getRoutine(change.code)) !== JSON.stringify(change.before))) {
        preview = null; message = "계획이나 루틴이 변경됐습니다. 다시 미리보기를 확인해 주세요."; render(); return false;
      }
      const backup = copy({ customPlans: state.customPlans, sessions: state.sessions, history: state.history, routineChange: state.routineChange || null });
      const changes = preview.changes;
      const checkpoint = { appliedAt: new Date().toISOString(), sourcePlanId: state.generatedPlanDraft.originPlanId || state.generatedPlanDraft.id, days: {} };
      for (const change of changes) {
        const { code, before, after } = change;
        checkpoint.days[code] = { before: state.customPlans[code] ? copy(state.customPlans[code]) : null, after: copy(after) };
        preserveSessions(state, code, before);
        state.customPlans[code] = copy(after);
      }
      state.routineChange = checkpoint;
      api.sync();
      if (!api.persist()) {
        Object.assign(state, backup);
        message = "저장하지 못해 적용을 취소했습니다. 기존 루틴과 기록을 유지합니다.";
        render(); return false;
      }
      preview = null;
      message = "선택한 요일에 적용했습니다. 진행 중이거나 오늘만 바꾼 운동은 유지하고 다음 운동부터 새 루틴을 사용합니다.";
      api.render(); api.announce(message); return true;
    }

    function restore() {
      const state = api.getState(), checkpoint = state.routineChange;
      if (!checkpoint?.days || !Object.keys(checkpoint.days).length) return false;
      if (Object.entries(checkpoint.days).some(([code, change]) => JSON.stringify(api.getRoutine(code)) !== JSON.stringify(change.after))) {
        message = "적용 후 직접 편집한 루틴이 있어 자동 복원하지 않았습니다. 루틴 편집에서 내용을 확인해 주세요.";
        render(); return false;
      }
      const backup = copy({ customPlans: state.customPlans, sessions: state.sessions, history: state.history, routineChange: checkpoint });
      for (const [code, change] of Object.entries(checkpoint.days)) {
        preserveSessions(state, code, api.getRoutine(code));
        if (change.before) state.customPlans[code] = copy(change.before);
        else delete state.customPlans[code];
      }
      state.routineChange = null;
      api.sync();
      if (!api.persist()) { Object.assign(state, backup); message = "저장하지 못해 복원을 취소했습니다."; render(); return false; }
      preview = null; message = "적용 전 루틴으로 복원했습니다. 진행 중인 운동 기록은 유지했습니다.";
      api.render(); api.announce(message); return true;
    }

    function render() {
      if (!mount) return;
      const state = api.getState(), plan = state.generatedPlanDraft;
      const signature = JSON.stringify(plan);
      const checked = Array.from(mount.querySelectorAll("[data-apply-day]:checked"), input => input.value);
      if (displayedPlan !== signature) { preview = null; message = ""; displayedPlan = signature; }
      const validDays = (plan?.schedule || []).filter(day => DAYS[day.day] && day.exercises.length);
      const options = validDays.map(day => `<label><input type="checkbox" data-apply-day value="${DAYS[day.day]}" ${checked.includes(DAYS[day.day]) ? "checked" : ""}> ${html(day.day)}요일</label>`).join("");
      const describe = routine => `<p>${html(routine.theme)} · 준비 ${html(routine.warmupTime)}</p><ul>${routine.exercises.map(ex => `<li>${html(ex.name)} · ${ex.sets.length}세트 · ${html(ex.sets.join(" / "))} · 휴식 ${ex.restSec}초</li>`).join("")}</ul><p>${html(routine.cardioMain)} ${html(routine.cardioTime)}</p>`;
      mount.innerHTML = `<h3 class="section-title">추천을 내 루틴에 적용</h3>
        <p class="muted">선택한 요일만 변경합니다. 진행 중인 세션은 그대로 이어갈 수 있습니다. 최근 적용 1회를 되돌릴 수 있습니다.</p>
        ${validDays.length ? `<div class="goal-options">${options}</div><button class="btn secondary" type="button" data-plan-preview>변경 내용 미리보기</button>` : '<p class="muted">먼저 운동이 포함된 맞춤 계획을 생성하거나 저장한 계획을 열어 주세요.</p>'}
        <div data-plan-diff>${preview ? preview.changes.map(change => `<article class="plan-diff"><h4>${Object.entries(DAYS).find(([, code]) => code === change.code)[0]}요일</h4><div class="plan-diff-columns"><div><strong>현재 루틴</strong>${describe(change.before)}</div><div><strong>적용할 루틴</strong>${describe(change.after)}</div></div></article>`).join("") + '<button class="btn primary" type="button" data-plan-apply>확인한 루틴 적용</button>' : ""}</div>
        ${state.routineChange ? '<button class="btn ghost" type="button" data-plan-restore>최근 적용 전 루틴 복원</button>' : ""}
        <p class="muted" role="status">${html(message)}</p>`;
    }
    return { render, prepare, apply, restore };
  }
  root.RoutinePlanner = { create, buildRoutine, hasProgress };
})(typeof window !== "undefined" ? window : globalThis);
