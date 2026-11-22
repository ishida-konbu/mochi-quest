import * as T from './vendor/three.module.min.js';
import { rimPoint } from './main-bath-rims.js';

const tau=2*Math.PI;
const drift={
  sakura:['#ddaaa8','#f3d8bd',29],peach:['#ce8f95','#e9b6a8',21],
  maple:['#a55d41','#c49354',14],bamboo:['#6e875d','#afae71',5],
  temple:['#70866d','#9ca688',6],
};
let finish;
// Petals gather in small rafts along the bank. Each leaf's veins and folded
// margins share a phase, so they travel together as the surface moves.
export function addBathLeaves(parent,s,level,clock){
  if(s.rank!=='main'||!drift[s.kind])return;
  const [dark,light,n]=drift[s.kind],positions=[],colors=[],phases=[],faces=[];
  const low=new T.Color(dark),high=new T.Color(light),c=new T.Color();
  for(let i=0;i<n;i++){
    const cluster=i%3,angle=.18+cluster*1.91+(i%5-2)*.067+.065*Math.sin(i*2.64);
    const r=.62+.23*(.5+.5*Math.cos(i*3.12+cluster*.9));
    const [x,z]=rimPoint(s,angle),turn=2.4*i+s.index,ct=Math.cos(turn),st=Math.sin(turn);
    const size=(.73+.30*(1+Math.sin(i*7.83)))*(s.kind==='temple'?.235:s.kind==='bamboo'?.26:s.kind==='maple'?.115:.102);
    const phase=i*1.672+s.index;
    const point=(u,v,h,t)=>{
      positions.push(x*r+size*(ct*u-st*v),h*size,z*r+size*(st*u+ct*v));
      c.copy(low).lerp(high,t);colors.push(c.r,c.g,c.b);phases.push(phase);
      return phases.length-1;
    };
    const centre=point(0,0,s.kind==='bamboo'?.11:.035,.31);
    let outline=[];
    if(s.kind==='maple'){
      outline=[[0,-1.15],[.18,-.47],[.67,-.72],[.43,-.27],[1.02,-.18],[.50,.08],[.86,.35],[.36,.34],
        [.18,.65],[.02,.32],[-.31,.49],[-.41,.28],[-.92,.36],[-.55,.04],[-1,-.26],[-.36,-.25],[-.68,-.77],[-.14,-.45]];
    }else if(s.kind==='bamboo'){
      outline=[[-1.34,0],[-.76,-.24],[-.30,-.44],[.53,-.36],[1.34,0],[.61,.23],[-.23,.45],[-.89,.22]];
    }else if(s.kind==='temple'){
      for(let j=0;j<26;j++){
        const a=j*tau/26,r=j===0?.31:.94+.062*Math.cos(6*a);outline.push([r*Math.cos(a),r*Math.sin(a)]);
      }
    }else{
      outline=[[0,-.76],[.26,-.99],[.55,-.77],[.60,-.38],[.52,.10],[.32,.50],[.01,.84],[-.30,.49],
        [-.54,.06],[-.62,-.45],[-.56,-.82],[-.25,-1]];
    }
    const ring=outline.map(([u,v],j)=>{
      const y=s.kind==='bamboo'?.20+.38*Math.abs(u)**3:s.kind==='temple'?.11+.09*Math.cos(j*.84):.07+.07*Math.sin(j+.3*i);
      return point(u,v,y,.36+.43*Math.abs(Math.sin(j*.42+phase)));
    });
    for(let j=0;j<ring.length;j++)faces.push(centre,ring[(j+1)%ring.length],ring[j]);
    if(s.kind==='maple'||s.kind==='temple'){
      const end=s.kind==='maple'?.90:-.90;
      faces.push(point(-.036,.06,.13,.70),point(.036,.06,.13,.70),point(.05,end,.14,.79));
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.setAttribute('driftPhase',new T.Float32BufferAttribute(phases,1));
  g.setIndex(faces);g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere.radius+=.12;
  if(!finish){
    finish=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
    finish.onBeforeCompile=shader=>{
      shader.uniforms.poolClock=clock;
      shader.vertexShader='uniform float poolClock; attribute float driftPhase;\n'+shader.vertexShader
        .replace('#include <begin_vertex>',`#include <begin_vertex>
          float t=poolClock*.38+driftPhase;
          transformed+=vec3(.053*cos(t),.004*sin(1.7*t),.064*sin(t));`);
    };
  }
  const mesh=new T.Mesh(g,finish);mesh.position.y=level+.018;mesh.receiveShadow=true;parent.add(mesh);
}
