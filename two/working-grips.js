// Stage blocking uses the surface points sampled from the standing travelling
// model. Animation adds breath and movement; use performer.update's return
// value when a loose prop has to follow the palm exactly.
const standingHands=[[-.785,.524,.517],[.770,.541,.518]];
const kagamiHands=[[-.566,.577,.372],[.555,.584,.373]];
// Inner contact on each rounded pad, in actor metres at the neutral socket.
// Left and right differ on the sculpted and painted GLB.
const standingInner=[[-.660,.534,.583],[.654,.539,.627]];
const kagamiInner=[[-.475,.587,.420],[.470,.589,.452]];
const standingBottom=[[-.735,.403,.461],[.720,.420,.520]];
const kagamiBottom=[[-.529,.522,.332],[.519,.530,.375]];
const standingUnder=[[-.688,.432,.543],[.688,.450,.589]];
const kagamiUnder=[[-.496,.535,.391],[.495,.543,.425]];
const socketAngle=Math.atan2(.86,.49);

export function restWorkGrip(mode,side,size=1,turn=0,face='front'){
  const stacked=mode==='kagami',inside=face==='inside';
  const marks=inside?(stacked?kagamiInner:standingInner):
    face==='bottom'?(stacked?kagamiBottom:standingBottom):
    face==='underside'?(stacked?kagamiUnder:standingUnder):(stacked?kagamiHands:standingHands);
  const [x,y,z]=marks[side],a=side?-turn:turn,c=Math.cos(a),s=Math.sin(a);
  let px=x*c+z*s,py=y,pz=z*c-x*s;
  if(face!=='front'){
    // The socket tracks the narrower front of the cake as the pad comes
    // around the cheek. Match the radial travel of the rendered shoulder.
    const angle=socketAngle-turn;
    const dr=.13*(Math.sin(angle)**2-Math.sin(socketAngle)**2)*(stacked?.51:.708);
    px+=(side?1:-1)*dr*Math.sin(angle);
    pz+=dr*Math.cos(angle);
    // The measured vertical arcs differ slightly because the artist's
    // two bind wrists have different cants.
    py-=(side?.031:.006)*Math.sin(turn)*(stacked?.32/.708:1);
  }
  return [px*size,py*size,pz*size];
}
