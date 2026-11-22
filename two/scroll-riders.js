// The mounted hare in the first scroll. Both travellers keep their own place
// in the delivery book, including when they share the same patch of ground.
export function pairRiverTravellers(npcs) {
  const deer = npcs.find(n => n.type === 'deer' && n.habitat === 'river');
  const hare = npcs.find(n => n.type === 'rabbit' && n.role === 'wander' && !n.area);
  if (!deer || !hare) return;
  deer.carriesHare = true;
  hare.ridesDeer = deer;
  hare.homeX = deer.homeX;
  hare.homeZ = deer.homeZ;
  updateHareRider(hare, 0);
  return hare;
}

export function updateHareRider(hare, time) {
  if (!hare) return;
  const deer = hare.ridesDeer, size = deer.stature;
  const seat = -.08 * size;
  hare.heading = deer.heading;
  hare.x = deer.x + Math.sin(deer.heading)*seat;
  hare.z = deer.z + Math.cos(deer.heading)*seat;
  hare.speed = deer.speed;
  const sway = Math.min(1, deer.speed)*Math.abs(Math.sin((time+deer.phase)*3.8));
  hare.y = deer.y + 1.24*size - .71 + .022*sway;
}

export function poseHareRider(limbs, hare, time) {
  const beat = (time+hare.ridesDeer.phase)*3.8;
  const step = Math.min(1,hare.speed);
  limbs.torso.rotation.set(.12+.027*step*Math.sin(beat*2),0,.037*step*Math.sin(beat));
  limbs.torso.position.y = 0;
  limbs.head.rotation.set(-.07+.06*Math.cos(beat),.27*Math.sin(time*.59),-.05);
  for (const s of [-1,1]) {
    const leg = limbs['leg'+s];
    leg.rotation.set(-.76, s*.30, s*.58);
    const arm = limbs['arm'+s];
    arm.rotation.set(-.76+.09*Math.sin(beat+s), s*.08, s*.05);
    limbs['筆穂耳'+s].rotation.z = s*.055+.042*step*Math.sin(beat-.25*s);
  }
}
