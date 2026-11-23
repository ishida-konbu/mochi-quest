// Periodic paths can be sampled at any world time, including a resumed journey.
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => {const t=clamp(value);return t*t*(3-2*t);};

// The sculpt stretches lengthwise inside its pitched trunk. Delivery volumes
// use this same ratio before applying world stature and pitch.
export const dragonLengthScale = 1.5;
// Centre, horizontal radius and vertical radius of each inked cross-section.
export const dragonSpine=[[-.78,1.21,-2.95,.004,.004],[-.80,.98,-3.12,.061,.073],[-.65,.65,-3.16,.092,.108],
  [-.35,.36,-2.92,.141,.15],[-.19,.26,-2.56,.182,.19],[-.29,.50,-2.12,.204,.214],
  [-.28,.90,-1.76,.225,.25],[.02,1.06,-1.46,.249,.262],[.39,.96,-1.17,.258,.275],
  [.54,.66,-.79,.279,.291],[.45,.50,-.35,.301,.318],[.10,.52,.04,.315,.323],
  [-.24,.75,.40,.312,.32],[-.44,1.06,.70,.286,.301],[-.45,1.45,.87,.27,.284],
  [-.35,1.74,1.08,.239,.264],[-.13,1.88,1.42,.214,.243]];
// The hind claws spring from the seventh dorsal joint, at t=.407 on the sculpt's spine.
export const dragonHindZ = -1.60347;
export const dragonTailStretch = 3;
export const dragonTailZ = z => z + (dragonTailStretch-1)*Math.min(0,z-dragonHindZ);

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
// The dragon's head points along local +Z. A negative X rotation raises it.
export const maxDragonPitch = .40;
export function dragonPitch(n) {
  const slope = Math.atan2(n.verticalSpeed || 0, Math.max(2, n.speed || 0));
  return -Math.max(-maxDragonPitch, Math.min(maxDragonPitch, slope));
}
export function craneWingbeat(t,out) {
  const flap=t*4.35,thermal=.5+.5*Math.cos(t*.51);
  out.flap=flap;out.amplitude=.18+.82*thermal*thermal;
  out.stroke=out.amplitude*(.79*Math.sin(flap)+.21*Math.sin(2*flap-.32));
  out.bank=.11+.19*Math.sin(t*.53);
  return out;
}
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
