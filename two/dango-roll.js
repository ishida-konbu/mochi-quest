export function onDangoCourse(player) {
  return player.mode === 'dango' && !player.inWater &&
    !player.mount && !player.skiff && !player.activity;
}

export function isGroundedDango(player) {
  return player.grounded && onDangoCourse(player);
}
