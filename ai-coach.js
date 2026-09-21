/* Pure data preparation: these helpers never send data or alter saved state. */
const FitMindAdaptation = (() => {
  const metricKeys = ["weightKg", "muscleKg", "bodyFatPercent", "visceralFatLevel", "waistCm"];
  const dateMs = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const valueMs = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(valueMs) && new Date(valueMs).toISOString().slice(0, 10) === value ? valueMs : null;
  };
  const text = (value, limit) => typeof value === "string" ? value.slice(0, limit) : "";
  function cleanInbody(record) {
    return Object.fromEntries([["date", record.date], ...metricKeys.map((key) => [key, Number.isFinite(record[key]) ? record[key] : null]), ["memo", text(record.memo, 1000)]]);
  }
  function compareInbody(records) {
    const sorted = records.filter((record) => dateMs(record.date) !== null).slice().sort((a, b) => a.date.localeCompare(b.date));
    const dateCounts = new Map();
    for (const record of sorted) dateCounts.set(record.date, (dateCounts.get(record.date) || 0) + 1);
    return metricKeys.map((key) => {
      const known = sorted.filter((record) => dateCounts.get(record.date) === 1 && Number.isFinite(record[key]));
      if (known.length < 2) return { key, comparable: false };
      const first = known[0], last = known.at(-1);
      const days = (dateMs(last.date) - dateMs(first.date)) / 86400000;
      if (days <= 0) return { key, comparable: false };
      return { key, comparable: true, fromDate: first.date, toDate: last.date, days, from: first[key], to: last[key], change: Math.round((last[key] - first[key]) * 100) / 100 };
    });
  }
  function basePlan(plan) {
    if (!plan || !Array.isArray(plan.schedule) || !plan.schedule.length) return null;
    const profileKeys = ["goals", "days", "timeMin", "heightCm", "weightKg", "age", "sex", "experience", "place", "equipment", "injury", "injuryAreas", "dietPreference", "allergies"];
    return { id: text(plan.originPlanId || plan.id, 200), title: text(plan.title, 120), explanation: text(plan.explanation, 4000),
      ...(plan.profile && typeof plan.profile === "object" ? { profile: Object.fromEntries(profileKeys.filter((key) => Object.hasOwn(plan.profile, key)).map((key) => [key, Array.isArray(plan.profile[key]) ? [...plan.profile[key]] : plan.profile[key]])) } : {}),
      inputSnapshot: { goalDetails: text(plan.inputSnapshot?.goalDetails, 2000) },
      schedule: plan.schedule.map((day) => ({ day: day.day, part: text(day.part, 100), cardio: text(day.cardio, 300), exercises: (day.exercises || []).map(({ name, sets, reps, restSec }) => ({ name, sets, reps, restSec })) })),
      ...(plan.meal ? { meal: { name: text(plan.meal.name, 120), items: (plan.meal.items || []).map((item) => text(item, 500)).slice(0, 12), proteinNote: text(plan.meal.proteinNote, 1000), note: text(plan.meal.note, 1000) } } : {}) };
  }
  function performance(saved, periodDays, toDate) {
    const end = dateMs(toDate);
    if (end === null || ![7, 28].includes(periodDays)) throw new Error("기록 기간을 확인해 주세요.");
    const fromDate = new Date(end - (periodDays - 1) * 86400000).toISOString().slice(0, 10);
    const within = (date) => dateMs(date) !== null && date >= fromDate && date <= toDate;
    const summaries = new Map();
    for (const summary of saved.history || []) {
      if (!within(summary.date)) continue;
      const key = summary.sessionKey || `${summary.date}_${summary.dayCode || ""}`;
      if (!summaries.has(key)) summaries.set(key, { summary, session: saved.sessions?.[key] });
    }
    for (const [key, session] of Object.entries(saved.sessions || {})) {
      const date = key.slice(0, 10);
      if (!within(date) || summaries.has(key)) continue;
      const actualCount = Object.values(session.actualSetsByExercise || {}).reduce((count, rows) => count + (Array.isArray(rows) ? rows.filter((row) => row && (row.load || row.reps || Number.isFinite(row.rir))).length : 0), 0);
      const rawDoneSets = Object.values(session.setDoneByExercise || {}).reduce((sum, count) => sum + (Number.isFinite(count) && count > 0 ? count : 0), 0);
      const elapsed = Number.isFinite(session.workoutElapsedSec) ? session.workoutElapsedSec : null;
      const exercises = Array.isArray(session.planSnapshot?.exercises) ? session.planSnapshot.exercises : null;
      const setsFor = (exercise) => Array.isArray(exercise.sets) ? exercise.sets.length : 0;
      const doneFor = (exercise) => Number.isFinite(session.setDoneByExercise?.[exercise.id]) ? Math.max(0, session.setDoneByExercise[exercise.id]) : 0;
      // Today-only replacements retain old marks and measurements for history.
      // Progress must use only the current snapshot's IDs and planned set bounds.
      const doneSets = exercises ? exercises.reduce((sum, exercise) => sum + Math.min(doneFor(exercise), setsFor(exercise)), 0) : rawDoneSets || null;
      const total = exercises ? exercises.reduce((sum, exercise) => sum + setsFor(exercise), 0) : null;
      const completedExercises = exercises?.filter((exercise) => Boolean(session.completedExerciseMap?.[exercise.id]) || doneFor(exercise) >= setsFor(exercise)).length;
      const completionRate = exercises ? (exercises.length ? Math.round(completedExercises / exercises.length * 100) : 0) : null;
      if (actualCount || rawDoneSets > 0 || elapsed > 0) summaries.set(key, { summary: { date, dayCode: session.dayCode, setDone: doneSets, setTotal: total,
        completionRate, workoutElapsedSec: elapsed }, session });
    }
    let remaining = 80;
    const entries = [...summaries.entries()].sort(([a], [b]) => b.localeCompare(a));
    const records = entries.slice(0, 56).map(([key, { summary, session }]) => {
      const actual = [];
      for (const [exerciseId, rows] of Object.entries(session?.actualSetsByExercise || {})) {
        if (!Array.isArray(rows)) continue;
        rows.forEach((row, index) => {
          if (!row || !(row.load || row.reps || Number.isFinite(row.rir))) return;
          actual.push({ exerciseId: text(exerciseId, 100), name: text(session.exerciseNamesById?.[exerciseId], 80), setIndex: index + 1,
            load: text(row.load, 30), reps: text(row.reps, 30), rir: Number.isFinite(row.rir) ? row.rir : null, recordedAt: text(row.recordedAt, 40) });
        });
      }
      const actualSets = actual.slice(-remaining);
      if (!remaining) actualSets.length = 0;
      remaining -= actualSets.length;
      const metric = (key) => Number.isFinite(summary[key]) ? summary[key] : null;
      return { date: summary.date, dayCode: text(summary.dayCode || session?.dayCode, 10), sourcePlanId: text(session?.sourcePlanId, 200),
        completionRate: metric("completionRate"), setDone: metric("setDone"), setTotal: metric("setTotal"), workoutElapsedSec: metric("workoutElapsedSec"),
        actualSetCount: actual.length, actualSets };
    });
    const recordedDays = new Set(records.map((record) => record.date)).size;
    return { periodDays, fromDate, toDate, records, recordedDays, unrecordedDays: periodDays - recordedDays,
      omittedSessions: Math.max(0, entries.length - records.length), omittedActualSets: records.reduce((count, record) => count + record.actualSetCount - record.actualSets.length, 0) };
  }
  return { cleanInbody, compareInbody, basePlan, performance };
})();

/* UI wiring: Codex OAuth recommendations reuse local plan and backup storage. */
(() => {
  "use strict";
  const el = (id) => document.getElementById(id);
  const controls = {
    status: el("aiConnectionStatus"), connect: el("aiConnectBtn"), login: el("aiLoginBtn"),
    refresh: el("aiRefreshBtn"), loginLink: el("aiLoginLink"), model: el("aiModelSelect"),
    goals: el("aiGoalDetails"), inbody: el("aiInbodySelect"), inbodySummary: el("aiInbodySummary"),
    useWeight: el("aiUseWeightBtn"), recommend: el("aiRecommendBtn"), cancel: el("aiCancelBtn"),
    message: el("aiRequestStatus"), metadata: el("aiResultMeta"), reasoning: el("aiReasoningSelect")
  };
  if (!controls.recommend) return;

  function addControl(tag, id, label, parent) {
    const node = document.createElement(tag);
    node.id = id;
    if (label) node.textContent = label;
    parent.appendChild(node);
    return node;
  }
  const panel = controls.recommend.closest("section");
  const compareBox = document.createElement("fieldset");
  compareBox.className = "editor-fieldset";
  addControl("legend", "aiCompareTitle", "인바디 비교 · 최대 6개", compareBox);
  addControl("p", "aiCompareHelp", "기준 기록은 위 체중 선택을 유지합니다. 비교할 기록을 추가로 선택하면 선택한 수치·메모만 전송합니다. 기록 1개도 사용할 수 있지만 변화량을 추정하지 않습니다.", compareBox).className = "muted";
  controls.compareRecords = addControl("div", "aiCompareRecords", "", compareBox);
  controls.comparePreview = addControl("div", "aiInbodyCompare", "", compareBox);
  controls.inbodySummary.parentNode.insertBefore(compareBox, controls.inbodySummary.nextSibling);
  const adaptBox = document.createElement("fieldset");
  adaptBox.className = "editor-fieldset";
  addControl("legend", "aiAdaptTitle", "실제 수행 기록으로 계획 조정", adaptBox);
  const periodLabel = addControl("label", "aiAdaptPeriodLabel", "검토 기간", adaptBox);
  periodLabel.htmlFor = "aiAdaptPeriod";
  controls.period = addControl("select", "aiAdaptPeriod", "", adaptBox);
  controls.period.className = "editor-input";
  controls.period.add(new Option("최근 7일", "7")); controls.period.add(new Option("최근 28일", "28"));
  const difficultyLabel = addControl("label", "aiAdaptDifficultyLabel", "어려웠던 점·다음 계획에 바라는 점", adaptBox);
  difficultyLabel.htmlFor = "aiAdaptDifficulty";
  controls.difficulty = addControl("textarea", "aiAdaptDifficulty", "", adaptBox);
  controls.difficulty.className = "editor-input generator-textarea"; controls.difficulty.maxLength = 1000;
  controls.difficulty.placeholder = "예: 지난주엔 40분 이상 운동하기 어려웠어요. 무릎이 불편한 운동을 바꾸고 싶어요.";
  controls.adaptPreview = addControl("div", "aiAdaptPreview", "", adaptBox);
  controls.adapt = addControl("button", "aiAdaptBtn", "열린 계획을 수행 기록으로 조정", adaptBox);
  controls.adapt.type = "button"; controls.adapt.className = "btn secondary";
  panel.insertBefore(adaptBox, controls.message);
  controls.changes = document.createElement("p"); controls.changes.id = "aiChangeReasons"; controls.changes.className = "muted";
  controls.metadata.parentNode.insertBefore(controls.changes, controls.metadata.nextSibling);
  if (controls.inbody.previousElementSibling?.tagName === "LABEL") controls.inbody.previousElementSibling.textContent = "체중 입력 기준 인바디 기록";
  let selectedInbodyIds = Array.isArray(state.aiCoachPreferences?.inbodyIds) ? new Set(state.aiCoachPreferences.inbodyIds.slice(0, 6)) : null;

  let ready = false;
  let serverBusy = false;
  let checking = false;
  let activeRequest = null;
  let elapsedTimer = null;
  let loginPoll = null;
  let loginPollDeadline = 0;
  let knownModels = [];
  let modelEfforts = new Map();
  const effortLabels = { none: "없음", minimal: "최소", low: "낮음", medium: "보통", high: "높음", xhigh: "매우 높음", max: "최대", ultra: "최상" };
  const effortLabel = (value) => effortLabels[value] ? `${effortLabels[value]} (${value})` : "미기록";
  let inbodySignature = "";
  let previousState = state;

  function preferences() {
    return state.aiCoachPreferences || { model: "", reasoningEffort: "low", goalDetails: "", inbodyId: "" };
  }

  function remember() {
    state.aiCoachPreferences = {
      model: controls.model.value,
      reasoningEffort: controls.reasoning.value,
      goalDetails: controls.goals.value.trim().slice(0, 2000),
      inbodyId: controls.inbody.value,
      ...(selectedInbodyIds === null ? {} : { inbodyIds: [...selectedInbodyIds].slice(0, 6) }),
      adaptationDays: Number(controls.period.value) === 28 ? 28 : 7,
      adaptationDifficulty: controls.difficulty.value.trim().slice(0, 1000)
    };
    if (!persistState()) controls.message.textContent = "선택한 설정을 이 기기에 저장하지 못했어요. 저장공간을 확인해 주세요.";
  }

  function updateButtons() {
    const pending = Boolean(activeRequest);
    controls.recommend.disabled = !ready || serverBusy || pending || !hasValidEffort();
    controls.adapt.disabled = controls.recommend.disabled || !FitMindAdaptation.basePlan(state.generatedPlanDraft);
    controls.period.disabled = pending;
    controls.difficulty.disabled = pending;
    controls.model.disabled = !ready || pending || knownModels.length === 0;
    controls.reasoning.disabled = !ready || pending || !controls.model.value;
    controls.connect.disabled = checking || pending;
    controls.login.disabled = checking || pending;
    controls.refresh.disabled = checking;
    controls.cancel.hidden = !pending;
    controls.recommend.closest("section").setAttribute("aria-busy", String(pending));
    if (pending) {
      el("generatePlanBtn").disabled = true;
      el("saveGeneratedPlanBtn").disabled = true;
    } else {
      el("generatePlanBtn").disabled = false;
      el("saveGeneratedPlanBtn").disabled = false;
    }
  }

  async function requestApi(path, body, signal) {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", "X-FitMind-Request": "1" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      const error = new Error(data?.error?.message || "AI 연결 서버에 응답할 수 없습니다. 로컬 앱을 실행한 뒤 다시 확인해 주세요.");
      error.code = data?.error?.code;
      throw error;
    }
    return data;
  }

  function showModels(models) {
    const wanted = controls.model.value || preferences().model;
    modelEfforts = new Map((Array.isArray(models) ? models : []).map((item) => [
      typeof item === "string" ? item : item?.id,
      Array.isArray(item?.reasoningEfforts) ? item.reasoningEfforts.filter((effort) => Object.hasOwn(effortLabels, effort)) : ["low"]
    ]));
    knownModels = (Array.isArray(models) ? models : [])
      .map((item) => typeof item === "string" ? item : item?.id)
      .filter((id) => typeof id === "string" && /^gpt-/i.test(id));
    controls.model.replaceChildren(new Option(knownModels.length ? "사용할 GPT 모델을 선택하세요" : "사용 가능한 GPT 모델이 없습니다", ""));
    for (const id of knownModels) controls.model.add(new Option(id, id));
    if (knownModels.includes(wanted)) controls.model.value = wanted;
    if (wanted && !knownModels.includes(wanted)) {
      controls.message.textContent = "이전에 선택한 모델이 현재 목록에 없습니다. 다른 모델을 직접 선택해 주세요.";
    }
    showReasoning();
  }

  function hasValidEffort() {
    return knownModels.includes(controls.model.value) && (modelEfforts.get(controls.model.value) || []).includes(controls.reasoning.value);
  }

  function showReasoning() {
    const wanted = controls.reasoning.value || (preferences().reasoningEffort ?? "low");
    const efforts = modelEfforts.get(controls.model.value) || [];
    controls.reasoning.replaceChildren(new Option(efforts.length ? "추론 강도를 선택하세요" : "모델 선택 후 추론 강도를 선택하세요", ""));
    for (const effort of efforts) controls.reasoning.add(new Option(effortLabel(effort), effort));
    if (controls.model.value && !efforts.length) controls.message.textContent = "이 모델의 지원 추론 강도를 확인할 수 없습니다. 연결 새로고침 또는 다른 모델 선택을 해주세요.";
    if (efforts.includes(wanted)) controls.reasoning.value = wanted;
    else if (efforts.length) controls.message.textContent = "선택한 모델에서 이전 추론 강도를 지원하지 않습니다. 사용할 강도를 직접 선택해 주세요.";
  }

  async function refreshConnection(action = "status") {
    if (checking) return;
    if (location.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(location.hostname)) {
      ready = false;
      controls.status.textContent = "GPT 추천은 이 PC에서 npm start로 실행한 로컬 앱에서 사용할 수 있습니다. 기존 운동 기록 기능은 계속 사용할 수 있어요.";
      controls.connect.disabled = true;
      controls.login.disabled = true;
      controls.refresh.disabled = true;
      return;
    }
    checking = true;
    controls.status.textContent = action === "login" ? "Codex 로그인을 시작하고 있습니다." : "Codex 연결과 모델 목록을 확인하고 있습니다.";
    updateButtons();
    try {
      const result = await requestApi(`/api/ai/${action}`, action === "status" ? undefined : {}, AbortSignal.timeout(45000));
      ready = result.status === "ready";
      serverBusy = Boolean(result.busy);
      controls.status.textContent = result.message || (ready ? "Codex OAuth 연결됨 · 계정의 모델 목록을 불러왔습니다." : "Codex 연결을 완료한 뒤 다시 확인해 주세요.");
      if (serverBusy) controls.status.textContent += " 이전 추천 요청이 처리 중입니다.";
      if (ready) {
        showModels(result.models);
        controls.loginLink.hidden = true;
        clearInterval(loginPoll);
        loginPoll = null;
      } else {
        knownModels = [];
        controls.model.replaceChildren(new Option("Codex 연결 후 모델을 선택하세요", ""));
      }
      if (result.loginUrl) {
        const url = new URL(result.loginUrl);
        if (url.protocol === "https:" && ["auth.openai.com", "auth0.openai.com"].includes(url.hostname)) {
          controls.loginLink.href = url.href;
          controls.loginLink.hidden = false;
        }
      }
      if (result.status === "login_pending" && !loginPoll) {
        loginPollDeadline = Date.now() + 5 * 60 * 1000;
        loginPoll = setInterval(() => {
          if (Date.now() > loginPollDeadline) {
            clearInterval(loginPoll);
            loginPoll = null;
          } else refreshConnection();
        }, 10000);
      }
    } catch (error) {
      ready = false;
      controls.status.textContent = error.name === "TimeoutError"
        ? "Codex 연결 확인 시간이 초과됐습니다. 연결 상태를 확인한 뒤 새로고침해 주세요."
        : error.message;
    } finally {
      checking = false;
      updateButtons();
    }
  }

  function chosenRecord() {
    return getSortedInbodyRecords().find((record) => record.id === controls.inbody.value) || null;
  }

  function selectedRecords() {
    const records = getSortedInbodyRecords();
    if (selectedInbodyIds === null) {
      const record = chosenRecord();
      return record ? [record] : [];
    }
    return records.filter((record) => selectedInbodyIds.has(record.id)).slice(0, 6).sort((a, b) => a.date.localeCompare(b.date));
  }

  function addPreview(parent, title, data) {
    const details = document.createElement("details");
    const summary = document.createElement("summary"); summary.textContent = title;
    const pre = document.createElement("pre"); pre.textContent = JSON.stringify(data, null, 2); pre.style.whiteSpace = "pre-wrap"; pre.style.overflowWrap = "anywhere";
    details.appendChild(summary); details.appendChild(pre); parent.appendChild(details);
  }

  function renderComparison() {
    const records = getSortedInbodyRecords();
    const selected = selectedRecords();
    const ids = new Set(selected.map((record) => record.id));
    controls.compareRecords.replaceChildren();
    for (const record of records) {
      const label = document.createElement("label");
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = ids.has(record.id);
      checkbox.setAttribute("aria-label", `${record.date} 인바디 비교에 포함`);
      checkbox.addEventListener("change", () => {
        const next = new Set(selectedRecords().map((item) => item.id));
        checkbox.checked ? next.add(record.id) : next.delete(record.id);
        if (next.size > 6) { checkbox.checked = false; controls.message.textContent = "인바디 비교는 최대 6개까지 선택해 주세요."; return; }
        selectedInbodyIds = next; remember(); renderComparison();
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${record.date}${Number.isFinite(record.weightKg) ? ` · ${record.weightKg}kg` : " · 체중 미입력"} `));
      controls.compareRecords.appendChild(label);
    }
    controls.comparePreview.replaceChildren();
    const info = document.createElement("p"); info.className = "muted";
    info.textContent = selected.length ? `AI 전송 대상 ${selected.length}개 · 사진 제외. 비교 목록이 전송 범위를 결정하며 위 선택은 체중 입력 기준으로 사용할 수 있습니다.` : "선택한 인바디가 없어 목표와 운동 조건만 전송합니다.";
    controls.comparePreview.appendChild(info);
    if (new Set(selected.map((record) => record.date)).size < selected.length) {
      const duplicate = document.createElement("p"); duplicate.textContent = "같은 날짜에 여러 측정이 있어 해당 날짜는 변화량 비교에서 제외했습니다. 비교할 측정을 하나만 선택해 주세요.";
      controls.comparePreview.appendChild(duplicate);
    }
    const labels = { weightKg: ["체중", "kg"], muscleKg: ["골격근량", "kg"], bodyFatPercent: ["체지방률", "%p"], visceralFatLevel: ["내장지방", "레벨"], waistCm: ["허리둘레", "cm"] };
    for (const metric of FitMindAdaptation.compareInbody(selected)) {
      if (!selected.length) break;
      const line = document.createElement("p"); const [name, unit] = labels[metric.key];
      line.textContent = metric.comparable
        ? `${name}: ${metric.fromDate} → ${metric.toDate} (${metric.days}일) · ${metric.from} → ${metric.to} · ${metric.change > 0 ? "+" : ""}${metric.change}${unit}`
        : `${name}: 서로 다른 날짜의 입력 수치가 2개 이상 있어야 비교할 수 있습니다.`;
      controls.comparePreview.appendChild(line);
    }
    if (selected.length) addPreview(controls.comparePreview, "전송할 인바디 수치·메모 확인", selected.map(FitMindAdaptation.cleanInbody));
  }

  function adaptationInput() {
    const basePlan = FitMindAdaptation.basePlan(state.generatedPlanDraft);
    const result = FitMindAdaptation.performance(state, Number(controls.period.value) === 28 ? 28 : 7, getTodayDateString());
    const { periodDays, fromDate, toDate, ...performance } = result;
    return { periodDays, fromDate, toDate, difficulty: controls.difficulty.value.trim().slice(0, 1000), basePlan, performance };
  }

  function renderAdaptationPreview() {
    const input = adaptationInput();
    const currentProfile = readGeneratorProfile();
    controls.adaptPreview.replaceChildren();
    const caption = document.createElement("p"); caption.className = "muted";
    const actualCount = input.performance.records.reduce((sum, record) => sum + record.actualSetCount, 0);
    caption.textContent = input.basePlan
      ? `조정 기준: 현재 열어둔 ‘${input.basePlan.title}’ · ${input.fromDate}~${input.toDate} · 기록이 있는 날 ${input.performance.recordedDays}일, 확인할 수 없는 날 ${input.performance.unrecordedDays}일 · 실제 세트 기록 ${actualCount}개. 기록이 없는 날을 운동 실패로 판단하지 않습니다. 다른 계획은 저장 목록의 보기로 선택하세요.`
      : "조정할 추천 계획을 먼저 생성하거나 저장 목록에서 보기로 열어 주세요. 기존 실행 루틴을 자동으로 변경하지 않습니다.";
    controls.adaptPreview.appendChild(caption);
    const current = document.createElement("p"); current.className = "muted";
    current.textContent = currentProfile.error
      ? `현재 운동 조건을 완성해 주세요: ${currentProfile.error}`
      : `현재 입력한 목표·요일·${currentProfile.value.timeMin}분·장소·장비·주의사항으로 조정합니다. 원본 조건과 달라진 내용도 아래에서 확인하세요.`;
    controls.adaptPreview.appendChild(current);
    if (input.performance.omittedActualSets || input.performance.omittedSessions) {
      const omitted = document.createElement("p"); omitted.textContent = `전송 크기를 위해 최근 수행기록 56개·실제 세트 상세 80개까지 포함합니다. 생략: 수행기록 ${input.performance.omittedSessions}개, 세트 상세 ${input.performance.omittedActualSets}개. 전체 세트 개수는 요약에 포함됩니다.`;
      controls.adaptPreview.appendChild(omitted);
    }
    addPreview(controls.adaptPreview, "조정 요청에 보낼 현재 조건·원본 계획·수행 기록 확인", { currentProfile: currentProfile.value || null, currentGoalDetails: controls.goals.value.trim(), ...input });
  }

  function refreshInbody() {
    const records = getSortedInbodyRecords();
    const signature = JSON.stringify(records.map(({ imageDataUrl, ...record }) => record));
    if (signature !== inbodySignature) {
      const selected = controls.inbody.value || preferences().inbodyId;
      controls.inbody.replaceChildren(new Option("인바디 없이 운동 조건만 사용", ""));
      for (const record of records) {
        const weight = Number.isFinite(record.weightKg) ? ` · ${record.weightKg}kg` : "";
        controls.inbody.add(new Option(`${record.date}${weight}`, record.id));
      }
      if (records.some((record) => record.id === selected)) controls.inbody.value = selected;
      inbodySignature = signature;
    }
    const record = chosenRecord();
    controls.useWeight.disabled = !Number.isFinite(record?.weightKg);
    renderComparison();
    if (!record) {
      controls.inbodySummary.textContent = records.length
        ? "인바디를 선택하지 않았습니다. 위의 목표와 운동 조건만 전송합니다."
        : "인바디 영역에서 수치를 저장한 뒤 이 목록에서 선택해 주세요. 미입력 값은 AI가 추정하지 않습니다.";
      return;
    }
    const metrics = [["체중", record.weightKg, "kg"], ["골격근량", record.muscleKg, "kg"], ["체지방률", record.bodyFatPercent, "%"], ["내장지방", record.visceralFatLevel, "레벨"], ["허리", record.waistCm, "cm"]];
    controls.inbodySummary.textContent = `${record.date} · ${metrics.map(([name, value, unit]) => `${name} ${Number.isFinite(value) ? value + unit : "미입력"}`).join(" · ")}${record.memo ? " · 저장된 메모 포함" : ""}`;
  }

  function updateResultMetadata() {
    const plan = state.generatedPlanDraft;
    const ai = plan?.source === "codex-oauth";
    controls.metadata.hidden = !ai;
    controls.metadata.textContent = ai ? `GPT 추천 · ${plan.model || "모델 미기록"} · 추론 ${effortLabel(plan.reasoningEffort)} · ${plan.createdAt ? new Date(plan.createdAt).toLocaleString("ko-KR") : ""} · 생성 결과 저장으로 보관하고 전체 데이터 백업으로 내보낼 수 있습니다.` : "";
    controls.changes.textContent = ai && Array.isArray(plan.changeReasons) ? `조정 이유: ${plan.changeReasons.join(" / ")}` : "";
    controls.changes.hidden = !controls.changes.textContent;
  }

  async function recommend(mode = "recommend") {
    if (activeRequest || !ready || serverBusy || !hasValidEffort()) return;
    if (!el("generatorForm").reportValidity()) return;
    const profile = readGeneratorProfile();
    if (profile.error) {
      controls.message.textContent = profile.error;
      return;
    }
    remember();
    const adaptation = mode === "adapt" ? adaptationInput() : null;
    if (adaptation && (!adaptation.basePlan || (!adaptation.performance.records.length && !adaptation.difficulty))) {
      controls.message.textContent = adaptation.basePlan ? "조정에 참고할 수행 기록이 없습니다. 어려웠던 점을 입력하거나 운동 기록을 먼저 저장해 주세요." : "조정할 추천 계획을 먼저 열어 주세요.";
      return;
    }
    const body = {
      requestId: crypto.randomUUID(), model: controls.model.value, reasoningEffort: controls.reasoning.value, profile: profile.value,
      inbodyRecords: selectedRecords().map(FitMindAdaptation.cleanInbody), goalDetails: controls.goals.value.trim(),
      ...(adaptation ? { adaptation } : {})
    };
    const requestState = state;
    const previousDraft = state.generatedPlanDraft;
    const controller = new AbortController();
    activeRequest = controller;
    updateButtons();
    const started = Date.now();
    const waitingMessage = () => {
      controls.message.textContent = `${body.model} · 추론 ${effortLabel(body.reasoningEffort)}로 입력 조건을 검토하고 있습니다. ${Math.floor((Date.now() - started) / 1000)}초 경과`;
    };
    waitingMessage();
    elapsedTimer = setInterval(waitingMessage, 1000);
    try {
      const response = await requestApi("/api/ai/recommend", body, AbortSignal.any([controller.signal, AbortSignal.timeout(190000)]));
      if (controller.signal.aborted) return;
      if (adaptation && (!Array.isArray(response.plan?.changeReasons) || !response.plan.changeReasons.length || response.plan.changeReasons.some((reason) => typeof reason !== "string" || !reason.trim()))) throw new Error("계획 변경 이유가 누락되어 조정 결과를 저장하지 않았습니다.");
      const plan = normalizeGeneratedPlan({
        ...response.plan, id: `ai_${body.requestId}`, source: "codex-oauth", model: body.model,
        reasoningEffort: body.reasoningEffort,
        profile: body.profile, inputSnapshot: { goalDetails: body.goalDetails, inbodyRecords: body.inbodyRecords,
          ...(adaptation ? { adaptation, changeReasons: response.plan.changeReasons || [] } : {}) },
        createdAt: new Date().toISOString()
      });
      if (!plan) throw new Error("AI 응답 형식이 올바르지 않아 저장하지 않았습니다. 입력 조건을 확인한 뒤 다시 시도해 주세요.");
      if (state !== requestState || state.generatedPlanDraft !== previousDraft) {
        controls.message.textContent = "기다리는 동안 백업 또는 현재 계획이 변경되어 AI 결과로 덮어쓰지 않았습니다. 필요한 조건으로 다시 요청해 주세요.";
        return;
      }
      state.generatedPlanDraft = plan;
      const saved = persistState();
      renderGeneratorPanel();
      updateResultMetadata();
      controls.message.textContent = saved
        ? "GPT 추천이 완료되어 초안을 이 기기에 보관했습니다. 생성 결과를 확인하고 생성 결과 저장으로 목록에 추가해 주세요."
        : "GPT 추천은 완료됐지만 이 기기에 저장하지 못했습니다. 결과를 확인하고 전체 데이터 백업으로 보관해 주세요.";
    } catch (error) {
      if (controller.signal.aborted) {
        serverBusy = true;
        controls.message.textContent = "응답 대기를 중지했습니다. 연결된 OAuth 서비스의 생성은 계속될 수 있습니다. 연결 새로고침으로 처리 종료를 확인한 뒤 다시 요청해 주세요.";
      } else if (error.name === "TimeoutError") {
        serverBusy = true;
        controls.message.textContent = "추천 대기 시간이 초과됐습니다. 이전 요청이 끝났는지 연결 새로고침으로 확인한 뒤 다시 시도해 주세요.";
      } else {
        controls.message.textContent = error.message;
        if (["AI_BUSY", "AI_TIMEOUT"].includes(error.code)) serverBusy = true;
        if (error.code === "AUTH_REQUIRED") ready = false;
      }
    } finally {
      clearInterval(elapsedTimer);
      elapsedTimer = null;
      activeRequest = null;
      updateButtons();
    }
  }

  controls.goals.value = preferences().goalDetails || "";
  controls.period.value = String(preferences().adaptationDays === 28 ? 28 : 7);
  controls.difficulty.value = preferences().adaptationDifficulty || "";
  controls.connect.addEventListener("click", () => refreshConnection("connect"));
  controls.login.addEventListener("click", () => refreshConnection("login"));
  controls.refresh.addEventListener("click", () => refreshConnection());
  controls.model.addEventListener("change", () => { showReasoning(); remember(); updateButtons(); });
  controls.reasoning.addEventListener("change", () => { remember(); updateButtons(); });
  controls.goals.addEventListener("change", remember);
  controls.inbody.addEventListener("change", () => { remember(); refreshInbody(); });
  controls.useWeight.addEventListener("click", () => {
    const record = chosenRecord();
    if (Number.isFinite(record?.weightKg)) {
      el("fitWeightInput").value = String(record.weightKg);
      controls.message.textContent = "선택한 인바디 체중을 운동 조건에 반영했습니다.";
    }
  });
  controls.period.addEventListener("change", () => { remember(); renderAdaptationPreview(); });
  controls.difficulty.addEventListener("change", () => { remember(); renderAdaptationPreview(); });
  el("generatorForm").addEventListener("input", renderAdaptationPreview);
  controls.recommend.addEventListener("click", () => recommend());
  controls.adapt.addEventListener("click", () => recommend("adapt"));
  controls.cancel.addEventListener("click", () => activeRequest?.abort());
  const observer = new MutationObserver(() => {
    if (state !== previousState) {
      previousState = state;
      controls.goals.value = preferences().goalDetails || "";
      controls.model.value = knownModels.includes(preferences().model) ? preferences().model : "";
      controls.reasoning.value = preferences().reasoningEffort ?? "low";
      showReasoning();
      controls.inbody.value = preferences().inbodyId || "";
      selectedInbodyIds = Array.isArray(preferences().inbodyIds) ? new Set(preferences().inbodyIds.slice(0, 6)) : null;
      controls.period.value = String(preferences().adaptationDays === 28 ? 28 : 7);
      controls.difficulty.value = preferences().adaptationDifficulty || "";
      inbodySignature = "";
    }
    refreshInbody();
    updateResultMetadata();
    renderAdaptationPreview();
    updateButtons();
  });
  observer.observe(el("inbodyHistoryList"), { childList: true });
  observer.observe(el("generatedPlanResult"), { childList: true });
  window.addEventListener("pagehide", () => {
    activeRequest?.abort();
    clearInterval(elapsedTimer);
    clearInterval(loginPoll);
  });
  window.addEventListener("fitmind:state-updated", () => { refreshInbody(); renderAdaptationPreview(); updateResultMetadata(); updateButtons(); });
  refreshInbody();
  renderAdaptationPreview();
  updateResultMetadata();
  refreshConnection();
})();
