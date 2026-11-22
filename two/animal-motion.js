// Periodic paths can be sampled at any world time, including a resumed journey.
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => {const t=clamp(value);return t*t*(3-2*t);};
export const dragonVisible = player => player.h >= 48;

// The crest travels from the head through the tail. Give the light tip a wider
// sweep. Both the rendered transverse sections and the delivery volumes use it.
export function dragonWave(z, phase, out) {
  const tail = clamp((1.6-z)/5);
  const amplitude = .22+.60*tail;
  const theta = phase+1.23*z;
  out.x = amplitude*Math.sin(theta);
  out.y = (.16+.11*tail)*Math.cos(.90*theta+.38) + .06*Math.sin(theta*1.7);
  return out;
}
export const dragonPhase = (time, n) => (time+(n.phase||0))*1.12;
export const kirinFrequency = 2.18;
export function hoofPhase(side,front) {
  return side<0 ? (front<0 ? 0 : Math.PI/2) : (front<0 ? Math.PI : 1.5*Math.PI);
}
export function kirinHoofAngle(phase) {
  return -.34*Math.cos(phase) + .036*Math.sin(2*phase);
}

export function poseKirinLeg(leg,side,phase) {
  leg.rotation.x=kirinHoofAngle(phase);
  leg.rotation.z=side*.014*(1-Math.cos(phase));
}
export function poseKirinTrunk(trunk,phase) {
  trunk.position.y=.017*(1-Math.cos(phase*2));
  trunk.rotation.z=.019*Math.sin(phase);
}

// Drive stride and pose from the same clock. An animal slows, settles to
// graze/write/listen, then pushes off again without slipping back to its route.
export function walkingScore(time, n, out) {
  const period=13 + 1.1*(n.phase||0), moving=period*.60, ramp=1.05;
  const now=time+2.1*(n.phase||0);
  const cycle=Math.floor(now/period), t=now-cycle*period;
  let progress, pace;
  if(t<ramp) {pace=t/ramp;progress=t*t/(2*ramp);}
  else if(t<moving-ramp) {pace=1;progress=t-ramp*.5;}
  else if(t<moving) {
    const left=moving-t;
    pace=left/ramp;progress=moving-ramp-left*left/(2*ramp);
  } else {pace=0;progress=moving-ramp;}
  out.travel=cycle*(moving-ramp)+progress;
  out.pace=pace;
  out.gesture=smooth((t-moving+.4)/1.05)*smooth((period-.1-t)/1.05);
  out.variation=((cycle+(n.manner||0))%3+3)%3;
  return out;
}

function knot(index,seed,lane) {
  let h=Math.imul(index+141,0x45d9f3b)^Math.imul(seed+lane*213,0x119de1f3);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}
function cat(a,b,c,d,t) {return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*b-a-3*c+d)));}
function tangent(a,b,c,d,t) {return .5*((c-a)+2*t*(2*a-5*b+4*c-d)+3*t*t*(3*b-a-3*c+d));}
const kirinKeys = new WeakMap();
export function kirinPath(n,time,out) {
  const interval=9.8, u=time/interval, i=Math.floor(u),t=u-i, seed=Math.round(n.phase*982)+7;
  let path=kirinKeys.get(n);
  if(!path || path.index!==i) {
    const points=[];
    for(let j=i-1;j<=i+2;j++) {
      const theta=j*1.04+n.phase+(knot(j,seed,0)-.5)*.85, r=8+knot(j,seed,1)*8;
      points.push([Math.sin(theta)*r,Math.cos(theta)*r,3.1+4*knot(j,seed,2)]);
    }
    path={index:i,points};kirinKeys.set(n,path);
  }
  const [a,b,c,d]=path.points;
  out.x=n.homeX+cat(a[0],b[0],c[0],d[0],t);
  out.z=n.homeZ+cat(a[1],b[1],c[1],d[1],t);
  out.clearance=cat(a[2],b[2],c[2],d[2],t);
  const dx=tangent(a[0],b[0],c[0],d[0],t),dz=tangent(a[1],b[1],c[1],d[1],t);
  out.heading=Math.atan2(dx,dz);out.speed=Math.hypot(dx,dz)/interval;
  return out;
}
