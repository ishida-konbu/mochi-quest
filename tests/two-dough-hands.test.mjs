import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Box3,Ray,Vector3,Matrix3,Matrix4,Quaternion,Group,Texture,TextureLoader} from '../two/vendor/three.module.min.js';
import {GLTFLoader} from '../two/vendor/GLTFLoader.min.js';
import {loadRiceModel,poseRice} from '../two/mochi-model.js';
import {makeHero} from '../two/actors.js';
import {makeCookingArms} from '../two/cooking-arms.js';
import {createCookingPerformer} from '../two/cooking-performer.js';
import {restWorkGrip} from '../two/working-grips.js';
import {createCookingScore} from '../two/cooking-motion.js';
import {cookingLayout} from '../two/cooking-stage.js';
import {LIVING_SITES} from '../two/living-sites.js';
import {BASIC_RECIPE,STARTER_RECIPES} from '../two/living-craft.js';
import {craftMotion} from '../two/build-craft-motion.js';
import {timberTree} from '../two/living-build.js';
import {fellingMotion} from '../two/exploration-felling.js';
import {terrainContactHeight} from '../two/terrain.js';

async function loadTraveller(t){
  t.mock.method(TextureLoader.prototype,'loadAsync',async()=>new Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const b=await readFile(new URL(url));
    return this.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  });
  await loadRiceModel();
}

function paintedSurface(body,root){
  const position=body.geometry.attributes.position;
  return Array.from({length:position.count},(_,i)=>
    root.worldToLocal(body.localToWorld(body.getVertexPosition(i,new Vector3()))));
}

// Check the entire drawn mesh, including the triangles between the hands,
// cheeks, and belly. UV seams duplicate vertices, so count indexed faces.
function measure(points,index){
  const normals=[],ab=new Vector3(),ac=new Vector3();
  let area=0;
  for(let i=0;i<index.count;i+=3){
    const a=points[index.getX(i)],b=points[index.getX(i+1)],c=points[index.getX(i+2)];
    const n=new Vector3().crossVectors(ab.subVectors(b,a),ac.subVectors(c,a));
    area+=n.length();normals.push(n);
  }
  return {area,normals};
}

// Carry the authored smooth normals through the same morphs and joints as
// the material. These directions are independent of the measured triangle
// edges: a legitimate turn around the belly rotates both, a fold does not.
function paintedNormals(body,root){
  const g=body.geometry,{normal,skinIndex,skinWeight}=g.attributes;
  body.skeleton.update();
  const palette=body.skeleton.bones.map((_,i)=>{
    const bone=new Matrix4().fromArray(body.skeleton.boneMatrices,16*i);
    return new Matrix3().setFromMatrix4(bone.premultiply(body.bindMatrixInverse).multiply(body.bindMatrix));
  });
  const toActor=new Matrix3().getNormalMatrix(new Matrix4().copy(root.matrixWorld).invert().multiply(body.matrixWorld));
  const raw=new Vector3(),v=new Vector3();
  return Array.from({length:normal.count},(_,i)=>{
    raw.fromBufferAttribute(normal,i);
    for(const [key,w] of body.morphTargetInfluences.entries()){
      if(w)raw.addScaledVector(v.fromBufferAttribute(g.morphAttributes.normal[key],i),w);
    }
    const out=new Vector3();
    for(let k=0;k<4;k++){
      const w=skinWeight.getComponent(i,k);
      if(w)out.addScaledVector(v.copy(raw).applyMatrix3(palette[skinIndex.getComponent(i,k)]),w);
    }
    return out.applyNormalMatrix(toActor);
  });
}

function handLandmarks(body,hand,working){
  const {position,skinIndex,skinWeight}=body.geometry.attributes;
  const joint=body.skeleton.bones.indexOf(hand),root=[],pad=[];
  for(let i=0;i<position.count;i++){
    let w=0;
    for(let k=0;k<4;k++)if(skinIndex.getComponent(i,k)===joint)w+=skinWeight.getComponent(i,k);
    if(working && (working.attributes.skinIndex.getX(i)!==joint || working.attributes.skinWeight.getX(i)!==1))continue;
    if(w>.12 && w<.45)root.push(i);
    if(w>.80)pad.push(i);
  }
  const diameters=['getX','getY','getZ'].map(axis=>{
    pad.sort((a,b)=>position[axis](a)-position[axis](b));
    return [pad[0],pad.at(-1)];
  });
  const side=hand.name==='Hand_R'?0:1;
  return {root:working?working.userData.wristCollars[side]:root,diameters};
}

function floorPads(body,legs){
  const {position,skinIndex,skinWeight}=body.geometry.attributes;
  const ids=Array.from({length:position.count},(_,i)=>i);
  return legs.map(leg=>{
    const joint=body.skeleton.bones.indexOf(leg);
    return ids.filter(i=>skinIndex.getX(i)===joint && skinWeight.getX(i)>.72)
      .sort((a,b)=>position.getY(a)-position.getY(b)).slice(0,8);
  });
}

// Count exits through the rendered closed torso. A buried cross-section
// guarantees the sleeve joins the cheek even on the shallow upper kagami tier.
function insideTorso(point,points,g){
  const ray=new Ray(point,new Vector3(.011,1,.017).normalize()),hit=new Vector3();
  const index=g.index.array;
  let exits=0;
  for(let i=0;i<g.userData.torsoIndexCount;i+=3){
    if(ray.intersectTriangle(points[index[i]],points[index[i+1]],points[index[i+2]],false,hit))exits++;
  }
  return exits%2===1;
}

// Sample diametrically opposite points at the same bind height, before
// the two movable mitts. These pairs follow material sections through a
// tilted pose, instead of measuring an axis-aligned box around the worker.
function materialDiameters(g){
  const ids=[...new Set(g.index.array.subarray(0,g.userData.torsoIndexCount))];
  const pos=g.attributes.position;
  return [.43,.64,.85,1.06,1.30,1.56,1.81].flatMap(y=>{
    const ring=ids.filter(id=>Math.abs(pos.getY(id)-y)<.025);
    return ['getX','getZ'].map(axis=>{
      const sorted=[...ring].sort((a,b)=>pos[axis](a)-pos[axis](b));
      return [sorted[0],sorted.at(-1)];
    });
  });
}

const centre=(points,ids)=>ids.reduce((sum,id)=>sum.add(points[id]),new Vector3()).divideScalar(ids.length);

test('the traveller draws intact transverse sections and carries two rigid, short hands through work',async t=>{
  await loadTraveller(t);
  const scene=new Group(),traveller=makeHero(),source=traveller.rice.body;
  const kitchen=cookingLayout(LIVING_SITES.find(site=>site.id==='river-mortar'));
  const footIds=floorPads(source,traveller.rice.legs);
  const travelling=source.geometry,landmarks=new Map();
  // Pose a second copy of the working skin on the unmodified traveller.
  const neutralArms=makeCookingArms(traveller);
  source.geometry=travelling;
  const pos=source.geometry.attributes.position,face=[];
  for(const [x,y] of [[-.34,1.44],[.34,1.44],[.012,1.165]]){
    let best=Infinity,id=0;
    for(let i=0;i<pos.count;i++){
      const d=(pos.getX(i)-x)**2+(pos.getY(i)-y)**2;
      if(pos.getZ(i)>.65 && best>d){id=i;best=d;}
    }
    face.push(id);
  }
  for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const size=full?1.28:1,player={mode,buffs:{full:Number(full)}};
    const actor=createCookingPerformer(scene,player),body=actor.group.getObjectByName('Nikkori');
    const sections=materialDiameters(body.geometry);
    const plane=craftMotion({kind:'floor'},player,{feet:[0,0]});
    const score=createCookingScore(BASIC_RECIPE,kitchen,{full,mode});
    const market=cookingLayout(LIVING_SITES.find(site=>site.id==='market-mortar'));
    const marketScore=createCookingScore(BASIC_RECIPE,market,{full,mode});
    const hit=marketScore.cues.find(c=>c.name==='pound').time;
    const overhead=marketScore.sample(hit-.29),strike=marketScore.sample(hit);
    const tree=timberTree('birch:39941:2333:9507');
    const feller={...player,x:tree.x-1.7,y:terrainContactHeight(tree.x-1.7,tree.z),z:tree.z,heading:1.06,grounded:true};
    const fell=fellingMotion(tree,feller);
    const hut=craftMotion({kind:'hut'},player,{feet:[0,0]});
    const base=plane.sample(plane.duration*.42);
    const far={...base,hands:[[14,6,-7],[-15,6,-10]],handWork:[1,1],twist:.9};
    const sent=plane.sample(plane.duration*.34),secondSend=plane.sample(plane.duration*.67),release=plane.sample(plane.duration);
    const frames=[base,sent,plane.sample(plane.duration*.381),secondSend,far,release,
      ...[.2,.56,.86].map(f=>hut.sample(hut.duration*f)),
      ...[.32,.58,.70].map(f=>fell.sample(fell.duration*f)),
      ...score.chapters.map(c=>score.sample(c.start+(c.end-c.start)*.60)),overhead,strike];

    for(const frame of frames){
      const {time}=frame;
      // Pose a separate travelling hero on the same authored clip, at the
      // same size. Compare in actor space independently of tool placement.
      const rice=traveller.rice;
      rice.press=0;rice.pull=0;rice.velocity=0;rice.pullV=0;
      const skin={...player,grounded:true,gestureSample:{time,weight:1,smile:Number(frame.phase==='finish')}};
      const idle=poseRice(rice,skin,time,0,'curious',null,false);
      source.morphTargetInfluences[source.morphTargetDictionary.kagamiShoulder]=Number(mode==='kagami');
      neutralArms.forEach(arm=>arm.turnSocket(0,false));
      traveller.pose.scale.set(size*idle.width,size*idle.stretch,size*idle.width);
      traveller.root.updateMatrixWorld(true);
      assert.equal(source.geometry,travelling,'working sockets must belong to the performer');
      const standing=paintedSurface(source,traveller.root);
      actor.update({...frame,time:time+1}); // Seek each sample independently of the previous shot.
      const grips=actor.update(frame);
      const points=paintedSurface(body,actor.group);
      assert.equal(travelling.morphAttributes.position.length,4,'travel mesh acquired working shape keys');
      const g=body.geometry,patched=g!==travelling;
      if(patched)assert.equal(g.userData.travellingSkin,travelling,'the working patches must come from the traveller');
      if(!landmarks.has(g))landmarks.set(g,traveller.rice.hands.map(hand=>handLandmarks(source,hand,patched&&g)));
      const mitts=landmarks.get(g);
      // Pose the very same painted patches on the reference rig. This isolates
      // a pad travelling around the belly from a pad changing its shape.
      source.geometry=g;
      const rest=patched?paintedSurface(source,traveller.root):standing;
      const arch=g.morphAttributes.position[body.morphTargetDictionary.kagamiShoulder];
      const nativePalm=id=>new Vector3().fromBufferAttribute(g.attributes.position,id)
        .addScaledVector(new Vector3().fromBufferAttribute(arch,id),Number(mode==='kagami'))
        .multiply(rice.model.scale).multiplyScalar(size);
      const b=measure(points,g.index);
      const carrier=source.skeleton.bones.find(b=>b.name==='Body'),home=carrier.position.clone();
      for(const key of ['workForward','workDraw','workSettle']){
        const index=source.morphTargetDictionary[key],amount=body.morphTargetInfluences[index];
        source.morphTargetInfluences[index]=amount;
        carrier.position[key==='workForward'?'z':'y']+=amount;
      }
      traveller.root.updateMatrixWorld(true);
      const flexed=measure(paintedSurface(source,traveller.root),g.index);
      const restNormals=paintedNormals(source,traveller.root),workNormals=paintedNormals(body,actor.group);
      carrier.position.copy(home);
      for(const key of ['workForward','workDraw','workSettle'])source.morphTargetInfluences[source.morphTargetDictionary[key]]=0;
      traveller.root.updateMatrixWorld(true);
      const where=[mode,full,frame.phase,time.toFixed(2)].join('/');
      const near=(actual,expected,fraction,label)=>assert.ok(Math.abs(actual/expected-1)<fraction,
        where+' '+label+' '+(actual/expected).toFixed(4));
      for(const [n,[a,b]] of sections.entries()){
        const lateral=n%2===0;
        near(points[a].distanceTo(points[b]),rest[a].distanceTo(rest[b]),lateral?.025:.12,'dough section diameter');
      }
      near(b.area,flexed.area,.045,'surface area of bent skin');
      for(const [u,v] of [[0,1],[0,2],[1,2]]){
        near(points[face[u]].distanceTo(points[face[v]]),rest[face[u]].distanceTo(rest[face[v]]),.055,'face');
      }
      if(frame===overhead){
        const hoist=points[face[2]].y-rest[face[2]].y;
        assert.ok(hoist>.10*size,where+' the waist must share the lift of the two-handed mallet');
      }
      const turned=frame.tool==='plane' || frame.socketTurn?.some(a=>Math.abs(a)>0);
      source.geometry=travelling;
      const from=new Vector3(),to=new Vector3(),expected=new Vector3(),transport=new Quaternion();
      const index=body.geometry.index;
      let flipped=0,damaged=0;
      for(let i=0;i<flexed.normals.length;i++){
        const n=flexed.normals[i],m=b.normals[i],area=n.length();
        expected.copy(n);
        {
          from.set(0,0,0);to.set(0,0,0);
          for(let k=0;k<3;k++){
            const id=index.getX(3*i+k);
            from.add(restNormals[id]);to.add(workNormals[id]);
          }
          expected.applyQuaternion(transport.setFromUnitVectors(from.normalize(),to.normalize()));
        }
        if(expected.dot(m)<0)flipped+=area;
        if(m.length()>2*area || m.length()<.50*area)damaged+=area;
      }
      assert.ok(flipped/flexed.area<.00005,where+' inverted surface fraction '+flipped/flexed.area);
      assert.ok(damaged/flexed.area<.002,where+' stretched or crushed faces '+damaged/flexed.area);
      for(const [i,id] of actor.handVertices.entries()){
        assert.ok(g.index.array.includes(id),'grip must belong to a drawn triangle');
        const contact=scene.worldToLocal(actor.group.localToWorld(points[id].clone()));
        assert.ok(contact.distanceTo(new Vector3(...grips[i]))<1e-7,'tool grip must be a rendered point');
        const side=i?1:-1;
        assert.ok(side*points[id].x>(turned?0:.30*size),where+' hands crossed');

        const {root,diameters}=mitts[i],collar=centre(points,root),restCollar=centre(rest,root);
        const bindCollar=root.reduce((p,id)=>p.add(nativePalm(id)),new Vector3()).divideScalar(root.length);
        near(collar.distanceTo(points[id]),bindCollar.distanceTo(nativePalm(id)),.00001,'shoulder to tip');
        for(const [a,b] of diameters)near(points[a].distanceTo(points[b]),nativePalm(a).distanceTo(nativePalm(b)),.00001,'mitt diameter');
        if(frame!==far)assert.ok(insideTorso(collar,points,g),where+' wrist root separated from the chest '+i);
        if(frame===sent){
          const cap=g.userData.wristCaps[i];
          for(const axis of ['x','y','z']){
            const sorted=[...cap].sort((a,b)=>points[a][axis]-points[b][axis]);
            for(const v of [sorted[0],sorted.at(-1)])assert.ok(insideTorso(points[v],points,g),where+' exposed back of the mitt');
          }
          assert.ok(collar.z-restCollar.z>.18*size,where+' shoulder did not follow the stroke');
          const lip=face[2];
          assert.ok(points[lip].z-rest[lip].z>.19*size,where+' upper body did not reach over the work');
          assert.ok(Math.abs(points[lip].y-rest[lip].y)<.20*size,where+' head rose away from the working hands');
        }
        if(frame===release){
          assert.ok(collar.distanceTo(restCollar)<.018*size,where+' shoulder did not release');
          assert.ok(points[id].distanceTo(rest[id])<.018*size,where+' hand did not release');
        }
        const foot=centre(points,footIds[i]),home=centre(rest,footIds[i]);
        assert.ok(foot.distanceTo(home)<.23*size,where+' original foot shape pulled away from its base');
      }
    }
    actor.dispose();
  }
});

test('the reaching torso has a continuous side profile and carries its breadth below the face',async t=>{
  await loadTraveller(t);
  const fractions=[.16,.30,.34,.38,.42,.46,.50,.54,.58,.62,.66];
  const layout=cookingLayout(LIVING_SITES.find(site=>site.id==='river-mortar'));
  const recipe=STARTER_RECIPES.find(r=>r.regionId==='river').draft;
  for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const player={mode,buffs:{full:Number(full)}},actor=createCookingPerformer(new Group(),player);
    const body=actor.group.getObjectByName('Nikkori'),g=body.geometry;
    const ids=g.index.array.subarray(0,g.userData.torsoIndexCount);
    const saw=craftMotion({kind:'fence'},player,{feet:[0,0]});
    const plane=craftMotion({kind:'floor'},player,{feet:[0,0]});
    const cook=createCookingScore(recipe,layout,{mode,full});
    const at=(id,f)=>{
      const chapter=cook.chapters.find(c=>c.id===id);
      return cook.sample(chapter.start+f*(chapter.end-chapter.start));
    };
    const hit=cook.cues.find(c=>c.name==='pound').time;
    const poses=[saw.sample(saw.duration*.70),plane.sample(plane.duration*.34),at('transfer',.55),at('garnish',.55),cook.sample(hit-.32),cook.sample(hit)];
    for(const frame of poses){
      actor.update(frame);
      const points=paintedSurface(body,actor.group);
      let low=Infinity,high=-Infinity;
      for(const id of ids){low=Math.min(low,points[id].y);high=Math.max(high,points[id].y);}
      // Slice the projected silhouette at fixed proportions of the actual
      // height. Material rings can keep their diameter while riding up into
      // the crown, leaving only a narrow stem in these same world sections.
      const profile=fractions.map(f=>{
        const y=low+f*(high-low);
        let left=Infinity,right=-Infinity,front=-Infinity;
        for(let t=0;t<ids.length;t+=3)for(let e=0;e<3;e++){
          const a=points[ids[t+e]],b=points[ids[t+(e+1)%3]];
          if((a.y>y)===(b.y>y))continue;
          const u=(y-a.y)/(b.y-a.y),x=a.x+u*(b.x-a.x);
          left=Math.min(left,x);right=Math.max(right,x);
          front=Math.max(front,a.z+u*(b.z-a.z));
        }
        return {f,width:right-left,front};
      });
      const cheekWidth=Math.max(...profile.filter(p=>p.f>=.46).map(p=>p.width));
      const waist=profile[0],shoulder=profile.find(p=>p.f===.54);
      let hollow=0;
      for(const p of profile.filter(p=>p.f<shoulder.f)){
        const u=(p.f-waist.f)/(shoulder.f-waist.f);
        hollow=Math.max(hollow,waist.front+u*(shoulder.front-waist.front)-p.front);
      }
      const where=[mode,full,frame.tool??frame.phase,frame.time.toFixed(2)].join('/');
      assert.ok(hollow<cheekWidth*.02,where+' underside of the cheek overhangs the belly');
      assert.ok(profile[1].width>=cheekWidth*.84,where+' lower body narrowed beneath the cheek');
    }
    actor.dispose();
  }
});

test('the hands stay rigid and the waist keeps its thickness throughout construction and every workshop menu',async t=>{
  await loadTraveller(t);
  const site=LIVING_SITES.filter(s=>s.kind==='workshop');
  const point=new Vector3(),other=new Vector3();
  for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const player={mode,buffs:{full:Number(full)}},actor=createCookingPerformer(new Group(),player);
    const body=actor.group.getObjectByName('Nikkori'),g=body.geometry,pos=g.attributes.position;
    const hands=new Set(g.index.array.subarray(g.userData.torsoIndexCount));
    const pairs=[];
    for(const side of ['Hand_L','Hand_R']){
      const bone=body.skeleton.bones.findIndex(b=>b.name===side);
      const verts=[...hands].filter(i=>g.attributes.skinIndex.getX(i)===bone);
      for(const axis of ['getX','getY','getZ']){
        verts.sort((a,b)=>pos[axis](a)-pos[axis](b));
        pairs.push([verts[0],verts.at(-1)]);
      }
    }
    const hut=craftMotion({kind:'hut'},player,{feet:[0,0]});
    actor.update(hut.sample(0));
    const distance=([a,b])=>body.localToWorld(body.getVertexPosition(a,point))
      .distanceTo(body.localToWorld(body.getVertexPosition(b,other)));
    const reference=pairs.map(distance),sections=materialDiameters(g),widths=sections.map(distance);
    const sessions=STARTER_RECIPES.map(recipe=>createCookingScore(recipe.draft,
      cookingLayout(site.find(s=>s.id===recipe.regionId+'-mortar')),{mode,full}));
    for(const session of [hut,...sessions])for(let n=0;n<=Math.ceil(session.duration*20);n++){
      const frame=session.sample(Math.min(session.duration,n/20));
      actor.update(frame);
      const where=[mode,full,frame.tool??frame.phase,n].join('/');
      for(let i=0;i<pairs.length;i++)assert.ok(Math.abs(distance(pairs[i])-reference[i])<1e-6,
        where+' hand changed dimensions');
      for(let i=0;i<sections.length;i++){
        const tolerance=i%2===0?.025:.12;
        assert.ok(Math.abs(distance(sections[i])/widths[i]-1)<tolerance,where+' body section '+i);
      }
    }
    actor.dispose();
  }
});

test('the hands pass either side of the fillings, paddle and folded leaf throughout the recipe',async t=>{
  await loadTraveller(t);
  const recipe={...BASIC_RECIPE,finish:'grill',technique:'wrap',fillings:[
    {id:'azuki',amount:20,placement:'inside'},{id:'herb',amount:8,placement:'mixed'},{id:'sakura',amount:4,placement:'inside'}]};
  const layout=cookingLayout(LIVING_SITES.find(site=>site.id==='market-mortar'));
  const direction=new Vector3(.113,.961,.253).normalize(),ray=new Ray(),hit=new Vector3();
  for(const mode of ['normal','kagami','dango'])for(const full of [false,true]){
    const actor=createCookingPerformer(new Group(),{mode,buffs:{full:Number(full)}});
    const body=actor.group.getObjectByName('Nikkori'),g=body.geometry;
    const points=new Map(),indices=g.index.array.subarray(g.userData.torsoIndexCount);
    const pads=[[],[]];
    for(let i=0;i<indices.length;i+=3){
      const id=indices[i],side=body.skeleton.bones[g.attributes.skinIndex.getX(id)].name==='Hand_R'?0:1;
      const tri=[id,indices[i+1],indices[i+2]].map(index=>{
        if(!points.has(index))points.set(index,new Vector3());
        return points.get(index);
      });
      pads[side].push(tri);
    }
    // Test the painted palm just inside its outline. Touching the opposing
    // surface is allowed; crossing into its closed volume is not.
    const rims=g.userData.handRims.map(ids=>ids.filter((_,i)=>i%5===0).map(id=>points.get(id)));
    const surfaces=pads.map(triangles=>[...new Set(triangles.flat())]);
    const bounds=[new Box3(),new Box3()],centre=new Vector3(),probe=new Vector3();
    const courses=[recipe,STARTER_RECIPES.find(r=>r.regionId==='river').draft].map(draft=>createCookingScore(draft,layout,{mode,full}));
    for(const score of courses)for(const ch of score.chapters.filter(ch=>['prep','shape','garnish','wrap','plate'].includes(ch.id))){
      for(let time=ch.start;time<ch.end;time+=1/8){
        actor.update(score.sample(time));
        for(const [id,p] of points)body.getVertexPosition(id,p);
        for(const i of [0,1])bounds[i].setFromPoints(surfaces[i]);
        if(!bounds[0].intersectsBox(bounds[1]))continue;
        for(const side of [0,1]){
          centre.set(0,0,0);
          for(const p of rims[side])centre.add(p);
          centre.divideScalar(rims[side].length);
          for(const p of rims[side]){
            probe.copy(p).lerp(centre,.035);
            if(!bounds[1-side].containsPoint(probe))continue;
            ray.set(probe,direction);
            let crossings=0;
            for(const tri of pads[1-side])if(ray.intersectTriangle(...tri,false,hit))crossings++;
            assert.equal(crossings%2,0,mode+'/'+full+' overlapping hands in '+ch.id+' at '+time.toFixed(2));
          }
        }
      }
    }
    actor.dispose();
  }
});

test('a planted cake leans into a near contact and releases without accumulating offsets',async t=>{
  await loadTraveller(t);
  const parent=new Group(),actor=createCookingPerformer(parent,{mode:'normal',buffs:{}});
  parent.position.set(2,.5,-7);parent.rotation.y=.39;parent.scale.setScalar(1.20);
  const body=actor.group.getObjectByName('Nikkori');
  const plane=craftMotion({kind:'floor'},{mode:'normal',buffs:{}},{feet:[0,0]});
  const frame={...plane.sample(0),handWork:[0,0],lean:0,lift:0,effort:0};
  const free=actor.update(frame).map(p=>new Vector3(...p));
  const target=free[0].clone().add(new Vector3(.025,.035,-.2));
  const active={...frame,hands:[target.toArray(),free[1].toArray()],handWork:[1,0]};
  const grips=actor.update(active),held=new Vector3(...grips[0]);
  assert.ok(held.distanceTo(target)<free[0].distanceTo(target)*.65,'native hand failed to approach a nearby target');
  assert.ok(held.distanceTo(free[0])>.06,'missing working pose');
  const actual=body.localToWorld(body.getVertexPosition(actor.handVertices[0],new Vector3()));
  assert.ok(parent.worldToLocal(actual).distanceTo(held)<1e-7,'grip must be expressed in stage space');
  const released=actor.update(frame);
  for(let i=0;i<2;i++)assert.ok(new Vector3(...released[i]).distanceTo(free[i])<1e-7,'pose drift after release');
  actor.dispose();
});

test('the native hand height comes from rolling the whole cake onto the opposite or working-side foot',async t=>{
  await loadTraveller(t);
  for(const mode of ['normal','kagami'])for(const size of [1,1.28]){
    const player={mode,buffs:{full:Number(size>1)}},actor=createCookingPerformer(new Group(),player);
    const plane=craftMotion({kind:'floor'},player,{feet:[0,0]});
    const stand={...plane.sample(0),tool:undefined,socketTurn:undefined,hero:[0,0,0],heading:0,lean:0,effort:0,lift:0,
      handWork:[0,0],weightShift:[0,0],twist:0,palms:[null,null],feet:[[-.34*size,0,0],[.34*size,0,0]]};
    const free=actor.update(stand).map(p=>new Vector3(...p));
    for(let i=0;i<2;i++){
      assert.ok(free[i].distanceTo(new Vector3(...restWorkGrip(mode,i,size)))<.015*size);
      for(const sign of [-1,1]){
        const hands=free.map(p=>p.toArray());
        hands[i][1]+=.25*size*sign;
        const handWork=[0,0];handWork[i]=1;
        const grip=actor.update({...stand,hands,handWork})[i];
        const raised=sign*(grip[1]-free[i].y);
        assert.ok(raised>(sign>0?.16:.054)*size,[mode,i,sign,'native hand missed the roll',raised]);
        const tilt=actor.group.getObjectByName('mochi').rotation.z;
        assert.ok(sign*(i?1:-1)*tilt>.14 && Math.abs(tilt)<.20,'foot and body must roll together');
      }
    }
    actor.dispose();
  }
});

test('the working traveller has outward-facing skin over the painted mouth and both uncovered sockets',async t=>{
  await loadTraveller(t);
  const actor=createCookingPerformer(new Group(),{mode:'normal',buffs:{}});
  const g=actor.group.getObjectByName('Nikkori').geometry,original=g.userData.travellingSkin;
  // Unwrap the flank around the vertical axis. A reversed triangle would
  // double the skin back over its neighbour when the hand moves away.
  const pos=g.attributes.position,ix=g.index.array,added=original.attributes.position.count;
  const angle=i=>Math.atan2(pos.getX(i),pos.getZ(i));
  const faces=[0,0];
  let mouthFaces=0;
  for(let j=0;j<g.userData.torsoIndexCount;j+=3){
    const a=ix[j],b=ix[j+1],c=ix[j+2];
    if([a,b,c].every(i=>pos.getZ(i)>.82 && Math.hypot((pos.getX(i)-.006)/.17,(pos.getY(i)-1.18)/.15)<1)){
      const ab=pos.getX(b)-pos.getX(a),ac=pos.getX(c)-pos.getX(a);
      assert.ok(ab*(pos.getY(c)-pos.getY(a))-ac*(pos.getY(b)-pos.getY(a))>0,'painted lip doubles back');
      mouthFaces++;
    }
    if(Math.min(a,b,c)<added)continue;
    const ab=angle(b)-angle(a),ac=angle(c)-angle(a);
    const signed=ab*(pos.getY(c)-pos.getY(a))-ac*(pos.getY(b)-pos.getY(a));
    assert.ok(signed>0,'socket fill folds over at triangle '+j/3);
    faces[Number(pos.getX(a)>0)]++;
  }
  assert.ok(mouthFaces>0 && faces.every(count=>count>0));
  actor.dispose();
});
