import { cases, dialogues, evidence, inferences, trials } from './mystery-data.js';

const byId = rows => new Map(rows.map(row => [row.id, row]));
const caseIndex = byId(cases);
const dialogueIndex = byId(dialogues);
const evidenceIndex = byId(evidence);
const inferenceIndex = byId(inferences);
const trialIndex = byId(trials);
const fail = feedback => ({ ok: false, feedback });
const addOnce = (list, id) => { if (!list.includes(id)) list.push(id); };
const knownIds = (value, index) => Array.isArray(value)
  ? [...new Set(value.filter(id => index.has(id)))] : [];

function satisfies(state, condition) {
  if (!condition || typeof condition !== 'object') return false;
  if (Array.isArray(condition.all)) return condition.all.every(c => satisfies(state, c));
  if (Array.isArray(condition.any)) return condition.any.some(c => satisfies(state, c));
  switch (condition.op) {
    case 'caseAccepted': return ['active', 'resolved'].includes(state.status[condition.id]);
    case 'caseSolved': return state.status[condition.id] === 'resolved';
    case 'hasEvidence': return state.evidence.includes(condition.id);
    case 'hasInference': return state.inferences.includes(condition.id);
    case 'trialWon': return state.hearings[condition.id]?.won === true;
    case 'flagEquals': return condition.id === 'trialActive' && trialIndex.has(condition.value) &&
      state.activeTrial === condition.value;
    default: return false;
  }
}

function restore(saved) {
  const source = saved?.schemaVersion === 1 ? saved : {};
  const recorded = knownIds(source.evidence, evidenceIndex);
  const proved = knownIds(source.inferences, inferenceIndex);
  const state = {
    schemaVersion: 1, status: {},
    evidence: recorded.filter(id => evidenceIndex.get(id).kind !== 'resolvedFact'),
    inferences: [], hearings: {}, activeTrial: null,
  };
  for (const entry of cases) {
    const status = source.status?.[entry.id];
    state.status[entry.id] = 'unaccepted';
    if (!['active','resolved'].includes(status) || !satisfies(state, entry.prerequisites)) continue;
    state.status[entry.id] = 'active';
    for (const id of entry.inferenceIds) {
      const puzzle = inferenceIndex.get(id);
      if (puzzle.stage === 'field' && proved.includes(id) &&
          puzzle.requiredEvidenceIds.every(clue => state.evidence.includes(clue)) &&
          puzzle.acceptedEvidenceSets.some(set => set.every(clue => state.evidence.includes(clue))))
        addOnce(state.inferences, id);
    }
    // Reload in the field. Stable completed round IDs let the player resume at
    // the desk, including the intentionally non-numeric order of the final trial.
    const trial = trialIndex.get(entry.trialId);
    const savedHearing = trial && source.hearings?.[trial.id];
    if (savedHearing && satisfies(state, trial.readyCondition)) {
      let round = 0;
      const done = savedHearing.completed;
      while (round < trial.rounds.length && done?.[round] === trial.rounds[round].id) {
        const grant = trial.rounds[round].grantInferenceId;
        if (grant) addOnce(state.inferences, grant);
        round++;
      }
      state.hearings[trial.id] = {
        round, won: round === trial.rounds.length && savedHearing.won === true,
      };
    }
    // An interrupted or malformed record must never leave a supposedly solved
    // case with no way to obtain its fact card or to repeat the missing proof.
    if (status === 'resolved' && satisfies(state, entry.completionCondition)) {
      state.status[entry.id] = 'resolved';
      addOnce(state.evidence, entry.resolvedFactId);
    }
  }
  // Preserve the order in which the notebook was actually filled.
  const ordered = (ids, original) => [...original.filter(id => ids.includes(id)),
    ...ids.filter(id => !original.includes(id))];
  state.evidence = ordered(state.evidence, recorded);
  state.inferences = ordered(state.inferences, proved);
  return state;
}

function checkProof(state, question, exhibits, reasonId) {
  if (!Array.isArray(exhibits) || !exhibits.every(id => state.evidence.includes(id)))
    return fail('手帖に記録した資料を選んでください。');
  const reason = question.choices.find(choice => choice.id === reasonId);
  if (!reason) return fail('その資料から言える理由を、一つ選んでください。');
  if (!reason.correct) return fail(reason.feedbackJa);
  const selected = new Set(exhibits);
  const supported = question.acceptedEvidenceSets.some(set =>
    set.length === selected.size && set.every(id => selected.has(id)));
  if (!supported) return fail('この組み合わせでは、その説明を裏づけきれません。必要な資料だけを選び直してください。');
  return { ok: true, feedback: reason.feedbackJa };
}

export function createMystery(saved) {
  const state = restore(saved);
  const meets = condition => satisfies(state, condition);
  function save() {
    const hearings = {};
    for (const trial of trials) {
      const progress = state.hearings[trial.id];
      if (progress) hearings[trial.id] = {
        completed: trial.rounds.slice(0, progress.round).map(round => round.id), won: progress.won,
      };
    }
    return { schemaVersion: 1, status: { ...state.status }, evidence: [...state.evidence],
      inferences: [...state.inferences], hearings };
  }

  function requesterDialogue(caseId) {
    const entry = caseIndex.get(caseId);
    if (!entry) return null;
    switch (state.status[caseId]) {
      case 'resolved': return entry.trialId ? 'D_' + caseId + '_RETURN' : 'D_' + caseId + '_POST';
      case 'active': return 'D_' + caseId + '_REPEAT';
      default: return meets(entry.prerequisites) ? entry.offerDialogueId : 'D_' + caseId + '_PRELUDE';
    }
  }

  function canInfer(id) {
    const puzzle = inferenceIndex.get(id);
    return !!puzzle && puzzle.stage === 'field' && state.status[puzzle.caseId] === 'active' &&
      !state.inferences.includes(id) && puzzle.requiredEvidenceIds.every(e => state.evidence.includes(e)) &&
      puzzle.acceptedEvidenceSets.some(set => set.every(e => state.evidence.includes(e)));
  }

  function submitInference(id, exhibits, choiceId) {
    if (!canInfer(id)) return fail('この問いを確かめるための記録を、先に手帖へそろえてください。');
    const puzzle = inferenceIndex.get(id);
    const result = checkProof(state, puzzle, exhibits, choiceId);
    if (result.ok) {
      addOnce(state.inferences, id);
      for (const clue of puzzle.grantsEvidenceIds) addOnce(state.evidence, clue);
    }
    return result;
  }

  function choose(dialogueId, choiceId) {
    const line = dialogueIndex.get(dialogueId);
    const choice = line?.choices.find(item => item.id === choiceId);
    if (!choice || !meets(line.condition) || !meets(choice.condition))
      return fail('いまはその話へ進めません。手帖の記録を確かめてください。');
    // Stage all effects first. The destination can require a fact established
    // by this very choice (accept, record, or confirm the verdict).
    const next = { ...state, status: { ...state.status }, evidence: [...state.evidence] };
    for (const effect of choice.effects) {
      const id = effect.id;
      switch (effect.op) {
        case 'acceptCase': {
          const entry = caseIndex.get(id);
          if (!entry || id !== line.caseId || line.situation !== 'offer' ||
              state.status[id] !== 'unaccepted' || !meets(entry.prerequisites))
            return fail('この依頼は今は受けられません。');
          next.status[id] = 'active';
          break;
        }
        case 'completeCase': {
          const entry = caseIndex.get(id);
          if (!entry || id !== line.caseId || line.situation !== 'resolution' ||
              state.status[id] !== 'active' || !meets(entry.completionCondition))
            return fail('まだ確かめていないことがあります。');
          next.status[id] = 'resolved';
          addOnce(next.evidence, entry.resolvedFactId);
          break;
        }
        case 'acquireEvidence': {
          const clue = evidenceIndex.get(id);
          if (!clue || !satisfies(next, clue.acquisition.condition) ||
              (clue.kind === 'resolvedFact' && next.status[clue.caseId] !== 'resolved'))
            return fail('この記録には、先に確かめることがあります。');
          addOnce(next.evidence, id);
          break;
        }
        case 'unlockInference':
          if (!canInfer(id)) return fail('この問いには、まだ確かめることがあります。');
          break;
        default: return fail('この選択を記録できませんでした。');
      }
    }
    if (choice.nextId && !satisfies(next, dialogueIndex.get(choice.nextId)?.condition))
      return fail('次の話に必要な記録がそろっていません。');
    state.status = next.status;
    state.evidence = next.evidence;
    return { ok: true, nextId: choice.nextId, uiAction: choice.uiAction };
  }

  function startTrial(id) {
    const trial = trialIndex.get(id);
    if (!trial || state.status[trial.caseId] !== 'active' || !meets(trial.readyCondition) ||
        state.hearings[id]?.won) return fail('開廷に必要な記録を手帖で確かめてください。');
    state.hearings[id] ??= { round: 0, won: false };
    state.activeTrial = id;
    return { ok: true };
  }

  function leaveTrial() {
    state.activeTrial = null;
    return { ok: true };
  }

  function submitRound(id, statementId, exhibits, reasonId) {
    const progress = state.hearings[id];
    const round = trialIndex.get(id)?.rounds[progress?.round];
    if (!round || state.activeTrial !== id || progress.won) return fail('京の評定所で審理を再開してください。');
    if (statementId !== round.challenge.statementId)
      return fail('資料と食い違うのは、どの発言でしょう。証言の中からもう一度選んでください。');
    const result = checkProof(state, round.challenge, exhibits, reasonId);
    if (result.ok) {
      if (round.grantInferenceId) addOnce(state.inferences, round.grantInferenceId);
      progress.round++;
      result.feedback = round.successJa;
    }
    return result;
  }

  function reconstruct(id, order) {
    const trial = trialIndex.get(id);
    const progress = state.hearings[id];
    if (!trial || state.activeTrial !== id || progress?.round !== trial.rounds.length || progress.won)
      return fail('先に、この審理の証言を確かめてください。');
    const puzzle = trial.reconstruction;
    if (!Array.isArray(order) || order.length !== puzzle.correctOrder.length ||
      !puzzle.correctOrder.every((key, i) => key === order[i])) return fail(puzzle.wrongFeedbackJa);
    progress.won = true;
    leaveTrial();
    return { ok: true, feedback: puzzle.feedbackJa };
  }

  return { state, save, meets, choose, canInfer, submitInference, startTrial, submitRound,
    reconstruct, leaveTrial, requesterDialogue };
}
