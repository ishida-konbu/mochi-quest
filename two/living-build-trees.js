// The identity follows the planted bole across cell streaming and LOD changes.
const identities = new WeakMap(), perches = new WeakSet();
let removed = new Set(), revision = 0;
export function timberId(tree) {
  let id = identities.get(tree);
  if (!id) {
    id = tree.kind + ':' + tree.seed + ':' + Math.round(tree.x * 100) + ':' + Math.round(tree.z * 100);
    identities.set(tree, id);
  }
  return id;
}
export function reserveTimberPerch(tree) { perches.add(tree); }
export function isTimberPerch(tree) { return perches.has(tree); }
export function isTimberFelled(tree) { return removed.size > 0 && removed.has(timberId(tree)); }
export function timberRevision() { return revision; }
export function bindFelledTrees(ids) {
  if (ids.length === removed.size && ids.every(id => removed.has(id))) return;
  removed = new Set(ids);
  revision++;
}
