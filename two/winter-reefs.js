// Exposed heads of two reefs flanking the winter bay. The shelf falls away
// sharply here, so survey the crown above sea level and measure down to bedrock.
import { SNOW_TOWN } from './snow-country.js';

export const WINTER_REEFS = [
  // West reef, with one leaning pine on the principal rock.
  [-31,-77,5.6,3.7,4.65,-.58,0], [-35.8,-75.2,3.9,2.6,2.08,-.62,3],
  [-25.6,-78.4,2.8,1.7,1.27,-.57,1], [-22.1,-79.3,1.8,1.02,.72,-.71,2],
  // A lower, broken chain across the eastern mouth.
  [32,-90,4.8,3.0,2.73,.74,2], [36.5,-92.6,3.38,2.2,1.67,.66,1],
  [40.4,-94.4,2.34,1.51,.94,.68,3],
].map(([x,z,rx,rz,top,yaw,stratum],i) => ({
  x:SNOW_TOWN.x+x, z:SNOW_TOWN.z+z, rx, rz, top, yaw, stratum,
  tint:i<4?'#7c8487':'#899092', winterReef:true, reef:true,
}));
