// One game minute is two seconds of active play. Only this clock may jump
// when a traveller rests. Boats, tides, weather and temple bells use seconds.
export const DAY_MINUTES = 1440;
export const SECONDS_PER_MINUTE = 2;
export const WORLD_DAY_SECONDS = DAY_MINUTES * SECONDS_PER_MINUTE;
export const INITIAL_WORLD_MINUTE = 480;
export const WAIT_HOURS = Object.freeze([6, 12, 18, 21]);
export const LEGACY_KYO_SECONDS = 288;

const smooth = (start, end, value) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export function legacyWorldMinute(seconds, offset = 0) {
  // Old Kyoto starts at high noon. Import only the phase of this day.
  return ((seconds + offset) % LEGACY_KYO_SECONDS * DAY_MINUTES / LEGACY_KYO_SECONDS + 720) % DAY_MINUTES;
}

export function minutesSinceNoon(minute) {
  return (minute + 720) % DAY_MINUTES;
}

export function waitTargetMinute(minute, hour) {
  if (!WAIT_HOURS.includes(hour)) return null;
  const start = minute - minute % DAY_MINUTES;
  const target = start + hour * 60;
  return target <= minute ? target + DAY_MINUTES : target;
}

export function worldClockLabel(minute) {
  const day = Math.floor(minute / DAY_MINUTES) + 1;
  const withinDay = Math.floor(minute % DAY_MINUTES);
  const h = Math.floor(withinDay / 60), m = withinDay % 60;
  const band = h < 5 ? '深夜' : h < 7 ? '夜明け' : h < 11 ? '朝' : h < 16 ? '昼' : h < 19 ? '夕暮れ' : '夜';
  return `${day}日目　${band} ${h}:${String(m).padStart(2, '0')}`;
}

export function worldNight(minute) {
  return smooth(-.35, .48, Math.cos((minute % DAY_MINUTES) * (Math.PI * 2 / DAY_MINUTES)));
}

// Start with the local painted sky weights. At the centre of a fixed scene
// these sum to one, leaving no contribution from the passing world light.
export function lightAtMinute(climate, minute = INITIAL_WORLD_MINUTE) {
  const fixedMoon = climate.moon, fixedDawn = climate.dawn;
  const changing = (1 - fixedMoon) * (1 - fixedDawn);
  const hour = (minute % DAY_MINUTES) / 60;
  const distanceToTwilight = Math.min(Math.abs(hour - 6.1), Math.abs(hour - 17.9));
  const night = worldNight(minute);
  climate.moon = fixedMoon + changing * night;
  climate.dawn = fixedDawn + changing * (1 - night) * (1 - smooth(0, 2.35, distanceToTwilight));
  climate.sunWest = changing * smooth(10, 14, hour) * (1 - smooth(21, 23, hour));
  climate.dawnSea = fixedDawn;
  return climate;
}
