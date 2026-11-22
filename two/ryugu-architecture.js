import * as THREE from './vendor/three.module.min.js';
import { seaPrint } from './ryugu-ink.js';

const {sin,cos,PI}=Math;
// A real fluted valve. Tangent facets remain narrow at the hinge, spreading
// into two staggered scallops on the rim rather than a row of identical cones.
function shellValve() {
  const positions=[],uv=[],colors=[],indices=[],rows=15,cols=80;
  const lip=new THREE.Color('#827662'),nacre=new THREE.Color('#eee2c3'),heart=new THREE.Color('#c7a48d');
  const shade=new THREE.Color();
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const a=(i/cols-.5)*2.56,t=.018+j/rows*.982;
    const flute=.5+.5*cos(2*PI*14*i/cols),line=((14*i/cols+.5)%1)-.5;
    const rim=1-.031*(1-flute)*t**6,s=t*rim;
    positions.push(s*sin(a),s*cos(a),.21*sin(PI*t)*cos(a)+(.035*flute-.023)*t+.045*sin(a*2.4));
    uv.push(i/cols,j/rows);
    shade.copy(nacre).lerp(heart,.30*(1-t)+.47*flute*t)
      .lerp(lip,(.19+.33*t)*Math.exp(-line*line*140)+.52*t**12);
    colors.push(shade.r,shade.g,shade.b);
    const k=j*(cols+1)+i;
    if(j<rows && i<cols) indices.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);
  }
  const g=new THREE.BufferGeometry();g.setIndex(indices);
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function tideCarp() {
  // Munagawara ornaments: a carp's ridged tail bends back over its head.
  const p=new THREE.Shape();p.moveTo(-.60,.04);p.quadraticCurveTo(-.61,.19,-.47,.27);
  p.quadraticCurveTo(-.41,.45,-.19,.46);p.quadraticCurveTo(.12,.47,.19,.80);
  p.quadraticCurveTo(.21,.98,.15,1.12);p.quadraticCurveTo(.06,1.17,-.02,1.34);
  p.quadraticCurveTo(.12,1.32,.26,1.23);p.quadraticCurveTo(.34,1.36,.53,1.45);
  p.quadraticCurveTo(.53,1.27,.42,1.12);p.quadraticCurveTo(.52,.88,.41,.69);
  p.lineTo(.56,.79);p.lineTo(.50,.56);p.lineTo(.58,.59);p.quadraticCurveTo(.43,.30,.24,.21);
  p.quadraticCurveTo(.06,.07,-.22,.14);p.lineTo(-.41,.09);p.lineTo(-.47,.02);p.closePath();
  const g=new THREE.ExtrudeGeometry(p,{depth:.13,bevelEnabled:true,bevelThickness:.033,bevelSize:.032,bevelSegments:2,curveSegments:10});
  g.translate(0,0,-.065);return g;
}
// Sliding panels in each pavilion carry a different episode of the same
// undersea procession. A new coat of limewash lies behind the dry ink strokes.
function paintedScreen(episode) {
  const w=896,h=274,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');let seed=957+episode*777;
  const rand=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  const paper=g.createLinearGradient(0,0,0,h);
  paper.addColorStop(0,'#dfd7bb');paper.addColorStop(.58,'#e9e0c4');paper.addColorStop(1,'#c6c7af');
  g.fillStyle=paper;g.fillRect(0,0,w,h);g.lineJoin=g.lineCap='round';
  function path(d,ink,width=1,fill) {
    const outline=new Path2D(d);
    if(fill){g.fillStyle=fill;g.fill(outline);}
    if(ink){g.lineWidth=width;g.strokeStyle=ink;g.stroke(outline);}
  }
  for(let i=0;i<46;i++){
    const x=rand()*w,y=185+rand()*81,l=16+rand()*72;
    path('M'+x+' '+y+'q'+(l*.45)+' -7 '+l+' -1q'+(-l*.51)+' -3 '+(-l*.78)+' 1Z',null,1,i%3?'#a2ac98':'#879989');
  }
  // Thin, waved bands of mist separate open water from the tidepools.
  for(let i=0;i<8;i++){
    const x=rand()*w,y=23+rand()*76,l=42+rand()*156;
    path('M'+x+' '+y+'q'+(l*.46)+' -7 '+l+' -5q-'+(l*.23)+' 1 -'+(l*.34)+' 4l-'+(l*.66)+' 2Z',null,1,'#cecdb5');
  }
  for(let side=0;side<2;side++){
    g.save();g.translate(side?w:0,244);g.scale(side?-1:1,1);
    path('M-27 28Q-2 -21 33 -27L51 -42 77 -38 96 -45Q119 -39 141 -17L165 -13 191 4Q220 3 237 16L263 28Z','#736f58',2.6,'#b1ac90');
    path('M13 8Q37 -13 46 -28L61 -28 78 -37M55 0Q76 -13 88 -32M101 -29L106 -17 123 -6M137 2L144 -8 159 0','#89866b',1.6);
    const bough='M56 -31Q70 -74 55 -104Q47 -129 49 -160M63 -66Q87 -87 92 -112Q101 -120 112 -120M60 -89Q39 -102 31 -126M51 -140Q75 -153 74 -174M83 -91Q104 -88 119 -106';
    path(bough,'#8b6551',4.4);g.translate(1.5,-.5);path(bough,'#c1a287',1.5);
    for(let i=0;i<16;i++){
      const x=15+rand()*145,y=-25+rand()*31,r=9+rand()*17;
      path('M'+x+' '+y+'q-'+(r*.49)+' -'+(r*.54)+' -'+(r*.34)+' -'+r+'q'+(r*.56)+' 4 '+(r*.34)+' '+r+'Z',null,1,i%2?'#748e78':'#96a38b');
    }
    g.restore();
  }
  const play=[['octopus','bream','seaTurtle'],['seaTurtle','octopus','bream'],['bream','seaTurtle','octopus']][episode];
  for(let i=0;i<play.length;i++){
    const x=163+i*181+(episode%2?24:-4),y=67+16*cos(i*2+episode);
    g.save();g.translate(x,y);if(i===2){g.translate(145,0);g.scale(-1,1);}
    g.drawImage(seaPrint(play[i]),0,0,153,153);g.restore();
  }
  g.fillStyle='#a36f54';g.fillRect(814,182,20,25);g.strokeStyle='#dfcdab';g.lineWidth=1.2;g.strokeRect(817,185,14,18);
  path('M820 189L828 189M821 194L828 194M822 187L822 200M827 191L827 201','#dfcdab',1.1);
  for(let i=0;i<4300;i++){g.fillStyle=i%4?'rgba(250,244,218,.14)':'rgba(77,73,56,.082)';g.fillRect(rand()*w,rand()*h,1+rand()*3,.65);}
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.MeshLambertMaterial({map});
}
export function prepareSeaOrnaments(p,put,bar) {
  p.shapes.shellValve=shellValve();p.shapes.tideCarp=tideCarp();
  const shellMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  function pearlShell(u,h,v,s,yaw=0) {
    put('rock',u,h+.12*s,v,1.36*s,.27*s,.88*s,'#929281',p.stone,yaw);
    put('shellValve',u,h+.25*s,v,1.26*s,1.69*s,1.1*s,'#fff5df',shellMat,yaw,-.26);
    put('shellValve',u,h+.24*s,v,1.26*s,1.52*s,1.1*s,'#f6eccc',shellMat,yaw,1.36);
    const pearlV=v+cos(yaw)*s*.51,pearlU=u+sin(yaw)*s*.51;
    put('ball',pearlU,h+.65*s,pearlV,.32*s,.32*s,.32*s,'#ebe2ce',p.fine);
    put('ball',pearlU-.10*s,h+.77*s,pearlV+.22*s,.083*s,.068*s,.062*s,'#fff6db',p.fine);
  }
  function ridge(u,h,v,w,d,scale=1){
    // Mortared ridge with bronze collars, dragon-scaled shachi and an
    // unbroken dark lower silhouette against the watery horizon.
    for(const sign of [-1,1]) {
      const x=u+sign*w*.28;
      put('tideCarp',x,h-.013,v,scale,scale,scale,'#ab9770',p.solid,sign>0?0:PI);
      put('ball',x-sign*.35*scale,h+.29*scale,v+.096*scale,.054*scale,.054*scale,.019*scale,'#49473d',p.fine);
      const left=x-sign*.39*scale;
      bar([left,h+.23*scale,v+.08*scale],[left-sign*.19*scale,h+.17*scale,v+.12*scale],.019*scale,'#554d3b');
    }
    put('box',u,h+.045,v,w*.69,.14*scale,d*.08,'#59574b',p.roofs);
    for(let i=-2;i<=2;i++)put('box',u+i*w*.108,h+.112*scale,v,.044*scale,.042*scale,d*.081,'#ccbb8c',p.fine);
  }
  return {pearlShell,ridge,screen:paintedScreen(1)};
}
