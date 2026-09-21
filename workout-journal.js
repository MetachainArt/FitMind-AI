"use strict";

(function (root) {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const blankSet = () => ({ load: "", reps: "", rir: null, recordedAt: "" });
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const nameKey = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

  function validateSet(raw) {
    const load = String(raw.load ?? "").trim();
    const reps = String(raw.reps ?? "").trim();
    const rawRir = raw.rir === null || raw.rir === undefined ? "" : String(raw.rir).trim();
    const rir = rawRir === "" ? null : Number(rawRir);
    if (!reps) return { error: "실제로 수행한 횟수나 시간을 입력해 주세요. 예: 10회, 30초" };
    if (load.length > 80 || reps.length > 120) return { error: "중량은 80자, 횟수·시간은 120자 이내로 입력해 주세요." };
    if (rir !== null && (!Number.isFinite(rir) || rir < 0 || rir > 10 || !Number.isInteger(rir))) {
      return { error: "남은 여유 횟수(RIR)는 0~10 정수로 입력하거나 비워 주세요." };
    }
    return { value: { load, reps, rir } };
  }

  function normalizeActualSets(raw) {
    if (!object(raw)) return {};
    const result = {};
    Object.entries(raw).slice(0, 200).forEach(([id, rows]) => {
      if (!Array.isArray(rows) || ["__proto__", "constructor", "prototype"].includes(id)) return;
      result[id] = rows.slice(0, 100).map((row) => {
        if (!object(row) || typeof row.recordedAt !== "string" || !row.recordedAt) return blankSet();
        const parsed = validateSet(row);
        if (parsed.error || !Number.isFinite(Date.parse(row.recordedAt))) return blankSet();
        return { ...parsed.value, recordedAt: row.recordedAt };
      });
    });
    return result;
  }

  function getExerciseName(session, id, fallback = "") {
    return session.exerciseNamesById?.[id]
      || session.planSnapshot?.exercises?.find((item) => item.id === id)?.name
      || fallback;
  }

  function previousSets(state, currentSession, exercise) {
    const targetName = nameKey(exercise.name);
    const rows = [];
    Object.entries(state.sessions || {}).forEach(([sessionKey, session]) => {
      if (!object(session) || sessionKey === currentSession.sessionKey) return;
      // Future-dated and later same-day sessions are not a previous workout.
      if (sessionKey.slice(0, 10) > currentSession.sessionKey.slice(0, 10)) return;
      Object.entries(session.actualSetsByExercise || {}).forEach(([id, sets]) => {
        const savedName = getExerciseName(session, id);
        if (!targetName || nameKey(savedName) !== targetName || !Array.isArray(sets)) return;
        sets.forEach((set, index) => {
          if (!object(set) || !set.recordedAt || !set.reps) return;
          rows.push({ ...set, sessionKey, exerciseId: id, exerciseName: savedName, index });
        });
      });
    });
    return rows.sort((a, b) => b.sessionKey.slice(0, 10).localeCompare(a.sessionKey.slice(0, 10))
      || b.recordedAt.localeCompare(a.recordedAt) || a.index - b.index);
  }

  function create(adapter) {
    const mount = adapter.mount;
    let selectedId = "";
    let manualSelection = false;
    let manualIndex = false;
    let editorSessionKey = "";
    let editorExerciseId = "";
    let editorIndex = 0;
    let viewKey = "";
    let lastSessionKey = "";
    let notice = "";
    let historyRows = [];
    const find = (selector) => mount?.querySelector(selector);
    const current = () => adapter.getSession();
    const exercises = () => adapter.getPlan().exercises || [];
    const selected = () => exercises().find((item) => item.id === selectedId) || exercises()[0];
    const message = (text) => {
      notice = text;
      const target = find("[data-journal-message]");
      if (target) target.textContent = text;
    };
    const readInputs = () => ({ load: find("[data-journal-load]")?.value || "", reps: find("[data-journal-reps]")?.value || "", rir: find("[data-journal-rir]")?.value ?? "" });
    const fillInputs = (row = blankSet()) => {
      if (!mount) return;
      find("[data-journal-load]").value = row.load || "";
      find("[data-journal-reps]").value = row.reps || "";
      find("[data-journal-rir]").value = row.rir ?? "";
    };

    function transact(session, change, success, { stopTimers = false } = {}) {
      const oldSession = clone(session);
      const oldHistory = clone(adapter.getState().history || []);
      try {
        change();
        if (stopTimers) {
          const elapsed = adapter.getElapsed?.(session);
          if (Number.isFinite(elapsed)) session.workoutElapsedSec = elapsed;
          session.workoutTimerRunning = false;
          session.workoutLastTickMs = null;
        }
        if (session === current()) adapter.syncSummary?.();
        if (!adapter.persist()) throw new Error("storage_failed");
      } catch (_error) {
        Object.keys(session).forEach((key) => delete session[key]);
        Object.assign(session, oldSession);
        adapter.getState().history = oldHistory;
        message("저장하지 못해 변경을 되돌렸어요. 저장공간과 다른 탭의 변경 여부를 확인해 주세요.");
        return false;
      }
      if (stopTimers) {
        adapter.stopRest?.();
        adapter.pauseWorkout?.();
      }
      viewKey = "";
      notice = success;
      adapter.render?.();
      render();
      return true;
    }

    function writeSet(session, exercise, index, value) {
      if (!object(session.actualSetsByExercise)) session.actualSetsByExercise = {};
      if (!object(session.exerciseNamesById)) session.exerciseNamesById = {};
      session.exerciseNamesById[exercise.id] = exercise.name;
      const rows = session.actualSetsByExercise[exercise.id] || [];
      while (rows.length <= index) rows.push(blankSet());
      rows[index] = { ...value, recordedAt: new Date().toISOString() };
      session.actualSetsByExercise[exercise.id] = rows;
      session.updatedAt = new Date().toISOString();
    }

    function saveSet({ sessionKey, exerciseId, index, ...raw }) {
      const session = adapter.getState().sessions?.[sessionKey];
      if (!session || !Number.isInteger(index) || index < 0 || index >= 100) return false;
      const exercise = session === current() ? exercises().find((item) => item.id === exerciseId)
        : { id: exerciseId, name: getExerciseName(session, exerciseId) };
      if (!exercise?.name) { message("기록의 운동 이름을 확인할 수 없어요."); return false; }
      const parsed = validateSet(raw);
      if (parsed.error) { message(parsed.error); return false; }
      return transact(session, () => {
        writeSet(session, exercise, index, parsed.value);
        // A later manual correction must not be overwritten by completion undo.
        session.journalLastCompletion = null;
      }, "실제 수행 기록을 저장했어요. 목표와 완료 세트 수는 유지됩니다.");
    }

    function deleteSet({ sessionKey, exerciseId, index }) {
      const session = adapter.getState().sessions?.[sessionKey];
      if (!session?.actualSetsByExercise?.[exerciseId]?.[index]?.recordedAt) return false;
      return transact(session, () => {
        session.actualSetsByExercise[exerciseId][index] = blankSet();
        session.journalLastCompletion = null;
        session.updatedAt = new Date().toISOString();
      }, "실제 수행 기록을 삭제했어요. 완료 여부는 바꾸지 않았습니다.");
    }

    function captureCompletion(exercise, kind = "exercise") {
      const session = current();
      if (kind === "exercise" && mount) {
        const raw = readInputs();
        const hasInput = Boolean(raw.load.trim() || raw.reps.trim() || String(raw.rir).trim());
        const recordedSession = editorSessionKey ? adapter.getState().sessions[editorSessionKey] : session;
        const existing = recordedSession?.actualSetsByExercise?.[editorSessionKey ? editorExerciseId : selectedId]?.[editorIndex];
        const parsed = hasInput ? validateSet(raw) : null;
        if (hasInput && (!existing?.recordedAt || parsed?.error || JSON.stringify(parsed.value) !== JSON.stringify({ load: existing.load, reps: existing.reps, rir: existing.rir }))) {
          message("입력 중인 실제 기록을 먼저 ‘실제 기록 저장’ 또는 ‘세트 완료’로 저장한 뒤 운동 전체를 완료해 주세요.");
          return false;
        }
      }
      session.journalLastCompletion = {
        exerciseId: exercise.id,
        kind,
        targetCount: exercise.sets.length,
        previousDone: Number(session.setDoneByExercise?.[exercise.id]) || 0,
        previousCompleted: Boolean(session.completedExerciseMap?.[exercise.id]),
        activeExerciseId: session.activeExerciseId || exercise.id,
        previousActualSets: clone(session.actualSetsByExercise?.[exercise.id] || [])
      };
      return true;
    }

    function captureSet(exercise, index) {
      const raw = readInputs();
      const hasInput = Boolean(raw.load.trim() || raw.reps.trim() || String(raw.rir).trim());
      const isCurrentEditor = !editorSessionKey && selectedId === exercise.id && editorIndex === index;
      if (hasInput && !isCurrentEditor) {
        message("입력 중인 기록이 현재 운동의 다음 세트와 달라요. 기록을 별도로 저장한 뒤 현재 운동과 다음 세트를 선택해 주세요.");
        return false;
      }
      const parsed = hasInput && isCurrentEditor ? validateSet(raw) : null;
      if (parsed?.error) { message(parsed.error); return false; }
      captureCompletion(exercise, "set");
      if (parsed?.value) writeSet(current(), exercise, index, parsed.value);
      manualIndex = false;
      manualSelection = false;
      return true;
    }

    function undoLastCompletion() {
      const session = current();
      const action = session.journalLastCompletion;
      const exercise = object(action) ? exercises().find((item) => item.id === action.exerciseId) : null;
      if (!exercise) {
        message("이 세션에서 취소할 최근 완료가 없어요."); return false;
      }
      if (action.targetCount !== exercise.sets.length || !Number.isInteger(action.previousDone) || action.previousDone < 0 || action.previousDone > exercise.sets.length) {
        message("완료 이후 운동 구성이 달라져 이 완료는 취소할 수 없어요. 현재 기록을 확인해 주세요."); return false;
      }
      return transact(session, () => {
        session.setDoneByExercise[action.exerciseId] = action.previousDone;
        if (action.previousCompleted) session.completedExerciseMap[action.exerciseId] = true;
        else delete session.completedExerciseMap[action.exerciseId];
        session.activeExerciseId = action.exerciseId;
        session.actualSetsByExercise ||= {};
        session.actualSetsByExercise[action.exerciseId] = clone(action.previousActualSets || []);
        session.journalLastCompletion = null;
        session.updatedAt = new Date().toISOString();
        manualSelection = false;
        editorSessionKey = "";
      }, "최근 완료를 취소했어요. 기록과 요약을 복구하고 타이머를 일시정지했습니다.", { stopTimers: true });
    }

    function replaceToday({ exerciseId, name, sets, restSec }) {
      const session = current();
      const plan = adapter.getPlan();
      const source = plan.exercises.find((item) => item.id === exerciseId);
      const cleanName = String(name || "").trim();
      const cleanSets = Array.isArray(sets) ? sets.map((item) => String(item).trim()).filter(Boolean) : [];
      const rest = Number(restSec);
      if (!source || !cleanName || cleanName.length > 80 || cleanSets.length < 1 || cleanSets.length > 30
        || cleanSets.some((item) => item.length > 160) || !Number.isFinite(rest) || rest < 0 || rest > 600 || !Number.isInteger(rest)) {
        message("대체 운동 이름(80자 이내), 세트 목표(1~30줄, 줄당 160자), 휴식(0~600초 정수)을 확인해 주세요."); return false;
      }
      return transact(session, () => {
        if (!session.planSnapshot) session.planSnapshot = clone(plan);
        session.exerciseNamesById ||= {};
        session.exerciseNamesById[source.id] = source.name;
        const replacement = {
          ...clone(source),
          id: `today-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          name: cleanName, sets: cleanSets, restSec: rest,
          howTo: "오늘 직접 선택한 대체 운동입니다. 익숙한 자세와 가벼운 강도로 시작하세요.",
          machine: "대체 운동에 맞는 기구 설정을 확인하세요.",
          ball: "수행하기 어렵다면 다른 운동으로 다시 대체할 수 있어요.",
          safety: "통증이나 어지러움이 있으면 중단하세요.",
          mistake: "원래 운동과 동일한 중량을 그대로 적용하지 마세요."
        };
        session.planSnapshot.exercises = session.planSnapshot.exercises.map((item) => item.id === source.id ? replacement : item);
        session.exerciseNamesById[replacement.id] = replacement.name;
        session.replacements ||= [];
        session.replacements.push({ originalId: source.id, replacementId: replacement.id, originalName: source.name, replacementName: cleanName, replacedAt: new Date().toISOString() });
        session.activeExerciseId = replacement.id;
        session.journalLastCompletion = null;
        session.updatedAt = new Date().toISOString();
        manualSelection = false;
        editorSessionKey = "";
      }, "오늘 운동만 대체했어요. 기존 주간 루틴과 이전 수행 기록은 보존했습니다.", { stopTimers: true });
    }

    function render() {
      if (!mount) return;
      const session = current();
      if (lastSessionKey !== session.sessionKey) {
        followActive();
        lastSessionKey = session.sessionKey;
      }
      const list = exercises();
      if (!manualSelection || !list.some((item) => item.id === selectedId)) selectedId = session.activeExerciseId || list[0]?.id || "";
      const exercise = selected();
      if (!exercise) { mount.innerHTML = ""; return; }
      selectedId = exercise.id;
      const previousView = readInputs();
      const nextKey = `${session.sessionKey}:${selectedId}:${session.setDoneByExercise?.[selectedId] || 0}:${editorSessionKey}:${editorExerciseId}`;
      const preserve = viewKey === nextKey;
      if (!preserve && !editorSessionKey && !manualIndex) editorIndex = Math.min(Number(session.setDoneByExercise?.[selectedId]) || 0, Math.max(0, exercise.sets.length - 1));
      viewKey = nextKey;
      const editingSession = editorSessionKey ? adapter.getState().sessions[editorSessionKey] : session;
      const editingId = editorSessionKey ? editorExerciseId : selectedId;
      const rows = editingSession?.actualSetsByExercise?.[editingId] || [];
      const setCount = Math.max(exercise.sets.length, rows.length, editorIndex + 1);
      historyRows = previousSets(adapter.getState(), session, exercise).slice(0, 40);
      const todayRows = Object.entries(session.actualSetsByExercise || {}).flatMap(([id, entries]) => (entries || []).flatMap((row, index) => row?.recordedAt ? [{ ...row, index, exerciseId: id, name: getExerciseName(session, id, id === exercise.id ? exercise.name : id) }] : []));
      mount.innerHTML = `
        <section class="generated-plan-box journal-box" aria-label="실제 수행 기록">
          <h3 class="section-title">실제 수행 기록 · 지난 운동 비교</h3>
          <p class="muted">목표와 별도로 저장합니다. 입력 후 세트 완료를 누르면 현재 세트에 함께 기록됩니다. 기록만 저장할 수도 있어요.</p>
          <label class="editor-label">기록할 운동<select class="editor-input" data-journal-exercise>${list.map((item) => `<option value="${escape(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escape(item.name)}</option>`).join("")}</select></label>
          ${editorSessionKey ? `<p class="safety-notice">지난 기록 수정: ${escape(editorSessionKey.slice(0, 10))} · ${escape(getExerciseName(editingSession, editingId))} <button type="button" class="btn ghost small" data-journal-action="cancel-edit">오늘 기록으로 돌아가기</button></p>` : ""}
          <form data-journal-form>
            <div class="generator-field-grid">
              <label class="editor-label">세트<select class="editor-input" data-journal-index>${Array.from({ length: Math.min(100, setCount) }, (_, index) => `<option value="${index}" ${index === editorIndex ? "selected" : ""}>${index + 1}세트</option>`).join("")}</select></label>
              <label class="editor-label">실제 중량 / 맨몸<input class="editor-input" data-journal-load maxlength="80" placeholder="예: 40kg, 맨몸, 보조 20kg"></label>
              <label class="editor-label">실제 횟수 / 시간<input class="editor-input" data-journal-reps maxlength="120" placeholder="예: 10회, 30초" required></label>
              <label class="editor-label">남은 여유 횟수(RIR, 선택)<input class="editor-input" data-journal-rir type="number" min="0" max="10" step="1" placeholder="0~10"></label>
            </div>
            <div class="generator-actions"><button class="btn secondary" type="submit">실제 기록 저장</button><button class="btn ghost" type="button" data-journal-action="previous">이전 값 불러오기</button><button class="btn ghost danger" type="button" data-journal-action="delete">이 세트 기록 삭제</button></div>
          </form>
          <p class="muted" role="status" aria-live="polite" data-journal-message>${escape(notice)}</p>
          <button class="btn ghost" type="button" data-journal-action="undo" ${session.journalLastCompletion ? "" : "disabled"}>최근 ${session.journalLastCompletion?.kind === "exercise" ? "운동" : "세트"} 완료 취소</button>
          <details><summary>오늘 실제 기록 (${todayRows.length}세트)</summary><ul class="history-list">${todayRows.map((row) => `<li>${escape(row.name)} · ${row.index + 1}세트 · ${escape(row.load || "중량 미입력")} × ${escape(row.reps)}${row.rir !== null ? ` · RIR ${escape(row.rir)}` : ""}</li>`).join("") || '<li class="history-empty">아직 실제 수행 기록이 없습니다.</li>'}</ul></details>
          <details ${editorSessionKey ? "open" : ""}><summary>같은 운동의 지난 기록·추세 (${historyRows.length}세트)</summary>
            <p class="muted">같은 운동 이름의 이전 기록을 최근 날짜순으로 비교합니다. 중량·횟수·시간 표기를 유지하며 서로 다른 단위를 합산하지 않습니다.</p>
            <div class="journal-table-scroll"><table><thead><tr><th>날짜</th><th>세트</th><th>중량</th><th>횟수·시간</th><th>RIR</th><th>수정</th></tr></thead><tbody>${historyRows.map((row, index) => `<tr><td>${escape(row.sessionKey.slice(0, 10))}</td><td>${row.index + 1}</td><td>${escape(row.load || "—")}</td><td>${escape(row.reps)}</td><td>${escape(row.rir ?? "—")}</td><td><button class="btn ghost small" type="button" data-journal-edit="${index}">수정</button><button class="btn ghost small danger" type="button" data-journal-delete-history="${index}">삭제</button></td></tr>`).join("") || '<tr><td colspan="6">이전에 저장한 실제 기록이 없습니다.</td></tr>'}</tbody></table></div>
          </details>
          <details><summary>오늘만 다른 운동으로 대체</summary>
            <p class="muted">선택한 운동을 오늘 계획에서 대체합니다. 이미 수행한 기록은 남으며 새 운동은 미완료로 시작합니다.</p>
            <form data-journal-replace-form>
              <label class="editor-label">대체 운동 이름<input class="editor-input" name="replacementName" maxlength="80" required></label>
              <label class="editor-label">세트별 목표 · 한 줄에 한 세트<textarea class="editor-input" name="replacementSets" rows="3" placeholder="맨몸 x10회&#10;맨몸 x10회" required></textarea></label>
              <label class="editor-label">휴식 시간(초)<input class="editor-input" name="replacementRest" type="number" min="0" max="600" step="1" value="${exercise.restSec || 0}" required></label>
              <button class="btn secondary" type="submit">오늘만 대체 적용</button>
            </form>
          </details>
        </section>`;
      fillInputs(preserve ? previousView : rows[editorIndex] || blankSet());
    }

    function followActive() {
      manualSelection = false;
      manualIndex = false;
      editorSessionKey = "";
      editorExerciseId = "";
      viewKey = "";
    }

    if (mount) {
      mount.addEventListener("change", (event) => {
        if (event.target.matches("[data-journal-exercise]")) {
          selectedId = event.target.value; manualSelection = true; manualIndex = false; editorSessionKey = ""; viewKey = ""; render();
        } else if (event.target.matches("[data-journal-index]")) {
          editorIndex = Number(event.target.value);
          manualIndex = true;
          const session = editorSessionKey ? adapter.getState().sessions[editorSessionKey] : current();
          fillInputs(session.actualSetsByExercise?.[editorSessionKey ? editorExerciseId : selectedId]?.[editorIndex]);
        }
      });
      mount.addEventListener("submit", (event) => {
        if (event.target.matches("[data-journal-form]")) {
          event.preventDefault();
          saveSet({ sessionKey: editorSessionKey || current().sessionKey, exerciseId: editorSessionKey ? editorExerciseId : selectedId, index: editorIndex, ...readInputs() });
        } else if (event.target.matches("[data-journal-replace-form]")) {
          event.preventDefault();
          replaceToday({ exerciseId: selectedId, name: event.target.elements.replacementName.value, sets: event.target.elements.replacementSets.value.split(/\r?\n/), restSec: event.target.elements.replacementRest.value });
        }
      });
      mount.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button || !mount.contains(button)) return;
        if (button.dataset.journalEdit !== undefined) {
          const row = historyRows[Number(button.dataset.journalEdit)];
          if (!row) return;
          editorSessionKey = row.sessionKey; editorExerciseId = row.exerciseId; editorIndex = row.index; viewKey = ""; render();
          find("[data-journal-reps]")?.focus();
        } else if (button.dataset.journalDeleteHistory !== undefined) {
          const row = historyRows[Number(button.dataset.journalDeleteHistory)];
          if (row && root.confirm(`${row.sessionKey.slice(0, 10)} ${row.index + 1}세트의 실제 기록을 삭제할까요?`)) deleteSet(row);
        } else if (button.dataset.journalAction === "undo") undoLastCompletion();
        else if (button.dataset.journalAction === "cancel-edit") { editorSessionKey = ""; viewKey = ""; render(); }
        else if (button.dataset.journalAction === "delete") {
          if (root.confirm("이 세트의 실제 수행 기록만 삭제할까요?")) deleteSet({ sessionKey: editorSessionKey || current().sessionKey, exerciseId: editorSessionKey ? editorExerciseId : selectedId, index: editorIndex });
        } else if (button.dataset.journalAction === "previous") {
          const previous = previousSets(adapter.getState(), current(), selected());
          const latestKey = previous[0]?.sessionKey;
          const row = previous.find((item) => item.sessionKey === latestKey && item.index === editorIndex) || previous[0];
          if (row) { fillInputs(row); message(`${row.sessionKey.slice(0, 10)} 기록을 입력칸에 불러왔어요. 저장하거나 세트 완료로 확정하세요.`); }
          else message("같은 운동 이름으로 저장한 이전 실제 기록이 없어요.");
        }
      });
    }
    return { render, followActive, captureSet, captureCompletion, undoLastCompletion, saveSet, deleteSet, replaceToday };
  }

  root.WorkoutJournal = { create, validateSet, normalizeActualSets, previousSets };
})(typeof window !== "undefined" ? window : globalThis);
