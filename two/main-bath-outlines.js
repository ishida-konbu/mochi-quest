// Survey points on each silhouette in local semi-axes. Intersect the outline
// with radial rays once, so the rim, water, ground and gameplay use one shore.
const outlines = {
  petalRaft: [[1.14,0],[.81,.66],[.22,.91],[-.13,.77],[-.48,.92],[-.93,.62],[-1.12,.11],[-.79,-.53],[-.17,-1.04],[.22,-.94],[.72,-.62]],
  bambooBoat: [[1.30,0],[.87,.41],[.13,.88],[-.54,.73],[-1.30,.10],[-.89,-.39],[-.17,-.85],[.49,-.81],[.99,-.42]],
  kilnJar: [[.91,0],[1.02,.43],[.80,.88],[.38,1.02],[-.35,1.02],[-.83,.87],[-1.02,.37],[-.91,-.13],[-.65,-.49],[-.44,-.73],[-.50,-1.02],[.51,-1.02],[.44,-.73],[.67,-.48]],
  sinterShelf: [[1.12,.03],[.92,.45],[.78,.88],[.35,.86],[.12,1.13],[-.35,.93],[-.76,.86],[-.75,.57],[-1.06,.38],[-1.14,-.15],[-.82,-.34],[-.76,-.84],[-.24,-.94],[.10,-.80],[.53,-.97],[.75,-.54],[1.02,-.42]],
  riceField: [[1,0],[.97,.53],[.55,.58],[.52,.94],[-.13,1],[-.74,.92],[-.82,.56],[-1.11,.51],[-1.03,-.46],[-.52,-.53],[-.49,-.85],[.16,-1.03],[.89,-.96]],
  scallop: [[1.13,-.12],[.93,.49],[.69,.80],[.28,1.03],[0,1.10],[-.32,1.02],[-.65,.84],[-.95,.48],[-1.1,-.08],[-.88,-.44],[-.39,-.69],[-.44,-.90],[.39,-.90],[.35,-.70],[.88,-.47]],
  mapleLeaf: [[1.19,-.15],[.71,.19],[.89,.63],[.42,.53],[.22,.87],[0,1.29],[-.26,.83],[-.39,.54],[-.89,.70],[-.71,.21],[-1.19,-.12],[-.68,-.31],[-.80,-.77],[-.24,-.60],[0,-1.14],[.22,-.64],[.87,-.78],[.69,-.32]],
  crescent: [[1.22,-.42],[.97,.23],[.69,.72],[.21,1.03],[-.36,.99],[-.88,.69],[-1.12,.26],[-1.20,-.36],[-1.04,-.97],[-.72,-.66],[-.31,-.37],[.19,-.28],[.69,-.41],[1.15,-.81]],
  foldingFan: [[1.16,-.34],[.78,.31],[.37,.82],[.14,1.03],[-.15,1.03],[-.39,.80],[-.80,.26],[-1.16,-.34],[-.86,-.75],[-.43,-1.02],[0,-1.10],[.44,-1.02],[.86,-.75]],
  suzuri: [[1,0],[.99,.61],[.86,.92],[.49,.95],[0,.95],[-.75,.95],[-.99,.79],[-1,0],[-1,-.78],[-.88,-.96],[-.40,-.96],[0,-.95],[.47,-.86],[.73,-.67],[.95,-.42]],
  calabash: [[1.21,0],[1.03,.68],[.62,1.03],[.28,.86],[-.17,.49],[-.50,.61],[-.84,.72],[-1.10,.47],[-1.17,0],[-1.07,-.48],[-.78,-.68],[-.48,-.58],[-.16,-.46],[.33,-.84],[.70,-1.01],[1.05,-.66]],
  foxTail: [[1.20,-.60],[1.03,.10],[.68,.67],[.25,.98],[-.20,1.05],[-.78,.83],[-1.08,.36],[-1.11,-.22],[-.89,-.83],[-.62,-1.04],[-.52,-.59],[-.25,-.34],[.10,-.29],[.53,-.42],[1.05,-.99]],
  shipBasin: [[1.25,.06],[.94,.52],[.46,.83],[-.39,.91],[-.93,.67],[-1.04,.32],[-1.04,-.45],[-.87,-.64],[-.37,-.84],[.43,-.73],[.94,-.43]],
  jarMouth: [[1.06,0],[.87,.61],[.43,.89],[0,.98],[-.45,.91],[-.92,.63],[-1.05,0],[-.91,-.59],[-.42,-.88],[0,-.91],[.48,-.89],[.92,-.57]],
};

const tau=2*Math.PI,samples=512;
const contours=new Map();
for(const [name,knots] of Object.entries(outlines)){
  const points=knots.map(([x,z])=>({a:(Math.atan2(z,x)+tau)%tau,r:Math.hypot(x,z)})).sort((p,q)=>p.a-q.a);
  const table=new Float32Array(samples);
  for(let i=0;i<samples;i++){
    const a=i*tau/samples;
    let next=points.findIndex(p=>p.a>a);
    if(next<0)next=0;
    const hi=points[next],lo=points[(next+points.length-1)%points.length];
    const span=(hi.a-lo.a+tau)%tau,t=((a-lo.a+tau)%tau)/span;
    const chord=lo.r*hi.r*Math.sin(span)/(hi.r*Math.sin(span*(1-t))+lo.r*Math.sin(span*t));
    // Cut stone and carpentry keep straight runs, while potters' shoulders
    // and folded leaves curve smoothly between landmarks.
    if(['suzuri','riceField','mapleLeaf','sinterShelf','foldingFan'].includes(name)){
      table[i]=chord;
    }else{
      const before=points[(next+points.length-2)%points.length],after=points[(next+1)%points.length];
      const slope=(p,q)=>(q.r-p.r)/((q.a-p.a+tau)%tau);
      const tangent=(u,v)=>u*v>0 ? 2*u*v/(u+v) : 0;
      const d=slope(lo,hi),m0=tangent(slope(before,lo),d)*span,m1=tangent(d,slope(hi,after))*span;
      table[i]=lo.r*(1-t)**2*(1+2*t)+hi.r*t*t*(3-2*t)+t*(1-t)*((1-t)*m0-t*m1);
    }
  }
  // Keep the flat faces of the carved tray and the points on the maple,
  // rounding each corner just enough for a wet, finger-polished edge.
  const width=name==='mapleLeaf'?2:name==='suzuri'?4:7,soft=new Float32Array(samples+1);
  for(let i=0;i<samples;i++){
    let sum=0;
    for(let j=-width;j<=width;j++)sum+=table[(i+j+samples)%samples]*(width+1-Math.abs(j));
    soft[i]=sum/(width+1)**2;
  }
  soft[samples]=soft[0];contours.set(name,soft);
}

export function mainBathLip(shape,a){
  if(shape==='lotusThrone')return .96+.116*Math.cos(8*(a-Math.PI/2))+.052*Math.cos(4*a);
  const profile=contours.get(shape);
  if(!profile)return;
  const sample=((a/tau%1+1)%1)*samples, i=Math.floor(sample)%samples;
  const radius=profile[i]+(profile[i+1]-profile[i])*(sample-Math.floor(sample));
  return shape==='scallop'?radius*(1-.058*Math.sin(7*(a+.22))**2*Math.max(0,Math.sin(a+.28))):radius;
}

// Snow drifts leave the entries and steps on the original axes. The far
// shore forms six shallow coves between the snow-covered boulders.
export function snowBathLip(a){
  return 1+.085*Math.sin(2*a)**2*Math.cos(6*a-.54)+.036*Math.sin(2*a);
}
