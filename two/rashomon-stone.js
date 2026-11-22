import * as T from './vendor/three.module.min.js';
import { RASHOMON, GATE_STONE, GATE_STONE_STEPS, GATE_STONE_APRONS } from './kyo-layout.js';
import { seeded } from './terrain.js';

// All beds, flags and stair stones share one mesh. The quarried faces have an
// individual grain direction; their dressed edges and the joints cast real shade.
function stoneYard(random) {
  const positions=[],colors=[],uv=[],indices=[],color=new T.Color();
  const flags=['#c0bba9','#c7c1ae','#b8b5a4','#c2bfae','#bab8a9','#ccc5b2'];
  const wall=['#adac9c','#bab5a3','#a5a696','#b8b5a6','#aead9d','#b4af9e'];
  const ledge=['#cec7b4','#c5bfad','#c9c5b2','#d0c9b9'];
  const mortar='#827f71';

  function polygon(points,shade,light,axis,grain) {
    const start=positions.length/3;
    color.set(shade).multiplyScalar(light);
    for(const [x,y,z] of points) {
      positions.push(x,y,z);colors.push(color.r,color.g,color.b);
      const along=axis===2?z:x,across=axis===1?z:y;
      uv.push(grain.u+.49*(along*grain.c-across*grain.s),grain.v+.49*(along*grain.s+across*grain.c));
    }
    for(let i=1;i<points.length-1;i++)indices.push(start,start+i,start+i+1);
  }
  function block(x1,x2,z1,z2,bottom,top,palette,bevel=.022) {
    const shade=typeof palette==='string'?palette:palette[Math.floor(random()*palette.length)];
    const spin=(random()-.5)*1.6,grain={u:random()*8,v:random()*8,c:Math.cos(spin),s:Math.sin(spin)};
    const w=x2-x1,d=z2-z1;
    const cut=Math.min(w*.14,d*.14,.07),rim=Math.min(bevel,(top-bottom)*.25,w*.05,d*.065);
    const corners=Array.from({length:4},()=>cut*(.29+random()*.73));
    function ring(inset,y) {
      const a=x1+inset,b=x2-inset,n=z1+inset,f=z2-inset;
      const [nw,sw,se,ne]=corners;
      return [[a+nw,y,n],[a,y,n+nw],[a,y,f-sw],[a+sw,y,f],
        [b-se,y,f],[b,y,f-se],[b,y,n+ne],[b-ne,y,n]];
    }
    const sole=ring(0,bottom),lip=ring(0,top-rim),face=ring(rim,top);
    for(let i=0;i<8;i++){
      const j=(i+1)%8,axis=Math.abs(lip[j][0]-lip[i][0])>Math.abs(lip[j][2]-lip[i][2])?0:2;
      polygon([sole[i],sole[j],lip[j],lip[i]],shade,.89,axis,grain);
      polygon([lip[i],lip[j],face[j],face[i]],shade,1.035,axis,grain);
    }
    polygon(face,shade,1,1,grain);
  }
  // Break long courses into stones of varying but comparable lengths.
  function course(lo,hi,pitch,offset,place) {
    let a=lo,b=lo+pitch*(offset?.57:1.03);
    while(b<hi-pitch*.40) {
      place(a,b);a=b;b+=pitch*(.80+.40*random());
    }
    place(a,hi);
  }
  function paving(x1,x2,z1,z2,top,rowDepth,pitch,palette=flags) {
    const rows=Math.max(1,Math.round((z2-z1)/rowDepth));
    for(let j=0;j<rows;j++) {
      const a=z1+(z2-z1)*j/rows,b=z1+(z2-z1)*(j+1)/rows;
      course(x1,x2,pitch,j%2,(x,xx)=>block(x+.009,xx-.009,a+.009,b-.009,top-.070,top,palette,.014));
    }
  }
  function stair(q,sideways) {
    const a=sideways?q.z-q.d/2:q.x-q.w/2,b=sideways?q.z+q.d/2:q.x+q.w/2;
    const run=sideways?q.x:q.z,half=GATE_STONE.going/2;
    const idx=Math.round(q.top/GATE_STONE.height*GATE_STONE.count);
    function stone(lo,hi,palette,rim) {
      const x1=sideways?run-half:lo,x2=sideways?run+half:hi;
      const z1=sideways?lo:run-half,z2=sideways?hi:run+half;
      // The end blocks descend into the haunch. No gap shows beneath a flight
      // viewed across the street; the light arris picks out each worn nosing.
      block(x1+.005,x2-.005,z1+.005,z2-.005,-.007,q.top,palette,rim);
    }
    const cheek=sideways?.21:.29;
    stone(a,a+cheek,ledge,.027);stone(b-cheek,b,ledge,.027);
    course(a+cheek,b-cheek,sideways?1.25:2.24,idx%2,(lo,hi)=>stone(lo,hi,ledge,.019));
  }
  function masonry(width,depth,height,stairWidth,sideWidth,sideZ) {
    const x=width/2,z=depth/2,coping=.44;
    // The fieldstone core only shows in the recessed bedding joints. The
    // lower plinth, stretcher courses and overhanging edge have separate profiles.
    block(-x+.135,x-.135,-z+.135,z-.135,-.08,height-.052,mortar);
    const beds=[
      {bottom:-.045,top:.18,inset:.002,thick:.39,pitch:1.44},
      {bottom:.165,top:height*.472,inset:.072,thick:.38,pitch:1.09},
      {bottom:height*.472,top:height-.178,inset:.091,thick:.38,pitch:1.46},
      {bottom:height-.178,top:height,inset:0,thick:coping,pitch:1.72},
    ];
    for(const [n,bed] of beds.entries()){
      const {bottom,top,inset,thick,pitch}=bed;
      const palette=n===3?ledge:n===0?wall:flags,gap=n<2?.012:.009,bevel=n===3?.035:.022;
      for(const sign of [-1,1]){
        // A masonry course turns each corner. Side stretchers stop behind
        // the end header so the two sets of joints never coincide.
        const face=sign*(z-inset),rear=face-sign*thick;
        for(const [lo,hi] of [[-x+inset,-stairWidth/2],[stairWidth/2,x-inset]])
          course(lo,hi,pitch,(n+(sign>0))%2,(u,v)=>
            block(u+gap,v-gap,Math.min(face,rear),Math.max(face,rear),bottom+.004,top,palette,bevel));
        const edge=sign*(x-inset),back=edge-sign*thick;
        for(const [lo,hi] of [[-z+inset+thick,sideZ-sideWidth/2],[sideZ+sideWidth/2,z-inset-thick]])
          course(lo,hi,pitch,(n+(sign<0))%2,(u,v)=>
            block(Math.min(edge,back),Math.max(edge,back),u+gap,v-gap,bottom+.004,top,palette,bevel));
      }
    }
    // The unbroken pavement between the three front openings continues to
    // the rear steps. Inset borders meet the coping stones at the returns.
    paving(-x+coping,x-coping,-z+coping,z-coping,height,1.01,1.57);
    for(const sign of [-1,1]){
      const a=sign*z,b=sign*(z-coping);
      paving(-stairWidth/2,stairWidth/2,Math.min(a,b),Math.max(a,b),height,coping,2.16,ledge);
      const c=sign*x,d=sign*(x-coping);
      paving(Math.min(c,d),Math.max(c,d),sideZ-sideWidth/2,sideZ+sideWidth/2,height,1.18,coping,ledge);
    }
  }
  function apron(width,depth,center,height) {
    const x=width/2,z1=center-depth/2,z2=center+depth/2;
    // The dark bed is above the avenue's visual surface, which is lifted
    // slightly from the terrain to keep the road continuous at intersections.
    block(-x,x,z1,z2,-.07,height-.009,mortar,.003);
    paving(-x,x,z1,z2,height,.83,1.48);
  }
  function geometry(){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(indices);g.computeVertexNormals();
    return g;
  }
  return {masonry,stair,apron,geometry};
}

export function drawRashomonStone(scene,painter,groundY) {
  const {width,depth,height,stairWidth,sideWidth,sideZ}=GATE_STONE;
  const yard=stoneYard(seeded(0x72616a6f));
  yard.masonry(width,depth,height,stairWidth,sideWidth,sideZ);
  for(const q of GATE_STONE_STEPS)yard.stair(q,q.d>q.w);
  for(const apron of GATE_STONE_APRONS)yard.apron(apron.w,apron.d,apron.z,apron.top);

  const geo=yard.geometry();
  geo.translate(RASHOMON.x,groundY,RASHOMON.z);geo.computeBoundingSphere();
  const granite=painter.stone.map;
  const finish=new T.MeshStandardMaterial({vertexColors:true,map:granite,bumpMap:granite,
    bumpScale:.014,roughness:.91,envMapIntensity:.26});
  finish.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 mineral=texture2D(map,vMapUv).rgb;
      float value=dot(mineral,vec3(.28,.58,.14));
      diffuseColor.rgb*=.79+.68*mix(vec3(value),mineral,.23);
    `);
  };
  const base=new T.Mesh(geo,finish);base.name='羅生門の切石積み基壇と石畳';
  base.castShadow=base.receiveShadow=true;base.userData.range=350;
  (painter.scene??scene).add(base);
}
