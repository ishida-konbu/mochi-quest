// Crown dimensions are fractions of total tree height. Each species has four
// growth habits, with different scaffolds, forks, crown depths and leaf tiers.
export const TREE_FAMILIES = [
  // name, architecture, spray, spread, clear bole, leaf colour, new growth, bark
  ['black-pine', 'pine', 0, .57, .34, '#526347','#89915d','#796349'],
  ['red-pine', 'pine', 0, .48, .42, '#657452','#939d69','#a97858'],
  ['cedar', 'spire', 1, .29, .18, '#445b48','#809276','#73644f'],
  ['cypress', 'spire', 2, .34, .26, '#51745b','#97a37a','#916f52'],
  ['silver-fir', 'spire', 10, .35, .15, '#819996','#d5e1de','#777873'],
  ['larch', 'spire', 1, .34, .26, '#a58a48','#d9b65c','#807257'],
  ['cherry', 'blossom', 4, .53, .31, '#cfa3a0','#f4d4c8','#856e64'],
  ['plum', 'blossom', 5, .41, .28, '#b46c75','#edbbb5','#746259'],
  ['willow', 'weeping', 6, .43, .43, '#7f955c','#b4ba77','#887e64'],
  ['birch', 'airy', 7, .32, .36, '#829467','#bec398','#e0d9bf'],
  ['ginkgo', 'vase', 8, .39, .35, '#c79e45','#e8c665','#877c65'],
  ['maple', 'spreading', 9, .51, .31, '#a64836','#e07c46','#756957'],
  ['zelkova', 'vase', 3, .48, .34, '#738453','#b2af71','#a39481'],
  ['oak', 'spreading', 3, .53, .22, '#596e45','#929e60','#73674f'],
  ['moso', 'canes', 11, .34, .42, '#718254','#a9b27d','#899566'],
];
export const TREE_FORMS_PER_FAMILY = 4;
export const TREE_FORM_COUNT = TREE_FAMILIES.length * TREE_FORMS_PER_FAMILY;
const habitats = [
  [6,6,6,7,8,8,9,12,13], [14,14,14,2,3,7,12], [6,7,10,12,13],
  [1,2,3,5,9,12,13], [1,6,8,9,10,12,13], [0,0,0,1,1,3,13],
  [4,4,4,2,5,9], [11,11,11,11,10,10,5,12], [8,8,9,12,13,1],
  [0,0,1,6,7,3,12],
];
export function forestForm(region, random) {
  const pool = habitats[region];
  return pool[Math.floor(random()*pool.length)]*TREE_FORMS_PER_FAMILY + Math.floor(random()*TREE_FORMS_PER_FAMILY);
}
