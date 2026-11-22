// Inclined beds, fracture faces, a quartz seam and lichen on the weather side
// share one indexed mesh. Each group of stones follows a common bedding plane.
import * as THREE from './vendor/three.module.min.js';
import { tintedSurface } from './pigments.js';

function rockForm(variant, winter=false) {
  const points=[],colors=[],uv=[],index=[], sideCount=15;
  const angle=variant*1.89, TAU=Math.PI*2;
  const wet=new THREE.Color('#4e5d66'), dry=new THREE.Color('#8c9897'), snow=new THREE.Color('#edf1e9');
  const layers=[
    [-.37,.71],[-.03,.94],[.16,1],[.31,.97],[.325,.921],
    [.349,.967],[.53,.89],[.547,.849],[.559,.884],
    [.69,.85],[.715,.826],[.732,.83],[.89,.68],[.96,.39],[1,.015],
  ];
  const dried=new THREE.Color('#dad4be'),shade=new THREE.Color('#9fa9a1'),
    seam=new THREE.Color('#ece0c5'),moss=new THREE.Color('#819273'),tint=new THREE.Color();
  for(const [j,[height,radius]] of layers.entries()) {
    for(let i=0;i<=sideCount;i++){
      const a=TAU*(i%sideCount)/sideCount;
      const theta=a+.068*Math.sin(3*a+angle)+.033*Math.cos(7*a);
      const joint=.93+.118*Math.sin(3*a+angle)+.065*Math.cos(6*a-angle);
      const skew=.16*height;
      const x=Math.cos(theta)*joint*radius+skew, z=Math.sin(theta)*joint*radius;
      const dip=.15*x-.072*z;
      const worn=.058*Math.cos(2*a+angle)*radius+.045*Math.sin(5*a-height)*radius;
      points.push(x,height+dip+worn,z);
      uv.push(i/sideCount*2.6,height+dip);
      const flank=.47+.16*Math.cos(a-angle)+.09*Math.sin(4*a+j*.26);
      tint.copy(shade).lerp(dried,flank+height*.23);
      if(j===3||j===7)tint.multiplyScalar(.70);
      if(j===10)tint.lerp(seam,.68);
      if(j>=12)tint.lerp(moss,.19+.36*(.5+.5*Math.cos(a-angle)));
      if(winter){
        // The saturated band faces the swell. Snow clings to the leeward
        // shoulders of the same fractured mesh, preserving the rock silhouette.
        tint.copy(wet).lerp(dry,.10+.56*flank+.12*height);
        if(j===3||j===7)tint.multiplyScalar(.67);
        if(j===10)tint.lerp(seam,.29);
        const drift=.87+.052*Math.sin(a-angle)+.031*Math.cos(4*a);
        tint.lerp(snow,THREE.MathUtils.smoothstep(height,drift,drift+.11));
      }
      colors.push(tint.r,tint.g,tint.b);
      if(i && j){
        const k=j*(sideCount+1)+i,lo=k-sideCount-1;
        index.push(lo-1,k-1,k, lo-1,k,lo);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points,3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(index);geo.computeVertexNormals();
  return geo;
}

export function dressOutcrops(p,rocks,height) {
  const pigment=tintedSurface(p.stone.map,.34,.93,.032);
  pigment.vertexColors=true;
  for(let i=0;i<4;i++) {
    p.shapes['bedrock'+i]=rockForm(i);
    p.shapes['winterReef'+i]=rockForm(i,true);
  }
  for(const rock of rocks){
    if(rock.stratum===undefined) continue;
    p.part((rock.winterReef?'winterReef':'bedrock')+rock.stratum,rock.x,height(rock.x,rock.z),rock.z,
      rock.rx,rock.h,rock.rz,rock.winterReef?'#fff':rock.tint,rock.yaw,0,0,pigment,true,true);
  }
}
