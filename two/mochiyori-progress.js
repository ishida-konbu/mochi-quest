// The journal stores only acquired knowledge. Text and dependency rules stay in the authored story.
import { CAST, CHAPTERS, SCENES } from './mochiyori-story.js';

export const entries = new Map(CHAPTERS.flatMap(chapter => chapter.clues.map(clue => [clue.id, clue])));
export const placeKey = (region, place = '') => region + '/' + (place || '');
export const chapterLabel = number => number === 8 ? '終幕' : '第' + '一二三四五六七'[number - 1] + '話';

// Append new kinds at the end. Indices keep travel-transfer links compact.
export const memoryKeys = [
  ...CHAPTERS.flatMap(ch => ch.clues.filter(c => c.id !== 'returned-tools').map(c => 'clue/'+c.id)),
  ...CHAPTERS.flatMap(ch => ch.proofs.map((_,i) => 'proof/'+ch.id+'/'+i)),
  ...CHAPTERS.map(ch => 'end/'+ch.id),
  ...SCENES.map(s => 'food/'+s.region),
  ...CAST.map(c => 'talk/'+c.id),
  ...CAST.filter(c => ['弥平','八重','桃子','墨八','お澄','ささ'].includes(c.name)).map(c => 'guest/'+c.id),
  ...CAST.filter(c => c.name==='弥平').map(c => 'rest/'+c.id),
  'clue/returned-tools'
];
const memoryIndex = new Map(memoryKeys.map((key,i) => [key,i]));

const milestones = new Map(CHAPTERS.flatMap((ch,chapter) => [
  ['end/'+ch.id,{chapter,proof:null}],
  ...ch.proofs.map((_,proof) => ['proof/'+ch.id+'/'+proof,{chapter,proof}])
]));

// A handover is atomic with its note. Reconstructing a parcel from these two
// receipts also restores the bag of travellers with a pre-dialogue notebook.
const parcels = [
  ['same-rice', '棚田の米二包み', ['steam-test']],
  ['packing-bars', '蒸し箱の桟三本', ['steam-repair']],
  ['mended-cloth', 'おこげに借りた試し布', ['cloth-test']],
  ['terrace-letter', 'みのりから八重への便り', ['changed-day']],
  ['changed-day', '堺へ届ける搬入日の知らせ', ['ship-instruction']],
  ['changed-day', '浦へ届ける搬入日の知らせ', ['dawn-delivery']],
  ['changed-day', '稲荷へ届ける搬入日の知らせ', ['inari-delivery']],
  ['old-manifest', '竜宮から松原へ返す道具包み', ['returned-tools']],
  ['broken-hinge', '松原で預かった蝶番', ['matched-hinge']],
  ['request/festival', '桃林への招待状', ['peach-invitation']],
  ['request/festival', '竜宮への招待状', ['palace-invitation']],
  ['palace-invitation', '器を試す潮葛の真珠餅', ['lidded-bowl']],
];

export function createNotebook(snapshot) {
  const heard = new Set();
  const memories = new Map();
  function remember(key, siteIndex = 0) {
    const index = memoryIndex.get(key);
    if (index === undefined || !Number.isInteger(siteIndex) || siteIndex < 0 || siteIndex > 31) return false;
    if (!memories.has(index)) memories.set(index, siteIndex);
    return true;
  }
  let chapterIndex = 0;
  let proofIndex = 0;
  let pin = null;
  let requested = false;
  function acceptRequest() {
    if (!current() || requested) return false;
    requested = true;
    if (pin === 'request') pin = null;
    return true;
  }
  function carrying() {
    const requestKey = requested ? 'request/' + current()?.id : null;
    return parcels.filter(([source, , destinations]) =>
      (source === requestKey || heard.has(source)) && !destinations.some(id => heard.has(id)));
  }
  function hasParcelFor(id) {
    return !parcels.some(([, , destinations]) => destinations.includes(id)) ||
      carrying().some(([, , destinations]) => destinations.includes(id));
  }
  function available(clue) {
    return clue.requires.every(id => heard.has(id));
  }
  function record(id) {
    const clue = current()?.clues.find(item => item.id === id);
    if (!clue || heard.has(id) || !available(clue)) return false;
    heard.add(id);
    if (pin === id) pin = null;
    return true;
  }
  function current() { return CHAPTERS[chapterIndex]; }
  function ready() { return !!current() && current().clues.every(clue => heard.has(clue.id)); }
  function prove(evidence, reason) {
    const proof = current()?.proofs[proofIndex];
    if (!ready() || !proof || evidence !== proof.answer || reason !== proof.correct) return false;
    proofIndex++;
    return true;
  }
  function finish() {
    if (!ready() || proofIndex !== current().proofs.length) return false;
    chapterIndex++;
    proofIndex = 0;
    pin = null;
    requested = false;
    return true;
  }
  function leads() { return current()?.clues.filter(clue => !heard.has(clue.id) && available(clue)) ?? []; }
  function track(id) {
    if (id !== null && !(id === 'request' && current() && !requested) &&
        !(id === 'verdict' && ready()) && !leads().some(clue => clue.id === id)) return false;
    pin = id;
    return true;
  }
  // Keep a consistent prefix even if an old, partial, or edited save contains stale IDs.
  if (snapshot?.v === 1 && Array.isArray(snapshot.notes)) {
    const saved = new Set(snapshot.notes);
    // Older notebooks settled the return when the hearing began. Preserve
    // a hearing already under way, and every journey that has passed it.
    if (Number.isInteger(snapshot.chapter) && (snapshot.chapter > 4 ||
        (snapshot.chapter === 4 && snapshot.proof > 0)) && saved.has('old-manifest'))
      saved.add('returned-tools');
    while (current()) {
      let changed;
      do {
        changed = false;
        for (const id of saved) if (record(id)) changed = true;
      } while (changed);
      if (chapterIndex >= snapshot.chapter || !Number.isInteger(snapshot.chapter) ||
          snapshot.chapter > CHAPTERS.length || !ready()) break;
      proofIndex = current().proofs.length;
      finish();
    }
    if (current() && ready() && chapterIndex === snapshot.chapter && Number.isInteger(snapshot.proof))
      proofIndex = Math.max(0, Math.min(current().proofs.length, snapshot.proof));
    requested = !!current() && (snapshot.request === current().id || current().clues.some(c => heard.has(c.id)));
    track(snapshot.pin);
  }
  // Previous editions recorded testimony and decisions. These already witnessed
  // scenes remain available to a traveller returning with an earlier notebook.
  if (snapshot?.v === 1 && Array.isArray(snapshot.scenes)) {
    for (const encoded of snapshot.scenes.slice(0,memoryKeys.length)) {
      if (Number.isInteger(encoded) && encoded >= 0) remember(memoryKeys[Math.floor(encoded/32)],encoded%32);
    }
  }
  function seen(key) {
    const step=milestones.get(key);
    const solved=step && (step.chapter<chapterIndex || (step.chapter===chapterIndex && step.proof!==null && step.proof<proofIndex));
    return Boolean(memories.has(memoryIndex.get(key)) || solved || (key.startsWith('clue/') && heard.has(key.slice(5))));
  }
  return {
    get index() { return chapterIndex; }, get proofIndex() { return proofIndex; }, get pin() { return pin; },
    get requested() { return requested; }, acceptRequest, hasParcelFor, items: () => carrying().map(([,name]) => name),
    remember, seen, seenAt: key => memories.get(memoryIndex.get(key)),
    has: id => heard.has(id), current, ready, leads, record, prove, finish, track,
    save: () => ({v: 1, chapter: chapterIndex, proof: proofIndex, notes: [...heard], pin,
      ...(requested && {request: current().id}),
      ...(memories.size && {scenes: [...memories].map(([i,site]) => i*32+site)})})
  };
}
