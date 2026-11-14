import {items as oldItems,categories as oldCategories,winPath} from '../baseline/level.mjs';
import {layout as originalLayout,sprites,selections} from '../baseline/visual-r3/r3-2/layout.mjs';
export {sprites,selections};
export const spritePath=(id,selectedLevel)=>selectedLevel?.artOverrides?.[id]??`../baseline/visual-r3/r3-2/exports/${sprites[id]}-${selections[id]}.png`;
const copy=x=>structuredClone(x);
const movingNames={"t1": "搪瓷水壶", "t2": "平底锅", "t3": "砧板", "t5": "擀面杖", "d1": "旅行箱", "d2": "运动鞋", "d3": "遮阳帽", "d5": "相机", "r1": "玻璃罐", "r2": "鸡蛋纸托", "r3": "牛奶纸盒", "r4": "铝箔团", "c1": "浇水壶", "c2": "小铲子", "c4": "多肉花盆", "c5": "修枝剪"};
const category=id=>copy(oldCategories.find(c=>c.id===id));
const makeItems=(ids,covers)=>ids.map(id=>({...copy(oldItems.find(i=>i.id===id)),blockedBy:covers[id]??[]}));
const p=(x,y,size,angle,z)=>({x,y,size,angle,z});
const levels=[
 {id:'l1',name:'猫咪拆过的客厅',caption:'一间客厅 · 一点小美好',scene:'living',hint:'先完成一箱，让暂存里的回收物找到位置。',items:copy(oldItems),categories:copy(oldCategories),capacity:5,revision:'l1-hud-047-20261112',layout:copy(originalLayout),winPath:copy(winPath),losePath:['c1','c2','c3','c4','c5','r1'],minimumPeak:2},
 {id:'l2',name:'下班前收桌',caption:'关掉电脑前 · 留张干净的桌子',scene:'desk',hint:'充电线压着文件夹。先收常用柜，或为纸本架留两格；第三箱可选测试帮助。',
 revision:'desk-help-056-20261114',routeGoal:{targetPeak:2,text:'试着让最高暂存不超过2格'},
 items:makeItems(['d1','d2','d3','t1','t2','t3','r1','r2','r3','c1','c2','c5'],{t1:['r1'],t2:['c2'],d1:['c1'],d2:['c2'],r2:['c5']}).map(i=>({...i,name:({t1:'工作笔记本',t2:'文件夹',t3:'随手记',c1:'笔筒',c2:'充电线',c5:'耳机',d3:'清洁手套'})[i.id]??i.name})),
 categories:['daily','toy','recycle','cat'].map(id=>({...category(id),name:({daily:'常用柜',toy:'纸本架',recycle:'回收袋',cat:'工具抽屉'})[id]})),capacity:3,
 artOverrides:{t1:'./office-art/notebook.png',t2:'./office-art/folder.png',t3:'./office-art/notebook.png',c1:'./office-art/pencil-cup.png',c2:'./office-art/cable.png',c5:'./office-art/headphones.png'},
 // Four overlap pairs: paper/box, mug/pencil cup, clock/cable, bottle/headphones.
 // Blockers draw above targets; offset centers intend to expose target pixels.
 // Final alpha overlap and exposed hit areas require sprite/browser validation.
 layout:{t1:p(62,265,86,-9,200),r1:p(83,250,90,3,500),d1:p(262,267,88,-9,210),c1:p(284,259,69,8,510),d2:p(72,410,85,8,260),c2:p(92,414,82,12,560),r2:p(265,413,77,10,270),c5:p(282,415,84,-8,570),t2:p(57,390,88,-12,230),t3:p(54,337,73,-16,240),d3:p(302,331,64,-19,250),r3:p(177,442,76,-10,330)},
 winPath:['c1','d1','c2','d2','d3','r1','t1','t2','t3','c5','r2','r3'],alternativePath:['r1','c1','c2','t1','t2','t3','c5','r2','r3','d1','d2','d3'],losePath:['c1','c2','c5','r1'],minimumPeak:2},
 {id:'l3',name:'搬家前最后一箱',caption:'把今天装好 · 带去新的家',scene:'moving',hint:'回收箱先接走一批，再让园艺箱接走下一批。',items:makeItems(['t1','t2','t3','t5','d1','d2','d3','d5','r1','r2','r3','r4','c1','c2','c4','c5'],{t1:['r1'],t2:['r2'],d1:['c1'],d2:['c2'],r3:['c4'],r4:['c5']}).map(i=>({...i,name:movingNames[i.id]})),categories:oldCategories.map(c=>({...copy(c),name:({toy:'厨房箱',daily:'出行箱',recycle:'回收箱',cat:'园艺箱'})[c.id]})),capacity:3,
 layout:{t1:p(55,229,80,-8,200),r1:p(85,208,95,3,500),t2:p(268,215,78,9,200),r2:p(288,238,73,14,500),d1:p(160,283,82,-9,230),c1:p(171,277,64,10,530),d2:p(71,343,80,10,270),c2:p(81,338,90,5,570),r3:p(265,345,82,-10,280),c4:p(270,340,81,-5,580),r4:p(169,430,83,-16,330),c5:p(181,423,65,0,630),t3:p(220,240,52,-22,210),t5:p(315,432,60,14,340),d3:p(32,436,58,-25,340),d5:p(118,419,60,-16,320)},
 winPath:['r1','t1','r2','t2','t3','t5','c1','d1','c2','d2','d3','d5','c4','r3','c5','r4'],losePath:['c1','c2','r1','r2'],minimumPeak:2}
];
function deepFreeze(o){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);return o;}
export const LEVELS=deepFreeze(levels);
export const getLevel=id=>LEVELS.find(l=>l.id===id);
