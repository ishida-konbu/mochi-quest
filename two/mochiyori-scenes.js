import { CAST, CHAPTERS, SCENES } from './mochiyori-story.js';
import * as scores from './mochiyori-choreography.js';
import { STORY_SITES, storySite } from './story-sites.js';

const catalog = new Map();
function register(key, score, region, place, category, chapter = null) {
  if (!score) return;
  catalog.set(key,{...score,key, site:storySite(region,place), category,chapter});
}
for (const ch of CHAPTERS) {
  for (const c of ch.clues) register('clue/'+c.id,scores.CLUE_SCENES?.[c.id],c.region,c.place,c.kind,ch);
  ch.proofs.forEach((_,i) => register('proof/'+ch.id+'/'+i,scores.PROOF_SCENES?.[ch.id+'/'+i],ch.verdictRegion,ch.verdictPlace,'推理',ch));
  register('end/'+ch.id,scores.CHAPTER_SCENES?.[ch.id],ch.verdictRegion,ch.verdictPlace,'結び',ch);
}
for (const s of SCENES) register('food/'+s.region,scores.FOOD_SCENES?.[s.region],s.region,null,'土地の餅');
for (const person of CAST) {
  register('talk/'+person.id,scores.AMBIENT_SCENES?.[person.id],person.region,null,'聞き込み');
  register('rest/'+person.id,scores.AMBIENT_SCENES?.[person.id]?.sites?.peach,'peach',null,'桃林での休養');
  register('guest/'+person.id,scores.FESTIVAL_SCENES?.[person.id],'kyo',null,'祭の客');
}
export const performedScenes = catalog;
export const sceneLocation = (site) => STORY_SITES.findIndex(s => s.region === site.region && s.place === site.place);
export function memoryScene(book, key, visiting) {
  const score = catalog.get(key);
  if (!score) return null;
  const site = visiting || STORY_SITES[book.seenAt(key)] || score.site;
  return {...score,site, number:SCENES.findIndex(s => s.region === site.region)+1};
}
