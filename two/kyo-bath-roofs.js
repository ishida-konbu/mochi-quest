// Individual kawara beds follow the actual curved roof. Their circular end
// tiles and the carved verges remain in silhouette against the pale city sky.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';

const {abs,cos,exp,PI,pow,sin}=Math;
const slate='#5c6668',light='#88908c',fascia='#605448',brass='#b69a68';
function sheet(nx,ny,sample){
  const p=[],idx=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    p.push(...sample(i/nx,j/ny));
    if(j<ny && i<nx){const k=j*(nx+1)+i;idx.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function woodBand(model,y,x0,x1,z,tall,deep,color){
  for(const face of [-1,1])model.add(sheet(56,1,(a,b)=>{
    const x=x0+(x1-x0)*a;return [x,y(x)-tall*b,z+face*deep];
  }),color);
  model.add(sheet(56,1,(a,b)=>{const x=x0+(x1-x0)*a;return [x,y(x)-tall,z+(2*b-1)*deep];}),fascia);
}
function tube(model,pts,r,shade,steps=pts.length-1){
  model.stroke(shade,pts,Array(pts.length).fill(r),steps);
}
function tileDisc(){
  const form=sculpture(),sides=12;
  // A turned rim and three raised tomoe share 69 vertices. The same
  // little end tile repeats hundreds of times along the plaster walls.
  const rings=[[1,-.10],[1,.07],[.86,.16],[.76,.08],[.015,.08]];
  form.add(sheet(sides,rings.length-1,(u,v)=>{
    const [r,z]=rings[Math.round(v*(rings.length-1))],a=u*2*PI;
    return [r*cos(a),r*sin(a),z];
  }),'#969b91');
  for(let i=0;i<3;i++){
    const a=i*2*PI/3;
    const points=[[.08,.15],[.15,.50],[.40,.56],[.56,.36],[.37,.32]];
    const coords=points.flatMap(([x,y])=>[x*cos(a)-y*sin(a),x*sin(a)+y*cos(a),.131]);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));
    g.setIndex([0,1,4,1,2,4,2,3,4]);g.computeVertexNormals();form.add(g,'#b2b2a0');
  }
  return form.finish();
}
const endTile=tileDisc();

export function wallCoping(length){
  const g=sculpture(),hw=length/2+.03,width=.69,rise=.245;
  for(const dir of [-1,1]){
    g.add(sheet(1,5,(u,v)=>[(u*2-1)*hw,rise*pow(1-v,1.26),dir*v*width/2]),slate);
    g.box('#535c5c',0,-.025,dir*width*.49,hw*2,.068,.064);
    const count=Math.max(2,Math.round(length/.30));
    for(let i=0;i<count;i++){
      const x=hw*((i+.5)*2/count-1);
      g.add(sheet(6,4,(u,v)=>{
        const t=u*PI,h=1-v;
        return [x+.045*cos(t),rise*pow(h,1.26)+.042*sin(t),dir*(.012+v*(width/2-.012))];
      }),i%3===0?'#78827e':'#6a7473');
      g.add(endTile,'#fff',x,.015,dir*(width/2+.012),.059,.059,.059,0,dir<0?PI:0);
    }
  }
  g.box('#697270',0,rise+.025,0,hw*2,.087,.154);
  return g.finish();
}

export function karahafu(){
  const s=sculpture(),hw=2.52,hd=1.30;
  const y=(x,z)=>.215+.91*exp(-pow(x/.99,2))+.14*pow(x/hw,6)+.13*pow(1-abs(z)/hd,1.3);
  s.add(sheet(60,16,(u,v)=>{const x=(2*u-1)*hw,z=(2*v-1)*hd;return [x,y(x,z),z];}),slate);
  for(const side of [-1,1]){
    const z=side*hd,line=x=>y(x,z);
    woodBand(s,line,-hw,hw,z,.185,.056,'#a18a64');
    woodBand(s,x=>line(x)-.120,-hw,hw,z+side*.02,.089,.061,'#534f46');
    for(const drop of [.018,.129]){
      const pts=Array.from({length:43},(_,i)=>{const x=hw*(i/21-1);return [x,line(x)-drop,z+side*.067];});
      tube(s,pts,.016,drop<.1?'#d0b57d':'#c1a77a',42);
    }
    // The cloud-shaped transom has an actual undercut above the lanterns.
    const a=new T.Shape();a.moveTo(-2.05,-.08);
    for(let i=0;i<=60;i++){const x=4.1*i/60-2.05;a.lineTo(x,line(x)-.19);}
    for(let i=60;i>=0;i--){const x=4.1*i/60-2.05;a.lineTo(x,-.048+.125*exp(-pow((abs(x)-1.14)/.26,2)));}
    a.closePath();
    s.add(new T.ExtrudeGeometry(a,{depth:.085,bevelEnabled:false}), '#6b5640',0,0,z-side*.15);
    for(let i=0;i<5;i++){
      const x=(i-2)*.40,cy=.16+.36*exp(-x*x*2.6);
      tube(s,[[x-.23,cy-.01,z],[x-.09,cy+.087,z],[x+.06,cy+.08,z],[x+.15,cy+.015,z],
        [x+.077,cy-.032,z],[x+.025,cy+.005,z]],.020,brass,12);
    }
  }
  for(let j=0;j<=10;j++){
    const z=(2*j/10-1)*hd*.95;
    for(const dir of [-1,1]){
      s.add(sheet(23,6,(u,v)=>{
        const x=dir*(.04+(hw-.04)*u),arc=v*PI,zz=z+cos(arc)*.044;
        return [x,y(x,zz)+.018+.048*sin(arc),zz];
      }),j%3===1?'#7f8884':'#727c7a');
      s.add(endTile,'#fff',dir*(hw+.006),y(hw,z)+.026,z,.064,.064,.064,0,dir*PI/2);
    }
  }
  for(const side of [-1,1])for(let k=-9;k<=9;k++){
    const x=k*.245;
    s.box('#9a7c59',x,y(x,side*hd)-.20,side*(hd-.16),.088,.108,.28);
  }
  return s.finish();
}

export function washHallRoof(width,depth,rise){
  const s=sculpture(),hw=width/2,hd=depth/2,ridge=hw-hd*.83;
  const roof=(x,z)=>{
    const rake=Math.max(abs(z)/hd,Math.max(0,(abs(x)-ridge)/(hw-ridge)));
    return rise*pow(Math.max(0,1-rake),1.36)+.14*pow(abs(x)/hw,8)*pow(abs(z)/hd,4);
  };
  // Four hipped slopes meet on their common corner rafters without a crease
  // cutting across the pressed tiles. Their underside has a real board soffit.
  for(const side of [-1,1]){
    s.add(sheet(38,14,(u,v)=>{
      const width=ridge+(hw-ridge)*v,x=(u*2-1)*width,z=v*hd*side;
      return [x,roof(x,z),z];
    }),slate);
    s.add(sheet(18,14,(u,v)=>{
      const z=(u*2-1)*hd*v,x=side*(ridge+(hw-ridge)*v);
      return [x,roof(x,z),z];
    }),'#68716f');
    s.add(sheet(40,1,(u,v)=>{const x=(u*2-1)*hw,z=side*hd;return [x,roof(x,z)-v*.127,z];}),fascia);
    s.add(sheet(20,1,(u,v)=>{const z=(u*2-1)*hd,x=side*hw;return [x,roof(x,z)-v*.127,z];}),fascia);
    const n=Math.round(width/.335);
    for(let j=0;j<n;j++){
      const x=(2*(j+.5)/n-1)*hw;
      const z0=Math.max(0,(abs(x)-ridge)/(hw-ridge));
      if(z0>=1)continue;
      s.add(sheet(5,9,(u,v)=>{
        const a=u*PI,xx=x+.043*cos(a),z=side*hd*(z0+(1-z0)*v);
        return [xx,roof(xx,z)+.012+.047*sin(a),z];
      }),j%3===0?'#87908a':'#75807c');
      s.add(endTile,'#fff',x,roof(x,side*hd)+.015,side*(hd+.008),.068,.068,.068,0,side<0?PI:0);
    }
    for(const corner of [-1,1]){
      const pts=Array.from({length:14},(_,i)=>{const t=i/13,x=corner*(ridge+(hw-ridge)*t),z=side*hd*t;return [x,roof(x,z)+.05,z];});
      tube(s,pts,.059,'#88908a',15);
    }
    for(let row=1;row<=9;row++){
      const v=row/10,z=side*hd*v,span=ridge+(hw-ridge)*v;
      const pts=Array.from({length:13},(_,i)=>{const x=span*(i/6-1);return [x,roof(x,z)+.010,z];});
      tube(s,pts,.012,'#4f5c5b',12);
    }
  }
  s.box('#5e5c4f',0,-.11,0,width-.09,.11,depth-.09);
  for(let i=0;i<3;i++)s.box(i===1?'#94978b':'#606b69',0,rise+.04+i*.077,0,ridge*2+.32-i*.07,.080,.27-i*.041);
  for(const side of [-1,1]){
    const x=side*(ridge+.09);
    s.ball('#76847c',x,rise+.19,0,.15,.19,.15);
    s.add(endTile,'#fff',x+side*.09,rise+.19,0,.116,.116,.116,0,side*PI/2);
  }
  return s.finish();
}
