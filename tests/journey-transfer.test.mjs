import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../two/game.js';
import { REGIONS } from '../two/terrain.js';
import { PAGES_ORIGIN, WORKER_ORIGIN, SAVE_KEY, SETTINGS_KEY, decodeTransfer, storeTransfer, transferURL } from '../two/journey-transfer.js';

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
  assert.deepEqual(incoming.settings,settings);
});

test('historical six-district saves retain their stamps and acquire stocked new bike ports',()=>{
  const old=createGame().save();
  old.version=2; old.items.length=36;old.bikes.length=6;old.visited.push('market');
  const loaded=decode(encode(old).hash).game.save();
  assert.equal(loaded.version,4);
  assert.deepEqual(loaded.visited,old.visited);
  assert.equal(loaded.bikes.length,10);
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
