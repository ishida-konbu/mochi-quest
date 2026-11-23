import assert from 'node:assert/strict';
import test from 'node:test';
import { CAST, CHAPTERS } from '../two/mochiyori-story.js';
import { createNotebook } from '../two/mochiyori-progress.js';
import { createStoryDialogue } from '../two/mochiyori-dialogue.js';
import { CHAPTER_LINES, CLUE_LINES, PROOF_LINES } from '../two/mochiyori-lines.js';
import { storySite } from '../two/story-sites.js';

const byName = new Map(CAST.map(p => [p.name, p]));
byName.set('茶屋の亭主', {id: 'road-tea-host', name: '茶屋の亭主'});
function listen(dialogue) {
  for (let n = 0; dialogue.frame && !dialogue.frame.choices.length; n++) {
    assert.ok(n < 50, 'Dialogue must reach a decision or end');
    assert.ok(dialogue.frame.speaker && dialogue.frame.text);
    dialogue.step();
  }
}
function choose(dialogue, id) {
  assert.ok(dialogue.frame?.choices.some(c => c.id === id),
    'Expected choice ' + id + ' in ' + JSON.stringify(dialogue.frame));
  dialogue.step(id);
  listen(dialogue);
}
function meet(dialogue, lead) {
  assert.ok(byName.has(lead.person), lead.person);
  dialogue.start(byName.get(lead.person), lead.site);
  listen(dialogue);
}
function investigate(dialogue, id) {
  if (dialogue.frame?.choices.some(c => c.id === 'clue/' + id)) return choose(dialogue, 'clue/' + id);
  choose(dialogue, 'do');
}

test('all exchanges and both hearings have authored speaker turns and replies', () => {
  const speakers = new Set([...byName.keys(), '配達人のお餅', '炭焼き']);
  for (const chapter of CHAPTERS) {
    const story = CHAPTER_LINES[chapter.id];
    assert.ok([story.opener, story.host].every(name => byName.has(name)));
    assert.ok(story.request);
    for (const turns of [story.intro, story.accepted, story.ending, ...chapter.clues.map(clue => CLUE_LINES[clue.id].lines)]) {
      assert.ok(turns.length > 0);
      for (const [name, line] of turns) assert.ok(speakers.has(name) && line, name + ' ' + line);
    }
    for (const clue of chapter.clues) {
      const exchange = CLUE_LINES[clue.id];
      assert.ok(exchange.ask && exchange.choice && exchange.lines.some(([who]) => who === '配達人のお餅'), clue.id);
    }
    for (const i of chapter.proofs.keys()) {
      const spoken = PROOF_LINES[chapter.id][i];
      assert.ok(spoken.conclusion && (spoken.kind === 'fact' || spoken.prompt));
    }
  }
});

test('a refusal or a cancelled exchange gives no note, item or progress', () => {
  const book = createNotebook(), talk = createStoryDialogue(book);
  const [opening] = talk.leads();
  assert.equal(opening.id, 'request');
  assert.equal(opening.person, 'おはな');
  const start = book.save();
  meet(talk, opening);
  assert.equal(talk.step(), talk.frame);
  choose(talk, 'decline');
  assert.deepEqual(book.save(), start);
  meet(talk, opening);
  talk.step('accept');
  talk.close();
  assert.deepEqual(book.save(), start);
  meet(talk, opening);
  choose(talk, 'accept');
  assert.equal(book.requested, true);
  const accepted = createNotebook(book.save());
  assert.equal(accepted.requested, true);
  const lead = talk.leads()[0];
  meet(talk, lead);
  const inspect = talk.frame.choices.some(c => c.id === 'clue/' + lead.id) ? 'clue/' + lead.id : 'do';
  talk.step(inspect);
  assert.equal(talk.frame.action.key, 'clue/' + lead.id);
  talk.close();
  assert.equal(book.has(lead.id), false);
  meet(talk, lead);
  investigate(talk, lead.id);
  assert.equal(book.has(lead.id), true);
});

test('the traveller must carry the actual parcel and handovers survive interrupted or reloaded conversations', () => {
  const first = CHAPTERS[0];
  const book = createNotebook({ v: 1, chapter: 1, notes: first.clues.map(c => c.id), proof: 0 });
  const talk = createStoryDialogue(book);
  const [opening] = talk.leads();
  meet(talk, opening);
  choose(talk, 'accept');
  meet(talk, opening);
  talk.step('clue/steam-test');
  assert.equal(talk.frame.text, CLUE_LINES['steam-test'].missing);
  assert.deepEqual(talk.frame.choices, []);
  assert.equal(book.has('steam-test'), false);
  assert.equal(talk.frame.action, undefined);
  meet(talk, talk.leads().find(c => c.id === 'same-rice'));
  investigate(talk, 'same-rice');
  assert.deepEqual(book.items(), ['棚田の米二包み']);
  const restored = createNotebook(book.save()), resumed = createStoryDialogue(restored);
  assert.deepEqual(restored.items(), book.items());
  const delivery = resumed.leads().find(c => c.id === 'steam-test');
  meet(resumed, delivery);
  resumed.step('do');
  resumed.close();
  assert.deepEqual(restored.items(), ['棚田の米二包み']);
  meet(resumed, delivery);
  investigate(resumed, 'steam-test');
  assert.equal(restored.has('steam-test'), true);
  assert.deepEqual(restored.items(), []);
  assert.equal(createNotebook(restored.save()).hasParcelFor('steam-test'), false);
});

test('only nearby named witnesses at the right site can provide the current evidence', () => {
  const book = createNotebook(), talk = createStoryDialogue(book);
  meet(talk, talk.leads()[0]); choose(talk, 'accept');
  const wrongSite = storySite('spring');
  talk.start(byName.get('おはな'), wrongSite); listen(talk);
  assert.ok(talk.frame.choices.every(c => !c.id.startsWith('clue/')));
  assert.equal(book.has('leaf-marks'), false);
  talk.start(byName.get('亀吉'), storySite('river')); listen(talk);
  assert.ok(talk.frame.choices.every(c => !c.id.startsWith('clue/')));
});

test('a new traveller can reach the banquet through conversation alone in either lead order, resuming after every decision', () => {
  for (const reverse of [false, true]) {
    let book = createNotebook();
    for (const chapter of CHAPTERS) {
      let talk = createStoryDialogue(book);
      assert.equal(book.current(), chapter);
      const [opening] = talk.leads();
      meet(talk, opening);
      choose(talk, 'accept');
      while (!book.ready()) {
        const leads = talk.leads();
        assert.ok(leads.length && leads.every(c => c.id !== 'verdict'), chapter.id);
        const lead = leads.at(reverse ? -1 : 0);
        meet(talk, lead);
        investigate(talk, lead.id);
        assert.ok(book.has(lead.id));
        book = createNotebook(JSON.parse(JSON.stringify(book.save())));
        talk = createStoryDialogue(book);
      }
      const [verdict] = talk.leads();
      assert.equal(verdict.id, 'verdict');
      meet(talk, verdict);
      choose(talk, 'verdict');
      let decisions = 0;
      while (book.current() === chapter) {
        const i = book.proofIndex, proof = chapter.proofs[i];
        const {kind} = PROOF_LINES[chapter.id][i];
        assert.ok(['reason', 'evidence'].includes(kind), 'Established facts should have been read back');
        const wrong = kind === 'reason' ? (proof.correct + 1) % proof.choices.length : proof.evidence.find(id => id !== proof.answer);
        const right = kind === 'reason' ? proof.correct : proof.answer;
        choose(talk, kind + '/' + wrong);
        assert.equal(book.proofIndex, i);
        choose(talk, kind + '/' + right);
        decisions++;
        if (book.current() === chapter) {
          assert.ok(book.proofIndex > i);
          book = createNotebook(book.save());
          talk = createStoryDialogue(book);
          meet(talk, verdict); choose(talk, 'verdict');
        }
      }
      assert.ok(decisions <= 2, 'A hearing should return the player to travel after at most two decisions');
      assert.notEqual(book.current(), chapter);
    }
    assert.equal(book.index, 8);
    assert.deepEqual(book.items(), []);
    const postgame = createStoryDialogue(book);
    postgame.start(byName.get('弥平'), storySite('kyo'));
    assert.equal(postgame.frame.action.key, 'guest/' + byName.get('弥平').id);
    listen(postgame);
    choose(postgame, 'food');
    assert.equal(book.seen('food/kyo'), true);
  }
});

test('the recovered cargo reaches Matsubara in person, with older hearings kept at their saved question', () => {
  const notes = CHAPTERS.slice(0,5).flatMap(chapter => chapter.clues.map(clue => clue.id)).filter(id => id !== 'returned-tools');
  const notebook = createNotebook({v:1,chapter:4,notes,proof:0});
  const talk = createStoryDialogue(notebook);
  assert.deepEqual(notebook.items(), ['竜宮から松原へ返す道具包み']);
  assert.equal(notebook.ready(), false);
  const [delivery] = talk.leads();
  assert.equal(delivery.person, 'お浜');
  assert.equal(delivery.site.region, 'coast');
  meet(talk, delivery);
  talk.step('do'); talk.close();
  assert.equal(notebook.items().length, 1);
  meet(talk, delivery);
  investigate(talk, delivery.id);
  assert.deepEqual(notebook.items(), []);
  assert.equal(notebook.ready(), true);

  for (const [chapter, proof] of [[4,1],[5,0]]) {
    const older = createNotebook({v:1,chapter,notes,proof});
    assert.equal(older.index, chapter);
    assert.equal(older.proofIndex, proof);
    assert.equal(older.has('returned-tools'), true);
    assert.deepEqual(older.items(), []);
  }
});

test('a worktable offers only its own active pickup and commits it once after inspection', () => {
  let book = createNotebook(), talk = createStoryDialogue(book);
  const river = storySite('river'), market = storySite('market');
  assert.equal(talk.pickupAt(river), null);
  meet(talk, talk.leads()[0]); choose(talk, 'accept');
  const leaf = talk.pickupAt(river);
  assert.equal(leaf.person.name, 'おはな');
  assert.equal(talk.inspect(leaf.id, market), null);
  assert.equal(talk.inspect(leaf.id, river).action.key, 'clue/leaf-marks');
  talk.close();
  assert.equal(book.has(leaf.id), false);
  talk.inspect(leaf.id, river); listen(talk);
  assert.equal(talk.pickupAt(river), null);
  assert.equal(book.has(leaf.id), true);

  const previous = CHAPTERS[0].clues.map(c => c.id);
  book = createNotebook({v:1, chapter:1, notes:[...previous, 'same-rice','steam-test'], proof:0});
  talk = createStoryDialogue(book);
  assert.equal(talk.pickupAt(market), null);
  meet(talk, talk.leads().find(lead => lead.id === 'prototype'));
  investigate(talk, 'prototype');
  const bars = talk.pickupAt(market);
  assert.equal(bars.id, 'packing-bars');
  assert.equal(talk.inspect(bars.id, market).action.key, 'clue/packing-bars');
  listen(talk);
  assert.deepEqual(book.items(), ['蒸し箱の桟三本']);
});
