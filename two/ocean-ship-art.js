import { dressedRiceFace } from './mochi-model.js';
import { traveller } from './travelling-merchants.js';
import * as T from './vendor/three.module.min.js';
import { FLEET,vesselPose,hullWidth,hatch,stairTops,stepDepth } from './ocean-voyage.js';
import { QUAY_MERCHANTS,DECK_Y,HOLD_Y } from './seaport-layout.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash } from './scroll-sculpt.js';
import { wrapDelta } from './terrain.js';

const {PI,sin,cos,abs}=Math, oak='#826144', light='#b39a70', ebony='#493e33', rope='#b7a27a';
const v=(...a)=>new T.Vector3(...a);
function rod(b,tint,a,z,r){
  const begin=v(...a),end=v(...z),d=end.clone().sub(begin),q=new T.Quaternion().setFromUnitVectors(v(0,1,0),d.clone().normalize());
  const e=new T.Euler().setFromQuaternion(q,'YXZ');
  b.post(tint,(a[0]+z[0])/2,(a[1]+z[1])/2,(a[2]+z[2])/2,r,d.length(),r,e.x,e.y,e.z);
}
function graphic(w,h,painter){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');painter(g,w,h);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  return tex;
}
function plankTexture(){
  return graphic(1024,256,(g,w,h)=>{
    g.fillStyle='#ab8966';g.fillRect(0,0,w,h);
    for(let j=0;j<185;j++){
      const y=j*1.43,phase=j*2.41;
      g.strokeStyle=j%6?'rgba(76,49,35,.13)':'rgba(240,217,170,.31)';g.lineWidth=1+j%3*.42;
      g.beginPath();for(let x=0;x<=w;x+=9){const yy=y+2.1*sin(x/67+phase)+4.9*sin(x/211+j*.075);if(!x)g.moveTo(x,yy);else g.lineTo(x,yy);}g.stroke();
    }
    for(let j=0;j<4;j++){
      const x=j*256+31,y=66+j%2*96;
      g.fillStyle='rgba(68,51,40,.56)';g.fillRect(x,0,1.7,h);
      for(let k=0;k<4;k++){g.save();g.translate(x+26+(k%2)*179,32+(k>>1)*192);g.rotate(.27);g.fillStyle='#615241';g.fillRect(-3,-5,6,10);g.fillStyle='#b7a17c';g.fillRect(-2,-3,1.5,6);g.restore();}
      for(let ring=0;ring<4;ring++){g.beginPath();g.ellipse(x+103,y,7+ring*5,1.3+ring*1.6,.03,0,2*PI);g.strokeStyle='rgba(100,66,45,.33)';g.stroke();}
    }
  });
}
function sailTexture(indigo){
  return graphic(768,768,(g,w,h)=>{
    g.fillStyle=indigo?'#d3c6a4':'#decd9e';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=3){g.fillStyle=y%9?'rgba(109,79,48,.085)':'rgba(94,76,55,.17)';g.fillRect(0,y,w,1);}
    for(let x=0;x<w;x+=3){g.fillStyle=x%12?'rgba(255,242,191,.18)':'rgba(90,69,48,.12)';g.fillRect(x,0,1,h);}
    const ink=indigo?'#575f5d':'#8b5444';
    for(let y=53;y<760;y+=90)for(let x=0;x<w;x+=12){g.strokeStyle='rgba(84,64,44,.46)';g.lineWidth=1.6;g.beginPath();g.moveTo(x,y+2);g.lineTo(x+5,y-2);g.stroke();}
    // A single broad, slightly broken brushline prints a wave under the disk.
    g.save();g.translate(384,397);g.strokeStyle=ink;g.lineWidth=11;g.beginPath();g.ellipse(0,0,160,165,-.06,.19,6.14);g.stroke();
    const paths=indigo?[
      'M-107 70 Q-83 55 -45 65 Q-9 70 13 53 Q29 37 60 41 Q91 46 114 27 Q92 50 59 46 Q35 44 21 59 Q4 77 -41 72 Q-84 64 -107 70Z',
      'M-84 62 Q-80 30 -55 22 Q-42 14 -59 -7 Q-77 -26 -65 -65 Q-63 -75 -58 -70 Q-48 -59 -49 -33 Q-44 -49 -32 -69 Q-22 -79 -25 -63 Q-29 -37 -42 -21 Q-20 -27 -11 -19 Q4 -20 12 -12 Q9 -5 -2 -4 L-5 4 Q-12 8 -25 8 Q-31 25 -17 31 Q21 9 48 22 Q72 31 71 51 Q62 60 35 61 Q17 68 -8 63',
      'M-37 29 Q-48 44 -62 48 Q-69 58 -80 57 M38 32 Q15 40 22 51 Q40 53 43 62 M0 -12 L-5 -12 M3 -5 L14 -4',
    ]:[
      'M-109 79 Q-66 49 -30 68 Q7 82 35 58 Q73 35 112 48 Q68 45 42 68 Q18 93 -36 76 Q-69 62 -109 79Z',
      'M-96 54 Q-64 44 -52 17 Q-45 -9 -24 -22 Q-20 -30 -19 -42 Q-19 -55 -9 -57 Q9 -59 11 -45 Q25 -43 30 -32 Q47 -28 43 -20 Q34 -9 12 -8 Q16 8 32 18 Q61 33 83 21 M-51 22 Q-54 41 -48 47 Q-20 23 -7 23 Q-32 45 -36 54 Q-57 66 -83 61 M3 5 Q-4 23 19 34 Q39 41 43 50 Q47 58 62 55 M17 -43 Q21 -54 30 -51 Q38 -46 35 -36 M-4 -47 Q0 -52 4 -47',
    ];
    g.lineJoin='round';g.lineCap='round';
    paths.forEach((d,j)=>{const path=new Path2D(d);g.lineWidth=j?4.6:1.5;if(!j)g.fillStyle=ink;if(!j)g.fill(path);else g.stroke(path);});g.restore();
    g.strokeStyle=ink;g.globalAlpha=.65;g.lineWidth=7;g.strokeRect(13,11,w-26,h-22);
  });
}
function indexed(pos,uv,ix,colors){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);
  if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const stations=40;
function sheer(z){
  const ends=Math.max(0,(abs(z)-8.5)/7.5);
  const boardingOpening=Math.max(0,Math.min(1,(1.54-abs(z))/.44));
  return DECK_Y+.69+.79*ends*ends-.74*boardingOpening;
}
function plankedHull(){
  const pos=[],uv=[],ix=[],colors=[];
  for(const side of [-1,1])for(let j=0;j<10;j++){
    const start=pos.length/3;
    for(let i=0;i<=stations;i++){
      const z=-15.55+31.48*i/stations,w=hullWidth(z),keel=-1.66+.75*(abs(z)/16)**2;
      for(let k=0;k<2;k++){
        const t=(j+k)/10,lip=k?0:.026,top=sheer(z);
        pos.push(side*(w*(.57+.43*t**.75)+lip),keel+(top-keel)*t,z);
        uv.push((z+16)*.128+j*.31,k);
        const c=new T.Color(j<4?'#776b59':j===7?'#a57a5e':j===9?'#d0a981':i%12<7?'#c3ad91':'#d4b89b');
        colors.push(c.r,c.g,c.b);
      }
      if(i<stations){const n=start+i*2;ix.push(n,n+1,n+2,n+2,n+1,n+3);}
    }
  }
  for(const z of [-15.55,15.93]){
    const start=pos.length/3,w=hullWidth(z);
    for(const [x,y,u,t] of [[-w*.57,-1,0,0],[w*.57,-1,1,0],[-w,sheer(z),0,1],[w,sheer(z),1,1]]){
      pos.push(x,y,z);uv.push(u,t);colors.push(.56,.45,.32);
    }
    ix.push(start,start+1,start+2,start+2,start+1,start+3);
  }
  return indexed(pos,uv,ix,colors);
}
function deckGrain(hold=false){
  const positions=[],uv=[],indices=[];
  for(let j=0;j<80;j++){
    const z=-15.38+j*.386,z0=z-.187,z1=z+.187,half=hold?hullWidth(z)*.82:hullWidth(z)-.09;
    const spans=!hold&&z>hatch.bottom-.17&&z<hatch.top+.15?[[-half,-1.36],[1.36,half]]:[[-half,half]];
    for(const [a,b] of spans){
      const k=positions.length/3;
      const y=(hold?HOLD_Y:DECK_Y)+.009;
      positions.push(a,y,z0,b,y,z0,a,y,z1,b,y,z1);
      const off=.37*j;uv.push(a*.14+off,0,b*.14+off,0,a*.14+off,1,b*.14+off,1);
      indices.push(k,k+2,k+1,k+1,k+2,k+3);
    }
  }
  return indexed(positions,uv,indices);
}
function bulkheadBoards(){
  const positions=[],uv=[],indices=[];
  for(const z of [-8.35,6.65])for(const side of [-1,1])for(const face of [-1,1]){
    const width=hullWidth(z)*.79-.99;
    for(let n=0;n<8;n++){
      const y0=.72+n*.309+.009,y1=y0+.291,plane=z+face*.102;
      const x0=side,x1=side*(1+width),k=positions.length/3;
      positions.push(x0,y0,plane,x1,y0,plane,x0,y1,plane,x1,y1,plane);
      const off=n*.421;
      uv.push(off,0,off+width*.19,0,off,1,off+width*.19,1);
      indices.push(k,k+1,k+2,k+1,k+3,k+2);
    }
  }
  return indexed(positions,uv,indices);
}
function sailPoint(a,b,w,h,z,y){
  const bulge=.95*sin(PI*b)*(.54+.46*sin(PI*a))+.092*sin(b*PI*7)*(.6+.4*sin(PI*a));
  return [(a-.5)*w*(.85+.15*(1-b))+.48*b,y+h*b-.29*sin(PI*a)*(1-b),z+bulge+.23*(a-.5)];
}
function sail(w,h,z,y){
  const pos=[],uv=[],ix=[],nx=18,ny=21;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    pos.push(...sailPoint(i/nx,j/ny,w,h,z,y));uv.push(i/nx,j/ny);
    if(i<nx&&j<ny){const n=j*(nx+1)+i;ix.push(n,n+1,n+nx+1,n+1,n+nx+2,n+nx+1);}
  }
  return indexed(pos,uv,ix);
}
let library;
function buildLibrary(){
  const wood=plankTexture();wood.wrapS=T.RepeatWrapping;
  const hullG=plankedHull(),hullM=brushWash(new T.MeshStandardMaterial({map:wood,vertexColors:true,roughness:.93,side:T.DoubleSide}),.26);
  const pigments=brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.23);
  const sails=[false,true].map(indigo=>new T.MeshLambertMaterial({map:sailTexture(indigo),side:T.DoubleSide}));
  const main=sculpture(),detail=sculpture(),deck=DECK_Y;
  // Separate oak planks leave a real opening in the upper deck.
  for(let n=0;n<80;n++){
    const z=-15.38+n*.386,w=hullWidth(z)-.09;
    const tint=['#b59975','#a48b6c','#b29b7c','#ac9273'][n%4];
    if(z>hatch.bottom-.17&&z<hatch.top+.15){
      const span=w-1.36;for(const side of [-1,1])main.box(tint,side*(1.36+span/2),deck-.088,z,span,.176,.376);
    }else main.box(tint,0,deck-.088,z,2*w,.176,.376);
    if(n%3===0){const span=hullWidth(z)*.82;detail.box('#94775a',0,HOLD_Y-.11,z,span*2,.22,1.174);}
  }
  for(let i=0;i<stairTops.length;i++)
    detail.box(i%3?light:'#9d805f',0,stairTops[i]-.083,hatch.bottom+(i+.5)*stepDepth,2.59,.166,stepDepth+.012);
  for(const side of [-1,1]){
    for(const z of [-4.47,-.95,2.45])detail.box(ebony,side*1.37,deck+.33,z,.13,.71,.13);
    rod(detail,oak,[side*1.37,deck+.72,-4.56],[side*1.37,deck+.72,2.48],.075);
    rod(detail,light,[side*1.26,HOLD_Y+.58,hatch.bottom],[side*1.26,deck+.58,hatch.top],.052);
    for(let i=0;i<6;i++){
      const sideLine=Array.from({length:17},(_,j)=>{const z=-15.54+31.43*j/16,t=.52+i*.085;return [side*(hullWidth(z)*(.57+.43*t**.75)+.032),-1.35+(sheer(z)+1.35)*t,z];});
      main.stroke(i%2?'#765540':'#624d3e',sideLine,sideLine.map(()=>i===5?.067:.031),36);
    }
    for(const [a,b] of [[-15.5,-1.56],[1.56,15.91]]){
      const pts=Array.from({length:15},(_,i)=>{const z=a+(b-a)*i/14;return [side*hullWidth(z),sheer(z)+.038,z];});
      main.stroke(ebony,pts,pts.map(()=>.118),30);
    }
    for(let i=0;i<14;i++){
      const z=-14.1+2.1*i,w=hullWidth(z);
      detail.stroke('#70583e',[[side*w*.70,HOLD_Y-.14,z],[side*w*.80,HOLD_Y+.25,z],[side*w*.90,deck-.81,z],[side*(w-.15),deck-.21,z]], [.09,.12,.105,.072],10);
    }
    for(const z of [-8.35,6.65]){
      const w=hullWidth(z)*.79;
      const span=w-.99;
      detail.box('#8d7052',side*(1.00+span/2),1.96,z,span,2.47,.19);
      detail.box(ebony,side*1.06,1.99,z+.13,.16,2.52,.2);
      detail.box(ebony,side*w*.5,3.29,z,w,.26,.24);
    }
    for(const z of [-6.65,6.1]){
      for(let j=0;j<2;j++){
        detail.ball(j?'#a58c62':'#b49d70',side*2.57,HOLD_Y+.45,z+j*.77,.67,.40,.54);
        for(const dz of [-.22,.22])detail.stroke('#77674e',[[side*2.0,.91,z+j*.77+dz],[side*2.12,1.36,z+j*.77+dz],[side*2.59,1.56,z+j*.77+dz],[side*3.00,1.38,z+j*.77+dz]], [.026,.033,.033,.018],11);
      }
    }
    // Side windows open between ribs. The stern cabin is accessible through
    // the central doorway, under a low boarded roof with a lashed ridge.
    for(const z of [-13.5,-12.0,-10.45,-8.78])detail.box(ebony,side*2.48,deck+1.33,z,.15,2.72,.15);
    for(const y of [.36,1.76,2.52])detail.box(oak,side*2.48,deck+y,-11.14,.13,y===.36?.68:.14,4.70);
    for(let k=0;k<13;k++)detail.box(light,side*2.48,deck+1.03,-13.45+k*.384,.086,1.11,.055);
    for(const z of [-13.5,-8.78]){
      const span=z<-12?2.38:1.4,mid=z<-12?1.18:1.84;
      detail.box('#a78c63',side*mid,deck+1.26,z,span,2.52,.14);
      for(let k=0;k<6;k++)detail.box(oak,side*(mid+span*(k/6-.43)),deck+1.26,z+.09,.044,2.55,.044);
    }
    for(let i=0;i<9;i++){
      const z=-14.05+i*.72;
      rod(main,ebony,[0,deck+3.24,z],[side*2.88,deck+2.67,z],.079);
    }
    main.box('#84755c',side*1.45,deck+2.98,-11.27,2.99,.18,5.88,0,0,side*-.20);
    rod(main,oak,[side*2.89,deck+2.65,-14.2],[side*2.89,deck+2.65,-8.33],.092);
    detail.stroke('#a28252',[[side*.3,deck+1.46,15.85],[side*.45,deck+2.01,16.43],[side*.45,deck+2.27,16.19],[side*.42,deck+2.19,15.97]], [.16,.15,.079,.025],13);
    // The large steer-oar blade extends astern beside the stern beam.
    rod(main,ebony,[side*.59,deck+1.77,-12.8],[side*1.67,.1,-16.49],.105);
    main.box('#856344',side*1.7,.05,-16.56,.48,2,.20,.56,0,.16*side);
  }
  const mastDefs=[[8.2,7.15,6.1,7.5],[-6.35,9.3,7.9,8]];
  // The transverse timbers supporting the upper deck leave the central companionway clear.
  for(const z of [-14.2,-11.5,-8.8,-6.1,4.9,7.6,10.3,13.0]){
    detail.box('#806b50',0,deck-.25,z,1.86*hullWidth(z),.17,.19);
    for(const side of [-1,1]){
      const x=side*hullWidth(z)*.86;
      rod(detail,'#927759',[x,deck-.67,z],[x-side*.45,deck-.29,z],.074);
    }
  }
  const sailGs=[];
  for(const [z,w,h,y] of mastDefs){
    rod(main,'#7e6346',[0,deck-.18,z],[.04,y+h+1.22,z-.12],.195);
    rod(main,ebony,[-w*.46,y+h,z-.15],[w*.51,y+h,z+.16],.108);
    sailGs.push(sail(w,h,z+.03,y));
    for(let k=0;k<=8;k++){
      const pts=Array.from({length:7},(_,i)=>sailPoint(i/6,k/8,w,h,z+.049,y));
      main.stroke(k%2?'#8f7955':'#785f40',pts,pts.map(()=>k%2?.031:.054),12);
    }
    for(const side of [-1,1]){
      detail.stroke(rope,[[side*w*.44,y+h,z],[side*w*.48,y+h*.48,z+.92],[side*w*.51,y-.04,z+.19],[side*3.74,deck+.49,z+2.63]], [.035,.031,.032,.036],19);
      for(const dz of [-3.25,2.65]){
        main.stroke('#766750',[[.02,y+h+.77,z],[side*1.48,y+h*.37,z+dz*.4],[side*3.60,deck+.59,z+dz]], [.039,.043,.052],16);
        const lower=[side*3.60,deck+.49,z+dz];
        for(let j=0;j<4;j++)detail.box(oak,lower[0],lower[1]+j*.043,lower[2],.34,.04,.20);
      }
    }
  }
  // Cockpit cargo: bale lashings run under each pallet and up to the same
  // tackle used by the crew at the quay. The walking lane by the hatch stays clear.
  for(const side of [-1,1]){
    for(let k=0;k<3;k++){
      const x=side*(2.12+.15*(k%2)),z=4.17+k*1.11;
      detail.box('#857256',x,deck+.07,z,1.27,.13,1.07);
      detail.ball(k%2?'#bd9d71':'#b29a74',x,deck+.42,z,.60,.38,.49);
      for(const dz of [-.23,.23])detail.stroke('#786044',[[x-.58,deck+.13,z+dz],[x-.48,deck+.62,z+dz],[x,deck+.80,z+dz],[x+.49,deck+.64,z+dz],[x+.58,deck+.13,z+dz]], [.026,.035,.035,.035,.026],15);
    }
    for(const z of [10.9,11.55,12.2,12.85,13.50]){
      const w=hullWidth(z);
      // Vermilion teeth painted below the bow rail, like a repeated brush seal.
      detail.stroke('#984e3e',[[side*(w*.97+.03),DECK_Y+.58,z-.21],[side*(w*.95+.04),DECK_Y+.22,z],[side*(w*.97+.03),DECK_Y+.55,z+.18]], [.035,.06,.025],8);
    }
  }
  const little=sculpture();
  for(let j=0;j<8;j++)little.box(j%2?light:oak,-4.03-j*.307,deck-.077,0,.302,.154,2.08);
  for(const side of [-1,1])little.box(ebony,-5.14,deck+.045,side*.99,2.55,.08,.096);
  const pot=new T.LatheGeometry([[.19,0],[.30,.07],[.44,.25],[.49,.54],[.40,.74],[.23,.84],[.18,.91],[.24,.94],[.23,1.0],[.16,1.0],[.16,.94]].map(q=>new T.Vector2(...q)),22);
  for(let j=0;j<7;j++)detail.add(pot,j%2?'#815545':'#52645a',2.45+.28*sin(j),HOLD_Y,-11+j*.72,1.05,1.16,1.05);
  const scroll=graphic(512,192,(g,w,h)=>{
    g.fillStyle='#cbba93';g.fillRect(0,0,w,h);
    for(let i=0;i<7;i++){const y=20+i*27;g.beginPath();g.moveTo(0,y);for(let x=0;x<=512;x+=5)g.lineTo(x,y+5*sin(x/22+i*.7));g.strokeStyle='#7b8c82';g.lineWidth=1.5;g.stroke();}
    for(let i=0;i<5;i++){const x=22+i*107,y=65+32*sin(i);g.beginPath();g.moveTo(x-30,y+19);g.quadraticCurveTo(x-18,y+9,x-11,y-3);g.quadraticCurveTo(x-3,y+6,x+3,y-12);g.quadraticCurveTo(x+8,y-20,x+24,y+16);g.fillStyle='#a4a18a';g.fill();g.strokeStyle='#716f5a';g.stroke();}
    g.fillStyle='#635843';g.font='25px serif';g.fillText('海路之圖',18,31);
  });
  const deckhand=traveller(new T.Group(),false);
  const deckMat=new T.MeshLambertMaterial({map:wood,color:'#d3bc9b',side:T.DoubleSide});
  const tallies=graphic(256,384,(g,w,h)=>{
    g.fillStyle='#d4be90';g.fillRect(0,0,w,h);
    for(let i=0;i<255;i++){g.fillStyle=i%2?'rgba(104,73,41,.12)':'rgba(250,230,183,.43)';g.fillRect((i*83)%w,(i*43)%h,5+i%15,1);}
    g.strokeStyle='#93754f';g.lineWidth=2;g.strokeRect(8,7,w-16,h-14);
    g.font='29px serif';g.fillStyle='#594432';for(const [i,line] of ['津荷目録','青磁廿壺','麻布十反','昆布三俵'].entries()){
      for(const [j,c] of [...line].entries())g.fillText(c,202-i*57,56+j*41);
    }
    g.textAlign='center';g.fillStyle='#a25741';g.fillRect(37,259,45,50);g.font='26px serif';g.fillStyle='#e4ce9e';g.fillText('津',59,294);
  });
  const wake=sculpture();
  for(const side of [-1,1])for(let k=0;k<17;k++){
    const z=15-k*2.7,offset=z>0?hullWidth(z)+.24:4.2+(-z)*.15;
    const pts=Array.from({length:7},(_,i)=>[side*(offset+.10*i+.15*sin(i*.5+k)),.017, z-i*.49]);
    wake.stroke(k%2?'#dacfb6':'#e6e0c5',pts,[.004,.039,.070,.095,.063,.036,.003],10);
  }
  return {deckhand,deckG:deckGrain(),holdG:deckGrain(true),bulkheads:bulkheadBoards(),tallies:new T.MeshLambertMaterial({map:tallies,side:T.DoubleSide}),deckMat,wake:wake.finish(),hullG,hullM,main:main.finish(),details:detail.finish(),board:little.finish(),pigments,sails,sailGs,scroll:new T.MeshLambertMaterial({map:scroll,side:T.DoubleSide})};
}
function deckhand(template){
  const person=template.clone(true);
  // The underlying rice face is attached asynchronously at boot. Each clone
  // registers for that attachment; the fitted face geometry is shared.
  const placeholder=person.getObjectByName('にっこり餅の面相');
  const face=dressedRiceFace(6);
  face.position.copy(placeholder.position);face.scale.copy(placeholder.scale);
  placeholder.parent.add(face);placeholder.removeFromParent();
  return person;
}
function shipScene(ship,L){
  const root=new T.Group(),near=new T.Group();root.add(near);
  const mesh=(g,m,parent=root)=>{const o=new T.Mesh(g,m);o.receiveShadow=o.castShadow=true;parent.add(o);return o;};
  mesh(L.hullG,L.hullM);mesh(L.main,L.pigments);
  mesh(L.details,L.pigments,near);mesh(L.deckG,L.deckMat,near);
  mesh(L.holdG,L.deckMat,near);mesh(L.bulkheads,L.deckMat,near);
  const manifest=mesh(new T.PlaneGeometry(.51,.77),L.tallies,near);manifest.position.set(1.67,2.31,-8.228);
  const wake=mesh(L.wake,L.pigments);wake.receiveShadow=wake.castShadow=false;
  for(const g of L.sailGs)mesh(g,L.sails[ship.color==='indigo'?1:0]);
  const chart=mesh(new T.PlaneGeometry(2.36,.98),L.scroll,near);chart.position.set(0,DECK_Y+1.36,-13.40);
  const board=mesh(L.board,L.pigments);root.name='交易船・'+ship.id;
  const crew=deckhand(L.deckhand);crew.name='水先の餅船頭';near.add(crew);crew.position.set(1.62,DECK_Y,10.3);crew.scale.setScalar(.90);
  return {root,near,board,crew,wake};
}
export function createOceanShips(scene){
  library??=buildLibrary();
  const ships=FLEET.map(ship=>{const model=shipScene(ship,library);scene.add(model.root);return {...model,ship,pose:{}};});
  const hands=QUAY_MERCHANTS.map(merchant=>{
    const hand=deckhand(library.deckhand);scene.add(hand);
    hand.scale.setScalar(merchant.size);hand.name=merchant.name;
    return {...merchant,hand};
  });
  return (time,player)=>{
    for(const {hand,x,z,i,y,yaw} of hands){
      const dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
      hand.visible=dx*dx+dz*dz<43**2;
      if(hand.visible){
        const bow=Math.sin(time*.79+i);hand.position.set(player.x+dx,y+.008*bow,player.z+dz);
        hand.rotation.set(.04+.048*bow,yaw+.19*Math.sin(time*.31+i),0,'YXZ');
      }
    }
    for(const {ship,root,near,board,crew,wake,pose} of ships){
      vesselPose(ship,time,pose);
      const dx=wrapDelta(pose.x-player.x),dz=wrapDelta(pose.z-player.z),d2=dx*dx+dz*dz;
      root.visible=d2<500**2;if(!root.visible)continue;
      root.position.set(player.x+dx,pose.y,player.z+dz);root.rotation.y=pose.yaw;
      near.visible=d2<91**2;board.visible=pose.docked;
      wake.visible=!pose.docked;wake.position.y=.49-pose.y+.022*sin(time*1.11);
      wake.scale.x=1+.037*sin(time*1.24+ship.index);
      crew.visible=d2<46**2;
      if(crew.visible)crew.rotation.set(.055+.047*sin(time*.74+ship.index),-.76+.22*cos(time*.38),.025*sin(time),'YXZ');
    }
  };
}
