import test from 'node:test';
import assert from 'node:assert/strict';
import { canFollowTravel, createTravelCamera, chopCameraArc } from '../two/travel-camera.js';
import { isGroundedDango } from '../two/dango-roll.js';
import { SKIFFS, skiffApproaches } from '../two/skiff-travel.js';
import { createGame } from '../two/game.js';
import { BOUND, groundHeight } from '../two/terrain.js';

const angle = radians => Math.atan2(Math.sin(radians), Math.cos(radians));
const northbound = {mode:'dango', grounded:true, vx:0, vz:-23.6, speed:23.6};

function movement(basis, side, forward) {
  const c = Math.cos(basis), s = Math.sin(basis);
  return {x:c*side-s*forward, z:-s*side-c*forward, rightX:c, rightZ:-s};
}

function advance(camera, yaw, seconds, {hz=60, player=northbound, enabled=true, looking=false}={}) {
  for (let i=0; i<Math.round(seconds*hz); i++) {
    yaw = camera.follow(yaw,player,1/hz,enabled,looking);
  }
  return yaw;
}

test('a held sideways or backward roll keeps its course while the eye swings behind it', () => {
  for (const [startYaw,side,forward] of [[Math.PI/2,1,0], [Math.PI,0,-1]]) {
    const camera = createTravelCamera();
    const game = createGame(), p = game.state.player;
    assert.ok(game.act('dango'));
    // Both inputs point north along the same stretch of the Sakuragawa road.
    game.state.time = 480;
    Object.assign(p,{x:0, z:70, y:groundHeight(0,70), invulnerable:7});
    let yaw = startYaw;
    for (let i=0; i<240; i++) {
      const basis = camera.movementYaw(yaw,side,forward,canFollowTravel(p));
      game.step(1/60,movement(basis,side,forward));
      const next = camera.follow(yaw,p,1/60,true);
      assert.ok(Math.abs(angle(next-yaw)) < 2/60, 'bounded angular speed even on a U-turn');
      yaw = next;
    }
    assert.ok(p.z < 0 && Math.abs(p.x) < .1, 'stays on the road for more than 70 m');
    assert.ok(p.speed > 23, 'holds full rolling speed');
    assert.ok(Math.abs(angle(yaw)) < .2, 'looks north behind the rolling player');

    if (side === 1) {
      const basis = camera.movementYaw(yaw,-1,0,true);
      assert.ok(movement(basis,-1,0).x < -.9, 'a deliberate change to left turns across the new view');
    }
    camera.movementYaw(yaw,0,0,true);
    const nextBasis = camera.movementYaw(yaw,1,0,true);
    assert.ok(Math.abs(angle(nextBasis-yaw)) < .001, 'a new movement uses the current view');
  }
});

test('small left-right thumbstick corrections do not accumulate into a turn', () => {
  const camera = createTravelCamera(), player = {...northbound};
  const initialAngle = 1.2;
  let yaw = initialAngle, x = 0, z = 0;
  for (let i=0; i<300; i++) {
    const direction = initialAngle + .10*Math.sin(i/60 * 4*Math.PI);
    const side = Math.sin(direction), forward = Math.cos(direction);
    const input = movement(camera.movementYaw(yaw,side,forward,true),side,forward);
    player.vx = input.x*player.speed;
    player.vz = input.z*player.speed;
    x += player.vx/60;
    z += player.vz/60;
    yaw = camera.follow(yaw,player,1/60,true);
  }
  assert.ok(Math.abs(x)<4 && z < -114, 'follows the original course through small reciprocal movements');
});

test('a fast roll takes the short turn across the angle seam using ground velocity', () => {
  const start = Math.PI-.38, target = -Math.PI+.38;
  // Heading points the opposite way, as it can when input reverses before momentum.
  const player = {...northbound, vx:-23.6*Math.sin(target), vz:-23.6*Math.cos(target), heading:target};
  const yaws = [];
  for (const hz of [20,60,120]) {
    const camera = createTravelCamera();
    let yaw = start, travel = 0;
    for (let i=0; i<3*hz; i++) {
      const next = camera.follow(yaw,player,1/hz,true);
      const turn = angle(next-yaw);
      assert.ok(turn >= -1e-8 && turn < 2/hz, 'one smooth turn through +π');
      travel += turn;
      yaw = next;
      if (i+1 === hz) yaws.push(yaw);
    }
    assert.ok(travel > .62 && travel < .8);
  }
  for (const yaw of yaws) assert.ok(Math.abs(angle(yaw-yaws[0])) < .06);
});

test('a look gesture or held orbit key gets time to settle before chase resumes', () => {
  const camera = createTravelCamera(), manualYaw = 1.6;
  advance(camera,2,.5);
  camera.manualLook();
  const held = advance(camera,manualYaw,2,{looking:true});
  assert.equal(held,manualYaw);
  const released = advance(camera,held,.65);
  assert.equal(released,manualYaw, 'does not tug the view upon release');
  const settled = advance(camera,released,4);
  assert.ok(Math.abs(angle(settled)) < .16);
});

test('explicit orbit input can still steer a continuously held direction', () => {
  const camera = createTravelCamera();
  const start = Math.PI/2;
  camera.movementYaw(start,1,0,true);
  const yaw = advance(camera,start,1);
  assert.ok(yaw < start-.1);
  camera.manualLook(.3);
  const basis = camera.movementYaw(yaw+.3,1,0,true);
  assert.ok(Math.abs(angle(basis-start-.3)) < .001);
});

function faceAlongHeldMovement(game, {yaw=0, side=1, jump=false, seconds=4}={}) {
  const camera = createTravelCamera(), player = game.state.player;
  for (let i=0; i<seconds*60; i++) {
    const basis = camera.movementYaw(yaw,side,0,canFollowTravel(player));
    game.step(1/60,{...movement(basis,side,0),jump});
    yaw = camera.follow(yaw,player,1/60,true);
  }
  return angle(yaw);
}

test('all walking forms stay on their chosen course while the view aligns, including a slow analog walk', () => {
  for (const mode of ['normal','kusa','kinako','habutae','kagami']) {
    const game = createGame(), player = game.state.player;
    game.state.kagamiUnlocked = true;
    assert.ok(game.act(mode));
    game.state.time = 480;
    Object.assign(player,{x:0,z:70,y:groundHeight(0,70),invulnerable:9});
    const side = mode==='normal' ? .45 : 1;
    const yaw = faceAlongHeldMovement(game,{yaw:Math.PI/2,side,seconds:6});
    assert.equal(player.mode,mode);
    assert.ok(Math.abs(player.x)<.1 && player.z<58,mode+' keeps moving north');
    assert.ok(Math.abs(yaw)<.22,mode+' camera now looks north');
  }
});

test('a slow swimmer and an airborne mochi can each steer while the camera turns behind them', () => {
  for (const airborne of [false,true]) {
    const game = createGame(), player = game.state.player;
    const startZ = BOUND-90;
    Object.assign(player,{x:0,z:startZ,y:groundHeight(0,startZ)});
    if (airborne) assert.ok(game.act('habutae'));
    const yaw = faceAlongHeldMovement(game,{side:airborne?1:.5,jump:airborne,seconds:6});
    if (airborne) assert.ok(!player.grounded && player.h>5);
    else assert.ok(player.inWater && player.speed<3);
    assert.ok(player.x>10 && Math.abs(player.z-startZ)<.1,'right input continues east');
    assert.ok(Math.abs(angle(yaw+Math.PI/2))<.22,'camera follows east');
  }
});

test('both steerable mounts keep the requested heading during a camera turn', () => {
  for (const mount of ['bike','turtle']) {
    const game = createGame(), player = game.state.player;
    const target = mount==='bike' ? game.state.objects.find(o=>o.type==='port')
      : game.state.npcs.find(n=>n.type==='turtle');
    Object.assign(player,{x:target.x,z:target.z,y:groundHeight(target.x,target.z)});
    assert.ok(game.act('interact'));
    assert.equal(player.mount,mount);
    const startZ = BOUND-90;
    Object.assign(player,{x:0,z:startZ,y:groundHeight(0,startZ)});
    const yaw = faceAlongHeldMovement(game);
    assert.ok(player.x>70 && Math.abs(player.z-startZ)<.1,mount+' keeps moving east');
    assert.ok(Math.abs(angle(yaw+Math.PI/2))<.22,mount+' camera follows east');
  }
});

test('a seated passenger can enjoy a moving skiff without the view orbiting', () => {
  const game = createGame(), player = game.state.player;
  const boat = SKIFFS.find(boat=>boat.index!==undefined);
  const [point] = skiffApproaches(boat,game.state.time);
  Object.assign(player,point,{y:groundHeight(point.x,point.z)});
  assert.ok(game.act('interact'));
  assert.equal(player.skiff,boat.id);
  const startX = player.x, startZ = player.z;
  const yaw = faceAlongHeldMovement(game,{yaw:1.4,seconds:1});
  assert.ok(Math.hypot(player.x-startX,player.z-startZ)>.02);
  assert.equal(canFollowTravel(player),false);
  assert.equal(yaw,1.4);
});

test('rest, vertical-only travel, scripted activities and a disabled setting leave the view alone', () => {
  const camera = createTravelCamera(), yaw = .97;
  for (const change of [
    {vx:0,vz:0}, {vx:.01,vz:0}, {grounded:false,vx:0,vz:0,vy:8},
    {activity:'bath'}, {activity:'fall'}, {skiff:'boat'},
  ]) {
    assert.equal(advance(camera,yaw,.5,{player:{...northbound,...change}}),yaw);
  }
  assert.equal(advance(camera,yaw,1,{enabled:false}),yaw);
  assert.equal(camera.movementYaw(yaw,-1,0,false),yaw);
});

test('roll effects still belong to a grounded dango after camera tracking is generalized', () => {
  assert.ok(isGroundedDango(northbound));
  for (const change of [
    {mode:'normal'}, {grounded:false}, {inWater:true}, {activity:'fall'}, {mount:'bike'}, {skiff:'boat'},
  ]) assert.equal(isGroundedDango({...northbound,...change}),false);
});

test('the axe clears the silhouette without moving a side view or crossing the camera seam', () => {
  const line=2.98;
  assert.equal(chopCameraArc(line+1.2,line,()=>1),null);
  const q=chopCameraArc(line,line,a=>angle(a-line)>0?1:.14);
  let yaw=line;
  for(let i=0;i<260;i++){
    const next=q(1/120);
    assert.ok(next>=yaw && next-yaw<1/120);
    yaw=next;
  }
  assert.ok(Math.abs(yaw-line-1.29)<.02);
  const front=chopCameraArc(line+Math.PI,line,()=>1);
  assert.ok(Math.abs(front(3)-line-Math.PI)<1.3);
});
