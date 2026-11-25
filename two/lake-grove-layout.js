import { lakePoint } from './snow-country.js';

// The inner trunks stand above the strand. Their long crowns lean back over
// the water, framing the open reach from the footpath on the south bank.
export const LAKE_WILLOWS = [
  { angle: 1.22, size: 1.00, seed: 18471 },
  { angle: 3.76, size: 1.24, seed: 51206 },
].map(({angle,size,seed})=>{
  const [x,z]=lakePoint(angle,1.065);
  return {kind:'lake-willow',h:4.7*size,x,z,radius:.47*size,height:4.7*size,angle,size,seed};
});

export const LAKE_ANIMALS = [
  {type:'frog', role:'skipper', angle:.83, r:1.04, radius:.29, height:1.2},
  {type:'rabbit', role:'wander', angle:.895, r:1.068, radius:.25, height:1.58},
].map(({angle,r,...body})=>{
  const [x,z]=lakePoint(angle,r);
  return {...body,x,z,angle};
});
