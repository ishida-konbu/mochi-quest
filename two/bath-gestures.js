// The upright treatments keep their real stool, submerged step or plunge
// depth. A reclining bath instead uses the full-length mochi shape key.
const postures={
  rinse:{height:.84,width:.98,pitch:.12,eye:.75,camera:.25},
  steam:{height:.82,width:1.035,pitch:-.10,eye:.74,camera:.22},
  seat:{height:.82,width:1.025,pitch:-.12,eye:.73,camera:.41},
  jar:{height:.94,width:.91,pitch:-.095,eye:.81,camera:.46},
  deep:{height:1,width:.96,pitch:-.15,eye:.89,camera:.43},
  bamboo:{height:.89,width:.97,pitch:.11,eye:.81,camera:.42},
  cascade:{height:.86,width:1.01,pitch:.12,eye:.78,camera:.39},
};
export const bathPosture=action=>postures[action];
const smooth=(x,a,b)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function seatedFeet(player,bath){
  const full=player.buffs?.full>0?1.28:1;
  const freeboard=player.mode==='kagami'?.47:.70;
  return bath.wet ? Math.max(bath.seatY,player.bathWaterY-freeboard*full) : bath.seatY;
}
export function seatedGesture(bath,time,left){
  const posture=bathPosture(bath?.action);
  if(!posture)return;
  const wave=Math.sin(time*(bath.action==='steam'?1.42:2.18)),beat=.5+.5*wave;
  let bow=0,roll=0,reach=0,lift=0,wipe=0;
  if(bath.action==='rinse'){
    // The short scoop, shoulder pour, and return share the wooden ladle's clock.
    const t=(3.2-left)/3.2;
    reach=smooth(t,.13,.26)*(1-smooth(t,.32,.52));
    lift=smooth(t,.29,.64)*(1-smooth(t,.79,.98));
    wipe=smooth(t,.61,.73)*(1-smooth(t,.82,.99));
    bow=.23*reach+.045*wipe-.048*lift;roll=.045*reach-.09*wipe;
  }else if(bath.action==='steam'){
    wipe=(.5+.5*Math.sin(time*1.85))**2;
    bow=.045*beat;roll=.025*wave;
  }else if(bath.action==='cascade'){
    wipe=beat;bow=.09*beat;roll=-.105+.035*wave;
  }else if(bath.action==='bamboo'){
    bow=.032*beat;roll=.079*Math.sin(time*1.6);
  }else if(bath.action==='deep'){
    bow=-.036*beat;
  }
  return {posture,beat,reach,lift,wipe,bow,roll};
}

// Per-player world-space mitt sample shared by the skinned hero and the active ladle.
export const rinsingPalms=new WeakMap();
const resting=[-.21,1.012,-3.28,-.17,.14];
const rinsePath=[
  [0,resting],[.16,resting],[.29,[-.16,.895,-3.29,.44,.14]],
  [.41,[-.26,1.24,-3.01,.68,.09]],[.54,[-.42,1.46,-2.97,.94,.04]],
  [.64,[-.52,1.62,-3.03,1.34,-.03]],[.77,[-.52,1.60,-2.98,1.49,-.36]],
  [.84,[-.50,1.56,-3.0,1.34,-.35]],[.90,[-.38,1.38,-3.01,.66,-.08]],
  [1,resting]
];
export function rinseDipperAt(elapsed,large=false){
  const t=Math.max(0,Math.min(1,elapsed/3.2));
  let k=1;while(k<rinsePath.length-1 && t>rinsePath[k][0])k++;
  const [start,a]=rinsePath[k-1],[end,b]=rinsePath[k],f=smooth(t,start,end);
  const values=a.map((v,i)=>v+(b[i]-v)*f);
  const lift=smooth(t,.34,.63)*(1-smooth(t,.83,1));
  const pour=smooth(t,.63,.72)*(1-smooth(t,.78,.86));
  const wet=smooth(t,.23,.30)*(1-smooth(t,.69,.81));
  const [u,y,v,pitch,roll]=values;
  return {u:u*(1+(large ? .18 : 0)*lift),y:y+(large ? .28 : 0)*lift,v,pitch,roll,pour,wet,
    hold:smooth(t,.25,.43)*(1-smooth(t,.83,.98))};
}
