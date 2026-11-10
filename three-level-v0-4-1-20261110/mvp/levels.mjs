import {items as oldItems,categories as oldCategories,capacity,winPath} from '../baseline/level.mjs';
import {layout as originalLayout,sprites,selections} from '../baseline/visual-r3/r3-2/layout.mjs';
export {sprites,selections};
export const spritePath=id=>`../baseline/visual-r3/r3-2/exports/${sprites[id]}-${selections[id]}.png`;
const copy=x=>structuredClone(x);
const category=id=>copy(oldCategories.find(c=>c.id===id));
const makeItems=(ids,covers)=>ids.map(id=>({...copy(oldItems.find(i=>i.id===id)),blockedBy:covers[id]??[]}));
const p=(x,y,size,angle,z)=>({x,y,size,angle,z});
const levels=[
 {id:'l1',name:'猫咪拆过的客厅',caption:'一间客厅 · 一点小美好',scene:'living',hint:'先完成一箱，让暂存里的回收物找到位置。',items:copy(oldItems),categories:copy(oldCategories),capacity,layout:copy(originalLayout),winPath:copy(winPath),losePath:['c1','c2','c3','c4'],minimumPeak:2},
 {id:'l2',name:'下班前收桌',caption:'关掉电脑前 · 留张干净的桌子',scene:'desk',hint:'玩具篮和日用柜，先清哪一边更省位置？',items:makeItems(['d1','d2','d3','t1','t2','t3','r1','r2','r3','c1','c2','c5'],{d1:['r1'],d2:['r3'],t2:['r2']}),categories:['daily','toy','recycle','cat'].map(category),capacity:3,
 layout:{d1:p(70,252,90,-9,200),r1:p(98,231,104,3,500),d2:p(264,252,86,8,210),r3:p(251,254,80,-14,510),t2:p(163,350,88,8,260),r2:p(184,370,80,14,560),t1:p(57,388,95,-9,280),t3:p(290,364,65,-19,270),d3:p(236,430,66,-23,310),c1:p(112,431,65,12,320),c2:p(176,251,72,17,190),c5:p(311,438,62,0,330)},
 winPath:['r2','t2','t1','t3','r1','r3','d1','d2','d3','c1','c2','c5'],alternativePath:['r1','d1','r3','d2','d3','r2','t2','t1','t3','c1','c2','c5'],losePath:['c1','c2','c5','r1'],minimumPeak:1},
 {id:'l3',name:'搬家前最后一箱',caption:'把今天装好 · 带去新的家',scene:'moving',hint:'回收袋先接走一批，再让猫咪箱接走下一批。',items:makeItems(['t1','t2','t3','t5','d1','d2','d3','d5','r1','r2','r3','r4','c1','c2','c4','c5'],{t1:['r1'],t2:['r2'],d1:['c1'],d2:['c2'],r3:['c4'],r4:['c5']}),categories:copy(oldCategories),capacity:3,
 layout:{t1:p(55,229,80,-8,200),r1:p(85,208,95,3,500),t2:p(268,215,78,9,200),r2:p(288,238,73,14,500),d1:p(160,283,82,-9,230),c1:p(171,277,64,10,530),d2:p(71,343,80,10,270),c2:p(81,338,90,5,570),r3:p(265,345,82,-10,280),c4:p(270,340,81,-5,580),r4:p(169,430,83,-16,330),c5:p(181,423,65,0,630),t3:p(220,240,52,-22,210),t5:p(315,432,60,14,340),d3:p(32,436,58,-25,340),d5:p(118,419,60,-16,320)},
 winPath:['r1','t1','r2','t2','t3','t5','c1','d1','c2','d2','d3','d5','c4','r3','c5','r4'],losePath:['c1','c2','r1','r2'],minimumPeak:2}
];
function deepFreeze(o){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);return o;}
export const LEVELS=deepFreeze(levels);
export const getLevel=id=>LEVELS.find(l=>l.id===id);
