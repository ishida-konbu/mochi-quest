// A single pastry study uses the same photographed food atlas and regional
// vessels as the village worktables. Geometry dimensions are in scene metres.
import * as T from './vendor/three.module.min.js';
import { cookingAtlas } from './cooking-atlases.js';
import { InkForm, surface } from './ryugu-ink.js';
import { brushWash } from './scroll-sculpt.js';
import { createStoryFood } from './story-crafts.js';
import { regionalVessel } from './story-tableware.js';
import { normalizeRecipe, traditionFor } from './living-craft.js';

const tau = Math.PI * 2;
const tiles = { rice:0, bamboo:1, soft:3, coarse:4, roast:5, blush:9, herb:10, sesame:13 };
const hues = { azuki:'#974c4d', soy:'#c59659', sakura:'#c9858e', herb:'#77964e', sesame:'#45443c' };
const identity = [0,0,0], unit = [1,1,1];
let pigment,roastPaint;
function foodPaint() {
  if (!pigment) {
    const map=cookingAtlas('ingredients');
    pigment = brushWash(new T.MeshStandardMaterial({ map, vertexColors:true, side:T.DoubleSide, roughness:.68 }),.08);
  }
  return pigment;
}
// The journey and its recipe book use the same photographs. Heating blends
// the raw rice photograph into the roast marks alongside the vertex colour.
function browningPaint() {
  if (roastPaint) return roastPaint;
  const base=foodPaint();
  roastPaint=base.clone();
  roastPaint.onBeforeCompile=function(shader, renderer) {
    base.onBeforeCompile.call(this,shader,renderer);
    const varyings='varying vec2 bakedUv; varying float heatBlend;';
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec2 roastUv; '+varyings)
      .replace('#include <begin_vertex>','#include <begin_vertex>\nbakedUv=roastUv; heatBlend=morphTargetInfluences[0];');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\n'+varyings)
      .replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace(
        'texture2D( map, vMapUv )','mix(texture2D(map,vMapUv), texture2D(map,bakedUv), heatBlend)'));
  };
  roastPaint.customProgramCacheKey=()=>'mochi-turning-on-charcoal';
  return roastPaint;
}
function patch(form, tile, columns, rows, sample, tint, textureUV) {
  const positions=[], indices=[], uv=[];
  for (let j=0; j<=rows; j++) for (let i=0; i<=columns; i++) {
    const u=i/columns, v=j/rows, p=sample(u,v);
    positions.push(...p);
    uv.push(...(textureUV ? textureUV(p,u,v) : [u,v]));
    const k=j*(columns+1)+i;
    if (i<columns && j<rows) indices.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);
  }
  const g=surface(positions,indices,uv);
  form.draw(g,identity,unit,tint,identity,tile);
  g.dispose();
}
const signedPow = (n,p) => Math.sign(n)*Math.abs(n)**p;
function doughProfile(r) {
  const flat = r.shape==='flat' || r.shape==='flower';
  const height = flat ? .093 : r.shape==='square' ? .128 : .156;
  const rx = flat ? .194 : .163, rz = r.shape==='square' ? .118 : flat ? .149 : .143;
  const exponent = r.shape==='square' ? .34 : 1;
  // Rice settles against its board while it cools; compress the bottom into
  // a small bearing surface without changing the top or the shoulder.
  const centreHeight = v => Math.max(0, height*(.5+.5*signedPow(Math.sin(Math.PI*(v-.5)),.73)) -
    .008*Math.max(0,1-2*v));
  function point(a, v) {
    const latitude=Math.PI*(v-.5), c=Math.cos(a), s=Math.sin(a);
    const radial=Math.pow(Math.max(0,Math.cos(latitude)),.84);
    const lobes=r.shape==='flower' ? .86+.135*Math.cos(5*a-.45) : 1;
    const asymmetry=1+.026*Math.sin(3*a+.7)+.012*Math.cos(7*a-1.1);
    const rim=radial*lobes*asymmetry;
    const x=rx*rim*signedPow(c,exponent), z=rz*rim*signedPow(s,exponent);
    const folds = r.shape==='flower' ? .014*(.5+.5*Math.cos(5*a-.45))*radial**1.5*Math.max(0,Math.sin(latitude)) : 0;
    const y=centreHeight(v)+folds+.0019*Math.cos(3*a)*radial**2;
    return [x,Math.max(0,y),z];
  }
  // Sample the shaped upper skin at a topping's footprint, including the
  // petal folds. Horizontally stamped toppings would float off the shoulders.
  function topHeight(x,z) {
    const a = Math.atan2(signedPow(z/rz,1/exponent),signedPow(x/rx,1/exponent));
    const edge = point(a,.5);
    const radial = Math.min(1, Math.hypot(x,z) / Math.hypot(edge[0],edge[2]));
    return point(a,.5+Math.acos(radial**(1/.84))/Math.PI)[1];
  }
  return {point,rx,rz,height,topHeight,centreHeight};
}
function tintFor(recipe) {
  const tint=new T.Color(recipe.base==='brownRice'?'#d6b18a':'#fff3dd');
  for (const f of recipe.fillings.filter(f=>f.placement==='mixed')) {
    const strength=f.id==='herb'?.88:f.id==='sakura'?.75:.33;
    const mixedWeight=f.id==='herb' ? .43+.50*Math.min(1,f.amount/32) : strength*(.20+f.amount/50);
    tint.lerp(new T.Color(hues[f.id]),mixedWeight);
  }
  return tint;
}

function cherry(form, pos, scale, phase, topHeight) {
  const [x,y,z]=pos;
  for(let i=0;i<5;i++) {
    const angle=phase+i*tau/5;
    patch(form,'blush',9,5,(u,v)=>{
      const across=2*v-1, l=u*.053*scale, b=Math.sin(Math.PI*u)**.68*.018*across*scale;
      const px=x+l*Math.cos(angle)-b*Math.sin(angle), pz=z+l*Math.sin(angle)+b*Math.cos(angle);
      return [px,topHeight(px,pz)+.001+scale*(.005*Math.sin(Math.PI*u)+.005*across**2*u+.002*i*u/5),pz];
    },i%2?'#d397a3':'#be8793');
  }
  form.oval([x,y+.005*scale,z],[.006*scale,.0035*scale,.007*scale],'#b7905d',identity,'rice');
}
function leafTip(form, pos, scale, angle, topHeight) {
  const [x,,z]=pos;
  const vein = t => {
    const px=x+t*.046*scale*Math.cos(angle), pz=z+t*.046*scale*Math.sin(angle);
    return [px, topHeight(px,pz)+.001+.004*scale*Math.sin(t*Math.PI)+.002*t, pz];
  };
  patch(form,'herb',12,6,(t,v)=>{
    const [px,py,pz]=vein(t);
    const w=(v*2-1)*.014*scale*Math.sin(Math.PI*t)**.72*(.88+.12*Math.cos(13*t));
    const bx=px-w*Math.sin(angle), bz=pz+w*Math.cos(angle);
    return [bx,py+topHeight(bx,bz)-topHeight(px,pz)+Math.abs(w)*.20,bz];
  },'#b9c890');
  form.stroke([vein(.05),vein(.5),vein(.93)],[.0012,.0008,.0002],'#bfc999','herb',4,6);
}
function garnish(form, recipe, profile, sliced, start,end) {
  const {point} = profile;
  const top = recipe.fillings.filter(f=>f.placement!=='inside');
  if (recipe.technique==='half') top.unshift({id:'rice', amount:30,placement:'mixed'});
  top.forEach(({id,amount,placement},index)=>{
    const mixed=placement==='mixed';
    const flower=id==='sakura' && !mixed;
    const n=flower?Math.max(1,Math.round(amount/10)):id==='rice'?60:Math.max(3,Math.floor(amount*(id==='sesame'?1.1:.65)));
    for(let i=0;i<n;i++){
      const seed=i+.71+index*3.61;
      const a=start+(end-start)*((seed*.61803398875)%1);
      // Sample the actual rounded shoulder. On a sectioned piece the exposed
      // plane and a few millimetres around its rim stay clear of protruding seeds.
      const rim=Math.sqrt((i+.4)/n)*(flower?.61:id==='herb' && !mixed?.73:.90);
      const v=1-Math.asin(rim)/Math.PI;
      const [x,y,z]=point(a,v), scale=.72+.28*(.5+.5*Math.sin(seed*31));
      if(sliced && Math.min(a-start,end-a)<.09) continue;
      if(flower) { cherry(form,[x,y+.001,z],scale,a,profile.topHeight); continue; }
      if(id==='herb' && !mixed) { leafTip(form,[x,y,z],scale,a+.4,profile.topHeight); continue; }
      const size=id==='rice'?.009:id==='soy'?.014:id==='azuki'?.013:id==='sesame'?.0057:.007;
      const elongated=id==='rice'||id==='sesame';
      const h=size*(elongated?.29:.48), yaw=a+.46*Math.sin(seed*8);
      const tint=id==='rice'?'#ffefcc':hues[id];
      form.oval([x,y+(mixed?-h*.22:h*.32),z],[size*scale,h*scale,size*scale*(elongated?.54:.76)],tint,[0,yaw,.10*Math.sin(seed)],'soft');
      if(id==='azuki' || id==='soy') {
        const hilum=size*.38*scale;
        form.stroke([[x-hilum*Math.cos(yaw),y+h*.70,z+hilum*Math.sin(yaw)],[x,y+h*.86,z],
          [x+hilum*Math.cos(yaw),y+h*.70,z-hilum*Math.sin(yaw)]],
          [.00045,.0010,.0004],id==='azuki'?'#e8bba7':'#765539','rice',4,4);
      }
    }
  });
}
function cutFace(form, fillings, profile, a, faceSide, tint) {
  const { point,height }=profile;
  // Cut dough and inner paste share a plane. Sampling the rice edge at every
  // height keeps the filling behind the skin even on a thin, petalled cake.
  const face=(u,v)=>{
    const [x,y,z]=point(a,v);
    // Both radial cuts meet along one vertical axis, even when opposing
    // petals have different heights around the edge of the cut.
    const centre=profile.centreHeight(v);
    return [x*u, centre+(y-centre)*u, z*u];
  };
  patch(form,'coarse',18,20,face,tint);
  const weight=fillings.reduce((n,f)=>n+f.amount,0);
  const span=Math.min(.77,.32+.005*weight), rise=height*(.19+.0015*Math.min(80,weight));
  const [x,,z]=point(a,.5), length=Math.hypot(x,z);
  const normal=[z/length*faceSide,0,-x/length*faceSide];
  // Material bands meet inside one irregular lentil-shaped cross-section.
  let consumed=0;
  for(const f of fillings) {
    const from=consumed/weight,to=(consumed+=f.amount)/weight;
    const pastePoint=(u,v,lift=.00045)=>{
      const mix=from+(to-from)*v;
      const round=Math.sqrt(Math.max(0,1-u*u));
      const crumb=1+.025*Math.sin(19*u)+.018*Math.sin(u*31);
      return [u*span*x+normal[0]*lift, height*.53+(mix*2-1)*rise*round*crumb, u*span*z+normal[2]*lift];
    };
    patch(form,'soft',30,8,pastePoint,hues[f.id]);
    // Little torn skins and cotyledons catch the light where the knife passed.
    const flecks=Math.max(3,Math.round(f.amount*.76));
    for(let i=0;i<flecks;i++){
      const u=.04+.89*((i*.618+.17)%1), v=.10+.78*((i*.414+.31)%1),
        radius=.010+.010*(.5+.5*Math.sin(i*7.3)), hue=new T.Color(hues[f.id]);
      hue.multiplyScalar(i%3===0?1.45:.69);
      patch(form,'rice',7,1,(angle,ring)=>pastePoint(u+radius*ring*Math.cos(tau*angle),v+.026*ring*Math.sin(tau*angle),.00076),hue);
    }
  }
}
function wrapper(form, profile) {
  // A leaf cradles the back and folds over one shoulder, leaving the front
  // edge and any cut section visible. The blade follows the dough itself.
  const path=(t,s,lift=0)=>{
    const taper=Math.sin(Math.PI*t)**.66;
    const a=3.47+(s-.5)*2.20*(.045+.955*taper)+.13*t, v=.055+t*.88;
    const [x,y,z]=profile.point(a,v);
    const edge=2*s-1;
    return [x*(1.018+.024*edge**2), y+.0016+lift+.003*edge**2, z*(1.025+.035*edge**2)];
  };
  patch(form,'bamboo',30,26,path,'#d5dcaf',(p,u,v)=>[v,u]);
  // The untucked ends lie on the woven tray. They arch up its sloping well
  // as they clear the rice, so the underside is visible at the two tips.
  for(const side of [-1,1]) {
    const blade=(u,v)=>{
      const along=(u*.25+.031)*side, across=(2*v-1)*.073*Math.sin(Math.PI*u)**.72;
      const x=along+.14*across, z=side*(.036+.023*u)+across;
      const radius=Math.hypot(x/.319,z/.245);
      const floor=.002+.047*T.MathUtils.smoothstep(radius,.58,1);
      return [x, floor+.004*Math.sin(Math.PI*u)+.008*u**4+.03*Math.abs(across),z];
    };
    patch(form,'bamboo',32,10,blade,'#ced599',(p,u,v)=>[v,u]);
    for(let k=1;k<5;k++) form.stroke(Array.from({length:9},(_,j)=>{
      const [x,y,z]=blade(.05+.11*j,k/5);return [x,y+.0007,z];
    }),.00065,'#a3b37a','bamboo',4,9);
  }
  for(let k=1;k<8;k++){
    const s=k/8;
    form.stroke(Array.from({length:10},(_,i)=>path(.03+i*.104,s,.0006)),k===4?.0013:.00052,
      k===4?'#b8c37e':'#82945c','bamboo',4,12);
  }
}
// Heat catches on raised, dry skin and where the lower face touched the
// grate. Pigment follows the shaped rice in local space, across the UV seam.
function toastSkin(form, profile) {
  const smooth = T.MathUtils.smoothstep;
  for (let i=0; i<form.p.length; i+=3) {
    const x=form.p[i]/profile.rx, y=form.p[i+1]/profile.height, z=form.p[i+2]/profile.rz;
    const blotch=.52*Math.sin(9*x+2*z)+.31*Math.sin(13*z-4*x)+.17*Math.cos(22*x+17*z);
    const grain=.055*Math.sin(57*x+11*z)*Math.sin(51*z-8*x);
    const blush=smooth(blotch+grain,.07,.66)*smooth(y,.26,.75);
    const blister=smooth(blotch+grain,.51,.91)*smooth(y,.52,.92);
    const bars=Math.cos(15*z+2.8*x+.13*Math.sin(4*x));
    const grate=(1-smooth(y,.04,.34))*smooth(bars,.48,.94);
    const heat=.28*blush+.59*blister+.51*grate;
    form.c[i]*=1-.77*heat;
    form.c[i+1]*=1-.91*heat;
    form.c[i+2]*=1-.94*heat;
  }
}
function sculptSurface(form,recipe,profile,tint,start,end) {
  const tile=recipe.finish==='grill'?'roast':recipe.technique==='half'?'coarse':'rice';
  patch(form,tile,84,38,(u,v)=>profile.point(start+(end-start)*u,v),tint,
    (p,u,v)=>{
      const a=start+(end-start)*u;
      // A complete cake has two faces. Both poles sample a single texel:
      // carrying the polar rim all the way to the underside creates spokes
      // when the first cooked face is turned towards the player.
      const towardRim=2*Math.min(v,1-v);
      const radial=.475*Math.sin(1.47*towardRim);
      const [x,,z]=profile.point(a,.5);
      return [.5+radial*x/profile.rx,.5+radial*z/profile.rz];
    });
  if (recipe.finish==='grill') toastSkin(form,profile);
}

// Whole servings under the cook's hands share the atlas, profile, petal folds
// and finish of the notebook study. Its explanatory cutaway belongs in the book.
export function makeCookingServing(recipe) {
  const profile=doughProfile(recipe), tint=tintFor(recipe);
  const form=new InkForm(tiles,4,4);
  sculptSurface(form,{...recipe,finish:'steam'},profile,tint,0,tau);
  const skin=new T.Mesh(form.geometry(),foodPaint());
  skin.name='丸めた生地';
  if (recipe.finish==='grill') {
    const roasted=new InkForm(tiles,4,4);
    sculptSurface(roasted,recipe,profile,tint,0,tau);
    skin.material=browningPaint();
    skin.geometry.setAttribute('roastUv',new T.Float32BufferAttribute(roasted.uv,2));
    skin.geometry.morphAttributes.position=[skin.geometry.attributes.position];
    skin.geometry.morphAttributes.color=[new T.Float32BufferAttribute(roasted.c,3)];
    skin.updateMorphTargets();
  }
  const grainForm=new InkForm(tiles,4,4);
  garnish(grainForm,{...recipe,fillings:recipe.fillings.filter(f=>f.placement==='mixed')},profile,false,0,tau);
  const topForm=new InkForm(tiles,4,4);
  garnish(topForm,{...recipe,technique:'none',fillings:recipe.fillings.filter(f=>f.placement==='top')},profile,false,0,tau);
  const leafForm=new InkForm(tiles,4,4);
  if(recipe.technique==='wrap') wrapper(leafForm,profile);
  function layer(paint,name) {
    const mesh=paint.ix.length ? new T.Mesh(paint.geometry(),foodPaint()) : new T.Group();
    mesh.name=name;
    return mesh;
  }
  const grains=layer(grainForm,'粒と練り込みの具'), top=layer(topForm,'仕上げの具'), leaf=layer(leafForm,'笹の包み');
  const group=new T.Group();
  group.add(skin,grains,top,leaf);
  return {group,skin,grains,top,leaf,height:profile.height};
}

export function createCraftModel(draft) {
  const recipe=normalizeRecipe(draft);
  if(!recipe) return null;
  const tradition=traditionFor(recipe);
  if(tradition) return createStoryFood(tradition.number);
  const g=new T.Group();
  const vessel=regionalVessel(recipe.finish==='grill'?3:5); g.add(vessel);
  const form=new InkForm(tiles,4,4), profile=doughProfile(recipe), tint=tintFor(recipe);
  const inside=recipe.fillings.filter(f=>f.placement==='inside');
  const sliced=inside.length>0, start=sliced?2.25:0, end=sliced?tau+.62:tau;
  sculptSurface(form,recipe,profile,tint,start,end);
  if(sliced){
    cutFace(form,inside,profile,start,1,tint);
    cutFace(form,inside,profile,end,-1,tint);
  }
  garnish(form,recipe,profile,sliced,start,end);
  if(recipe.technique==='wrap') wrapper(form,profile);
  const pastry=new T.Mesh(form.geometry(),foodPaint());
  pastry.name='手製の餅'; pastry.userData.craftGeometry=true;
  // The steamed rice rests on the upper bamboo weave. The ironware plate
  // used for grilled rice has a bare glazed well with no raised slats.
  pastry.position.y=vessel.userData.floor+(recipe.finish==='grill' ? .0006 : .004);
  g.add(pastry);
  return g;
}
