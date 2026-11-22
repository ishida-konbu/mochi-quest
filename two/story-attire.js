// Clothes are cut to the resident's body. The twelve swatches share a single
// weave atlas while the hems, wraps, carries and occupational tools are cut separately.
import * as T from './vendor/three.module.min.js';
import { batchActorParts as batch } from './actors.js';
import { residentRobeSurface } from './resident-art.js';
const tau=Math.PI*2,{sin,cos}=Math;
// Textile swatch, cut of garment, personal carry, dye of the lining.
const wardrobe={
 炭焼き:[7,'apron','charcoal','#62625c'],茶屋の亭主:[2,'bib','tea','#77816b'],
 卯助:[0,'halfcoat','coil','#415b63'],おはな:[1,'bib','petal','#b97668'],亀吉:[0,'mantle','sounder','#708674'],
 弥平:[2,'apron','spokeshave','#81785c'],ささ:[2,'halfcoat','bamboo','#748259'],豆蔵:[3,'mantle','beans','#af714e'],
 お絹:[6,'stole','silk','#94647b'],樽平:[3,'bib','cask','#84583f'],こま:[7,'mantle','pedlar','#aa795c'],
 お登勢:[9,'stole','keys','#a9736a'],留吉:[0,'apron','steampad','#657c7a'],ちか:[0,'mantle','towel','#63807a'],
 みのり:[4,'halfcoat','seedlings','#849165'],稲次:[4,'mantle','rice','#9d8051'],おせん:[4,'bib','riceears','#b89965'],
 網次:[5,'stole','floats','#627c81'],お浜:[5,'bib','shuttle','#768b88'],汀:[11,'mantle','shells','#688174'],
 お冬:[6,'mantle','nuts','#81758a'],炭六:[6,'mantle','charcoal','#5e605d'],しの:[6,'mantle','lamp','#757285'],雪丸:[6,'halfcoat','tinder','#6e7490'],
 栗太:[7,'halfcoat','chestnut','#a47853'],楓:[7,'mantle','plane','#a97853'],望:[8,'halfcoat','brand','#565e77'],甚八:[8,'mantle','reeds','#918967'],
 朝吉:[9,'halfcoat','twist','#a76851'],うめ:[9,'bib','dipcloth','#c3826b'],磯松:[5,'mantle','net','#617873'],
 八重:[1,'stole','letters','#9f7064'],勘兵衛:[3,'stole','abacus','#756553'],宗伯:[8,'mantle','scrolls','#68596a'],
 おこげ:[2,'stole','spools','#988177'],玄鐘:[4,'stole','beads','#7e674c'],版次:[8,'mantle','blocks','#555e6b'],
 すずり:[8,'stole','brushes','#595d6d'],ちよ:[0,'apron','towel','#77857e'],灯介:[9,'mantle','tinder','#906e4e'],
 桃子:[10,'bib','peaches','#bd897f'],久蔵:[10,'halfcoat','pruner','#819266'],ちとせ:[10,'mantle','tea','#9d8873'],
 墨八:[8,'stole','brushes','#555d67'],小鞠:[11,'stole','petal','#b98573'],鼓太:[11,'mantle','twist','#698c83'],なぎ:[11,'stole','keys','#778b83'],
 蓮照:[4,'kasaya','beads','#86755d'],ふみ:[2,'stole','scrolls','#86826e'],大吉:[4,'mantle','boards','#94795d'],
 お紺:[2,'mantle','tofu','#65756e'],結:[1,'mantle','ribbons','#a66359'],笛丸:[1,'halfcoat','flutecase','#996f7d'],
 昆太:[11,'apron','kelp','#717f6b'],北十郎:[5,'mantle','coil','#5e7372'],のり:[2,'bib','twine','#7b8b73'],
 杢吉:[5,'apron','plane','#686f68'],お澄:[11,'stole','tickets','#8d8677'],鉄平:[7,'mantle','tongs','#72665c'],
 とわ:[11,'apron','potters','#7e8e8a'],安蔵:[0,'bib','tallies','#786e5f']
};
const cream='#e7d6ad',reed='#c7a676',wood='#8f6e4e',soot='#515047',green='#768468',silver='#99a09a',rust='#a4624b';
const kitCache=new Map();
let clothMaterial;
function panel(parent,name,swatch,point,w=28,h=11){
  if(!clothMaterial){
    const map=new T.TextureLoader().load(new URL('./assets/residents/mochiyori-textiles.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    clothMaterial=new T.MeshStandardMaterial({map,color:'#ded3b9',side:T.DoubleSide,roughness:1});
  }
  const p=[],uv=[],ix=[],col=swatch%4,row=Math.floor(swatch/4);
  for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){
    const u=i/w,v=j/h,k=j*(w+1)+i;
    p.push(...point(u,v));
    uv.push((col+.015+.97*u)/4,1-(row+.985-.97*v)/3);
    if(i<w&&j<h)ix.push(k,k+w+1,k+1,k+1,k+w+1,k+w+2);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  const cloth=new T.Mesh(geo,clothMaterial);cloth.name=name;cloth.castShadow=cloth.receiveShadow=true;parent.add(cloth);
}
function trim(b,at,dye,edges=[0,1]){
  for(const v of edges){
    const pts=Array.from({length:21},(_,i)=>at(i/20,v));b.stroke(pts,.007,dye,24);
    b.stroke(Array.from({length:21},(_,i)=>at(i/20,v===0?.035:.965)),.0033,cream,24);
  }
}
function rod(b,x,y,z,dx,dy,dz,r,tone,end=r){b.rod([x,y,z],[x+dx,y+dy,z+dz],r,tone,end);}
function hoop(b,x,y,z,rx,rz,r,tone){
  b.stroke(Array.from({length:31},(_,i)=>[x+rx*cos(i*tau/30),y,z+rz*sin(i*tau/30)]),r,tone,36);
}
function pannier(b,height=.16){
  for(let j=0;j<5;j++)hoop(b,0,height*j/4,0,.106+j*.009,.078+j*.006,.009,j%2?reed:wood);
  b.ball(0,.015,0,.112,.013,.083,wood);
  for(let i=0;i<16;i++){const a=i*tau/16;rod(b,.102*cos(a),.005,.076*sin(a),.038*cos(a),height,.023*sin(a),.006,reed);}
  b.stroke([[-.132,height-.015,0],[-.11,height+.065,0],[0,height+.105,0],[.11,height+.065,0],[.132,height-.015,0]],.010,wood);
}
function rolled(b,x,z,h,r,col){
  rod(b,x,0,z,0,h,0,r,col);
  for(const y of [.023,h-.026])hoop(b,x,y,z,r*1.01,r*1.01,.005,wood);
  b.ball(x,h+.003,z,r,.005,r,cream);hoop(b,x,h+.008,z,r*.64,r*.64,.0028,wood);
}
function bundle(b,stuff,colour){
  pannier(b);
  for(let i=0;i<11;i++){
    const a=i*2.4,r=.093*Math.sqrt(i/11),x=cos(a)*r,z=sin(a)*r,y=.146+.032*(1-r/.094);
    if(stuff==='charcoal'){
      rod(b,x,.015,z,.034*sin(i),.20+.045*(i%3),.040*cos(i),.024,i%2?'#4d514c':'#686b62',.021);
      b.stroke([[x-.008,.10,z+.023],[x-.005,.168,z+.022],[x+.012,.207,z+.019]],.002,'#959689',8);
    }else{
      const scale=stuff==='beans'?.023:.042;
      b.ball(x,y,z,scale,scale*(stuff==='chestnut'?.89:1),scale*.85,colour,[.07,a,.1]);
      if(stuff==='chestnut')b.ball(x,y+.020,z+.02,.019,.004,.018,'#bf9e73');
      if(stuff==='peaches'){b.stroke([[x-.016,y+.031,z+.019],[x,y+.019,z+.039],[x+.008,y,z+.040]],.0027,rust);
        rod(b,x,y+.029,z,.009,.025,.001,.003,wood);}
    }
  }
}
function blades(b,count,style){
  for(let j=0;j<count;j++){
    const tilt=(j-(count-1)/2)/count,x=.045*sin(j*2.2),z=.035*cos(j*1.9),top=style==='reeds'?.62:.36;
    const end=[x+.17*tilt,top+.09*cos(j),z-.064];
    b.stroke([[x,0,z],[x+.05*tilt,.16,z],end],.0045,style==='reeds'?reed:green);
    for(let k=0;k<4;k++){
      const px=x+.062*tilt,py=.12+k*.041,pz=z-.012;
      if(style==='riceears'||style==='reeds')b.ball(end[0]+.012*k,end[1]-.023*k,end[2],.012,.037,.008,style==='riceears'?'#c7a35c':'#d2bf94',[0,0,-.66]);
      else b.ball(px+tilt*.045,py,pz,.015,.086,.006,green,[.24,0,tilt*.93+(k%2?.35:-.35)]);
    }
  }
  for(const y of [.046,.072])hoop(b,0,y,0,.06,.049,.006,wood);
}
function clothRoll(b,col){
  b.ball(0,.07,0,.131,.072,.087,col,[0,0,.06]);
  for(const s of [-1,1])b.stroke([[s*.121,.059,.034],[s*.084,.036,.068],[0,.034,.085],[-s*.094,.044,.057]],.004,cream);
  b.stroke([[-.105,.097,.018],[0,.123,.041],[.092,.117,.038]],.004,cream);
}
function toolBody(b,key,dye){
  if(['beans','nuts','chestnut','peaches','charcoal','tofu'].includes(key)){bundle(b,key,{beans:'#9b6855',nuts:'#917958',chestnut:'#a77b50',peaches:'#d39580',tofu:'#ccae72'}[key]);return;}
  if(['bamboo','seedlings','riceears','reeds'].includes(key)){blades(b,key==='reeds'?12:8,key);return;}
  if(['silk','scrolls','letters','tickets','tallies','pedlar'].includes(key)){
    if(key==='pedlar')pannier(b,.18);
    for(let j=0;j<3;j++){
      const x=(j-1)*.073,z=.017*cos(j*2);
      if(key==='tallies'||key==='tickets') {
        b.box(x,.10+.018*j,z,.061,.194,.022,reed,[0,.07*j,(j-1)*-.13]);
        for(let k=0;k<3;k++)b.box(x,.094+k*.028,z+.014,.021,.003,.002,wood);
        b.ball(x,.169+.018*j,z+.015,.007,.008,.002,soot);
      }else rolled(b,x,z,.246+.037*(j%2),.040,key==='silk'||key==='pedlar'?[rust,green,'#777894'][j]:cream);
    }
  }else if(['spools','twine','shuttle','spokeshave','potters','brand','brushes','flutecase','plane','pruner','tongs','tinder','keys','abacus'].includes(key)){
    if(key==='plane'||key==='spokeshave'){
      b.box(0,.042,0,key==='plane'?.24:.29,.071,.096,wood,[0,.09,0]);
      b.box(.021,.091,0,.063,.11,.05,silver,[0,0,-.41]);rod(b,-.08,.065,0,0,.03,0,.021,reed);
    }else if(key==='abacus'){
      for(const z of [-.073,.073])b.box(0,.012,z,.28,.027,.023,wood);
      for(const x of [-.13,.13])b.box(x,.012,0,.018,.027,.144,wood);
      for(let j=0;j<7;j++){const x=(j-3)*.034;rod(b,x,.016,-.07,0,0,.14,.0035,reed);
        for(const z of [-.045,-.024,.032])b.ball(x,.019,z,.014,.012,.009,soot);}
    }else if(key==='keys'||key==='tongs'||key==='pruner'){
      if(key==='keys'){hoop(b,0,.18,0,.047,.025,.006,wood);
        for(let j=0;j<3;j++){const x=(j-1)*.039;rod(b,x,.019,0,0,.16+.01*j,0,.006,silver);b.box(x+.013,.025,0,.034,.023,.014,silver);}}
      else{
        for(const sign of [-1,1])b.stroke([[sign*.064,.00,.009],[sign*.032,.113,0],[0,.19,0],[-sign*.042,.249,0],[-sign*.025,.279,.005]],.010,soot);
        b.ball(0,.19,.009,.015,.014,.008,silver);
      }
    }else if(key==='spools'||key==='twine'||key==='shuttle'){
      for(let i=0;i<2;i++){const x=(i-.5)*.092;rolled(b,x,0,.165,.032,i?dye:cream);
        for(let j=0;j<8;j++)hoop(b,x,.033+.012*j,0,.035,.035,.003,i?reed:dye);}
      if(key==='shuttle'){b.ball(.057,.092,.04,.018,.124,.014,wood,[0,0,-.22]);b.ball(.068,.140,.056,.006,.024,.002,cream);}
    }else if(key==='tinder'){b.ball(0,.035,0,.085,.034,.058,soot);b.box(.022,.087,0,.14,.038,.053,'#918b77',[0,0,.25]);}
    else{
      rolled(b,0,0,key==='flutecase'?.32:.133,.061,dye);
      for(let i=0;i<3;i++){const x=(i-1)*.023;rod(b,x,.035,0,.024*(i-1),.232+i*.026,.006,.008,reed);
        if(key==='brushes')rod(b,x+.024*(i-1),.267+i*.026,.006,.005,.062,0,.013,soot,.001);
        else if(key==='potters')b.ball(x+.024*(i-1),.275+i*.026,.006,.016,.031,.009,wood);}
      if(key==='brand')b.box(.028,.327,.006,.06,.024,.050,soot);
    }
  }else if(key==='coil'||key==='floats'||key==='net'){
    for(let j=0;j<7;j++)hoop(b,0,.013+j*.012,0,.13-.002*j,.082-.0015*j,.009,j%2?wood:reed);
    if(key!=='coil')for(let j=0;j<5;j++){const x=(j-2)*.042;b.ball(x,.10,.01,.019,.033,.014,reed);b.stroke([[x,.091,.017],[x-.023,.048,.052],[x,.021,.071],[x+.023,.048,.052],[x,.091,.017]],.0036,soot);}
  }else if(key==='cask'||key==='tea'||key==='lamp'){
    const y=key==='cask'?.11:.07;b.ball(0,y,0,.104,y,.10,key==='lamp'?'#d2b67f':dye);
    for(const t of [.36,1,1.64])hoop(b,0,y*t,0,.10*(t===1?1:.8),.10*(t===1?1:.8),.007,wood);
    if(key==='lamp')b.stroke([[-.064,.122,0],[-.038,.224,0],[.043,.224,0],[.069,.125,0]],.006,soot);
    else if(key==='tea'){b.ball(0,.146,0,.059,.012,.059,reed);rod(b,-.074,.078,0,-.067,.049,0,.027,dye,.017);}
  }else if(key==='kelp'){
    for(let j=0;j<6;j++){
      const pts=[],ix=[];for(let k=0;k<=12;k++){
        const v=k/12,x=(j-2.5)*.035+.016*sin(10*v+j),y=.032+v*(.23+.035*cos(j)),z=.012*cos(j)+.035*sin(v*4+j);
        pts.push(x-.020*(1-.35*v),y,z,x+.022*(1-.35*v),y,z+.012*sin(v*9));const a=2*k;if(k)ix.push(a-2,a-1,a,a-1,a+1,a);
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setIndex(ix);g.computeVertexNormals();b.add(g,j%2?'#535f4a':'#6b7255');g.dispose();
    }
    hoop(b,0,.073,0,.09,.037,.008,reed);
  }else if(key==='boards'||key==='blocks'){
    for(let j=0;j<3;j++)b.box(0,.021+j*.027,0,key==='boards'?.40:.21,.025,key==='boards'?.26:.18,j%2?wood:reed,[0,.02*j,0]);
    if(key==='blocks')for(let j=0;j<10;j++)b.box(-.078+(j%4)*.046,.091,-.049+Math.floor(j/4)*.038,.026,.008,.014,soot,[0,j*.51,0]);
  }else if(key==='shells'||key==='petal'||key==='beads'){
    for(let i=0;i<14;i++){const a=i*tau/14;b.ball(.089*cos(a),.066*(1+sin(a))+.018,.004,.013,.016,.009,key==='beads'?wood:cream);}
    if(key==='petal')for(let i=0;i<5;i++){const a=i*tau/5;b.ball(.03*cos(a),.131+.029*sin(a),.019,.022,.027,.008,'#d9a398',[0,0,-a]);}
    if(key==='shells')for(let i=0;i<3;i++)b.ball((i-1)*.041,.021,0,.027,.023,.014,cream,[.06,0,i*.32]);
  }else if(key==='sounder'){rod(b,-.14,-.012,0,.39,.041,0,.012,wood,.008);for(let i=0;i<6;i++)rod(b,-.093+i*.044,.004+i*.005,0,.007,.001,0,.013,cream);}
  else if(key==='rice'){ // spare small tied sample beside the carrier's existing full bale
    b.ball(0,.081,0,.094,.087,.083,reed);hoop(b,0,.145,0,.057,.047,.009,wood);b.ball(0,.166,0,.053,.028,.055,cream);
  }else {clothRoll(b,dye);
    if(key==='ribbons'||key==='twist')for(const s of [-1,1])b.stroke([[0,.113,0],[s*.05,.16,.023],[s*.106,.14,.015],[s*.071,.10,.056],[s*.111,.013,.066]],.014,s>0?rust:cream);
  }
}
function kit(parent,key,dye,at,scale=1,rot=0){
  const cacheKey=key+dye;
  if(!kitCache.has(cacheKey)){const g=new T.Group();batch(g,b=>toolBody(b,key,dye));kitCache.set(cacheKey,g);}
  const g=kitCache.get(cacheKey).clone();g.name='仕事道具・'+key;g.position.fromArray(at);g.scale.setScalar(scale);g.rotation.y=rot;parent.add(g);return g;
}
function backHat(parent,type,shade,kasa){
  const g=new T.Group();g.name=kasa?'背に掛けた編笠':'作業頭巾の結び';parent.add(g);
  if(kasa){
    g.position.set(0,type==='frog'?.96:1.07,type==='monkey'?-.185:-.222);g.rotation.x=-1.24;
    batch(g,b=>{
      const pts=[],ix=[];
      for(let j=0;j<=7;j++)for(let i=0;i<=40;i++){const r=j/7,a=i*tau/40,k=j*41+i;pts.push(r*.333*cos(a),.183*(1-r**.73),r*.32*sin(a));if(i<40&&j<7)ix.push(k,k+41,k+1,k+1,k+41,k+42);}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setIndex(ix);geo.computeVertexNormals();b.add(geo,reed);geo.dispose();
      for(let j=1;j<=7;j++){const r=j/7;hoop(b,0,.185*(1-r**.73),0,r*.333,r*.32,.0036,wood);}
      for(let i=0;i<14;i++){const a=i*tau/14;b.stroke([[.012*cos(a),.174,.012*sin(a)],[.160*cos(a),.080,.155*sin(a)],[.333*cos(a),.003,.32*sin(a)]],.0035,cream);}
    });
  }else{const h=type==='frog'?1.19:type==='rabbit'?1.43:1.39;
    batch(g,b=>{
      b.stroke([[-.13,h-.05,-.062],[-.064,h-.032,-.158],[.045,h-.037,-.155],[.115,h-.055,-.104]],.024,shade);
      for(const s of [-1,1])b.stroke([[.029,h-.034,-.167],[.022+s*.064,h-.059,-.198],[.029+s*.089,h-.12,-.202],[.031+s*.105,h-.16,-.20]],.022,shade);
    });
  }
}
function bodyPoint(kind){
  if(kind!=='monkey')return residentRobeSurface(kind);
  return(a,t,off=0)=>{const r=.254+.022*sin(t*Math.PI)-.079*t**3, d=.195+.026*sin(t*Math.PI)-.036*t**3;
    return [(r+off)*sin(a),.585+t*.652,-.026+.093*t+(d+off)*cos(a)];};
}
export function detailStoryFace(head,kind,name) {
  if(kind==='frog'){
    batch(head,b=>{
      for(const s of [-1,1]){
        const rotation=[0,s*.86,s*-.07],cx=s*.187,cy=.177,cz=.166;
        const forward=[s*.76,.03,.65];
        b.ball(cx,cy,cz,.071,.060,.043,'#b9ac87',rotation);
        b.ball(cx+forward[0]*.024,cy+.003,cz+.015,.054,.045,.020,'#c0a56f',rotation);
        b.ball(cx+forward[0]*.041,cy+.006,cz+.027,.036,.014,.008,'#403c30',rotation);
        b.ball(cx+forward[0]*.047-s*.004,cy+.013,cz+.034,.005,.005,.003,'#f1e8ca',rotation);
        b.stroke([[s*.155,.198,.218],[s*.173,.227,.208],[s*.203,.239,.175],[s*.221,.219,.141],[s*.224,.199,.128]],.0034,'#887c60',12,5);
        b.stroke([[s*.152,.006,.009],[s*.181,.024,.094],[s*.18,.054,.211],[s*.139,.064,.298],[s*.076,.077,.375],[s*.015,.084,.412]],.0048,'#5d523d',17,5);
        if(name==='弥平')for(let j=0;j<3;j++)b.stroke([[s*.230,.088-j*.012,.054],[s*.238,.070-j*.012,.021],[s*.218,.054-j*.010,-.033]],.0028,'#8c8166');
      }
    });
  }
  if(kind!=='monkey'||!wardrobe[name])return;
  const [swatch,, ,dye]=wardrobe[name],caps={蓮照:'cowl',勘兵衛:'eboshi',安蔵:'tenugui',栗太:'tenugui',こま:'bonnet',久蔵:'tenugui',お登勢:'bonnet',昆太:'tenugui'};
  const cut=caps[name],h=cut==='eboshi'?.20:cut==='cowl'?.135:cut==='bonnet'?.105:.045;
  const at=(u,v)=>{
    const a=u*tau,r=cut==='tenugui'?1-.032*v:Math.max(.015,(1-v)**.43);
    const brim=cut==='cowl'?.117:.178;
    return [(.197+.008*cos(a*4))*(r+.018*cos(a*7))*sin(a)-.046*v*v,brim+.015*cos(a)+v*(cut==='tenugui'?.053:.283+h-brim),-.020+.185*r*cos(a)-.040*v];
  };
  panel(head,'頭に結んだ仕事着',swatch,at,36,10);
  batch(head,b=>{
    trim(b,at,cut==='eboshi'?'#4e4c45':dye,[0]);
    if(cut==='tenugui')for(const s of [-1,1])b.stroke([[0,.188,-.202],[s*.054,.164,-.218],[s*.096,.102,-.219],[s*.096,.078,-.20]],.019,dye);
  });
}
export function dressStoryWorker(body,kind,name,dining=false){
  if(!wardrobe[name])return;
  const [swatch,cut,key,dye]=wardrobe[name],base=bodyPoint(kind);
  const rim=kind==='monkey'?.031:.029;
  const at=(u,v)=>{
    let a,t;
    if(cut==='bib'||cut==='apron'){a=(u-.5)*(cut==='bib'?1.80:2.28)*(.96-.19*v);t=.016+(cut==='bib'?.66:.43)*v;}
    else if(cut==='stole'||cut==='kasaya'){a=(u-.5)*(cut==='kasaya'?1.94:.77)+.93-1.50*v;t=.09+.79*v;}
    else{a=(u-.5)*5.66+Math.PI;t=(cut==='mantle'?.20:.345)+v*(cut==='mantle'?.72:.54);}
    const p=base(a,t,rim+.025*(1-v)+.006*sin(u*29+v*3));
    if(cut==='mantle')p[1]-=.044*(1-v)*(1+.5*cos(a*5));
    return p;
  };
  panel(body,'土地染めの仕事着',swatch,at);batch(body,b=>trim(b,at,dye));
  if(dining)return;
  const pos=base(.93,.392,rim+.041);
  const satchel=kit(body,key,dye,[pos[0]+.03,pos[1]-.109,pos[2]+.015],.88,.30);
  batch(body,b=>{
    const [x,y,z]=satchel.position.toArray();
    b.stroke([base(.61,.45,rim+.016),[x-.021,y+.081,z+.019],[x+.035,y+.056,z+.002],base(1.23,.45,rim+.014)],.009,wood);
  });
  if(['卯助','みのり','甚八','こま','栗太','久蔵'].includes(name))backHat(body,kind,dye,true);
  else if(['弥平','留吉','樽平','朝吉','うめ','おせん','杢吉','とわ'].includes(name))backHat(body,kind,dye,false);
}
export function dressPackAnimal(body,name,at){
  if(!wardrobe[name])return;
  const [swatch,,key,dye]=wardrobe[name];
  const lifted=(u,v)=>{const p=at(u,.11+.78*v);p[0]+=.009*sin((u-.5)*Math.PI);p[1]+=.010;return p;};
  panel(body,'背へ結んだ土地染めの荷布',swatch,lifted);batch(body,b=>trim(b,lifted,dye));
  const top=at(.51,.49),flank=at(.88,.53),large=['rice','boards','charcoal','beans','kelp','tongs','coil','blocks'].includes(key);
  kit(body,key,dye,[top[0]+(large?0:.035),top[1]-.014,top[2]],large?1.32:1.06,.15);
  if(key==='ribbons')kit(body,'petal',dye,[flank[0],flank[1]-.066,flank[2]+.06],.84,.9);
  batch(body,b=>{
    for(const v of [.19,.80])b.stroke(Array.from({length:19},(_,i)=>{
      const p=lifted(i/18,v);p[1]+=.012+.026*sin(i*Math.PI/18)**4;return p;
    }),.008,reed);
  });
}
export function dressSpecial(body,kind,name){
  if(!wardrobe[name])return;
  const [, ,key,dye]=wardrobe[name];
  if(kind==='crane'){
    const point=(u,v)=>{const a=(u-.5)*3.9;return [(.187+.025*v)*sin(a),1.06+.10*cos(a)-.080*(1-v),-.05+.18*(v-.5)+.11*cos(a)];};
    panel(body,'差配役の肩掛け',11,point,23,7);kit(body,key,dye,[.184,.932,.003],.73,.42);
  }else if(kind==='chicken'){kit(body,key,dye,[.130,.394,.01],.55,.3);}
  else if(kind==='fishfolk'){kit(body,key,dye,[.277,.88,.123],1,.35);}
  else if(kind==='riceElder'){kit(body,key,dye,[.328,.56,.104],.94,.2);}
  else if(kind==='riceMonk'){kit(body,key,dye,[.37,.55,.145],1.15,.3);}
}
