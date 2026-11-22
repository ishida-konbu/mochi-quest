import test from 'node:test';
import assert from 'node:assert/strict';
import { cases, dialogues, evidence, inferences, npcs, trials } from '../two/mystery-data.js';
import { createMystery } from '../two/mystery-state.js';

const dialogueById = new Map(dialogues.map(line => [line.id, line]));
const clueById = new Map(evidence.map(clue => [clue.id, clue]));
const inferenceById = new Map(inferences.map(puzzle => [puzzle.id, puzzle]));
const correct = question => question.choices.find(choice => choice.correct).id;
const wrong = question => question.choices.find(choice => !choice.correct).id;

function reload(m) {
  const restored = createMystery(JSON.parse(JSON.stringify(m.save())));
  assert.deepEqual(restored.save(), m.save());
  return restored;
}

// Find and follow actual visible choices, including the observation and witness
// questions before the recording choice. No test-only grant or solve command.
function choosePath(m, entry, targetChoice) {
  const queue = [[entry, []]], seen = new Set();
  while (queue.length) {
    const [id, path] = queue.shift(), line = dialogueById.get(id);
    if (!line || seen.has(id) || !m.meets(line.condition)) continue;
    seen.add(id);
    for (const choice of line.choices.filter(c => m.meets(c.condition))) {
      const next = [...path, [id, choice.id]];
      if (targetChoice(choice)) {
        for (const [node, key] of next) {
          const result = m.choose(node, key);
          assert.equal(result.ok, true, node + ' / ' + key + ' / ' + result.feedback);
        }
        return choice.nextId;
      }
      if (choice.nextId && !choice.effects.length) queue.push([choice.nextId, next]);
    }
  }
  assert.fail('No accessible dialogue path from ' + entry);
}
const actionFor = (op, id) => c => c.effects.some(effect => effect.op === op && effect.id === id);
function record(m, id) {
  const entry = clueById.get(id).acquisition.dialogueId;
  choosePath(m, entry, actionFor('acquireEvidence', id));
  assert.ok(m.state.evidence.includes(id));
}
function resolve(m, entry) {
  const start = entry.trialId ? entry.resolutionDialogueId : m.requesterDialogue(entry.id);
  choosePath(m, start, actionFor('completeCase', entry.id));
  assert.equal(m.state.status[entry.id], 'resolved');
  assert.equal(m.state.evidence.filter(id => id === entry.resolvedFactId).length, 1);
}

test('an explicit offer and recording decision are independent and idempotent', () => {
  let m = createMystery(null);
  assert.equal(m.requesterDialogue('C02'), 'D_C02_PRELUDE');
  assert.equal(m.choose('D_C02_OFFER_L2', 'D_C02_TAKE').ok, false);
  assert.equal(m.meets({ op:'unknown', id:'C01' }), false);
  assert.equal(m.meets({ any:[{ op:'caseSolved', id:'C01' }, { all:[] }] }), true);
  assert.ok(m.choose('D_C01_OFFER', 'D_C01_OFFER_CONTINUE').ok);
  assert.ok(m.choose('D_C01_OFFER_L2', 'D_C01_LATER').ok);
  assert.ok(m.choose('D_C01_E01', 'D_C01_E01_LEAVE').ok);
  assert.deepEqual(m.state.evidence, []);
  record(m, 'EV_C01_01');
  record(m, 'EV_C01_01');
  record(m, 'EV_C02_07');
  m = reload(m);
  assert.equal(m.state.status.C01, 'unaccepted');
  assert.equal(m.state.status.C02, 'unaccepted');
  assert.deepEqual(m.state.evidence, ['EV_C01_01', 'EV_C02_07']);
  assert.equal(m.choose('D_C01_E06_L2', 'D_C01_E06_RECORD').ok, false);
  assert.ok(m.choose('D_C01_OFFER_L2', 'D_C01_TAKE').ok);
  assert.equal(m.choose('D_C01_OFFER_L2', 'D_C01_TAKE').ok, false);
  assert.equal(m.requesterDialogue('C01'), 'D_C01_REPEAT');
  assert.equal(m.choose('D_C01_RESOLVE_L3', 'D_C01_CONFIRM').ok, false);
  assert.equal(m.startTrial('TR_C07').ok, false);
});

function proveField(m, puzzle) {
  const owned = puzzle.acceptedEvidenceSets[0];
  const before = m.save();
  assert.equal(m.submitInference(puzzle.id, [], correct(puzzle)).ok, false);
  const bad = m.submitInference(puzzle.id, owned, wrong(puzzle));
  assert.deepEqual(bad, { ok:false, feedback:puzzle.choices.find(c => c.id === wrong(puzzle)).feedbackJa });
  assert.deepEqual(m.save(), before);
  const open = 'D_' + puzzle.id + '_OPEN';
  choosePath(m, open, c => c.uiAction?.type === 'openInference');
  assert.ok(!m.state.inferences.includes(puzzle.id));
  assert.equal(m.submitInference(puzzle.id, owned, correct(puzzle)).ok, true);
}

function hearing(m, trial, useAlternate) {
  assert.ok(m.meets(trial.readyCondition));
  assert.ok(m.startTrial(trial.id).ok);
  assert.equal(m.reconstruct(trial.id, trial.reconstruction.correctOrder).ok, false);
  for (const [index, round] of trial.rounds.entries()) {
    const { challenge } = round;
    const owned = useAlternate ? challenge.acceptedEvidenceSets.at(-1) : challenge.acceptedEvidenceSets[0];
    const answer = correct(challenge);
    const other = round.testimony.lines.find(line => line.id !== challenge.statementId);
    assert.ok(other, 'Every cross-examination offers another statement');
    const before = m.save();
    assert.equal(m.submitRound(trial.id, other.id, owned, answer).ok, false);
    assert.equal(m.submitRound(trial.id, challenge.statementId, owned.slice(1), answer).ok, false);
    assert.equal(m.submitRound(trial.id, challenge.statementId, owned, wrong(challenge)).ok, false);
    assert.deepEqual(m.save(), before);
    assert.ok(m.submitRound(trial.id, challenge.statementId, owned, answer).ok);
    assert.ok(m.leaveTrial().ok);
    assert.equal(m.submitRound(trial.id, challenge.statementId, owned, answer).ok, false);
    m = reload(m);
    assert.ok(m.startTrial(trial.id).ok);
    assert.equal(m.state.hearings[trial.id].round, index + 1);
    if (round.grantInferenceId) assert.ok(m.state.inferences.includes(round.grantInferenceId));
  }
  const { correctOrder } = trial.reconstruction;
  assert.equal(m.reconstruct(trial.id, [...correctOrder].reverse()).ok, false);
  assert.equal(m.meets({ op:'trialWon', id:trial.id }), false);
  assert.ok(m.reconstruct(trial.id, [...correctOrder]).ok);
  assert.equal(m.state.status[trial.caseId], 'active');
  assert.equal(m.startTrial(trial.id).ok, false);
  assert.equal(m.meets({ op:'trialWon', id:trial.id }), true);
  return reload(m);
}

for (const reverse of [false, true]) {
  const route = reverse ? ['C01','C03','C02','C04','C06','C05','C07'] :
    ['C01','C02','C03','C04','C05','C06','C07'];
  test('solves the campaign by dialogue and authored proofs through ' + route.join(' → '), () => {
    let m = createMystery();
    record(m, 'EV_C07_13'); // First-day demonstration also supports the final physical proof.
    record(m, 'EV_C02_07'); // The yokozuna can be found before anyone reports him missing.
    for (const id of route) {
      const entry = cases.find(c => c.id === id);
      assert.equal(m.requesterDialogue(id), entry.offerDialogueId);
      choosePath(m, m.requesterDialogue(id), actionFor('acceptCase', id));
      m = reload(m);
      let available;
      do {
        const before = m.state.evidence.length + m.state.inferences.length;
        for (const clue of evidence) {
          if (clue.caseId !== id || clue.kind === 'resolvedFact' || m.state.evidence.includes(clue.id)) continue;
          // One route deliberately takes C02's short path, with no side quests or optional inference.
          if (reverse && id === 'C02' && !entry.mandatoryEvidenceIds.includes(clue.id)) continue;
          if (m.meets(clue.acquisition.condition)) record(m, clue.id);
        }
        for (const inferenceId of entry.inferenceIds) {
          if (m.canInfer(inferenceId)) proveField(m, inferenceById.get(inferenceId));
        }
        available = before !== m.state.evidence.length + m.state.inferences.length;
      } while (available);
      assert.ok(entry.mandatoryEvidenceIds.every(e => m.state.evidence.includes(e)), id + ' investigation');
      if (entry.trialId) m = hearing(m, trials.find(t => t.id === entry.trialId), reverse);
      assert.ok(m.meets(entry.completionCondition));
      resolve(m, entry);
      m = reload(m);
      assert.ok(m.meets(dialogueById.get(m.requesterDialogue(id)).condition));
    }
    for (const npc of npcs) {
      const ending = dialogueById.get('D_' + npc.id + '_EPILOGUE');
      assert.ok(ending && m.meets(ending.condition), npc.nameJa);
      assert.ok(m.choose(ending.id, ending.choices[0].id).ok);
    }
    assert.equal(m.state.evidence.filter(id => clueById.get(id).kind === 'resolvedFact').length, 7);
  });
}

test('unknown IDs and malformed records do not prevent an old journey opening', () => {
  const empty = createMystery().save();
  for (const malformed of [null, true, 'broken', { schemaVersion:36 }, { schemaVersion:1,
    evidence:17, status:{ C01:'bogus' }, hearings:{ TR_C07:{ completed:['wrong'], won:true } },
    inferences:['unrecognized'] }]) {
    assert.deepEqual(createMystery(malformed).save(), empty);
  }
});

test('an inconsistent solved flag can recover through the ordinary investigation', () => {
  const m = createMystery({schemaVersion:1,
    status:{C01:'resolved',C02:'resolved',C07:'resolved'}, evidence:['EV_C01_90','EV_C02_90'],
    inferences:['INF_C01_01'], hearings:{TR_C07:{completed:[],won:true}}});
  assert.equal(m.state.status.C01, 'active');
  assert.equal(m.state.status.C02, 'unaccepted');
  assert.equal(m.state.status.C07, 'unaccepted');
  assert.deepEqual(m.state.evidence, []);
  assert.deepEqual(m.state.inferences, []);
  assert.deepEqual(m.state.hearings, {});
  assert.equal(m.requesterDialogue('C01'),'D_C01_REPEAT');
});

test('a full notebook and the complete delivery scroll fit the shared journey link together', async () => {
  const { createGame } = await import('../two/game.js');
  const { REGIONS } = await import('../two/terrain.js');
  const { transferURL, decodeTransfer, PAGES_ORIGIN, WORKER_ORIGIN } = await import('../two/journey-transfer.js');
  const game = createGame(), snapshot = game.save();
  snapshot.delivered = game.state.npcs.map(npc => npc.id);
  snapshot.mystery = {
    schemaVersion: 1,
    status: Object.fromEntries(cases.map(c => [c.id, 'resolved'])),
    evidence: evidence.map(e => e.id),
    inferences: inferences.map(i => i.id),
    hearings: Object.fromEntries(trials.map(t => [t.id, { completed:t.rounds.map(r => r.id), won:true }])),
  };
  const share = transferURL(PAGES_ORIGIN, snapshot, { sound:false, yaw:1, goal:'kyo' });
  assert.ok(share);
  const incoming = decodeTransfer(WORKER_ORIGIN, new URL(share).hash, createGame, REGIONS);
  assert.ok(incoming.game.state.kagamiUnlocked);
  assert.deepEqual(incoming.game.save().delivered, snapshot.delivered);
  assert.deepEqual(incoming.game.mystery.save(), snapshot.mystery);
});
