import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { openJourneyStorage } from '../two/journey-storage.js';
import { SAVE_KEY, LEGACY_KEY, BACKUP_KEY, PREVIOUS_KEY, SETTINGS_KEY, decodeJourney, replaceJourney } from '../two/journey-transfer.js';
import { BASIC_RECIPE, craftRecipe } from '../two/living-craft.js';

function mockStore(initial) {
  const data = new Map(initial);
  return { getItem:key=>data.get(key) ?? null, setItem:(key,v)=>data.set(key,v), removeItem:key=>data.delete(key) };
}
test('v2 through v12 keep the old journey intact and introduce one set of provisions', () => {
  const sample = createGame().save();
  for (let version=2; version<=12; version++) {
    const old=structuredClone(sample);
    old.version=version;delete old.livingWorld;
    old.score=27;
    old.items.length=version===2 ? 36 : version<=4 ? 48 : version===5 ? 56 : version===6 ? 62 : old.items.length;
    old.bikes.length=version===2 ? 6 : version<=4 ? 10 : version<=6 ? 14 : old.bikes.length;
    const game=createGame(old);
    assert.ok(game.restored,'v'+version);
    const world=game.state.livingWorld;
    assert.equal(world.wallet,24);
    assert.ok(world.worldMinute<1440);
    assert.ok(craftRecipe(world,BASIC_RECIPE,{regionId:'river'}).ok);
    const copy=createGame(game.save());
    assert.ok(copy.restored);
    assert.deepEqual(copy.state.livingWorld,world);
    assert.equal(copy.state.score,27);
  }
});
test('a stale writer, quota failure, and a corrupt file preserve the last playable record', () => {
  const original=JSON.stringify(createGame().save());
  const storage=mockStore([[LEGACY_KEY,original]]);
  const first=openJourneyStorage(storage), stale=openJourneyStorage(storage);
  const snapshot=JSON.parse(original);
  snapshot.livingWorld.revision++;
  first.write(snapshot);
  assert.equal(storage.getItem(LEGACY_KEY),original);
  assert.throws(()=>stale.write(snapshot),/conflict/);
  const good=storage.getItem(SAVE_KEY);
  const set=storage.setItem;
  storage.setItem=(key,value)=>{if(key===SAVE_KEY) throw new Error('quota');set(key,value);};
  snapshot.livingWorld.revision++;
  assert.throws(()=>first.write(snapshot),/quota/);
  assert.equal(storage.getItem(SAVE_KEY),good);
  assert.equal(storage.getItem(PREVIOUS_KEY),good);
  const settings={sound:false,yaw:0,goal:null};
  for(const broken of [{...snapshot,version:100},{...snapshot,livingWorld:null},
    {...snapshot,livingWorld:{...snapshot.livingWorld,inventory:{rice:-3}}}]) {
    assert.equal(decodeJourney({format:1,journey:broken,settings},createGame),null);
  }
  assert.equal(storage.getItem(SAVE_KEY),good);
  storage.setItem=set;
  replaceJourney(storage,settings,null);
  assert.equal(openJourneyStorage(storage).original,null);
  assert.equal(storage.getItem(BACKUP_KEY),good);
  assert.equal(JSON.parse(storage.getItem(SETTINGS_KEY)).sound,false);
  const next=openJourneyStorage(storage);
  next.write(createGame().save());
  next.write(snapshot);
  assert.equal(storage.getItem(BACKUP_KEY),good);
});
