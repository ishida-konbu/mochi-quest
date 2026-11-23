import * as T from './vendor/three.module.min.js';
import { terrainHeight } from './terrain.js';

export function fitWaterPail(limbs,model,batch) {
  const pail=model('楓峡の手桶',root=>{
    // The inside wall returns to the coopered bottom, so the same vessel
    // reads hollow going downhill and holds a visible waterline coming back.
    const outline=[[.001,-.502],[.098,-.502],[.105,-.492],[.126,-.249],
      [.126,-.238],[.115,-.238],[.095,-.483],[.001,-.483]];
    const sides=16, quarter=Math.PI/2;
    const shell=new T.LatheGeometry(outline.map(([r,h])=>new T.Vector2(r,h)),sides);
    batch(root,b=>{
      b.add(shell,'#a2825d');
      for(let i=0;i<sides;i++) {
        const angle=i*2*Math.PI/sides, s=Math.sin(angle),c=Math.cos(angle);
        b.rod([s*.105,-.492,c*.105],[s*.126,-.25,c*.126],.0018,'#796548');
      }
      for(const [h,r] of [[-.445,.110],[-.287,.123]]) {
        b.loop(0,h,0,r,r,.038,'#544f40');
      }
      const handle=[];
      for(let i=0;i<=10;i++) {
        const a=i*Math.PI/10;
        handle.push([.123*Math.cos(a),-.269+.269*Math.sin(a),0]);
      }
      b.stroke(handle,.007,'#5b5141',16,6);
      b.rod([-.046,-.009,0],[.046,-.009,0],.011,'#917852');
      for(const sign of [-1,1]) b.ball(.123*sign,-.268,0,.008,.010,.010,'#615746');
    });
    shell.dispose();
    batch(root,b=>{
      const disk=new T.CircleGeometry(.11,24);
      b.add(disk,'#8faba1',[0,0,0],[1,1,1],[-quarter,0,0]);
      disk.dispose();
    },'桶の水面');
  });
  const grip=new T.Group();
  grip.position.set(.24,-.102,.31);
  limbs.arm1.add(grip);
  grip.add(pail);
  limbs.pailGrip=grip;
  limbs.pailCord=batch(grip,b=>b.rod([0,0,0],[0,-1,0],.0045,'#8a7852'),'手桶の下げ綱');
  limbs.pail=pail;
  limbs.pailWater=pail.getObjectByName('桶の水面');
  limbs.pourStream=batch(pail,b=>b.rod([0,0,0],[0,-1,0],.0085,'#b8c9bc',.005),'手桶から鉢への水');
  limbs.pourStream.castShadow=false;
  limbs.pourStream.visible=false;
  limbs.basinWaterHeight=terrainHeight(289,-120)+.658;
}

const swing=new T.Euler(), tilt=new T.Quaternion();
const lip=new T.Vector3(),down=new T.Vector3(0,-1,0);
export function poseWaterHare(limbs,n,beat) {
  const dip=n.waterDip || 0, pour=n.waterPour || 0, reach=dip+.52*pour;
  const torso=limbs.torso;
  torso.rotation.x += .94*reach;
  // Bend about the hips. The knees and supporting paw remain over the landing.
  torso.position.y += .70*(1-Math.cos(.94*reach))-.25*reach;
  torso.position.z = -.70*Math.sin(.94*reach);
  limbs.head.rotation.x -= .38*reach;
  torso.rotation.y = .38*(n.waterYield || 0)*(1-Math.min(1,dip+pour));
  limbs.arm1.rotation.x = .13 + .22*dip - .46*pour;
  limbs['arm-1'].rotation.z += .33*reach;
  for (const s of [-1,1]) {
    limbs['leg'+s].rotation.x-=.19*reach;
    limbs['leg'+s].rotation.z+=s*.09*reach;
  }
  const moving=Math.min(1,n.speed);
  const pail=limbs.pail;
  swing.set(.035*moving*Math.sin(beat)+1.04*dip+1.19*pour,0,.025*moving*Math.cos(beat));
  // Suspend the handle from the paw while gravity keeps the load upright.
  limbs.pailGrip.quaternion.copy(torso.quaternion).multiply(limbs.arm1.quaternion).invert();
  pail.quaternion.copy(tilt.setFromEuler(swing));
  const drop=.44*dip;
  pail.position.y=-drop;
  limbs.pailCord.visible=drop>.005;
  limbs.pailCord.scale.y=drop;
  const level=n.pailLevel || 0;
  limbs.pailWater.visible=level>.04;
  limbs.pailWater.position.y=-.476+.181*level;
  limbs.pailWater.scale.setScalar(.85+.15*level);

  // The lowest edge of the tipped rim is already over the stone bowl.
  const stream=limbs.pourStream;
  stream.visible=pour>.97 && level>.015 && level<.985;
  if(stream.visible) {
    stream.position.set(0,-.238,.126);
    lip.copy(stream.position);
    const height=pail.localToWorld(lip).y-limbs.basinWaterHeight;
    pail.getWorldQuaternion(tilt).invert();
    const flow=Math.min(1,level*9,(1-level)*9);
    stream.quaternion.setFromUnitVectors(down,lip.copy(down).applyQuaternion(tilt));
    stream.scale.set(flow,Math.max(.002,height),flow);
  }
}
