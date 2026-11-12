import {spritePath as originalSpritePath} from './levels.mjs';
const sample={"d5":"d5-towel","c4":"c4-bowl","r3":"r3-paperbag","c1":"c1-catfood","c3":"c3-scratcher","t4":"t4-pinwheel","r2":"r2-bottle","d4":"d4-umbrella","t2":"t2-blocks","t5":"t5-car","c5":"c5-yarn","t3":"t3-top","r4":"r4-newspaper","c2":"c2-wand","d3":"d3-glove","r1":"r1-box","d1":"d1-mug","d2":"d2-clock","r5":"r5-can","t1":"t1-train"};
const office={t1:'notebook',t2:'folder',t3:'notebook',c1:'pencil-cup',c2:'cable',c5:'headphones'};
export const spritePath=(id,level)=>level.id==='l1'&&sample[id]?`./art-046/${sample[id]}.webp`:level.id==='l2'&&office[id]?`./scene-art/${office[id]}.webp`:originalSpritePath(id,level);
export const scenePath=level=>level.id==='l1'?'./art-046/living.webp':`./scene-art/${level.scene}.webp`;
export const extraAssets=['desk','moving','desk-wide','moving-wide',...new Set(Object.values(office))].map(name=>`mvp/scene-art/${name}.webp`).concat(['living','living-wide','storage-box',...Object.values(sample)].map(name=>`mvp/art-046/${name}.webp`));
// Preserve top/bottom artwork proportions; only the empty support texture stretches.
// Landscape keeps a centered scene without reducing original prop sizes.
export function sceneFrame(width,height){return {x:0,y:0,width,height,wide:width>height};}
