import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { SKIFFS, skiffApproaches, skiffContact, skiffDeck, skiffPose } from '../two/skiff-travel.js';
import { RIVER_TRADE_PERIOD } from '../two/traveller-positions.js';
import { bridgeAt, bridgeHeight, canOccupy, groundHeight, staticVolumeAt } from '../two/terrain.js';

function approach(game,boat) {
  const [point]=skiffApproaches(boat,game.state.time);
  Object.assign(game.state.player,point,{y:groundHeight(point.x,point.z),h:0,grounded:true});
}

function seatMatches(player,boat,time) {
  const seat=skiffDeck(boat,time);
  assert.equal(player.skiff,boat.id);
  assert.ok(Math.hypot(player.x-seat.x, player.y-seat.y, player.z-seat.z)<1e-8);
  assert.equal(player.heading,seat.heading);
  assert.equal(player.inWater,false);
}

test('every moored and travelling skiff can be boarded, saved, resumed and left beside its current hull',()=>{
  assert.equal(SKIFFS.length,9);
  assert.equal(new Set(SKIFFS.map(boat=>boat.id)).size,SKIFFS.length);
  for (const boat of SKIFFS) {
    const game=createGame(), p=game.state.player;
    approach(game,boat);
    assert.equal(game.nearest()?.target,boat,boat.name);
    game.step(1/60);
    assert.equal(p.skiff,null,'the passenger chooses when to board');
    assert.ok(game.act('interact'),boat.name);
    seatMatches(p,boat,game.state.time);
    const start={x:p.x,z:p.z};
    for (let i=0;i<45;i++) game.step(1/60,{x:1,z:1});
    seatMatches(p,boat,game.state.time);
    const travelled=Math.hypot(start.x-p.x,start.z-p.z);
    assert.ok(boat.index===undefined ? travelled<1e-8 : travelled>.02,boat.name);
    assert.equal(game.nearest().action,'dismount');

    const snapshot=game.save();
    const resumed=createGame(JSON.parse(JSON.stringify(snapshot)));
    assert.ok(resumed.restored);
    const rider=resumed.state.player;
    seatMatches(rider,boat,resumed.state.time);
    resumed.step(.10);
    seatMatches(rider,boat,resumed.state.time);
    assert.ok(resumed.act('interact'),boat.name);
    assert.equal(rider.skiff,null);
    assert.ok(canOccupy(rider.x,rider.z,rider.y,.26,1.66));
    assert.equal(skiffContact(rider.x,rider.z,rider.y,1.66,.26,resumed.state.time),0);
    assert.deepEqual(resumed.save().bikes,snapshot.bikes);
  }
});

test('passengers clear scenery, other hulls and all three arched bridges during a full river circuit',()=>{
  const travelling=SKIFFS.filter(boat=>boat.index!==undefined);
  assert.equal(travelling.length,5);
  for (const boat of travelling) {
    const crossed=new Set();
    for (let time=0;time<=RIVER_TRADE_PERIOD;time+=.10) {
      const seat=skiffDeck(boat,time);
      // Include the width and height of a well-fed passenger wearing leaves.
      assert.ok(!staticVolumeAt(seat.x,seat.z,seat.y+.025,.49,1.90),boat.name+' at '+time);
      assert.equal(skiffContact(seat.x,seat.z,seat.y+.04,1.90,.49,time,boat.id),0,boat.name+' at '+time);
      const bridge=bridgeAt(seat.x,seat.z);
      if (!bridge) continue;
      const direction=Math.sign(skiffPose(boat,time).forward[0]);
      const crossing=bridge.x+','+direction;
      crossed.add(crossing);
      const clearance=bridgeHeight(bridge,seat.z)-.235-seat.y;
      assert.ok(clearance>1.95,boat.name+' at '+time);
    }
    assert.equal(crossed.size,boat.index>=2?6:0,boat.name);
  }
});

test('transformation and exhaustion on a boat keep the rider on the thwart; legacy journeys have no passenger',()=>{
  const boat=SKIFFS.at(-1),game=createGame(),p=game.state.player;
  approach(game,boat);
  assert.ok(game.act('kusa'));
  assert.ok(game.act('interact'));
  assert.equal(p.mode,'kusa');
  assert.equal(game.act('dango'),false);
  p.mp=.001;
  game.step(1/60);
  assert.equal(p.mode,'normal');
  seatMatches(p,boat,game.state.time);

  const previous=createGame().save();
  delete previous.player.skiff;
  const resumed=createGame(previous);
  assert.ok(resumed.restored);
  assert.equal(resumed.state.player.skiff,null);
});

test('a blocked landing leaves the passenger aboard',()=>{
  const game=createGame(), boat=SKIFFS[0];
  approach(game,boat);
  assert.ok(game.act('interact'));
  const obstacles=skiffApproaches(boat,game.state.time).map(q=>({
    kind:'person',name:'船番',species:'鹿',x:q.x,y:q.y,z:q.z,yaw:0,
  }));
  game.storyCollisions.update(obstacles);
  assert.equal(game.act('dismount'),false);
  seatMatches(game.state.player,boat,game.state.time);
  game.storyCollisions.update([]);
  assert.ok(game.act('dismount'));
});
