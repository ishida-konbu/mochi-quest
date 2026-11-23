import test from 'node:test';
import assert from 'node:assert/strict';
import { createDangoCamera, isGroundedDango, onDangoCourse } from '../two/dango-camera.js';
import { createGame } from '../two/game.js';
import { groundHeight } from '../two/terrain.js';

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
    const camera = createDangoCamera();
    const game = createGame(), p = game.state.player;
    assert.ok(game.act('dango'));
    // Both inputs point north along the same stretch of the Sakuragawa road.
    game.state.time = 480;
    Object.assign(p,{x:0, z:70, y:groundHeight(0,70), invulnerable:7});
    let yaw = startYaw;
    for (let i=0; i<240; i++) {
      const basis = camera.movementYaw(yaw,side,forward,onDangoCourse(p));
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
  const camera = createDangoCamera(), player = {...northbound};
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
    const camera = createDangoCamera();
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
  const camera = createDangoCamera(), manualYaw = 1.6;
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
  const camera = createDangoCamera();
  const start = Math.PI/2;
  camera.movementYaw(start,1,0,true);
  const yaw = advance(camera,start,1);
  assert.ok(yaw < start-.1);
  camera.manualLook(.3);
  const basis = camera.movementYaw(yaw+.3,1,0,true);
  assert.ok(Math.abs(angle(basis-start-.3)) < .001);
});

test('stationary, airborne, mounted and interrupted rolls leave the view in place', () => {
  const camera = createDangoCamera(), yaw = .97;
  assert.ok(isGroundedDango(northbound));
  for (const change of [
    {mode:'normal'}, {grounded:false}, {inWater:true}, {activity:'fall'}, {mount:'bike'}, {skiff:'boat'},
  ]) {
    const player = {...northbound,...change};
    assert.equal(isGroundedDango(player),false);
    assert.equal(advance(camera,yaw,.5,{player}),yaw);
  }
  assert.equal(advance(camera,yaw,1,{enabled:false}),yaw);
  for (const speed of [0,.8]) {
    assert.equal(advance(camera,yaw,1,{player:{...northbound,vx:speed,vz:0,speed}}),yaw);
  }
  assert.equal(camera.movementYaw(yaw,-1,0,false),yaw);
});
