import { Box3, Group, Vector3 } from './vendor/three.module.min.js';
import { createModelContacts } from './story-model-contacts.js';
import { CAST } from './mochiyori-story.js';
import { STORY_SITES } from './story-sites.js';
import { placeKey } from './mochiyori-progress.js';
import { createStoryCharacter, poseStoryCharacter, createStoryStillLife, animateStoryStillLife } from './story-models.js';
import { REGIONS, canOccupy, groundHeight, wrapDelta } from './terrain.js';

import { createFieldwork } from './mochiyori-fieldwork.js';

const helpers = [
  {id:'road-tea-host',region:'peach',name:'茶屋の亭主',species:'兎',occupation:'桃山の団子茶屋の亭主',line:'よく歩いたね。茶を一杯どうだい。桃林へ入る道なら、うちの前を通るよ。'},
  {id:'charcoal-burner',region:'peach',name:'炭焼き',species:'蛙',occupation:'山道の炭焼き',line:'炭俵を届けた帰りでね。ひと息ついてから、また山へ戻るよ。'}
];
const residents = [...CAST, ...helpers];
const byName = new Map(residents.map(person => [person.name,person]));
const festivalGuests = ['弥平','八重','桃子','墨八','お澄','ささ','ちよ'];
const residentsAtHome = { おこげ:'rashomon', 宗伯:'court', すずり:'court', ちよ:'teahouse', 玄鐘:'bell', '茶屋の亭主':'road-tea', 炭焼き:'road-tea' };
const locations = new Map(STORY_SITES.map(site => {
  const key = placeKey(site.region,site.place);
  return [key,{...site,key,number:REGIONS.findIndex(r => r.id === site.region)+1}];
}));
export const locationFor = (region, place) => locations.get(placeKey(region, place));
export function peopleAt(site, book) {
  const chapter = book.current();
  const visitors = new Map();
  for (const clue of chapter?.clues || []) {
    const where = placeKey(clue.region, clue.place);
    if (clue.characterId) visitors.set(clue.characterId, where);
  }
  // In the fifth chapter reports along the mountain road must lead to the missing artisan himself.
  if (book.index >= 4) visitors.set(byName.get('弥平').id, placeKey('peach'));
  const summoned = (chapter && book.ready()) ? ({
    mystery_01:['八重'], mystery_02:['楓','八重'], mystery_03:['望','お冬','結','八重'],
    mystery_06:['宗伯','お澄','すずり','勘兵衛','八重'],
    mystery_07:['宗伯','八重','すずり','お澄','勘兵衛','版次','弥平'],
    festival:['おこげ','ささ','弥平','八重','お澄','桃子','墨八','ちよ']
  }[chapter.id] || []) : [];
  for (const name of summoned) visitors.set(byName.get(name).id, placeKey(chapter.verdictRegion,chapter.verdictPlace));
  if (!chapter) for (const name of festivalGuests) visitors.set(byName.get(name).id,placeKey('kyo'));
  // Keep each person's place while a clue is heard. Changing the order on
  // every entry used to make the witness jump to the other side of the table.
  return residents.filter(person => (visitors.get(person.id) || placeKey(person.region,residentsAtHome[person.name])) === site.key);
}
const builtIn = {rashomon:'羅生門の老婆餅', bell:'鐘を守る僧餅'};
const offsets = [[-1.58,-.66],[1.58,-.66],[-.65,-1.69],[.96,-1.93],
  [-3.02,-1.3],[3.10,-1.5],[-2.73,1.0],[2.85,1.0],[-1.50,-3.30],[1.45,-3.30],
  [-4.15,.58],[4.16,.54],[-.3,-3.8],[-3.73,-2.91],[3.92,-2.89]];
const seatCache = new Map();
function seatsAt(site) {
  if (seatCache.has(site.key)) return seatCache.get(site.key);
  const seats = [], yaw = site.yaw || 0;
  const positions = site.region==='river' ? [[-1.76,-.40],[-.32,-.82],[1.79,-.38],...offsets.slice(3)] : offsets;
  for (const [u,v] of positions) {
    const x=site.x+u*Math.cos(yaw)+v*Math.sin(yaw), z=site.z+v*Math.cos(yaw)-u*Math.sin(yaw);
    const y=groundHeight(x,z,site.y+.4);
    if (Math.abs(y-site.y)>.82 || !canOccupy(x,z,y+.04,.29,1.55)) continue;
    seats.push({x,y,z,yaw:yaw-Math.atan2(u,2.9)});
  }
  seatCache.set(site.key,seats);
  return seats;
}

const bounds = new Box3();
const floor = new Vector3();
export function createStoryWorld(scene, book, collisions, getHero = () => null) {
  const group = new Group();
  group.name = 'もち寄り祭の仕事場';
  scene.add(group);
  const tables = new Map(), animals = new Map(), shapes = new WeakMap(), headOffsets = new WeakMap();
  const work = createFieldwork(scene);
  function shape(model,skip) {
    if (!shapes.has(model)) shapes.set(model,createModelContacts(model,skip));
    return shapes.get(model);
  }
  let chapter = -1, stations = [], speakers = [], nextSurvey = -Infinity;
  let lastX = Infinity, lastZ = Infinity, lastY = Infinity, revision = 0, drawnRevision = -1;
  let held = null;
  function addSpeaker(actor,person,site,index,external=false) {
    if (!headOffsets.has(actor)) {
      actor.getWorldPosition(floor);
      bounds.setFromObject(actor);
      // Measure once per actual rig. Tall ears, antlers and the sea guests'
      // carrying basin need different headroom above the same floor.
      headOffsets.set(actor,Math.max(.65,Math.min(3.3,bounds.max.y-floor.y))+.12);
    }
    speakers.push({actor,person,site,index,external,anchor:new Vector3()});
  }
  function rebuild(p) {
    group.clear();
    stations = []; speakers = [];
    const fixtures = [];
    for (const site of locations.values()) {
      if (Math.hypot(wrapDelta(p.x-site.x),wrapDelta(p.z-site.z))>45 || Math.abs(p.y-site.y)>25) continue;
      const cast = peopleAt(site,book);
      if (!cast.length) continue;
      if (builtIn[site.place]) {
        // These two residents already have full models in the gate and belfry.
        // A second copy would receive a second silhouette and collision body.
        const actor = scene.getObjectByName(builtIn[site.place]);
        if (actor) addSpeaker(actor,cast[0],site,0,true);
        else drawnRevision = -1; // The temple creates its monks on approach.
        continue;
      }
      const festival = site.key===placeKey('kyo') && !book.current();
      if (site.place!=='road-tea') {
        const edition = festival ? 8 : site.place==='court' && book.index>=5 ? 7 : 0;
        const key = site.key+'-'+edition;
        if (!tables.has(key)) tables.set(key,createStoryStillLife(site.number,edition,site.place));
        const table = tables.get(key);
        table.position.set(site.x,site.y,site.z); table.rotation.y=site.yaw;
        group.add(table);
        stations.push({table,site});
        fixtures.push({...site,kind:'table',modelContact:shape(table,table.children[0])});
      }
      const seats=seatsAt(site);
      for (const [i,person] of cast.entries()) {
        const seat=seats[i];
        if (!seat) throw new Error(site.name+'に'+person.name+'の立ち位置がありません');
        const version=person.id+(festival?'/festival':'');
        if (!animals.has(version)) animals.set(version,createStoryCharacter(person,{festivalGuest:festival}));
        const actor=animals.get(version);
        actor.position.set(seat.x,seat.y,seat.z);actor.rotation.y=seat.yaw;
        group.add(actor);addSpeaker(actor,person,site,i);
        fixtures.push({...seat,kind:'person',species:person.species,name:person.name,modelContact:shape(actor)});
      }
    }
    collisions?.update(fixtures);
  }
  return {
    visible(value) { group.visible=value; },
    invalidate() { revision++; },
    holdSpeaker(id) { held=id || null; },
    speakers() { return speakers; },
    playAction(key,personId) {
      const host=speakers.find(s=>s.person.id===personId || s.person.name===personId);
      return host ? work.start(key,host,speakers,stations.find(s=>s.site===host.site)?.table,getHero()) : 0;
    },
    stopAction: work.stop,
    get actionPlaying(){return work.playing;},
    get actionFocus(){return work.focus;},
    update(time,p) {
      const walked=Math.hypot(p.x-lastX,p.z-lastZ,p.y-lastY);
      if ((!held || walked>12) && (chapter!==book.index || drawnRevision!==revision ||
          (time>=nextSurvey && walked>5))) {
        chapter=book.index; drawnRevision=revision;
        lastX=p.x;lastY=p.y;lastZ=p.z;nextSurvey=time+.35;
        work.stop(); rebuild(p);
      }
      for (const {actor,site,index,external} of speakers) {
        if (!external) poseStoryCharacter(actor,time+index*.94,Math.hypot(p.x-site.x,p.z-site.z)<7);
      }
      // Evidence stays at rest until someone actually takes it in hand.
      for (const {table} of stations) animateStoryStillLife(table,time,false);
      work.update(time);
      for (const s of speakers) {
        s.actor.getWorldPosition(s.anchor);s.anchor.y+=headOffsets.get(s.actor);
      }
      collisions?.posed();
    },
    nearest(p,preferredId) {
      if (p.activity) return null;
      let best=null;
      for (const speaker of speakers) {
        const {site,person,actor}=speaker;
        actor.getWorldPosition(floor);
        if (Math.abs(p.y-floor.y)>2.25) continue;
        const distance=Math.hypot(wrapDelta(p.x-floor.x),wrapDelta(p.z-floor.z));
        if (distance>3.5) continue;
        if (person.id===preferredId || !best || distance<best.distance) {
          best={site,person,distance,action:'story',label:person.name+'に話しかける'};
          if (person.id===preferredId) break;
        }
      }
      return best;
    }
  };
}
