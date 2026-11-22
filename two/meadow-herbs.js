// Plate order is shared by the field survey, the texture shader and the botanical painter.
// Each impression has a typical height in metres and a width-to-height ratio.
export const HERBS = [
  ['野芝',.43,1.55], ['菅',.55,1.34], ['薄',.74,1.08], ['蒲',.67,1.02],
  ['羊歯',.56,1.50], ['蕗',.38,1.68], ['白詰草',.26,1.65], ['秋の麒麟草',.38,1.30],
  ['釣鐘草',.40,1.37], ['野菊',.45,1.28], ['撫子',.35,1.53], ['土筆',.47,1.18],
  ['笹',.62,1.52], ['薇',.44,1.33], ['沢瀉',.45,1.40], ['萩',.67,1.53],
  ['桔梗',.49,1.26], ['大葉子',.26,1.86], ['薺',.39,1.30], ['浜昼顔',.28,1.93],
];
export const HERB_FORMS = 5;
export const HERB_ATLAS_SIDE = Math.ceil(Math.sqrt(HERBS.length*HERB_FORMS));
