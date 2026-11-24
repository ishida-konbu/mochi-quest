import * as T from './vendor/three.module.min.js';

// The worktables, the recipe notebook and the active cook use one GPU copy
// of each photograph. A white texel preserves the pigment during the download.
const urls={
  materials:new URL('./assets/world/mochiyori-materials.webp',import.meta.url).href,
  ingredients:new URL('./assets/world/mochiyori-ingredients.webp',import.meta.url).href,
};
const maps=new Map();
let white;
export function cookingAtlas(name) {
  if(maps.has(name))return maps.get(name);
  const map=new T.TextureLoader().load(urls[name],texture=>{
    // WebGL2 allocates immutable storage for the initial one-pixel image.
    // The decoded photograph needs storage of its own dimensions.
    texture.dispose();texture.needsUpdate=true;
  });
  map.colorSpace=T.SRGBColorSpace;
  map.anisotropy=name==='ingredients'?8:4;
  if(!map.image && typeof HTMLCanvasElement!=='undefined') {
    if(!white){
      white=document.createElement('canvas');white.width=white.height=1;
      const context=white.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,1,1);
    }
    map.image=white;map.needsUpdate=true;
  }
  maps.set(name,map);
  return map;
}
