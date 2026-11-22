import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { COURT, COURT_GATE_Z, COURT_BRAZIERS, RETREATS, sitePoint, retreatStones } from '../two/retreat-layout.js';
import { watchPose } from '../two/court-patrol.js';
import { KYO_DAY_SECONDS, KYO_ROADS } from '../two/kyo-layout.js';
import { DISTRICTS } from '../two/geography.js';
import { terrainHeight, groundHeight, waterDepth, waterSurfaceAt, constrainMove, solidHeightAt, overheadHeight, TREES, BUILDINGS } from '../two/terrain.js';

test('a rolling dango can enter, bathe and resume at each rural spring',()=>{
  const game=createGame(),p=game.state.player;
  assert.equal(RETREATS.length,6);
  assert.equal(RETREATS.filter(s=>s.hut).length,3);
  for(const s of RETREATS){
    const [x,z]=sitePoint(s,0,s.rz+4);
    Object.assign(p,{x,z,y:groundHeight(x,z),mode:'dango',mount:null,h:0,vy:0,speed:0,vx:0,vz:0,grounded:true,activity:null,hp:38,mp:54});
    for(let i=0;i<120;i++){
      const dx=s.x-p.x,dz=s.z-p.z,d=Math.hypot(dx,dz);
      if(d<1.25)break;
      p.invulnerable=2;
      game.step(1/60,{x:dx/d,z:dz/d});
    }
    assert.ok(Math.hypot(s.x-p.x,s.z-p.z)<1.25,s.name+' approach');
    assert.ok(BUILDINGS.every(b=>Math.hypot(s.x-b.x,s.z-b.z)>18));
    assert.ok(TREES.every(t=>Math.hypot(s.x-t.x,s.z-t.z)>5));
    assert.ok(waterDepth(s.x,s.z)>.49);
    assert.equal(game.nearest()?.target.retreat,s);
    game.act('interact');assert.equal(p.activity,'bath');assert.equal(p.mode,'dango');
    const resumed=createGame(game.save());assert.equal(resumed.restored,true);
    for(let i=0;i<36;i++)resumed.step(.1,{});
    assert.equal(resumed.state.player.hp,100);assert.equal(resumed.state.player.mp,100);
    assert.ok(resumed.state.player.buffs.warm>19);
  }
});

test('the magistrates hall has a clear axial approach, supported steps and enclosed hearing room',()=>{
  const {x,z}=COURT,base=terrainHeight(x,z);
  let pos={x,z:z+COURT_GATE_Z+2.4},feet=groundHeight(pos.x,pos.z);
  for(let k=0;k<172;k++){
    pos=constrainMove(pos.x,pos.z,x,pos.z-.20,0,feet);
    feet=groundHeight(pos.x,pos.z,feet);
  }
  assert.ok(pos.z<z+2.4);
  assert.ok(Math.abs(feet-base-1.05)<.01);
  assert.ok(overheadHeight(x,z+2,feet)-feet>6);
  assert.ok(solidHeightAt(x,z-8.22,0,feet)>base+7);
  assert.ok(solidHeightAt(x+9,z+COURT_GATE_Z,0,base) >=base+2);
  assert.ok(solidHeightAt(x,z+COURT_GATE_Z,0,base) <base+.35);
  assert.ok(solidHeightAt(x-16,z-7.07,0,feet)>=base+3.4);
});

test('the court approach joins two unobstructed paved avenues across the capital',()=>{
  const city=DISTRICTS.kyo;
  const paved=KYO_ROADS.filter(([, ,stone])=>stone);
  const avenues=[
    {width:7,alongX:true,start:city.x-100,end:city.x+100,axis:city.z},
    {width:8,alongX:false,start:city.z-82,end:city.z+88,axis:city.x},
  ];
  for(const {width,alongX,start,end,axis} of avenues){
    const spans=paved.filter(([w,knots])=>w===width && knots.every(([x,z])=>(alongX?z:x)===axis))
      .map(([,knots])=>knots.map(([x,z])=>alongX?x:z));
    for(let a=start;a<=end;a+=.5){
      assert.ok(spans.some(s=>a>=Math.min(...s) && a<=Math.max(...s)), 'continuous stone pavement at '+a);
      for(const side of [-1,0,1]){
        // The south gate has an open central bay and two side bays set between pillars.
        const offset=!alongX && a>city.z+84?2.5:width/2-.63;
        const verge=axis+side*offset,x=alongX?a:verge,z=alongX?verge:a,y=groundHeight(x,z);
        assert.ok(solidHeightAt(x,z,.25,y)<y+.30, 'clear street at '+[x,z]);
      }
    }
  }
  const walk=paved.find(([,knots])=>knots[0][0]===COURT.x && knots[0][1]===COURT.z+COURT_GATE_Z);
  assert.deepEqual(walk[1].at(-1),[COURT.x,city.z]);

  const game=createGame(),p=game.state.player;
  Object.assign(p,{x:city.x-100,z:city.z,y:groundHeight(city.x-100,city.z),h:0,grounded:true});
  function reach(x,z,limit){
    for(let i=0;i<limit;i++){
      const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
      if(d<.16)return;
      p.invulnerable=2;game.step(1/30,{x:dx/d,z:dz/d});
    }
    assert.fail('obstructed at '+[p.x,p.z]+' on the way to '+[x,z]);
  }
  reach(city.x+100,city.z,1010);
  reach(COURT.x,city.z,950);
  reach(COURT.x,COURT.z+.4,270);
  assert.ok(Math.abs(p.y-terrainHeight(COURT.x,COURT.z)-1.05)<.03);
});

test('the full mural is visible through the main hearing bay, and both guards light the braziers on foot',()=>{
  const {x,z}=COURT,base=terrainHeight(x,z);
  for(const eye of [[0,9],[5,7],[-5,7]])for(const edge of [-8.24,0,8.24]){
    for(let t=0;t<1;t+=.025){
      const u=eye[0]+(edge-eye[0])*t,v=eye[1]+(-7.76-eye[1])*t;
      assert.ok(solidHeightAt(x+u,z+v,0,base+1.1)<base+2.7,'open sight line');
    }
  }
  for(const i of [0,1]){
    let first=0,second=0,deskVisits=0,atDesk=false;
    for(let t=0;t<=KYO_DAY_SECONDS;t+=.2){
      const q=watchPose(t,i);
      const byDesk=q.z < -2.6;
      if(byDesk && !atDesk)deskVisits++;
      atDesk=byDesk;
      const floor=groundHeight(x+q.x,z+q.z,base+1.08);
      assert.ok(solidHeightAt(x+q.x,z+q.z,.18,base+1.08)<=floor+.3,'patrol clearance at '+t);
      for(const [j,intensity,last] of [[0,q.front,first],[1,q.inner,second]]){
        if(intensity>0&&last===0){
          const [bx,bz]=COURT_BRAZIERS[2*i+j];
          assert.ok(Math.hypot(q.x-bx,q.z-bz)<.91);assert.ok(q.reach>.85);
        }
      }
      first=q.front;second=q.inner;
    }
    assert.equal(deskVisits,3);
    const noon=watchPose(0,i),night=watchPose(KYO_DAY_SECONDS/2,i),returning=watchPose(KYO_DAY_SECONDS,i);
    assert.ok(noon.z>COURT_GATE_Z && night.z<8);
    assert.equal(night.front,1);assert.equal(night.inner,1);
    assert.deepEqual(noon,returning);assert.equal(noon.front+noon.inner+noon.taper,0);
  }
});

test('the dome of each scanned rim rock supports the player at its visible crown',()=>{
  for(const s of RETREATS) {
    const level=waterSurfaceAt(s.x,s.z);
    const q=retreatStones(s).find(q=>q.scanned && q.v>0);
    const [x,z]=sitePoint(s,q.u,q.v);
    const crown=level-.03+1.18*q.h;
    assert.ok(Math.abs(groundHeight(x,z,crown)-crown)<.015,s.name);
  }
});
