import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../two/game.js';
import { canOccupy, BUILDINGS, REGIONS, SNOW_SPRING, groundHeight, terrainHeight } from '../two/terrain.js';
import { fromHokora, HOKORA_LANTERN, HOKORA_ROOM } from '../two/lake-hokora-layout.js';
import { FOREST_LAKE, isletPoint, snowPoint } from '../two/snow-country.js';
import { COURT } from '../two/retreat-layout.js';
import { PAGES_ORIGIN, WORKER_ORIGIN, SAVE_KEY, SETTINGS_KEY, decodeTransfer, replaceJourney, storeTransfer, transferURL, travelCameraPreference } from '../two/journey-transfer.js';

const settings = { sound:false, yaw:-1.27, goal:'moon' };
function decode(hash) { return decodeTransfer(WORKER_ORIGIN,hash,createGame,REGIONS); }
function encode(journey,options=settings) { return new URL(transferURL(PAGES_ORIGIN,journey,options)); }
test('a transfer carries only a normalized Mochi Quest 2 save and settings in the fragment',()=>{
  const save=createGame().save();
  save.score=270;
  save.visited.push('snow');
  save.player.unknown='extra'; save.unknown='extra';
  const url=encode(save,{...settings,unrelated:'extra'});
  assert.equal(url.origin+url.pathname,WORKER_ORIGIN+'/two/');
  assert.equal(url.search,'');
  assert.equal(transferURL('https://example.org',save,settings),null);
  assert.equal(decodeTransfer(PAGES_ORIGIN,url.hash,createGame,REGIONS),null);
  const incoming=decode(url.hash);
  assert.equal(incoming.game.save().score,270);
  assert.deepEqual(incoming.game.save().visited,['river','snow']);
  assert.equal(incoming.game.save().player.unknown,undefined);
  assert.equal(incoming.game.save().unknown,undefined);
  assert.deepEqual(incoming.settings,{...settings,volumes:{effects:1,ambient:1,music:1}});
  const mixed=decode(encode(save,{...settings,volumes:{effects:0,ambient:.6,music:.25}}).hash);
  assert.deepEqual(mixed.settings.volumes,{effects:0,ambient:.6,music:.25});
});

test('local and transferred camera preferences preserve explicit choices across the rename', () => {
  const save = createGame().save();
  for (const [fields, expected] of [
    [{}, undefined],
    [{ dangoCamera: false }, false],
    [{ dangoCamera: true }, true],
    [{ travelCamera: false }, false],
    [{ travelCamera: true }, true],
    [{ travelCamera: true, dangoCamera: false }, true],
    [{ travelCamera: false, dangoCamera: true }, false],
    [{ travelCamera: null, dangoCamera: false }, false],
    [{ travelCamera: 'false', dangoCamera: 'true' }, undefined],
  ]) {
    assert.equal(travelCameraPreference(fields), expected);
    const incoming = decode(encode(save, { ...settings, ...fields }).hash);
    assert.equal(incoming.settings.travelCamera, expected);
    assert.ok(!Object.hasOwn(incoming.settings, 'dangoCamera'));
  }
});

test('journey transfers keep each scenery preset and accept legacy or unrecognized preferences', () => {
  const save = createGame().save();
  for (const sceneryQuality of ['beautiful', 'normal', 'light']) {
    const incoming = decode(encode(save, { ...settings, sceneryQuality }).hash);
    assert.equal(incoming.settings.sceneryQuality, sceneryQuality);
  }
  for (const sceneryQuality of [undefined, null, 'auto', 'constructor', 1]) {
    const incoming = decode(encode(save, { ...settings, sceneryQuality }).hash);
    assert.equal(incoming.game.restored, true);
    assert.ok(!Object.hasOwn(incoming.settings, 'sceneryQuality'));
  }
});

test('historical six-district saves retain their stamps and acquire stocked new bike ports',()=>{
  const old=createGame().save();
  old.version=2; old.items.length=36;old.bikes.length=6;old.visited.push('market');
  const loaded=decode(encode(old).hash).game.save();
  assert.equal(loaded.version,12);
  assert.deepEqual(loaded.visited,old.visited);
  assert.equal(loaded.bikes.length,16);
});

test('invalid fragments, invalid snapshots and invalid preferences do not become a new empty game',()=>{
  const save=createGame().save();
  for (const fragment of ['#guide','#mochi2=%E0%A4%A','#mochi2='+'.'.repeat(24000),
    encode({...save,score:-1}).hash, encode({...save,items:[]}).hash,encode(save,{...settings,sound:0}).hash,
    encode(save,{...settings,goal:'missing'}).hash,encode(save,{...settings,yaw:null}).hash])
    assert.equal(decode(fragment),null);
});

test('failed storage retains the previous settings and journey',()=>{
  const old=new Map([[SAVE_KEY,'old journey'],[SETTINGS_KEY,'old settings']]);
  const storage={getItem:k=>old.get(k)??null,removeItem:k=>old.delete(k),setItem(k,value){
    if(k===SAVE_KEY) throw new Error('quota');
    old.set(k,value);
  }};
  assert.throws(()=>storeTransfer(storage,decode(encode(createGame().save()).hash)));
  assert.equal(old.get(SETTINGS_KEY),'old settings');
  assert.equal(old.get(SAVE_KEY),'old journey');
});

test('reset removes only the second journey and rolls back preferences if removal fails', () => {
  const records = new Map([[SAVE_KEY, 'old journey'], [SETTINGS_KEY, 'old settings'], ['other', 'keep']]);
  const storage = {
    getItem: key => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem() { throw new Error('denied'); },
  };
  const preferences = { sound: false, volumes: { music: .25 }, yaw: 0, goal: null, resetAt: 5 };
  assert.throws(() => replaceJourney(storage, preferences, null), /denied/);
  assert.equal(records.get(SETTINGS_KEY), 'old settings');
  assert.equal(records.get(SAVE_KEY), 'old journey');
  storage.removeItem = key => records.delete(key);
  replaceJourney(storage, preferences, null);
  assert.equal(records.has(SAVE_KEY), false);
  assert.deepEqual(JSON.parse(records.get(SETTINGS_KEY)), preferences);
  assert.equal(records.get('other'), 'keep');
});

test('older travellers keep their place inside the relocated court and both shop lofts',()=>{
  const snap=createGame().save(), close=(a,b)=>assert.ok(Math.abs(a-b)<.0001,a+' differs from '+b);
  const resume=(x,z,y)=>{
    Object.assign(snap.player,{x,z,y,h:0,heading:.4,grounded:true});
    const game=createGame(snap);
    assert.ok(game.restored);
    const next=game.save();
    assert.equal(next.version,12);
    const reloaded=createGame(next).save().player;
    for(const key of ['x','y','z','heading'])close(reloaded[key],next.player[key]);
    return next.player;
  };
  snap.version=7;
  const court=resume(155,-877,5.09111+1.05);
  close(court.x,COURT.x);close(court.z,COURT.z+5);
  close(court.y,terrainHeight(COURT.x,COURT.z)+1.05);
  const avenue=resume(155,-848,5.1);
  close(avenue.x,155);close(avenue.z,-848);
  for(const [x,base,craft] of [[151.5,7.05777,'rush'],[170,5.36271,'lacquer']]){
    const shop=BUILDINGS.find(b=>b.craft===craft && b.z===-915.5 && b.x===x);
    const inside=resume(x-.3,-904.06+.7,base+3.38);
    close(inside.x,shop.x+.3);close(inside.z,shop.z-.7);close(inside.y,shop.y+3.38);
    close(inside.heading,.4-Math.PI);
  }
  snap.version=6;snap.items.length=62;snap.bikes.length=14;
  const firstHall=resume(162,-867,4.06465+1.05);
  close(firstHall.x,COURT.x);close(firstHall.z,COURT.z+5);
});

test('a v11 traveller on the snow pagoda resumes on the same roof facing the winter sea',()=>{
  const tower=BUILDINGS.find(b=>b.snow && b.kind==='pagoda');
  const [x,z]=snowPoint(-78.8,-322);
  const roof=groundHeight(x,z,Infinity);
  const journal=createGame().save();
  journal.version=11;
  Object.assign(journal.player,{x:-78.8,z:-322,y:roof-tower.y+7.73876478562608,h:0,heading:.14});
  journal.visited.push('snow');
  const game=createGame(journal);
  assert.ok(game.restored);
  assert.deepEqual([game.state.player.x,game.state.player.z],[x,z]);
  assert.ok(Math.abs(game.state.player.y-roof)<1e-8);
  assert.equal(game.state.player.heading,.14);
  assert.deepEqual(game.state.visited,journal.visited);
  assert.deepEqual(createGame(game.save()).save().player,game.save().player);
});

test('a v11 snow bather travels with the bath; v12 lake swimmers resume on the same water or reclaimed ground',()=>{
  const journal=createGame().save();
  journal.version=11;
  journal.lastBath='onsen-48';
  Object.assign(journal.player,{x:-32,z:-292,y:8.353011637113925,h:0,activity:'bath',activityTime:2});
  const moved=createGame(journal);
  assert.equal(moved.save().lastBath,journal.lastBath);
  assert.deepEqual([moved.state.player.x,moved.state.player.z],[SNOW_SPRING.x,SNOW_SPRING.z]);
  assert.equal(moved.state.player.activity,'bath');

  const lakeJournal=createGame().save();
  lakeJournal.version=12;
  for(const [x,z,inWater] of [[...isletPoint(.81,2),true],[FOREST_LAKE.x,FOREST_LAKE.z,false]]){
    // Before the island was raised either position was a surface swim.
    Object.assign(lakeJournal.player,{x,z,h:0,y:-.19,grounded:true});
    const lake=createGame(lakeJournal),p=lake.state.player;
    assert.ok(lake.restored && lake.state.onLake);
    assert.equal(p.inWater,inWater);
    assert.deepEqual([p.x,p.z],[x,z]);
    assert.equal(p.y,groundHeight(x,z,p.y));
    assert.deepEqual(lake.state.visited,lakeJournal.visited);
  }
});

test('a lake swimmer saved beneath the future shrine or lantern returns on the clear forecourt',()=>{
  for(const site of [HOKORA_ROOM,HOKORA_LANTERN]){
    const [x,z]=fromHokora(site.x,site.z),journal=createGame().save();
    journal.version=12;
    Object.assign(journal.player,{x,z,y:-.19,h:0,grounded:true});
    const game=createGame(journal),p=game.state.player;
    assert.ok(game.restored && game.state.onLake && !p.inWater);
    assert.ok(Math.hypot(p.x-x,p.z-z)<6 && canOccupy(p.x,p.z,p.y,.26,1.66));
    assert.deepEqual(createGame(game.save()).save().player,game.save().player);
  }
});
