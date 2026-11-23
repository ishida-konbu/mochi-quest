import * as THREE from './vendor/three.module.min.js';
import { TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';

const TAU = Math.PI*2;
const vec = (x,y,z) => new THREE.Vector3(x,y,z);
const UP = vec(0,1,0);
export const forestTexture = name => new URL('./assets/world/'+name+'.webp'+
  (name==='forest-crowns'||name==='kyo-crown-washes'?'?v=jointed-bamboo-3':''),import.meta.url).href;

export function forestGeometry(index, perchOnly = false, omitCulms = false, woodStroke = null) {
  const family = Math.floor(index/TREE_FORMS_PER_FAMILY), habit = index%TREE_FORMS_PER_FAMILY;
  const [,form,spray,spread,bole,leafColor,tipColor,barkColor] = TREE_FAMILIES[family];
  let state = (index+1)*139669;
  const random = ()=>(state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296;
  const p=[], n=[], c=[], tex=[], ix=[], culms=[];
  let restingPoint;
  const base = new THREE.Color(leafColor), tips = new THREE.Color(tipColor), bark = new THREE.Color(barkColor);
  function vertex(point, normal, tile, u,v, color) {
    p.push(point.x,point.y,point.z);
    n.push(normal.x,normal.y,normal.z);
    c.push(color.r,color.g,color.b);
    tex.push(((tile%4)+.008+.984*u)/4,(3-Math.floor(tile/4)+.008+.984*v)/4);
  }
  function stick(points,radii,sides=6,fluting=false) {
    if(woodStroke){woodStroke(points,radii,fluting && sides===5);return;}
    const start=p.length/3, side=vec(0,0,1), cross=vec(1,0,0);
    for(let j=0;j<points.length;j++) {
      const axis=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();
      side.addScaledVector(axis,-side.dot(axis)).normalize();cross.crossVectors(axis,side).normalize();
      for(let k=0;k<=sides;k++) {
        const a=TAU*k/sides, normal=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(cross,Math.sin(a));
        const radius=radii[j]*(fluting && !j ? 1+.25*Math.cos(3*a) : 1);
        const color=bark.clone().multiplyScalar(.82+.18*Math.cos(a*2+j*.34));
        vertex(points[j].clone().addScaledVector(normal,radius),normal,15,k/sides,j/(points.length-1),color);
        if (j && k) {
          const b=start+j*(sides+1)+k;
          ix.push(b-1,b-sides-2,b, b,b-sides-2,b-sides-1);
        }
      }
    }
  }
  // A folded leaf-bearing bough has two faces and a lifted ridge. The shading
  // normals point partly skyward so the underside reflects diffuse skylight.
  function tuft(center,yaw,w,h,slope,tint) {
    if(woodStroke)return;
    const start=p.length/3, dx=Math.cos(yaw), dz=Math.sin(yaw);
    const face=vec(-dz*.54,.84,dx*.54).normalize();
    const tip=vec(-dz*slope*.72,h,dx*slope*.72);
    for(let j=0;j<2;j++) for(let k=0;k<3;k++) {
      const v=j-.5, u=(k-1)*.5;
      const fold=k===1 ? w*.18:0;
      const at=center.clone().addScaledVector(tip,v);
      at.x+=dx*u*w-dz*fold;at.z+=dz*u*w+dx*fold;
      at.y+= (k===1 ? .075 : -.025)*h;
      const shade=tint.clone().multiplyScalar(.87+j*.10+(k===1?.035:0));
      vertex(at,face,spray,k/2,j,shade);
    }
    ix.push(start,start+1,start+3,start+3,start+1,start+4,
      start+1,start+2,start+4,start+4,start+2,start+5);
  }
  // A needle spray grows out of a twig. Carry its central rib forward and
  // fold the two sides down. From above it reads as a fan, from the path
  // below as a tapering hand of needles, with air between successive tiers.
  function needles(anchor,yaw,width,reach,lift,tint){
    if(woodStroke)return;
    const start=p.length/3,dx=Math.cos(yaw),dz=Math.sin(yaw),along=vec(dx,0,dz),across=vec(-dz,0,dx);
    const heel=spray===0?.18:.16;
    // Where a low evergreen whorl overhangs the bare landing spur, turn the
    // needles upward enough to leave the hawk's feet in the clear.
    const nearPerch=restingPoint && Math.hypot(anchor.x-restingPoint.x,anchor.z-restingPoint.z)<reach+width*.68
      && Math.abs(anchor.y-restingPoint.y)<width*.40;
    for(let j=0;j<2;j++)for(let k=0;k<3;k++){
      const side=k-1,span=(j-heel)*reach;
      const q=anchor.clone().addScaledVector(along,span+(!side?.095:-.04)*width)
        .addScaledVector(across,side*width*.5);
      q.y+=span*lift+(side?-.085:.10)*width;
      if(nearPerch)q.y=Math.max(q.y,restingPoint.y+.029);
      const normal=vec(across.x*side*.55-dx*lift,.88,across.z*side*.55-dz*lift).normalize();
      vertex(q,normal,spray,k/2,j,tint.clone().multiplyScalar(.86+.12*j+(side?0:.04)));
    }
    ix.push(start,start+1,start+3,start+3,start+1,start+4,
      start+1,start+2,start+4,start+4,start+2,start+5);
  }
  // Five lanceolate blades radiate from one slender shoot. Their creases
  // follow the white brush strokes of a single leaf on the bamboo spray tile.
  function bambooFan(knot,yaw,reach,hue){
    const forward=vec(Math.cos(yaw),0,Math.sin(yaw));
    for(let leaf=0;leaf<5;leaf++){
      const s=leaf-2,az=yaw+s*(.38+random()*.12);
      const dir=vec(Math.cos(az),0,Math.sin(az));
      const roll=(leaf%2?1:-1)*(.48+.38*Math.sin(yaw*2+leaf)**2);
      const cross=vec(-dir.z*Math.cos(roll),Math.sin(roll),dir.x*Math.cos(roll));
      const len=reach*(.89+random()*.39-.055*Math.abs(s)), half=len*(.105+random()*.033);
      const root=knot.clone().addScaledVector(forward,(2-Math.abs(s))*.10*reach);
      const mid=root.clone().addScaledVector(dir,len*.46); mid.y+=len*(.014+.09*random());
      const tip=root.clone().addScaledVector(dir,len); tip.y-=len*(.32+.36*random());
      const bias=(s*.025+.052)*len;tip.addScaledVector(cross,bias);
      const ridge=mid.clone();ridge.y+=half*.41;
      const normal=vec(dir.z*Math.sin(roll)+dir.x*.26,Math.cos(roll),-dir.x*Math.sin(roll)+dir.z*.26).normalize(),first=p.length/3;
      const ink=hue.clone().multiplyScalar(.88+random()*.15);
      vertex(root,normal,spray,.715,.913,ink);
      vertex(mid.clone().addScaledVector(cross,-half),normal,spray,.761,.927,ink);
      vertex(ridge,normal,spray,.771,.917,ink.clone().multiplyScalar(1.09));
      vertex(mid.clone().addScaledVector(cross,half),normal,spray,.761,.903,ink);
      vertex(tip,normal,spray,.852,.907,ink);
      ix.push(first,first+2,first+1,first+1,first+2,first+4,
        first,first+3,first+2,first+2,first+3,first+4);
    }
  }
  const crownWidth=spread*[.94,.82,1.01,1.13][habit];
  const clear=bole+[.065,-.025,.025,-.08][habit], height=[1,.97,.88,.82][habit];
  const rake=[.01,.06,.22,.045][habit];
  const cone=form==='spire', cane=form==='canes', willow=form==='weeping';
  const count=cane?[5,7,5,8][habit]:habit===1?2:habit===3?3:1;
  for(let stem=0;stem<count;stem++) {
    const angle=stem*2.399+random()*.5;
    const scale=stem===0?height:height*(.68+random()*.27);
    const lateral=stem===0 ? 0 : (cane?.105:.28);
    const footRadius=cane?.065+.088*(.5+.5*Math.sin(angle*2.3+habit)):0;
    const foot=vec(Math.cos(angle)*footRadius,0,Math.sin(angle)*footRadius);
    const spine=t=>vec(foot.x + scale*(rake*t*t + Math.cos(angle)*lateral*t + (cone||cane?.007:.074)*Math.sin(t*6.4+stem)*t),
      scale*t-(cane?.034:.018), foot.z + scale*(Math.sin(angle)*lateral*t + (cone||cane?.009:.042)*Math.sin(t*7.2+habit)*t));
    const thickness=(cane?.009:cone?.026:.034)*(stem===0?1:.61);
    const spineT=[0,.08,.27,.48,.69,.89,1];
    const points=spineT.map(spine),radii=spineT.map(t=>thickness*(1-.97*t)**.76);
    // Bury a flared heel below the steepest surveyed tree sites, so the
    // uphill and downhill sides meet the same earth as the far silhouette.
    if(!cane){points[0].y-=.035;radii[0]*=1.14;}
    const firstVertex=p.length/3;
    if(!cane || !omitCulms)stick(points,radii,cane?5:8,true);
    if(cane && !omitCulms) {
      for(let j=1;j<=7;j++) {
        const t=j*.121, rad=thickness*(1-.97*t)**.76*1.25;
        stick([spine(t-.002),spine(t+.003)],[rad,rad],5);
      }
    }
    if(cane){
      culms.push({points,radii,thickness,firstVertex,endVertex:p.length/3});
      // Moso bears paired branches at successive nodes. Long open internodes
      // give way to loose sprays, each tilting away from its own culm.
      const firstNode=stem%3===0?3:4;
      for(let j=firstNode;j<=8;j++){
        const t=j*.121, root=spine(t), az=angle+j*2.72+random()*.47;
        const run=vec(Math.cos(az),0,Math.sin(az));
        const reach=scale*(.36-.175*t)*(.80+random()*.47);
        const joint=root.clone().addScaledVector(run,reach*.38);joint.y+=reach*.29;
        const fork=root.clone().addScaledVector(run,reach*.72);fork.y+=reach*.14;
        const end=root.clone().addScaledVector(run,reach);end.y-=reach*.15;
        stick([root,joint,fork,end],[thickness*.37,thickness*.23,.0018,.00055],3);
        const hue=base.clone().lerp(tips,.22+random()*.42+.12*t);
        for(let side=0;side<2;side++){
          const off=az+(side?-1:1)*(.53+.33*random());
          const from=side?fork:joint, span=reach*(side?.27:.38);
          const twig=from.clone().add(vec(Math.cos(off)*span,span*.035,Math.sin(off)*span));
          stick([from,twig],[.0018,.00045],3);
          bambooFan(twig,off,scale*(.074+.037*random()),hue);
        }
        bambooFan(end,az,scale*(.078+.029*random()),hue);
      }
      continue;
    }
    const layers=cone ? 8 : 7;
    for(let layer=0;layer<layers;layer++) {
      const f=layer/(layers-1), level=clear+(1-clear)*f*.92;
      const whorl=cone?5:stem===0?3:2;
      for(let j=0;j<whorl;j++) {
        const yaw=layer*2.399+j*TAU/whorl+random()*.52;
        const dx=Math.cos(yaw),dz=Math.sin(yaw), origin=spine(level);
        let radius=crownWidth*(cone?1-.86*f:.57+.43*Math.sin(Math.PI*(.17+f*.74)))*(1-.64*f**2);
        if(form==='vase') radius*=.66+.72*Math.sin(f*2.3);
        if(form==='pine') radius*=1.10-.16*(layer%2);
        radius*=(.8+random()*.3)*(stem===0?1:.7);
        const lift=(cone?-.08 : willow?.095 : form==='pine'?.033 : form==='vase'?.20:.15)*(.52+.76*random());
        const swept=habit===2 ? radius*.45 : 0;
        const swing=radius*(random()-.5)*(cone?.26:.55);
        const elbow=origin.clone().add(vec(dx*radius*.37+swept*.28-dz*swing,lift*.18+.015,dz*radius*.37+dx*swing));
        const end=origin.clone().add(vec(dx*radius+swept,lift*(.8+random()*.38),dz*radius));
        // A bare spur below the first leafy whorl provides a visible landing
        // place. The sampled contact and the rendered bark share both rings.
        if (stem===0 && layer===0 && j===0) {
          const az=yaw-.64;
          const root=origin.clone().lerp(elbow,.77);
          const bend=root.clone().add(vec(Math.cos(az)*radius*.41,-.106,Math.sin(az)*radius*.41));
          const tip=bend.clone().add(vec(Math.cos(az)*radius*.66,.021,Math.sin(az)*radius*.66));
          restingPoint=bend.clone().lerp(tip,.59);
          restingPoint.y+=.005;
          if(perchOnly)return {x:restingPoint.x,y:restingPoint.y,z:restingPoint.z,yaw:Math.atan2(tip.x-bend.x,tip.z-bend.z)};
          // Round the turn before the perch, leaving a straight section of
          // exposed bark under the feet. A fine fork draws the outer tip up.
          const knuckle=bend.clone().lerp(root,.23), knee=bend.clone().lerp(tip,.13);
          stick([root,knuckle,bend,knee,tip],[thickness*.46,.012,.009,.0082,.0028],6);
          const twig=tip.clone().add(vec(Math.cos(az+.56)*radius*.20,.045,Math.sin(az+.56)*radius*.20));
          stick([tip.clone().lerp(bend,.075),tip,twig],[.0041,.0032,.0006],4);
          const tipWash=base.clone().lerp(tips,.28);
          if(cone || form==='pine')needles(twig,az+.52,.063,.084,.41,tipWash);
          else tuft(twig,az+.56,.055,.061,.044,tipWash);
        }
        const before=elbow.clone().lerp(origin,.29),after=elbow.clone().lerp(end,.26);
        const shoulder=thickness*(1-.51*f);
        stick([origin,before,after,end],[shoulder*.47,shoulder*.34,shoulder*.22,.0012],4);
        if(!cone && (layer+j)%2===0) {
          const forkYaw=yaw+(j%2?-.85:.85), forkSize=radius*(.39+.26*random());
          const fork=elbow.clone().add(vec(Math.cos(forkYaw)*forkSize,lift*.72+.045,Math.sin(forkYaw)*forkSize));
          stick([elbow,elbow.clone().lerp(fork,.48).add(vec(0,-.015,0)),fork],
            [thickness*.22,thickness*.14,.001],4);
          const forkHue=base.clone().lerp(tips,.26+random()*.43);
          if(form==='pine')needles(fork,forkYaw,.23*(1-.35*f),.17*(1-.26*f),.19,forkHue);
          else tuft(fork,forkYaw,.21*(1-.35*f),willow?.26:.16,.13,forkHue);
        }
        const sprays=cone?3:4;
        for(let k=0;k<sprays;k++) {
          const t=.34+.64*k/(sprays-1), pos=elbow.clone().lerp(end,t);
          const direction=yaw+(k%2===0?-1:1)*(.38+random()*.62);
          const size=(cone?.18:.205)*(1-.36*f)*(stem===0?1:.82)*(.87+random()*.22);
          const hue=base.clone().lerp(tips,.15+.35*random()+.36*f);
          if(family===4) hue.lerp(tips,.48);
          if(form==='blossom') hue.lerp(tips,random()*.52);
          if(willow) {
            const length=(.20+.19*random())*(1-.39*f);pos.y-=length*.39;
            tuft(pos,direction,size*.87,length,size*.15,hue);
          } else if(cone || form==='pine') {
            // Rotate successive sprays around their woody attachment. The
            // lowest cedar fans hang, while the sunlit tips sweep upwards.
            const inclination=cone?-.22+.33*f+.16*(k%2):.19+.18*(k%2);
            needles(pos,direction,size*1.18,size*(cone?1.28:1.12),inclination,hue);
          } else {
            pos.y+=size*.22;
            tuft(pos,direction,size*1.42,size*1.12,size*(.38+.36*random()),hue);
          }
        }
      }
    }
    if(cone) tuft(spine(.972),angle,.11,.15,.06,tips);
  }
  if(woodStroke)return;
  const g=new THREE.BufferGeometry();
  for(const [key,data,size] of [['position',p,3],['normal',n,3],['color',c,3],['uv',tex,2]])
    g.setAttribute(key,new THREE.Float32BufferAttribute(data,size));
  g.setIndex(ix);
  if(cane)g.userData.culms=culms;
  return g;
}

export function forestMaterial(texture) {
  const mat=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,alphaTest:.36,side:THREE.DoubleSide});
  mat.onBeforeCompile=shader=>{
    // Leaf clusters represent a volume with sky-facing normals on both sides.
    // Cylindrical bark in the final atlas tile keeps its regular normals.
    shader.vertexShader='varying float treeLeaf;\n'+shader.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\ntreeLeaf=(uv.x>.75 && uv.y<.25)?0.:1.;');
    shader.fragmentShader='varying float treeLeaf;\n'+shader.fragmentShader.replace('#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\nif(!gl_FrontFacing && treeLeaf>.5) normal=-normal;');
  };
  return mat;
}
