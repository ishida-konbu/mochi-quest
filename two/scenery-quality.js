export const DEFAULT_SCENERY_QUALITY = 'beautiful';

// Every region uses the same horizon, in metres from the camera. Keep enough
// ground under each forest, and enough contrast for its last crowns to read.
export const SCENERY_PROFILES = {
  beautiful: {
    treeRange: 840, landmarkDetailRange: 345,
    terrainRange: 845, sceneryScale: 1.20, openFogDensity: .00215,
  },
  normal: {
    treeRange: 730, landmarkDetailRange: 245,
    terrainRange: 745, sceneryScale: 1.10, openFogDensity: .00255,
  },
  light: {
    treeRange: 640, landmarkDetailRange: 0,
    terrainRange: 710, sceneryScale: 1, openFogDensity: .0030,
  },
};

export function sceneryQualityPreference(value) {
  if (typeof value === 'string' && Object.hasOwn(SCENERY_PROFILES, value)) return value;
}
