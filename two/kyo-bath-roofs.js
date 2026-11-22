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
  for(const face of [-1,1])model.add(sheet(42,1,(a,b)=>{
    const x=x0+(x1-x0)*a;return [x,y(x)-tall*b,z+face*deep];
  }),color);
  model.add(sheet(42,1,(a,b)=>{const x=x0+(x1-x0)*a;return [x,y(x)-tall,z+(2*b-1)*deep];}),fascia);
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

function piercedGegyo(s,side,z,crown){
  // A pierced inome pendant and a six-petal nail cover hang from the
  // junction of the two bargeboards. Both have a real reveal and a back.
  const shape=new T.Shape();
  shape.moveTo(0,.22);shape.bezierCurveTo(-.09,.16,-.234,.114,-.382,.096);
  shape.quadraticCurveTo(-.414,.016,-.339,-.033);shape.quadraticCurveTo(-.281,-.060,-.267,-.012);
  shape.bezierCurveTo(-.209,-.035,-.238,-.128,-.185,-.159);
  shape.quadraticCurveTo(-.112,-.160,-.075,-.222);shape.lineTo(0,-.332);
  shape.lineTo(.075,-.222);shape.quadraticCurveTo(.112,-.160,.185,-.159);
  shape.bezierCurveTo(.238,-.128,.209,-.035,.267,-.012);
  shape.quadraticCurveTo(.281,-.06,.339,-.033);shape.quadraticCurveTo(.414,.016,.382,.096);
  shape.bezierCurveTo(.234,.114,.09,.16,0,.22);shape.closePath();
  const cut=(x,y,r)=>{
    const p=new T.Path();p.moveTo(x,y-r);p.bezierCurveTo(x-r*.27,y-r*.25,x-r*.96,y+r*.05,x-r*.85,y+r*.57);
    p.bezierCurveTo(x-r*.76,y+r*.95,x-r*.18,y+r*.99,x,y+r*.55);
    p.bezierCurveTo(x+r*.29,y+r*1.04,x+r*.82,y+r*.86,x+r*.85,y+r*.51);
    p.quadraticCurveTo(x+r*.89,y+r*.18,x,y-r);p.closePath();shape.holes.push(p);
  };
  cut(-.205,.037,.056);cut(.205,.037,.056);cut(0,-.176,.037);
  s.add(new T.ExtrudeGeometry(shape,{depth:.094,bevelEnabled:true,bevelSize:.010,bevelThickness:.009,curveSegments:7,bevelSegments:1}),
    '#9b8158',0,crown-.310,z,1,1,1,0,side<0?PI:0);
  const front=z+side*.105,y=crown-.314;
  for(let j=0;j<6;j++){
    const a=j*PI/3;
    s.ball('#a18c68',.069*cos(a),y+.069*sin(a),front,.063,.032,.017,0,0,a);
  }
  s.add(new T.CylinderGeometry(.044,.049,.036,6),'#6f6b58',0,y,front+side*.022,1,1,1,PI/2);
}

export function karahafu(){
  const s=sculpture(),hw=2.54,hd=1.31;
  const y=(x,z)=>.205+1.08*exp(-pow(x/1.01,2))+.152*pow(x/hw,6)+.104*pow(Math.max(0,1-abs(z)/hd),1.34);
  // Each cypress-bark course overlaps the previous one. The split sheets
  // stagger from course to course over a closed substrate, with a polished
  // brown cut at the eaves. The centre ridge sheds towards both shoulders.
  s.add(sheet(52,9,(u,v)=>{const x=(2*u-1)*hw,z=(2*v-1)*hd;return [x,y(x,z)+.003,z];}),'#71634e');
  const hues=['#85765e','#8c7961','#84725c','#928064','#82715c','#88765f'];
  const courses=23;
  for(const side of [-1,1])for(let k=0;k<courses;k++){
    const a=k*hw/courses,b=(k+1)*hw/courses+.016*(k+1<courses?1:0);
    const n=6,displace=k%2*.47;
    for(let j=0;j<=n;j++){
      const lo=Math.max(-hd,((j-displace)/n*2-1)*hd),hi=Math.min(hd,((j+1-displace)/n*2-1)*hd);
      if(hi-lo<.07)continue;
      s.add(sheet(2,2,(u,v)=>{const z=lo+(hi-lo)*v,x=side*(a+(b-a)*u);
        return [x,y(x,z)+.027+.018*u+.004*sin(3.8*v+k*.93+j),z];}),hues[(j*3+k*5)%6]);
      s.add(sheet(1,2,(u,v)=>{const z=lo+(hi-lo)*v,x=b*side;return [x,y(x,z)+.045-u*.017,z];}),
        k%4?'#6a5946':'#75634e');
    }
  }
  for(const side of [-1,1]){
    const z=side*hd,line=x=>y(x,z);
    // Layers of packed bark overlap the broad dressed fascia, whose sharp
    // lip throws an actual shadow on the pierced gable decoration below.
    woodBand(s,x=>line(x)+.070,-hw,hw,z,.138,.043,'#76634e');
    for(let j=0;j<6;j++){
      const offset=.059-.020*j;
      s.add(sheet(62,1,(u,v)=>{const x=hw*(2*u-1);return [x,line(x)+offset-.009*v,
        z+side*(.048+.003*sin(7*x+j))];}),j%2?'#998466':'#655746');
    }
    woodBand(s,x=>line(x)-.072,-hw,hw,z-.008*side,.191,.052,'#8c7353');
    woodBand(s,x=>line(x)-.232,-hw,hw,z-.022*side,.042,.048,'#65533f');
    const cloud=new T.Shape();cloud.moveTo(-2.24,-.058);
    for(let j=0;j<=50;j++){const x=-2.24+4.48*j/50;cloud.lineTo(x,line(x)-.245);}
    for(let j=50;j>=0;j--){const x=-2.24+4.48*j/50;cloud.lineTo(x,.010+.144*exp(-pow((abs(x)-1.19)/.34,2)));}
    cloud.closePath();
    for(const dir of [-1,1]){
      const win=new T.Path();
      win.moveTo(dir*.104,.361);win.bezierCurveTo(dir*.154,.425,dir*.245,.678,dir*.396,.692);
      win.bezierCurveTo(dir*.548,.695,dir*.695,.542,dir*.773,.442);
      win.bezierCurveTo(dir*.610,.462,dir*.527,.514,dir*.455,.478);
      win.quadraticCurveTo(dir*.396,.450,dir*.432,.403);
      win.quadraticCurveTo(dir*.376,.378,dir*.323,.431);
      win.quadraticCurveTo(dir*.230,.467,dir*.104,.361);win.closePath();cloud.holes.push(win);
      const outer=new T.Path();outer.moveTo(dir*.838,.287);
      outer.quadraticCurveTo(dir*.99,.350,dir*1.12,.282);outer.quadraticCurveTo(dir*1.08,.202,dir*.954,.206);
      outer.quadraticCurveTo(dir*.957,.265,dir*.838,.287);outer.closePath();cloud.holes.push(outer);
    }
    s.add(new T.ExtrudeGeometry(cloud,{depth:.087,curveSegments:9,bevelEnabled:true,bevelSize:.011,bevelThickness:.007,bevelSegments:1}),
      '#725a40',0,0,z-side*.153,1,1,1,0,side<0?PI:0);
    // Narrow alternating metal caps protect just the ends and apex. The
    // natural timber remains visible along the intervening bargeboard.
    for(const [centre,w] of [[-2.42,.201],[0,.276],[2.42,.201]]){
      const span=(u,v)=>{const x=centre+(u-.5)*w;return [x,line(x)-.076-v*.159,z+side*.061];};
      s.add(sheet(8,3,span),'#6d705e');
      for(const t of [.19,.81]){const pt=span(t,.51);s.ball('#b8a47c',...pt,.019,.019,.012);}
    }
    piercedGegyo(s,side,z+side*.058,line(0));

  }
  // Two layers of exposed rafters cross the underside. Each rafter end is
  // cut perpendicular to the run, with a lighter end-grain and a dark soffit.
  s.add(sheet(52,8,(u,v)=>{const x=hw*(2*u-1),z=hd*(2*v-1);return [x,y(x,z)-.168,z];}),'#a78c65');
  for(let j=-8;j<=8;j++){
    const z=j*.149;
    for(const side of [-1,1]){
      s.add(sheet(12,3,(u,v)=>{const x=side*(.025+(hw-.05)*u),i=Math.round(v*3),edge=i<2?-.039:.039;
        const drop=i===0||i===3?.207:.259;return [x,y(x,z)-drop,z+edge];}),j%3?'#917249':'#a28760');
      s.box('#baa278',side*(hw-.033),y(hw,z)-.221,z,.047,.073,.086);
    }
  }
  for(let j=-4;j<=4;j++){
    const x=j*.53;
    for(const edge of [-1,1]){
      s.box('#7b6045',x,y(x,edge*hd)-.201,edge*(hd-.279),.083,.085,.432);
    }
  }
  const ridge=(u,v)=>{const x=(u-.5)*.225,z=(2*v-1)*(hd+.037);return [x,y(x,z)+.103+.051*cos((u-.5)*PI),z];};
  s.add(sheet(10,18,ridge),'#7a7862');
  for(const side of [-1,1])s.box('#666b5b',side*.104,1.395,0,.030,.039,2*hd);
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
