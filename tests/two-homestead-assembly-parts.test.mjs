import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { homesteadGeometry } from '../two/homestead-carpentry.js';
import { assemblyParts } from '../two/homestead-assembly-parts.js';
import { makeAssemblyLoadField } from '../two/homestead-assembly-clearance.js';
import { planAssemblyStock } from '../two/homestead-assembly-stock.js';
import { makeAssemblyTextile } from '../two/homestead-assembly-textile.js';

// Hash the baked vertex data together, independent of draw order. This
// catches an accidentally duplicated/missing face or a changed cloth UV.
function vertices(geometry) {
  const {position,normal,uv,finishId,color}=geometry.attributes;
  return Array.from({length:position.count},(_,i)=>{
    let h=0x811c9dc5;
    const values=[position,normal,uv,finishId,color];
    for(const attr of values) {
      const bytes=new Uint32Array(attr.array.buffer,attr.array.byteOffset+i*attr.itemSize*4,attr.itemSize);
      for(const value of bytes)h=Math.imul(h^value,0x01000193);
    }
    return h>>>0;
  });
}

test('the staged kits and permanent building use the very same surfaces, including snow roofs',()=>{
  for(const kind of ['stand','camp','hut','floor','posts','wall','roof','chest','fence']){
    for(const terrain of kind==='roof'||kind==='hut'?['plain','snow']:['plain']){
      const stages=assemblyParts(kind,terrain), completed=homesteadGeometry(kind,terrain);
      assert.equal(new Set(stages.map(s=>s.id)).size,stages.length);
      assert.equal(stages.reduce((sum,s)=>sum+s.geometry.index.count,0),completed.index.count);
      const sort=(a,b)=>a-b;
      assert.deepEqual(stages.flatMap(s=>vertices(s.geometry)).sort(sort),vertices(completed).sort(sort),kind+' '+terrain);
      completed.dispose();
    }
  }
});

test('every hand target is on the actual local piece and each section has bounded non-degenerate faces',()=>{
  const hand=new T.Vector3(),closest=new T.Vector3(),triangle=new T.Triangle();
  for(const terrain of ['plain','snow'])for(const kind of ['stand','camp','hut','chest','fence']){
    for(const {id,geometry,grip,handholds,normal,bounds} of assemblyParts(kind,terrain)){
      assert.ok(bounds.max.every((n,i)=>Number.isFinite(n) && n>bounds.min[i]),id);
      assert.ok(Math.abs(Math.hypot(...normal)-1)<.0001,id);
      hand.fromArray(grip);
      const pads=handholds.map(a=>new T.Vector3(...a)),gaps=[Infinity,Infinity];
      assert.ok(pads[0].distanceTo(pads[1])>.12,id);
      let gap=Infinity;
      const ix=geometry.index.array;
      for(let j=0;j<ix.length;j+=3){
        triangle.setFromAttributeAndIndices(geometry.attributes.position,ix[j],ix[j+1],ix[j+2]);
        assert.ok(triangle.getArea()>1e-10,id);
        gap=Math.min(gap,triangle.closestPointToPoint(hand,closest).distanceTo(hand));
        for(const [i,p] of pads.entries())gaps[i]=Math.min(gaps[i],triangle.closestPointToPoint(p,closest).distanceTo(p));
      }
      assert.ok(gap<.02,id+' grip gap '+gap);
      assert.ok(gaps.every(d=>d<.0001),id+' hand contacts');
    }
  }
});

test('the full carpenter’s stock lies on sloping ground, clear of the stairs, other stock and pickup stances',()=>{
  const land=([x,z])=>.025*x+.018*z;
  const stair={center:[0,0,2.9],normal:[0,1],depth:.7,width:2.4,count:4,run:.3};
  for(const kind of ['stand','camp','hut','chest','fence']){
    const parts=assemblyParts(kind), stock=planAssemblyStock(parts,{kind,land,free:()=>true,platforms:[stair],start:[0,4.8]});
    assert.equal(stock?.length,parts.length,kind);
    const boxes=stock.map(p=>new T.Box3(new T.Vector3(...p.bounds.min),new T.Vector3(...p.bounds.max)));
    for(const [i,item] of stock.entries()){
      const step=parts[i],textile=step.unfurl?makeAssemblyTextile(step):null;
      textile?.unroll(0);
      const pos=(textile?.geometry??step.geometry).attributes.position,point=new T.Vector3();
      const m=new T.Matrix4().makeRotationFromEuler(new T.Euler(...item.rotation)).setPosition(...item.grip)
        .multiply(new T.Matrix4().makeTranslation(...step.grip.map(v=>-v)));
      let clearance=Infinity;
      for(let j=0;j<pos.count;j++){
        point.fromBufferAttribute(pos,j).applyMatrix4(m);
        clearance=Math.min(clearance,point.y-land([point.x,point.z]));
      }
      assert.ok(clearance>=.002 && clearance<=.023,step.id+' clearance '+clearance);
      const stairBox=new T.Box3(new T.Vector3(-1.2,-10,2.55),new T.Vector3(1.2,10,4.15));
      assert.equal(boxes[i].intersectsBox(stairBox),false,step.id);
      const pick=new T.Vector3(item.grip[0]+item.normal[0]*1.12,0,item.grip[2]+item.normal[1]*1.12);
      for(const [j,box] of boxes.entries()){
        pick.y=box.min.y;
        assert.ok(box.distanceToPoint(pick)>.44,step.id+' pickup obstructed by '+parts[j].id);
        if(i!==j)assert.equal(boxes[i].intersectsBox(box),false,step.id+' against '+parts[j].id);
      }
      textile?.geometry.dispose();
    }
  }
  assert.equal(planAssemblyStock(assemblyParts('stand'),{kind:'stand',land,free:()=>false}),null);
});

test('a moving cashbox clears the counter and remains carryable below and beside the open shelf',()=>{
  const kits=assemblyParts('stand'),i=kits.findIndex(part=>part.id==='stand.cashbox');
  const stock=planAssemblyStock(kits,{kind:'stand',land:()=>0,free:()=>true});
  const clearance=makeAssemblyLoadField(kits,stock,()=>0);
  assert.ok(clearance(i,[.52,.85,-.21],[0,0,0])>1.02);
  assert.ok(clearance(i,[.44,.35,-.24],[0,0,0])<.42);
  assert.ok(clearance(i,[0,.96,5],[0,0,0])<.97);
  assert.ok(clearance(i,[0,0,5],[0,0,0])>.13);
});

test('all four canopy staves seat through open counter mortises after the lower bents are fitted',()=>{
  const parts=assemblyParts('stand'), deck=parts.find(s=>s.id==='stand.counter').geometry;
  const roots=parts.filter(s=>s.id.endsWith('-bent'));
  const shade=parts.find(s=>s.id==='stand.rafters');
  assert.ok(roots.every(s=>s.bounds.max[1]<.806));
  assert.ok(Math.abs(shade.bounds.min[1]-.806)<.0001);
  const triangle=new T.Triangle(),hit=new T.Vector3(), ray=new T.Ray(new T.Vector3(),new T.Vector3(0,-1,0));
  function boardAt(x,z){
    ray.origin.set(x,1,z);
    for(let j=0;j<deck.index.count;j+=3){
      triangle.setFromAttributeAndIndices(deck.attributes.position,...deck.index.array.subarray(j,j+3));
      if(ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,hit) && hit.y>.807)return true;
    }
    return false;
  }
  for(const x of [-.75,.75])for(const z of [-.38,.33]){
    assert.equal(boardAt(x,z),false);
    assert.equal(boardAt(x+.07,z),true);
  }
});
