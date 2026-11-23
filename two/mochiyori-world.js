import { Group } from './vendor/three.module.min.js';
import { createModelContacts } from './story-model-contacts.js';
import { CAST } from './mochiyori-story.js';
import { STORY_SITES } from './story-sites.js';
import { placeKey } from './mochiyori-progress.js';
import { createStoryCharacter, poseStoryCharacter, createStoryStillLife, animateStoryStillLife } from './story-models.js';
import { REGIONS, groundHeight, wrapDelta } from './terrain.js';

const cast = new Map(CAST.map(person => [person.id, person]));
const festivalGuests = ['弥平','八重','桃子','墨八','お澄','ささ'];
const residentsAtHome = { おこげ:'rashomon', 宗伯:'court', すずり:'court', ちよ:'teahouse', 玄鐘:'bell' };
const locations = new Map(STORY_SITES.map(site => {
  const key = placeKey(site.region,site.place);
  return [key,{...site,key,number:REGIONS.findIndex(r => r.id === site.region)+1}];
}));
export const locationFor = (region, place) => locations.get(placeKey(region, place));
export function storyDestination(book) {
  if (book.pin === 'verdict' && book.ready()) return locationFor(book.current().verdictRegion, book.current().verdictPlace);
  const clue = book.leads().find(c => c.id === book.pin);
  return clue && locationFor(clue.region, clue.place);
}
export function peopleAt(site, book) {
  const chapter = book.current();
  const visitors = new Map();
  for (const clue of chapter?.clues || []) {
    const where = placeKey(clue.region, clue.place);
    if (clue.characterId) visitors.set(clue.characterId, where);
  }
  // In the fifth chapter reports along the mountain road must lead to the missing artisan himself.
  const artisan = CAST.find(c => c.name === '弥平');
  if (artisan && book.index >= 4) visitors.set(artisan.id, placeKey('peach'));
  // Witnesses join the hearing only after fieldwork has finished.
  const summoned = book.ready() ? ({
    mystery_03:['望','お冬'], mystery_06:['宗伯','お澄','すずり','勘兵衛','八重'],
    mystery_07:['宗伯','八重','すずり','お澄','勘兵衛','版次']
  }[chapter.id] || []) : [];
  for (const name of summoned) {
    const person = CAST.find(c => c.name === name);
    visitors.set(person.id,placeKey(chapter.verdictRegion,chapter.verdictPlace));
  }
  if (!chapter) for (const person of CAST) {
    if (festivalGuests.includes(person.name)) visitors.set(person.id,placeKey('kyo'));
  }
  const residents = CAST.filter(person => (visitors.get(person.id) || placeKey(person.region,residentsAtHome[person.name])) === site.key);
  const featured = (chapter?.clues || []).filter(c => placeKey(c.region, c.place) === site.key && !book.has(c.id)).map(c => cast.get(c.characterId));
  const witnesses = (chapter ? summoned : festivalGuests).map(name => residents.find(person => person.name === name)).filter(Boolean);
  return [...new Set([...witnesses,...featured.filter(person => residents.includes(person)),...residents])];
}
export function siteActions(site, book) {
  return book.leads().filter(c => placeKey(c.region, c.place) === site.key);
}
export function verdictHere(site, book) {
  const chapter = book.current();
  return !!chapter && site.key === placeKey(chapter.verdictRegion, chapter.verdictPlace);
}

export function createStoryWorld(scene, book, collisions) {
  const group = new Group();
  group.name = 'もち寄り祭の仕事場';
  scene.add(group);
  const tables = new Map(), animals = new Map(), shapes = new WeakMap();
  function shape(model,skip) {
    if (!shapes.has(model)) shapes.set(model,createModelContacts(model,skip));
    return shapes.get(model);
  }
  let chapter = -1, active = [], nextSurvey = -Infinity;
  function rebuild(p) {
    group.clear();
    active = [];
    const fixtures = [];
    for (const site of locations.values()) {
      if (Math.hypot(wrapDelta(p.x - site.x), wrapDelta(p.z - site.z)) > 45 || Math.abs(p.y - site.y) > 25) continue;
      const residents = peopleAt(site, book);
      const hasInquiry = residents.length || (book.current()?.clues || []).some(c => placeKey(c.region,c.place) === site.key) || verdictHere(site, book);
      if (!hasInquiry) continue;
      let edition = 0;
      if (site.region === 'kyo' && site.place === 'court' && book.index >= 5) edition = 7;
      if (site.region === 'kyo' && !site.place && !book.current()) edition = 8;
      // The gate attic already contains the seated seamstress and her sewing mat.
      if (['rashomon','bell','road-tea'].includes(site.place)) { active.push({site, station:true}); continue; }
      const key = site.key + '-' + (site.number === 11 ? edition : 0);
      if (!tables.has(key)) tables.set(key, createStoryStillLife(site.number, edition, site.place));
      const table = tables.get(key);
      table.position.set(site.x, site.y, site.z);
      table.rotation.y = site.yaw || 0;
      group.add(table);
      active.push({table, site, station:true});
      fixtures.push({...site,kind:'table',modelContact:shape(table,table.children[0])});
      const offsets = [[-2.05, -.62], [2.12, -.57], [-.75, -1.8], [1.02, -1.84]];
      const festivalGuest = !book.current() && site.key === placeKey('kyo');
      if (site.place === 'court' || festivalGuest) offsets.push([-3.68,-1.5],[3.65,-1.55]);
      residents.slice(0, offsets.length).forEach((person, i) => {
        const version = person.id + (festivalGuest ? '/festival' : '');
        if (!animals.has(version)) animals.set(version, createStoryCharacter(person,{festivalGuest}));
        const actor = animals.get(version);
        const [u,v] = offsets[i], yaw = site.yaw || 0;
        const x = site.x + u*Math.cos(yaw) + v*Math.sin(yaw), z = site.z + v*Math.cos(yaw) - u*Math.sin(yaw);
        const y = groundHeight(x,z,site.y+.4);
        actor.position.set(x, Math.abs(y-site.y) < 1.3 ? y : site.y, z);
        actor.rotation.y = yaw - Math.atan2(u, 2.9);
        fixtures.push({x,y:actor.position.y,z,yaw:actor.rotation.y,kind:'person',species:person.species,name:person.name,modelContact:shape(actor)});
        group.add(actor);
        active.push({actor, site, i});
      });
    }
    collisions?.update(fixtures);
  }
  let lastX = Infinity, lastZ = Infinity, lastY = Infinity, revision = 0, drawnRevision = -1;
  return {
    visible(value) { group.visible = value; },
    invalidate() { revision++; },
    update(time, p) {
      if (chapter !== book.index || drawnRevision !== revision ||
          (time >= nextSurvey && Math.hypot(p.x-lastX,p.z-lastZ,p.y-lastY) > 5)) {
        chapter = book.index; drawnRevision = revision;
        lastX = p.x; lastY = p.y; lastZ = p.z; nextSurvey = time + .35;
        rebuild(p);
      }
      for (const item of active) {
        const close = Math.hypot(p.x-item.site.x,p.z-item.site.z) < 7;
        if (item.actor) poseStoryCharacter(item.actor, time + item.i * .94, close);
        else if (item.table) animateStoryStillLife(item.table, time, close);
      }
      collisions?.posed();
    },
    nearest(p) {
      if (p.activity) return null;
      let best = null;
      for (const {site, station} of active) {
        if (!station || Math.abs(p.y-site.y) > 2.75) continue;
        const distance = Math.hypot(wrapDelta(p.x-site.x), wrapDelta(p.z-site.z));
        if (distance <= 4.7 && (!best || distance < best.distance)) best = {site, distance, action:'story', label: site.name + 'で話を聞く・調べる'};
      }
      return best;
    }
  };
}
