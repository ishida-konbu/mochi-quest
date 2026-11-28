const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
const angleBetween = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const ramp = (value, low, high) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};

// A skiff carries its seated passenger. Walking on a ship's deck supplies
// its own velocity after the ship has transported the player for the frame.
export function canFollowTravel(player) {
  return !player.activity && !player.skiff;
}

export function createTravelCamera() {
  let steeringYaw = null, inputAngle = 0;
  let turnRate = 0, manualHold = 0, lead = 0;

  function movementYaw(yaw, side, forward, enabled) {
    if (!enabled || (!side && !forward)) {
      steeringYaw = null;
      return yaw;
    }
    const angle = Math.atan2(side, forward);
    if (steeringYaw === null) {
      steeringYaw = yaw;
      inputAngle = angle;
    } else {
      // A held arrow keeps its world course even as the eye turns. A new
      // keyboard chord or a stick flick aims relative to the current view.
      const change = angleBetween(angle, inputAngle);
      const magnitude = Math.abs(change);
      if (magnitude >= .65) {
        steeringYaw = yaw;
        inputAngle = angle;
      } else if (magnitude > .22) {
        // The stick itself remains responsive within this band. Only its
        // reference frame ignores small reciprocal movements of the thumb.
        const intended = magnitude - .22;
        steeringYaw += clamp(angleBetween(yaw, steeringYaw), -intended, intended);
        inputAngle += Math.sign(change) * intended;
      }
    }
    return steeringYaw;
  }

  function manualLook(deltaYaw = 0) {
    if (steeringYaw !== null) steeringYaw += deltaYaw;
    manualHold = 1.35;
    turnRate = 0;
  }

  function follow(yaw, player, dt, enabled, looking = false) {
    if (looking) manualLook();
    else manualHold = Math.max(0, manualHold - dt);
    const following = enabled && canFollowTravel(player) && !looking && manualHold === 0;
    const speed = following ? Math.hypot(player.vx, player.vz) : 0;
    let ahead = 0;
    if (speed > .25) {
      // Post-contact horizontal velocity follows a sliding wall, a dive or a
      // flight across the map seam. A vertical jump has no bearing to chase.
      let turn = angleBetween(Math.atan2(-player.vx, -player.vz), yaw);
      if (Math.abs(turn) > Math.PI - .12 && turnRate !== 0) {
        turn = Math.sign(turnRate) * Math.abs(turn);
      }
      // Start gently at the edge of the thumbstick and allow faster turns
      // when rolling or riding at speed. Both limits are in radians/second.
      const maxRate = 1.12 + .33 * ramp(speed, 6.4, 20);
      const targetRate = clamp(turn * 2.8, -maxRate, maxRate) * ramp(speed, .25, 1.35);
      turnRate += (targetRate - turnRate) * (1 - Math.exp(-5 * dt));
      const step = turnRate * dt;
      if (Math.sign(step) === Math.sign(turn) && Math.abs(step) >= Math.abs(turn)) {
        yaw += turn;
        turnRate = 0;
      } else yaw += step;
      ahead = ramp(speed, 6, 23) * Math.max(0, Math.cos(turn)) ** 2;
    } else turnRate = 0;
    lead += (ahead - lead) * (1 - Math.exp(-3.5 * dt));
    return yaw;
  }

  function reset() {
    steeringYaw = null;
    turnRate = manualHold = lead = 0;
  }
  return { movementYaw, manualLook, follow, reset, get lead() { return lead; } };
}

// The hatchet works on the +X side of the stump frame. From the other
// flank the dough covers the handle throughout the backswing.
export function chopCameraArc(yaw, axeLine, clearance) {
  const flank = Math.sin(angleBetween(yaw, axeLine));
  if (flank >= .79) return null;
  let chosen = 0, chosenSide = 0, best = -Infinity;
  for (const side of [1, -1]) {
    for (const bearing of [1.74, 1.29]) {
      const turn = angleBetween(axeLine + side * bearing, yaw);
      let room = 1;
      const steps = Math.max(2, Math.ceil(Math.abs(turn) / .38));
      for (let i = 1; i <= steps; i++) {
        room = Math.min(room, clearance(yaw + turn * i / steps));
      }
      // Frame the near shoulder just in front of its profile so both the
      // face and the notch read. Room along the orbit takes precedence.
      const score = 4 * room + (side > 0 ? .95 : 0) + (bearing > Math.PI / 2 ? .22 : 0) - .15 * Math.abs(turn);
      if (score > best) { best = score; chosen = turn; chosenSide = side; }
    }
  }
  if (Math.abs(chosen) < .04 || (flank <= -.79 && chosenSide < 0)) return null;
  const duration = clamp(Math.abs(chosen) * 1.53, .65, 2.15);
  let elapsed = 0;
  return dt => {
    elapsed = Math.min(duration, elapsed + dt);
    return yaw + chosen * ramp(elapsed, 0, duration);
  };
}
