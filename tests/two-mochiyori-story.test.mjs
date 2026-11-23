import assert from 'node:assert/strict';
import test from 'node:test';
import { CAST, CHAPTERS, SCENES, SUPPLY_REGISTER } from '../two/mochiyori-story.js';
import { createNotebook } from '../two/mochiyori-progress.js';

function gather(book, visitLast = false) {
  while (book.leads().length) {
    const clue = book.leads().at(visitLast ? -1 : 0);
    assert.ok(book.record(clue.id), clue.id);
    assert.equal(book.record(clue.id), false, 'A second visit must not duplicate a note');
  }
  assert.ok(book.ready(), `Unreachable clue in ${book.current().title}`);
}

test('the first hearing accounts for the fifteen original participants without counting its two future guests', () => {
  assert.equal(SCENES.length, 17);
  const expected = new Set(SCENES.filter(scene => !scene.hidden).map(scene => scene.region));
  assert.equal(expected.size, 15);
  assert.equal(SUPPLY_REGISTER.length, 15);
  assert.deepEqual(new Set(SUPPLY_REGISTER.map(record => record.region)), expected);
  assert.match(SUPPLY_REGISTER.find(record => record.region === 'kyo').holder, /ちよ/);
  assert.ok(SUPPLY_REGISTER.every(record => record.holder && record.use));
});

test('every named source is an identifiable resident and every interpretation is supported by an available note', () => {
  const people = new Map(CAST.map(person => [person.id, person]));
  const regions = new Set(SCENES.map(scene => scene.region));
  assert.equal(people.size, 59);
  assert.ok(CAST.every(person => regions.has(person.region) && person.line && person.occupation));
  const evidence = new Set();
  for (const chapter of CHAPTERS) {
    assert.ok(regions.has(chapter.verdictRegion));
    for (const clue of chapter.clues) {
      assert.ok(regions.has(clue.region), clue.id);
      if (clue.characterId) assert.equal(people.get(clue.characterId)?.name, clue.speaker);
      assert.ok(!evidence.has(clue.id), `Duplicate note ${clue.id}`);
      evidence.add(clue.id);
    }
    for (const proof of chapter.proofs) {
      assert.ok(proof.evidence.every(id => evidence.has(id)), proof.title);
      assert.ok(proof.evidence.includes(proof.answer));
      assert.equal(new Set(proof.evidence).size, proof.evidence.length);
      assert.ok(proof.choices[proof.correct]?.text);
      assert.ok(proof.choices.every((choice, i) => i === proof.correct || choice.feedback));
    }
  }
});

test('all seven mysteries and the festival remain solvable in opposite lead orders, with wrong answers and interrupted hearings', () => {
  for (const visitLast of [false, true]) {
    let book = createNotebook();
    for (const chapter of CHAPTERS) {
      assert.equal(book.current(), chapter);
      assert.equal(book.finish(), false);
      book.acceptRequest();
      for (const clue of chapter.clues.filter(clue => !book.leads().includes(clue)))
        assert.equal(book.record(clue.id), false, `A lead opened too soon: ${clue.id}`);
      gather(book, visitLast);
      for (const [i, proof] of chapter.proofs.entries()) {
        assert.equal(book.finish(), false);
        const before = book.save();
        const otherNote = proof.evidence.find(id => id !== proof.answer);
        const otherReason = proof.choices.findIndex((_, n) => n !== proof.correct);
        assert.equal(book.prove(otherNote, proof.correct), false);
        assert.equal(book.prove(proof.answer, otherReason), false);
        assert.deepEqual(book.save(), before);
        assert.ok(book.prove(proof.answer, proof.correct));
        book = createNotebook(JSON.parse(JSON.stringify(book.save())));
        assert.equal(book.current(), chapter);
        assert.equal(book.proofIndex, i + 1);
      }
      assert.ok(book.finish());
    }
    const done = createNotebook(book.save());
    assert.equal(done.index, 8);
    assert.equal(done.current(), undefined);
    assert.deepEqual(done.leads(), []);
    assert.equal(done.finish(), false);
  }
});

test('physical comparisons and the final invitations unlock only after meeting their witnesses', () => {
  const clue = id => CHAPTERS.flatMap(chapter => chapter.clues).find(item => item.id === id);
  assert.deepEqual(new Set(clue('steam-repair').requires), new Set(['packing-bars', 'prototype', 'steam-test']));
  assert.ok(clue('steaming-witness').requires.includes('cloth-test'));
  assert.ok(clue('rest-wish').requires.includes('mountain-tea'));
  assert.deepEqual(new Set(clue('matched-hinge').requires), new Set(['broken-hinge', 'palace-consent']));
  assert.ok(clue('lidded-bowl').requires.includes('palace-invitation'));
  assert.deepEqual(CHAPTERS[2].proofs.at(-1).interviews.map(person => person.speaker).sort(), ['お冬', '望']);
  assert.deepEqual(CHAPTERS.slice(5,7).map(chapter => [chapter.verdictPlace, chapter.proofs.length]), [['court',5], ['court',6]]);
});
