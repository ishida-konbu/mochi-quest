// The identity follows the planted bole across cell streaming and LOD changes.
const identities = new WeakMap();
let removed = new Set(), revision = 0, carving = null;
export function timberId(tree) {
  let id = identities.get(tree);
  if (!id) {
    id = tree.kind + ':' + tree.seed + ':' + Math.round(tree.x * 100) + ':' + Math.round(tree.z * 100);
    identities.set(tree, id);
  }
  return id;
}
export function isTimberFelled(tree) { return removed.size > 0 && removed.has(timberId(tree)); }
// Replace only the painted tree with its cuttable copy during the three blows.
// Terrain contacts, travel saves, perches and regrowth still see a standing tree.
export function isTimberHidden(tree) { return tree===carving || isTimberFelled(tree); }
export function showTimberCut(source){
  if(carving===source)return;
  carving=source;
  revision++;
}
export function timberRevision() { return revision; }
export function bindFelledTrees(ids) {
  if (ids.length === removed.size && ids.every(id => removed.has(id))) return;
  removed = new Set(ids);
  revision++;
}
