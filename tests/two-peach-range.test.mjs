import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { PEACH, MOON_GATE } from '../two/pilgrimage-layout.js';
import { RETREATS } from '../two/retreat-layout.js';
import { CONNECTING_ROADS, groundHeight, terrainHeight, waterDepth } from '../two/terrain.js';

const road=CONNECTING_ROADS.find(r=>r.destination==='桃源郷');
const approach=road.points.slice(road.points.findIndex(([x])=>x<=PEACH.x+214));

// A row of narrow fins can block a ray, but it cannot sustain a high shoulder
// for tens of metres. Sample both the skyline angle and the depth of each ridge.
function ridgeSightline(u,v,bearing) {
  const x=PEACH.x+u,z=PEACH.z+v,eye=terrainHeight(x,z)+2.3;
  const dx=Math.cos(bearing),dz=Math.sin(bearing);
  let angle=-90,highGround=0,depth=0;
  for(let d=18;d<=285;d+=2) {
    const ground=terrainHeight(x+d*dx,z+d*dz);
    angle=Math.max(angle,Math.atan2(ground-eye,d)*180/Math.PI);
    highGround=ground>35?highGround+2:0;
    depth=Math.max(depth,highGround);
  }
  return {angle,depth};
}

test('the orchard is enclosed by deep mountain shoulders, including the sightline back through its old entrance',()=>{
  for(let i=0;i<36;i++){
    const {angle,depth}=ridgeSightline(0,0,2*Math.PI*i/36);
    assert.ok(angle>11,'open skyline at '+i*10+' degrees: '+angle);
    assert.ok(depth>=24,'thin ridge at '+i*10+' degrees: '+depth);
  }
  // The old east-facing view from the western orchard bank exposed the outer plain.
  for(const [x,z] of [[-67,0],[-60,25],[-57,-36]])for(const degrees of [-15,0,15]){
    const h=ridgeSightline(x,z,degrees*Math.PI/180);
    assert.ok(h.angle>8,'hillside view '+[x,z,degrees,h.angle]);
  }
});

function walkTrail(path,mode) {
  const game=createGame(),p=game.state.player,[x,z]=path[0];
  Object.assign(p,{x,z,y:groundHeight(x,z),mode});
  let i=1,topSpeed=0,crossedMoonGate=false;
  const goal=path.at(-1);
  for(let tick=0;tick<2300;tick++){
    while(i<path.length-1 && Math.hypot(p.x-path[i][0],p.z-path[i][1])<2.1)i++;
    const dx=path[i][0]-p.x,dz=path[i][1]-p.z,dist=Math.hypot(dx,dz);
    if(i===path.length-1 && dist<.8)break;
    game.step(1/25,{x:dx/dist,z:dz/dist});
    topSpeed=Math.max(topSpeed,p.speed);
    if(Math.hypot(p.x-MOON_GATE.x,p.z-MOON_GATE.z)<1.5)crossedMoonGate=true;
  }
  assert.ok(Math.hypot(p.x-goal[0],p.z-goal[1])<.8,'blocked '+mode+' at '+[p.x,p.z]+' towards '+path[i]);
  assert.ok(crossedMoonGate,'route missed the gate opening');
  assert.ok(Math.abs(p.y-groundHeight(p.x,p.z,p.y))<.1);
  if(mode==='dango')assert.ok(topSpeed>20,'dango cannot build speed in the ravine');
}

test('a winding valley-floor route admits a walker through the moon gate and a dango in the opposite direction',()=>{
  const first=approach[0];
  assert.ok(first[0]-PEACH.x>200);
  let length=0,maxGrade=0,opposedBanks=0;
  for(let i=1;i<approach.length;i++){
    const [ax,az]=approach[i-1],[x,z]=approach[i];
    const d=Math.hypot(x-ax,z-az);
    length+=d;
    maxGrade=Math.max(maxGrade,Math.abs(terrainHeight(x,z)-terrainHeight(ax,az))/d);
    assert.ok(waterDepth(x,z)<.15);
    // Follow the bed of the gorge between the two spurs. A road painted on
    // the crest could have an equally gentle grade but no enclosing banks.
    if(x>PEACH.x+55 && x<PEACH.x+180){
      const nx=(z-az)/d,nz=(ax-x)/d,y=terrainHeight(x,z);
      const hasBank=side=>[15,20,25,30,35,40].some(offset=>
        terrainHeight(x+side*offset*nx,z+side*offset*nz)>y+12);
      if(hasBank(-1) && hasBank(1))opposedBanks+=d;
    }
  }
  const last=approach.at(-1),chord=Math.hypot(first[0]-last[0],first[1]-last[1]);
  assert.ok(length>chord*1.24,'the route must wind between spurs');
  assert.ok(maxGrade<.43,'grade '+maxGrade);
  assert.ok(opposedBanks>95,'insufficient valley floor between high opposing banks');
  walkTrail(approach,'normal');
  walkTrail(approach.slice().reverse(),'dango');
});

test('an existing journey on the former eastern approach regains its footing and the old peach spring still welcomes bathers',()=>{
  const old=createGame().save(),x=PEACH.x+100,z=PEACH.z;
  // Surveyed bare ground on the east sightline in the previous public map.
  const oldY=6.0769154,newY=terrainHeight(x,z);
  assert.ok(newY>oldY+3);
  for(const [mode,h] of [['normal',0],['habutae',14],['kusa',0]]){
    Object.assign(old.player,{mode,x,z,y:oldY+h,h,grounded:h===0});
    const game=createGame(old),p=game.state.player;
    assert.ok(game.restored);
    assert.deepEqual([p.x,p.z],[x,z]);
    assert.ok(Math.abs(p.y-newY-h)<.01);
    const reopened=createGame(game.save());
    assert.equal(reopened.state.player.y,p.y);
  }
  const spring=RETREATS.find(site=>site.kind==='peach');
  // Saves from inside the hut or the pool keep the old survey coordinates,
  // even though the section of road beyond the spring has grown much longer.
  assert.ok(Math.hypot(spring.x+591.68896557,spring.z+140.89502924)<.001);
  Object.assign(old.player,{x:spring.x,z:spring.z,y:10.16025632,h:0,mode:'dango',grounded:true});
  const bather=createGame(old);
  assert.equal(bather.nearest()?.target.retreat,spring);
  bather.act('interact');
  assert.equal(bather.state.player.activity,'bath');
});
