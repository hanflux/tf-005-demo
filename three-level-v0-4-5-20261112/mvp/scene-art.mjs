import {spritePath as originalSpritePath} from './levels.mjs';
const sample={t1:'train',r1:'box',d1:'mug',d5:'towel',c2:'wand',c4:'bowl'};
const office={t1:'notebook',t2:'folder',t3:'notebook',c1:'pencil-cup',c2:'cable',c5:'headphones'};
export const spritePath=(id,level)=>level.id==='l1'&&sample[id]?`./art-045/${sample[id]}.svg`:level.id==='l2'&&office[id]?`./scene-art/${office[id]}.webp`:originalSpritePath(id,level);
export const scenePath=level=>level.id==='l1'?'./art-045/living.svg':`./scene-art/${level.scene}.webp`;
export const extraAssets=['desk','moving','desk-wide','moving-wide',...new Set(Object.values(office))].map(name=>`mvp/scene-art/${name}.webp`).concat(['living','storage-box',...Object.values(sample)].map(name=>`mvp/art-045/${name}.svg`));
// Preserve top/bottom artwork proportions; only the empty support texture stretches.
// Landscape keeps a centered scene without reducing original prop sizes.
export function sceneFrame(width,height){return {x:0,y:0,width,height,wide:width>height};}
