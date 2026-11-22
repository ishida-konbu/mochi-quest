import { surface } from './ryugu-ink.js';
import { TIDE_PORCH, tidePorchHeight } from './ryugu-palace-fittings.js';

export function entranceCanopy(p,put,bar,finish,plaque) {
  const {w,v,d}=TIDE_PORCH,front=v+d/2;
  const vertices=[],indices=[],uv=[];
  for(let j=0;j<=6;j++)for(let i=0;i<=48;i++){
    const x=w*(i/48-.5),z=d*(j/6-.5),h=tidePorchHeight(x,v+z);
    vertices.push(x,h-6.2,z);uv.push(i/48*5,j/6*1.65);
    if(i<48 && j<6){const k=j*49+i;indices.push(k,k+49,k+1,k+1,k+49,k+50);}
  }
  p.shapes.tidePorch=surface(vertices,indices,uv);
  put('tidePorch',0,5.90,v,1,1,1,'#694d3d',p.wood);
  put('tidePorch',0,6.20,v,1,1,1,'#507463',p.roofs);
  for(const sign of [-1,1]){
    // Stepped cantilever arms carry this porch without pillars in the swim lane.
    for(let i=0;i<4;i++)put('box',sign*5.46,4.48+i*.45,-7.99+i*.30,
      .68+i*.17,.38,1.76+i*.78,i%2?'#a06446':'#ba975e',p.lacquer);
    put('palaceBracket',sign*5.46,4.77,-5.89,1.58,2.18,2.38,'#a5724e',p.wood,Math.PI/2);
    for(const sign2 of [-1,1])bar([sign*5.46+.24*sign2,5.08,-7.9],[sign*5.46+.24*sign2,6.45,-3.14],.13,'#854b38',p.lacquer);
  }
  // Layered gilded karahafu fascia. A second curve of exposed cinnabar follows
  // the bell shape on its underside, framing the carved central pendant.
  for(const [dy,offset,r,color] of [[-.05,.014,.108,'#d6b479'],[-.23,0,.18,'#a2543b'],[-.42,.02,.087,'#e3c785']]){
    let last;
    for(let i=0;i<=48;i++){
      const x=w*(i/48-.5),pt=[x,tidePorchHeight(x,front)+dy,front+offset];
      if(last)bar(last,pt,r,color,p.lacquer);last=pt;
    }
  }
  for(let i=-10;i<=10;i++){
    const x=i*w/21,z=v-d*.50;
    bar([x,tidePorchHeight(x,z)+.045,z],[x,tidePorchHeight(x,front)+.045,front],.078,'#709184',p.roofs);
    put('round',x,tidePorchHeight(x,front),front+.085,.112,.10,.112,'#a78f65',p.bronze,0,Math.PI/2);
  }
  for(const x of [-2.68,2.68]){
    bar([x,6.11,front-.24],[x,tidePorchHeight(x,front)-.23,front-.24],.095,'#854d39',p.lacquer);
  }
  put('box',0,6.45,front-.18,6.30,1.58,.29,'#764b35',p.lacquer);
  put('box',0,6.45,front+.002,5.99,1.48,.093,'#c8a96e',p.lacquer);
  put('plane',0,6.45,front+.075,5.80,1.30,1,'#ffffff',plaque);
  put('palaceBracket',0,7.31,front-.08,2.24,1.65,1.6,'#bc985f',p.lacquer);
  put('shellValve',0,7.42,front+.12,.49,.68,.53,'#e1c485',p.fine);
  for(const x of [-6.89,6.89]){
    put('finial',x,tidePorchHeight(x,front),front,.23,.58,.23,'#c3a669',p.bronze);
    put('round',x,5.99,front-.21,.044,.63,.044,'#bd995e',p.bronze);
    put('palaceLamp',x,5.53,front-.21,.49,.66,.49,'#f4dec2',finish.lamp);
    put('kasa',x,5.8,front-.21,.47,.21,.47,'#71664c',p.bronze);
    put('ball',x,5.15,front-.21,.10,.12,.10,'#a66a4c',p.lacquer);
  }
}
