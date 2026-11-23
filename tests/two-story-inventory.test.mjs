import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAPTERS } from '../two/mochiyori-story.js';
import { PARCELS } from '../two/mochiyori-parcels.js';
import { createNotebook } from '../two/mochiyori-progress.js';

function atChapter(index, notes = []) {
  const previous = CHAPTERS.slice(0,index).flatMap(ch => ch.clues.map(c => c.id));
  const book = createNotebook({v:1,chapter:index,notes:previous.concat(notes),proof:0});
  book.acceptRequest();
  return book;
}

test('both drawings leave the bag in the same exchange that adds the test cloth', () => {
  const book = atChapter(2);
  assert.ok(book.record('wedding-filling'));
  const before = book.save();
  assert.equal(book.record('mended-cloth'), false);
  assert.deepEqual(book.save(), before);
  assert.ok(book.record('walnut-filling'));
  const restored = createNotebook(book.save());
  assert.deepEqual(restored.inventory().map(p => p.id), ['wedding-print','trial-print']);
  assert.ok(restored.record('mended-cloth'));
  assert.equal(restored.record('mended-cloth'), false);
  assert.deepEqual(createNotebook(restored.save()).inventory().map(p => p.id), ['trial-cloth']);
});

test('a legacy note already delivered in a different order does not reissue that parcel', () => {
  const book = atChapter(6,['continued-work']);
  assert.ok(book.has('continued-work'));
  assert.ok(book.record('joint-work'));
  assert.deepEqual(book.inventory().map(p => p.id), ['makers-seals']);
  assert.deepEqual(book.inventory(), createNotebook(book.save()).inventory());
});

test('every authored item is earned, persists in transit and reaches its unique destination', () => {
  const acquired = new Set();
  const delivered = new Set();
  let book = createNotebook();
  function commit(fn) {
    const before = book.inventory();
    assert.ok(fn());
    const after = book.inventory();
    for (const item of after.filter(item => !before.includes(item))) {
      assert.ok(!acquired.has(item.id), item.id);
      acquired.add(item.id);
    }
    for (const item of before.filter(item => !after.includes(item))) delivered.add(item.id);
    book = createNotebook(book.save());
    assert.deepEqual(book.inventory(), after);
    assert.deepEqual(new Set(book.deliveredItems().map(item => item.id)),delivered);
  }
  for (const chapter of CHAPTERS) {
    commit(book.acceptRequest);
    while (book.leads().length) commit(() => book.record(book.leads().at(-1).id));
    assert.ok(book.ready());
    for (const proof of chapter.proofs) commit(() => book.prove(proof.answer,proof.correct));
    commit(book.finish);
  }
  assert.equal(acquired.size, PARCELS.length);
  assert.deepEqual(delivered,acquired);
  assert.deepEqual(book.inventory(),[]);
});
