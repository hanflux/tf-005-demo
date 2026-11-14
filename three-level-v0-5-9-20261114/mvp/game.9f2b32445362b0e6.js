/* SSJWL compiled H5 runtime 0.5.9 */
(()=>{
const __module1=(()=>{
function clampView(v,w,h,worldW){const z=Math.max(1,Math.min(2.4,v.z));return {z,x:Math.max(w-worldW*z,Math.min(0,v.x)),y:Math.max(h-h*z,Math.min(0,v.y))};}
function installSceneGestures({viewport,room,worldScale,onChange,canInteract}){
let v={z:1,x:0,y:0},pointers=new Map(),origin=null,blockedUntil=0,dragged=false;
const size=()=>({w:viewport.clientWidth,h:viewport.clientHeight,ww:viewport.clientWidth*worldScale()});
function draw(){const {w,h,ww}=size();v=clampView(v,w,h,ww);room.style.width=ww+'px';room.style.height=h+'px';room.style.transformOrigin='0 0';room.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.z})`;onChange?.({...v});}
function seed(){const p=[...pointers.values()];origin={v:{...v},p:p.map(x=>({...x})),distance:p.length>1?Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y):0};}
viewport.addEventListener('pointerdown',e=>{if(!canInteract()||!e.isPrimary&&e.pointerType==='mouse')return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)dragged=false;else{dragged=true;blockedUntil=performance.now()+800;for(const id of pointers.keys())try{viewport.setPointerCapture(id)}catch{}}seed();},true);
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!origin)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()],r=viewport.getBoundingClientRect();if(p.length>1&&origin.p.length>1){const d=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),z=Math.max(1,Math.min(2.4,origin.v.z*d/Math.max(10,origin.distance))),cx=(origin.p[0].x+origin.p[1].x)/2-r.left,cy=(origin.p[0].y+origin.p[1].y)/2-r.top,mx=(p[0].x+p[1].x)/2-r.left,my=(p[0].y+p[1].y)/2-r.top;v={z,x:mx-(cx-origin.v.x)*z/origin.v.z,y:my-(cy-origin.v.y)*z/origin.v.z};dragged=true;}else if(p.length===1&&origin.p.length===1){const dx=p[0].x-origin.p[0].x,dy=p[0].y-origin.p[0].y;if(Math.hypot(dx,dy)>8&&(v.z>1||worldScale()>1)){dragged=true;try{viewport.setPointerCapture(e.pointerId)}catch{}v={...v,x:origin.v.x+dx,y:origin.v.y+dy};}}if(dragged){e.preventDefault();blockedUntil=performance.now()+800;draw();}},true);
function end(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(dragged){blockedUntil=performance.now()+800;e.preventDefault();}seed();}
viewport.addEventListener('pointerup',end,true);viewport.addEventListener('pointercancel',end,true);
const api={reset(){pointers.clear();origin=null;v={z:1,x:0,y:0};draw();},resize:draw,suppressClick:()=>dragged&&performance.now()<blockedUntil,move(dx){v.x+=dx;draw();},reveal(id){const el=room.querySelector('#'+id);if(!el)return;const r=el.getBoundingClientRect(),box=viewport.getBoundingClientRect();if(r.left<box.left)v.x+=box.left-r.left+12;if(r.right>box.right)v.x-=r.right-box.right+12;if(r.top<box.top)v.y+=box.top-r.top+12;if(r.bottom>box.bottom)v.y-=r.bottom-box.bottom+12;draw();},snapshot:()=>({...v}),cancel(){pointers.clear();origin=null;blockedUntil=performance.now()+800;dragged=true;}};return api;
}
return {clampView,installSceneGestures};})();
const __module2=(()=>{
class PlayClock{
constructor(now=()=>performance.now()){this.now=now;this.ms=0;this.active=false;this.last=now();}
reset(ms=0){this.ms=ms;this.active=false;this.last=this.now();}
update(active){const t=this.now();if(this.active)this.ms=Math.min(604800000,this.ms+Math.max(0,t-this.last));this.last=t;this.active=active;return Math.round(this.ms);}
}
function formatTime(ms){const n=Math.floor(ms/1000);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
return {PlayClock,formatTime};})();
const __module5=(()=>{
const categories = [
{id:'toy', name:'玩具篮', color:'#e79451'},
{id:'daily', name:'日用柜', color:'#72a9b0'},
{id:'recycle', name:'回收袋', color:'#94a868'},
{id:'cat', name:'猫咪箱', color:'#b79acb'}
];
const groups = [
['t','toy',['小火车','积木','陀螺','小风车','玩具车'],[6,77,148,219,290],10],
['d','daily',['水杯','小闹钟','手套','雨伞','毛巾'],[6,77,148,219,290],100],
['c','cat',['猫罐头','逗猫棒','猫抓板','猫碗','毛线球'],[6,77,148,219,290],190],
['r','recycle',['纸盒','饮料瓶','纸袋','报纸','易拉罐'],[20,91,20,91,290],280]
];
const scattered={t3:[148,190],t4:[219,280],t5:[290,100],d3:[148,280],d4:[219,190],d5:[290,10],c1:[148,10],c2:[219,100],c3:[148,100],c4:[219,10]};
const items = groups.flatMap(([prefix,category,names,xs,y]) => names.map((name,i)=>({
id:prefix+(i+1), category, name, x:scattered[prefix+(i+1)]?.[0]??xs[i], y:scattered[prefix+(i+1)]?.[1]??(prefix==='r'&&i<4?(i<2?32:122):y),
blockedBy:prefix==='t'&&i<2?['r'+(i+1)]:prefix==='d'&&i<2?['r'+(i+3)]:[]
})));
const capacity=3;
const winPath=['r1','t1','r2','t2','t3','t4','t5','r3','r4','r5','d1','d2','d3','d4','d5','c1','c2','c3','c4','c5'];
const losePath=['c1','c2','c3','c4'];
return {categories,items,capacity,winPath,losePath};})();
const __module6=(()=>{
const layout={
t1:{x:59,y:292,size:88,angle:-8,z:230},
r1:{x:91,y:270,size:101,angle:3,z:530},
t2:{x:269,y:239,size:80,angle:9,z:210},
r2:{x:290,y:263,size:74,angle:14,z:520},
d1:{x:149,y:347,size:77,angle:-9,z:310},
r3:{x:173,y:350,size:72,angle:12,z:610},
d2:{x:285,y:396,size:82,angle:10,z:350},
r4:{x:271,y:399,size:74,angle:-16,z:650},
c4:{x:64,y:436,size:89,angle:-5,z:390},
t3:{x:211,y:286,size:56,angle:-21,z:260},
t4:{x:30,y:361,size:62,angle:25,z:330},
t5:{x:210,y:452,size:62,angle:14,z:425},
d3:{x:129,y:444,size:57,angle:-25,z:420},
d4:{x:318,y:319,size:70,angle:8,z:300},
d5:{x:191,y:217,size:64,angle:-16,z:190},
c1:{x:327,y:451,size:58,angle:12,z:430},
c2:{x:128,y:401,size:67,angle:15,z:370},
c3:{x:204,y:387,size:67,angle:16,z:360},
c5:{x:235,y:332,size:56,angle:0,z:310},
r5:{x:159,y:262,size:58,angle:-20,z:198}
};
const sprites={t1:'t1-train',t2:'t2-blocks',d1:'d1-mug',d2:'d2-clock',r1:'r1-box',r2:'r2-bottle',c4:'c4-bowl',c2:'c2-wand',d4:'d4-umbrella',d5:'d5-towel',c3:'c3-scratcher',t3:'t3-top',t4:'t4-pinwheel',t5:'t5-car',d3:'d3-glove',c1:'c1-catfood',c5:'c5-yarn',r3:'r3-paperbag',r4:'r4-newspaper',r5:'r5-can'};
const selections={t1:256,t2:128,d1:128,d2:256,r1:256,r2:128,c4:128,c2:256,d4:256,d5:256,c3:256,t3:256,t4:256,t5:256,d3:256,c1:256,c5:256,r3:256,r4:256,r5:256};
const spritePath=id=>`exports/${sprites[id]}-${selections[id]}.png`;
return {layout,sprites,selections,spritePath};})();
const __module4=(()=>{
const {items:oldItems,categories:oldCategories,winPath}=__module5;
const {layout:originalLayout,sprites,selections}=__module6;
const spritePath=(id,selectedLevel)=>selectedLevel?.artOverrides?.[id]??`../baseline/visual-r3/r3-2/exports/${sprites[id]}-${selections[id]}.png`;
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
layout:{t1:p(62,265,86,-9,200),r1:p(83,250,90,3,500),d1:p(262,267,88,-9,210),c1:p(284,259,69,8,510),d2:p(72,410,85,8,260),c2:p(92,414,82,12,560),r2:p(265,413,77,10,270),c5:p(282,415,84,-8,570),t2:p(57,390,88,-12,230),t3:p(54,337,73,-16,240),d3:p(302,331,64,-19,250),r3:p(177,442,76,-10,330)},
winPath:['c1','d1','c2','d2','d3','r1','t1','t2','t3','c5','r2','r3'],alternativePath:['r1','c1','c2','t1','t2','t3','c5','r2','r3','d1','d2','d3'],losePath:['c1','c2','c5','r1'],minimumPeak:2},
{id:'l3',name:'搬家前最后一箱',caption:'把今天装好 · 带去新的家',scene:'moving',hint:'回收箱先接走一批，再让园艺箱接走下一批。',items:makeItems(['t1','t2','t3','t5','d1','d2','d3','d5','r1','r2','r3','r4','c1','c2','c4','c5'],{t1:['r1'],t2:['r2'],d1:['c1'],d2:['c2'],r3:['c4'],r4:['c5']}).map(i=>({...i,name:movingNames[i.id]})),categories:oldCategories.map(c=>({...copy(c),name:({toy:'厨房箱',daily:'出行箱',recycle:'回收箱',cat:'园艺箱'})[c.id]})),capacity:3,
layout:{t1:p(55,229,80,-8,200),r1:p(85,208,95,3,500),t2:p(268,215,78,9,200),r2:p(288,238,73,14,500),d1:p(160,283,82,-9,230),c1:p(171,277,64,10,530),d2:p(71,343,80,10,270),c2:p(81,338,90,5,570),r3:p(265,345,82,-10,280),c4:p(270,340,81,-5,580),r4:p(169,430,83,-16,330),c5:p(181,423,65,0,630),t3:p(220,240,52,-22,210),t5:p(315,432,60,14,340),d3:p(32,436,58,-25,340),d5:p(118,419,60,-16,320)},
winPath:['r1','t1','r2','t2','t3','t5','c1','d1','c2','d2','d3','d5','c4','r3','c5','r4'],losePath:['c1','c2','r1','r2'],minimumPeak:2}
];
levels.push({"id": "l4", "name": "周末工具角", "caption": "把常用工具放回手边", "scene": "workshop", "hint": "双指可放大；左右拖动找物品，点一下才收取。先观察当前分类与遮挡。", "items": [{"id": "a1", "name": "手工具·1", "category": "a", "blockedBy": ["c1"]}, {"id": "a2", "name": "手工具·2", "category": "a", "blockedBy": ["c2"]}, {"id": "a3", "name": "手工具·3", "category": "a", "blockedBy": []}, {"id": "b1", "name": "量具·1", "category": "b", "blockedBy": ["d1"]}, {"id": "b2", "name": "量具·2", "category": "b", "blockedBy": ["d2"]}, {"id": "b3", "name": "量具·3", "category": "b", "blockedBy": []}, {"id": "c1", "name": "紧固件·1", "category": "c", "blockedBy": []}, {"id": "c2", "name": "紧固件·2", "category": "c", "blockedBy": []}, {"id": "c3", "name": "紧固件·3", "category": "c", "blockedBy": []}, {"id": "d1", "name": "收纳耗材·1", "category": "d", "blockedBy": []}, {"id": "d2", "name": "收纳耗材·2", "category": "d", "blockedBy": []}, {"id": "d3", "name": "收纳耗材·3", "category": "d", "blockedBy": []}], "categories": [{"id": "a", "name": "手工具"}, {"id": "b", "name": "量具"}, {"id": "c", "name": "紧固件"}, {"id": "d", "name": "收纳耗材"}], "capacity": 3, "revision": "l4-059", "worldScale": 1.7, "layout": {"a1": {"x": 65.0, "y": 199, "size": 91, "angle": 11, "z": 201}, "a2": {"x": 355.0, "y": 175, "size": 83, "angle": -16, "z": 202}, "a3": {"x": 645.0, "y": 199, "size": 91, "angle": -7, "z": 203}, "b1": {"x": 77.0, "y": 409, "size": 91, "angle": -14, "z": 221}, "b2": {"x": 367.0, "y": 385, "size": 83, "angle": -5, "z": 222}, "b3": {"x": 657.0, "y": 409, "size": 91, "angle": 4, "z": 223}, "c1": {"x": 87.0, "y": 197, "size": 76, "angle": 4, "z": 541}, "c2": {"x": 377.0, "y": 173, "size": 76, "angle": -4, "z": 542}, "c3": {"x": 305, "y": 280, "size": 76, "angle": -12, "z": 543}, "d1": {"x": 99.0, "y": 407, "size": 76, "angle": 4, "z": 561}, "d2": {"x": 389.0, "y": 383, "size": 76, "angle": -4, "z": 562}, "d3": {"x": 305, "y": 315, "size": 76, "angle": -12, "z": 563}}, "artOverrides": {"a1": "./art-059/l4/a1.svg", "a2": "./art-059/l4/a2.svg", "a3": "./art-059/l4/a3.svg", "b1": "./art-059/l4/b1.svg", "b2": "./art-059/l4/b2.svg", "b3": "./art-059/l4/b3.svg", "c1": "./art-059/l4/c1.svg", "c2": "./art-059/l4/c2.svg", "c3": "./art-059/l4/c3.svg", "d1": "./art-059/l4/d1.svg", "d2": "./art-059/l4/d2.svg", "d3": "./art-059/l4/d3.svg"}, "starStores": 2, "minimumPeak": 2, "winPath": ["c1", "a1", "c2", "a2", "a3", "c3", "d1", "d2", "d3", "b1", "b2", "b3"], "losePath": ["c1", "c2", "d1", "d2"]});
levels.push({"id": "l5", "name": "阳台育苗台", "caption": "留一块晒太阳的位置", "scene": "garden", "hint": "双指可放大；左右拖动找物品，点一下才收取。先观察当前分类与遮挡。", "items": [{"id": "a1", "name": "花盆·1", "category": "a", "blockedBy": ["c1"]}, {"id": "a2", "name": "花盆·2", "category": "a", "blockedBy": ["c2"]}, {"id": "a3", "name": "花盆·3", "category": "a", "blockedBy": ["c3"]}, {"id": "a4", "name": "花盆·4", "category": "a", "blockedBy": []}, {"id": "b1", "name": "种子·1", "category": "b", "blockedBy": ["d1"]}, {"id": "b2", "name": "种子·2", "category": "b", "blockedBy": ["d2"]}, {"id": "b3", "name": "种子·3", "category": "b", "blockedBy": []}, {"id": "b4", "name": "种子·4", "category": "b", "blockedBy": []}, {"id": "c1", "name": "园艺工具·1", "category": "c", "blockedBy": []}, {"id": "c2", "name": "园艺工具·2", "category": "c", "blockedBy": []}, {"id": "c3", "name": "园艺工具·3", "category": "c", "blockedBy": []}, {"id": "c4", "name": "园艺工具·4", "category": "c", "blockedBy": []}, {"id": "d1", "name": "包装回收·1", "category": "d", "blockedBy": []}, {"id": "d2", "name": "包装回收·2", "category": "d", "blockedBy": []}, {"id": "d3", "name": "包装回收·3", "category": "d", "blockedBy": []}, {"id": "d4", "name": "包装回收·4", "category": "d", "blockedBy": []}], "categories": [{"id": "a", "name": "花盆"}, {"id": "b", "name": "种子"}, {"id": "c", "name": "园艺工具"}, {"id": "d", "name": "包装回收"}], "capacity": 3, "revision": "l5-059", "worldScale": 1.9, "layout": {"a1": {"x": 65.0, "y": 199, "size": 91, "angle": 11, "z": 201}, "a2": {"x": 258.33333333333337, "y": 175, "size": 83, "angle": -16, "z": 202}, "a3": {"x": 451.6666666666667, "y": 199, "size": 91, "angle": -7, "z": 203}, "a4": {"x": 645.0, "y": 175, "size": 83, "angle": 2, "z": 204}, "b1": {"x": 77.0, "y": 409, "size": 91, "angle": -14, "z": 221}, "b2": {"x": 270.33333333333337, "y": 385, "size": 83, "angle": -5, "z": 222}, "b3": {"x": 463.6666666666667, "y": 409, "size": 91, "angle": 4, "z": 223}, "b4": {"x": 657.0, "y": 385, "size": 83, "angle": 13, "z": 224}, "c1": {"x": 87.0, "y": 197, "size": 76, "angle": 4, "z": 541}, "c2": {"x": 280.33333333333337, "y": 173, "size": 76, "angle": -4, "z": 542}, "c3": {"x": 473.6666666666667, "y": 197, "size": 76, "angle": -12, "z": 543}, "c4": {"x": 415, "y": 280, "size": 76, "angle": -20, "z": 544}, "d1": {"x": 99.0, "y": 407, "size": 76, "angle": 4, "z": 561}, "d2": {"x": 292.33333333333337, "y": 383, "size": 76, "angle": -4, "z": 562}, "d3": {"x": 305, "y": 315, "size": 76, "angle": -12, "z": 563}, "d4": {"x": 415, "y": 315, "size": 76, "angle": -20, "z": 564}}, "artOverrides": {"a1": "./art-059/l5/a1.svg", "a2": "./art-059/l5/a2.svg", "a3": "./art-059/l5/a3.svg", "a4": "./art-059/l5/a4.svg", "b1": "./art-059/l5/b1.svg", "b2": "./art-059/l5/b2.svg", "b3": "./art-059/l5/b3.svg", "b4": "./art-059/l5/b4.svg", "c1": "./art-059/l5/c1.svg", "c2": "./art-059/l5/c2.svg", "c3": "./art-059/l5/c3.svg", "c4": "./art-059/l5/c4.svg", "d1": "./art-059/l5/d1.svg", "d2": "./art-059/l5/d2.svg", "d3": "./art-059/l5/d3.svg", "d4": "./art-059/l5/d4.svg"}, "starStores": 2, "minimumPeak": 2, "winPath": ["d1", "b1", "d2", "b2", "b3", "b4", "c1", "c2", "c3", "c4", "d3", "d4", "a1", "a2", "a3", "a4"], "losePath": ["c1", "c2", "d1", "d2"]});
levels.push({"id": "l6", "name": "露营归来", "caption": "把下一次出发准备好", "scene": "camp", "hint": "双指可放大；左右拖动找物品，点一下才收取。先观察当前分类与遮挡。", "items": [{"id": "a1", "name": "炊具·1", "category": "a", "blockedBy": ["c1"]}, {"id": "a2", "name": "炊具·2", "category": "a", "blockedBy": ["c2"]}, {"id": "a3", "name": "炊具·3", "category": "a", "blockedBy": ["c3"]}, {"id": "a4", "name": "炊具·4", "category": "a", "blockedBy": []}, {"id": "a5", "name": "炊具·5", "category": "a", "blockedBy": []}, {"id": "b1", "name": "行装·1", "category": "b", "blockedBy": ["d1"]}, {"id": "b2", "name": "行装·2", "category": "b", "blockedBy": ["d2"]}, {"id": "b3", "name": "行装·3", "category": "b", "blockedBy": ["d3"]}, {"id": "b4", "name": "行装·4", "category": "b", "blockedBy": []}, {"id": "b5", "name": "行装·5", "category": "b", "blockedBy": []}, {"id": "c1", "name": "照明·1", "category": "c", "blockedBy": []}, {"id": "c2", "name": "照明·2", "category": "c", "blockedBy": []}, {"id": "c3", "name": "照明·3", "category": "c", "blockedBy": []}, {"id": "c4", "name": "照明·4", "category": "c", "blockedBy": []}, {"id": "c5", "name": "照明·5", "category": "c", "blockedBy": []}, {"id": "d1", "name": "清洁·1", "category": "d", "blockedBy": []}, {"id": "d2", "name": "清洁·2", "category": "d", "blockedBy": []}, {"id": "d3", "name": "清洁·3", "category": "d", "blockedBy": []}, {"id": "d4", "name": "清洁·4", "category": "d", "blockedBy": []}, {"id": "d5", "name": "清洁·5", "category": "d", "blockedBy": []}], "categories": [{"id": "a", "name": "炊具"}, {"id": "b", "name": "行装"}, {"id": "c", "name": "照明"}, {"id": "d", "name": "清洁"}], "capacity": 4, "revision": "l6-059", "worldScale": 2.15, "layout": {"a1": {"x": 65.0, "y": 199, "size": 91, "angle": 11, "z": 201}, "a2": {"x": 210.0, "y": 175, "size": 83, "angle": -16, "z": 202}, "a3": {"x": 355.0, "y": 199, "size": 91, "angle": -7, "z": 203}, "a4": {"x": 500.0, "y": 175, "size": 83, "angle": 2, "z": 204}, "a5": {"x": 645.0, "y": 199, "size": 91, "angle": 11, "z": 205}, "b1": {"x": 77.0, "y": 409, "size": 91, "angle": -14, "z": 221}, "b2": {"x": 222.0, "y": 385, "size": 83, "angle": -5, "z": 222}, "b3": {"x": 367.0, "y": 409, "size": 91, "angle": 4, "z": 223}, "b4": {"x": 512.0, "y": 385, "size": 83, "angle": 13, "z": 224}, "b5": {"x": 657.0, "y": 409, "size": 91, "angle": -14, "z": 225}, "c1": {"x": 87.0, "y": 197, "size": 76, "angle": 4, "z": 541}, "c2": {"x": 232.0, "y": 173, "size": 76, "angle": -4, "z": 542}, "c3": {"x": 377.0, "y": 197, "size": 76, "angle": -12, "z": 543}, "c4": {"x": 415, "y": 280, "size": 76, "angle": -20, "z": 544}, "c5": {"x": 525, "y": 280, "size": 76, "angle": -28, "z": 545}, "d1": {"x": 99.0, "y": 407, "size": 76, "angle": 4, "z": 561}, "d2": {"x": 244.0, "y": 383, "size": 76, "angle": -4, "z": 562}, "d3": {"x": 389.0, "y": 407, "size": 76, "angle": -12, "z": 563}, "d4": {"x": 415, "y": 315, "size": 76, "angle": -20, "z": 564}, "d5": {"x": 525, "y": 315, "size": 76, "angle": -28, "z": 565}}, "artOverrides": {"a1": "./art-059/l6/a1.svg", "a2": "./art-059/l6/a2.svg", "a3": "./art-059/l6/a3.svg", "a4": "./art-059/l6/a4.svg", "a5": "./art-059/l6/a5.svg", "b1": "./art-059/l6/b1.svg", "b2": "./art-059/l6/b2.svg", "b3": "./art-059/l6/b3.svg", "b4": "./art-059/l6/b4.svg", "b5": "./art-059/l6/b5.svg", "c1": "./art-059/l6/c1.svg", "c2": "./art-059/l6/c2.svg", "c3": "./art-059/l6/c3.svg", "c4": "./art-059/l6/c4.svg", "c5": "./art-059/l6/c5.svg", "d1": "./art-059/l6/d1.svg", "d2": "./art-059/l6/d2.svg", "d3": "./art-059/l6/d3.svg", "d4": "./art-059/l6/d4.svg", "d5": "./art-059/l6/d5.svg"}, "starStores": 3, "minimumPeak": 3, "winPath": ["c1", "a1", "c2", "a2", "c3", "a3", "a4", "a5", "c4", "c5", "d1", "d2", "d3", "d4", "d5", "b1", "b2", "b3", "b4", "b5"], "losePath": ["c1", "c2", "c3", "d1", "d2"]});
for(const i of levels.find(l=>l.id==='l4').items)i.name={"a1": "扳手", "a2": "羊角锤", "a3": "钳子", "b1": "直尺", "b2": "卷尺", "b3": "水平尺", "c1": "螺丝", "c2": "螺母", "c3": "螺栓", "d1": "工具盒", "d2": "擦拭布", "d3": "胶带"}[i.id];
for(const i of levels.find(l=>l.id==='l5').items)i.name={"a1": "圆花盆", "a2": "方花盆", "a3": "育苗盘", "a4": "陶花盆", "b1": "向日葵种子", "b2": "豌豆种子", "b3": "番茄种子", "b4": "生菜种子", "c1": "小铲子", "c2": "修枝剪", "c3": "园艺手套", "c4": "喷壶", "d1": "纸箱", "d2": "空塑料瓶", "d3": "纸袋", "d4": "标签卡"}[i.id];
for(const i of levels.find(l=>l.id==='l6').items)i.name={"a1": "水壶", "a2": "平底锅", "a3": "饭碗", "a4": "汤锅", "a5": "锅铲", "b1": "背包", "b2": "遮阳帽", "b3": "登山鞋", "b4": "防潮垫", "b5": "绳圈", "c1": "手电筒", "c2": "营地灯", "c3": "备用电池", "c4": "灯串", "c5": "头灯", "d1": "清洁刷", "d2": "毛巾", "d3": "垃圾袋", "d4": "清洁皂", "d5": "水桶"}[i.id];
function deepFreeze(o){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);return o;}
const LEVELS=deepFreeze(levels);
const getLevel=id=>LEVELS.find(l=>l.id===id);
return {sprites,selections,spritePath,LEVELS,getLevel};})();
const __module7=(()=>{
function createState(level){return {levelId:level.id,phase:'playing',locations:Object.fromEntries(level.items.map(i=>[i.id,'board'])),active:level.categories.slice(0,2).map(c=>c.id),next:2,buffer:[],events:[],history:[],attempts:0,moves:0};}
function count(level,s,category){return level.items.filter(i=>i.category===category&&s.locations[i.id]==='sorted').length;}
function blocked(level,s,id){const item=level.items.find(i=>i.id===id);return item?item.blockedBy.filter(b=>s.locations[b]==='board'):[];}
function settle(level,s){
let changed=true;
while(changed){
changed=false;
for(const id of [...s.buffer]){
const item=level.items.find(i=>i.id===id);
if(s.active.includes(item.category)){s.buffer=s.buffer.filter(b=>b!==id);s.locations[id]='sorted';s.events.push({type:'drain',id});changed=true;}
}
s.active=s.active.flatMap(category=>{
if(count(level,s,category)!==level.items.filter(i=>i.category===category).length)return [category];
changed=true;if(s.next<level.categories.length){const next=level.categories[s.next++].id;s.events.push({type:'open',category:next});return [next];}return [];
});
}
if(level.items.every(i=>s.locations[i.id]==='sorted')&&s.buffer.length===0){s.phase='won';s.events.push({type:'win'});}
}
function finish(previous,s,id){
s.attempts++;
s.history=[...previous.history,{step:s.attempts,id,events:structuredClone(s.events),before:{buffer:[...previous.buffer],active:[...previous.active]},after:{buffer:[...s.buffer],active:[...s.active],phase:s.phase}}].slice(-5);
return s;
}
function take(level,previous,id){
if(previous.levelId!==level.id)throw Error('Level/state mismatch');
const s=structuredClone(previous);s.events=[];
if(s.phase!=='playing')return s;
const item=level.items.find(i=>i.id===id);if(!item||s.locations[id]!=='board')return s;
const blockers=blocked(level,s,id);
if(blockers.length){s.events.push({type:'blocked',id,blockers});return finish(previous,s,id);}
s.moves++;
if(s.active.includes(item.category)){s.locations[id]='sorted';s.events.push({type:'sort',id});}
else if(s.buffer.length>=level.capacity){s.phase='lost';s.events.push({type:'overflow',id});return finish(previous,s,id);}
else{s.locations[id]='buffer';s.buffer.push(id);s.events.push({type:'store',id});}
settle(level,s);return finish(previous,s,id);
}
function unlockHelp(level,previous){
if(previous.levelId!==level.id)throw Error('Level/state mismatch');
if(previous.phase!=='playing'||previous.helpUnlocked||previous.next>=level.categories.length)return previous;
const s=structuredClone(previous),category=level.categories[s.next++].id;
s.helpUnlocked=true;s.events=[{type:'help',category}];s.active.push(category);
settle(level,s);return s;
}
return {createState,count,blocked,take,unlockHelp};})();
const __module3=(()=>{
const {LEVELS,getLevel}=__module4;
const {createState,take,unlockHelp}=__module7;
const PROGRESS_KEY='ssjwl.progress.v1';
function replay(id,actions){const l=getLevel(id);if(!l||!Array.isArray(actions)||actions.length>256)throw Error('Invalid progress');let state=createState(l),peak=0,stores=0;for(const a of actions){if(state.phase!=='playing')throw Error('Action after end');if(a==='help'){const next=unlockHelp(l,state);if(next===state)throw Error('Invalid help');state=next;}else{if(typeof a!=='string'||!l.items.some(i=>i.id===a)||state.locations[a]!=='board')throw Error('Invalid item');state=take(l,state,a);if(state.events[0]?.type==='store')stores++;}peak=Math.max(peak,state.buffer.length);}return {state,peak,stores};}
function readProgress(storage){try{const raw=storage.getItem(PROGRESS_KEY);if(raw===null)return {status:'empty'};if(raw.length>50000)throw Error();const x=JSON.parse(raw);if(x.version!==1||x.revision!=='057'||!Array.isArray(x.completed)||x.completed.length>LEVELS.length)throw Error();if(x.current.elapsedMs!==undefined&&(!Number.isFinite(x.current.elapsedMs)||x.current.elapsedMs<0||x.current.elapsedMs>604800000))throw Error();if(x.current.timeKnown!==undefined&&typeof x.current.timeKnown!=='boolean')throw Error();const current=replay(x.current.id,x.current.actions),ids=new Set();for(const c of x.completed){if(ids.has(c.id)||replay(c.id,c.actions).state.phase!=='won')throw Error();ids.add(c.id);}return {status:'ok',data:x,current};}catch{return {status:'unavailable',message:'进度暂时无法读取，原数据已保留；本次可继续试玩。可到首页确认重置进度。'};}}
function writeProgress(storage,current,completed){const x={version:1,revision:'057',current,completed};replay(current.id,current.actions);for(const c of completed)if(replay(c.id,c.actions).state.phase!=='won')throw Error('Invalid completion');try{storage.setItem(PROGRESS_KEY,JSON.stringify(x));return true;}catch{return false;}}
return {PROGRESS_KEY,replay,readProgress,writeProgress};})();
const __module9=(()=>{
const VOICE_FILES={intro:'./audio-052/voice-intro.mp3',box:'./audio-052/voice-box.mp3',win:'./audio-052/voice-win.mp3',intro2:'./audio-054/voice-intro2.mp3',intro3:'./audio-054/voice-intro3.mp3',box2:'./audio-054/voice-box2.mp3',box3:'./audio-054/voice-box3.mp3',win2:'./audio-054/voice-win2.mp3',win3:'./audio-054/voice-win3.mp3'};
const VOICE_POOLS={intro:['intro','intro2','intro3'],box:['box','box2','box3'],win:['win','win2','win3']};
class VoiceLane{
constructor(owner){this.owner=owner;this.run=0;this.seen=new Set();this.queue=[];this.current=null;this.buffers=null;this.loading=null;this.error='';this.history=[];this.serial=0;this.lastVariant={};this.bags={};}
record(type,detail={}){this.history.push({type,run:this.run,t:performance.now(),...detail});if(this.history.length>160)this.history.shift();}
begin(run){this.cancel('new-run');this.run=run;this.seen.clear();}
enabled(){const o=this.owner;return o.prefs.voiceOn&&o.prefs.voiceVolume>0;}
async load(retry=false){
if(this.buffers||this.loading||!this.owner.ctx||(this.error&&!retry))return this.loading;
this.loading=(async()=>{try{const rows=await Promise.all(Object.entries(VOICE_FILES).map(async([name,path])=>{return [name,await this.owner.ctx.decodeAudioData(await this.owner.bytes(path))];}));this.buffers=Object.fromEntries(rows);this.error='';this.pump();}catch{for(const path of Object.values(VOICE_FILES))this.owner.byteCache?.delete(path);this.error='人声加载失败，点开启 / 继续声音重试';}finally{this.loading=null;this.owner.notify();}})();return this.loading;
}
say(kind,key,run=this.run){
if(run!==this.run||!VOICE_POOLS[kind]||this.seen.has(key))return false;
this.seen.add(key);
if(kind==='win')this.queue=this.queue.filter(x=>x.kind!=='intro');
if(!this.enabled()||document.hidden||this.owner.backgrounded){this.record('skipped',{kind,key});return false;}
this.queue.push({kind,key,run});this.record('queued',{kind,key});this.pump();return true;
}
pick(kind){
let bag=this.bags[kind];
if(!bag?.length){bag=[...VOICE_POOLS[kind]];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag[0]===this.lastVariant[kind])[bag[0],bag[1]]=[bag[1],bag[0]];this.bags[kind]=bag;}
const variant=bag.shift();this.lastVariant[kind]=variant;return variant;
}
pump(){
const o=this.owner;if(this.current||!this.buffers||!o.activated||!this.enabled()||document.hidden||o.backgrounded||o.ctx?.state!=='running')return;
const cue=this.queue.shift();if(!cue)return;if(cue.run!==this.run){this.pump();return;}
const variant=this.pick(cue.kind),source=o.ctx.createBufferSource(),serial=++this.serial;source.buffer=this.buffers[variant];source.connect(o.voiceGain);this.current={...cue,variant,source,serial};o.applyGains();this.record('started',{kind:cue.kind,key:cue.key,variant,duration:source.buffer.duration,contextTime:o.ctx.currentTime});
source.onended=()=>{source.disconnect();if(this.current?.serial!==serial)return;this.current=null;this.record('ended',{kind:cue.kind,key:cue.key});o.applyGains();o.notify();this.pump();};source.start();o.notify();
}
cancel(reason){this.queue=[];const old=this.current;this.current=null;++this.serial;if(old){old.source.onended=null;try{old.source.stop();}catch{}old.source.disconnect();this.record('cancelled',{kind:old.kind,key:old.key,reason});}this.owner.applyGains();}
snapshot(){return {ready:!!this.buffers,error:this.error,run:this.run,instances:this.current?1:0,current:this.current?{kind:this.current.kind,key:this.current.key,variant:this.current.variant}:null,queue:this.queue.map(({kind,key,run})=>({kind,key,run})),durations:this.buffers?Object.fromEntries(Object.entries(this.buffers).map(([k,v])=>[k,v.duration])):{},history:this.history.map(x=>({...x}))};}
}
return {VOICE_FILES,VOICE_POOLS,VoiceLane};})();
const __module8=(()=>{
const {VoiceLane,VOICE_FILES}=__module9;
const DEFAULT={musicOn:true,sfxOn:true,musicVolume:.45,sfxVolume:.30,voiceOn:true,voiceVolume:.80};
const KEY='ssjwl-audio-v1';
const MUSIC_PATH='./audio-050/carefree-loop.mp3',MUSIC_LOOP_SECONDS=40;
class GameAudio{
constructor(){
this.prefs={...DEFAULT};try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d){for(const k of ['musicOn','sfxOn','voiceOn'])if(typeof d[k]==='boolean')this.prefs[k]=d[k];for(const k of ['musicVolume','sfxVolume','voiceVolume'])if(Number.isFinite(d[k]))this.prefs[k]=Math.max(0,Math.min(1,d[k]));if(!('voiceOn' in d)&&(d.musicOn===false||d.musicVolume===0)&&(d.sfxOn===false||d.sfxVolume===0))this.prefs.voiceOn=false;}}catch{}
this.ctx=null;this.ready=false;this.activated=false;this.loading=null;this.bgm=null;this.offset=0;this.startedAt=0;this.sounds=new Set();this.starts=0;this.plays={};this.error='';this.notify=()=>{};this.backgrounded=document.hidden;this.voice=new VoiceLane(this);this.byteCache=new Map();
document.addEventListener('visibilitychange',()=>this.visibility());
window.addEventListener('blur',()=>{this.backgrounded=true;this.visibility();});
window.addEventListener('focus',()=>{this.backgrounded=document.hidden;this.visibility();});
}
async bytes(path){
if(!this.byteCache.has(path)){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);const task=fetch(path,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('audio unavailable');return r.arrayBuffer();}).finally(()=>clearTimeout(timer));this.byteCache.set(path,task);void task.catch(()=>{if(this.byteCache.get(path)===task)this.byteCache.delete(path);});}
return (await this.byteCache.get(path)).slice(0);
}
preload(){return Promise.allSettled([MUSIC_PATH,...['sort','store','warning','victory'].map(n=>`../baseline/audio/${n}.wav`),...Object.values(VOICE_FILES)].map(path=>this.bytes(path)));}
activate(retryVoice=false){if(this.activating)return retryVoice?this.activating.then(()=>this.voice.load(true)):this.activating;const task=this.activateNow(retryVoice);this.activating=task;return task.finally(()=>{if(this.activating===task)this.activating=null;});}
async activateNow(retryVoice=false){
this.activated=true;this.notify();if(this.loading)return this.loading;
if(!document.hidden)this.backgrounded=false;
if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context){this.error='此浏览器暂不支持声音';this.notify();return;}this.ctx=new Context();this.ctx.addEventListener('statechange',()=>this.notify());this.musicGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();this.voiceGain=this.ctx.createGain();this.voiceGain.connect(this.ctx.destination);this.musicGain.connect(this.ctx.destination);this.sfxGain.connect(this.ctx.destination);this.applyGains();}
try{if(!document.hidden)await this.ctx.resume();}catch{this.error='请再次点声音按钮';this.notify();return;}
void this.voice.load(retryVoice);this.voice.pump();if(this.ready){this.sync();return;}
this.loading=(async()=>{
try{
const entries=await Promise.all(['tidy-loop','sort','store','warning','victory'].map(async name=>{return [name,await this.ctx.decodeAudioData(await this.bytes(name==='tidy-loop'?MUSIC_PATH:`../baseline/audio/${name}.wav`))];}));
this.buffers=Object.fromEntries(entries);this.ready=true;this.error='';this.sync();
}catch{for(const path of [MUSIC_PATH,...['sort','store','warning','victory'].map(n=>`../baseline/audio/${n}.wav`)])this.byteCache.delete(path);this.error='声音加载失败，点此重试';}finally{this.loading=null;this.notify();}
})();return this.loading;
}
applyGains(){if(!this.ctx)return;const duck=!!this.voice?.current;this.musicGain.gain.setTargetAtTime(this.prefs.musicOn?this.prefs.musicVolume*(duck ? .28 : 1):0,this.ctx.currentTime,.025);this.sfxGain.gain.setTargetAtTime(this.prefs.sfxOn?this.prefs.sfxVolume*(duck ? .6 : 1):0,this.ctx.currentTime,.015);this.voiceGain.gain.setValueAtTime(this.prefs.voiceOn?this.prefs.voiceVolume:0,this.ctx.currentTime);}
beginRun(run){this.voice.begin(run);}
narrate(kind,key,run){return this.voice.say(kind,key,run);}
stopVoice(reason){this.voice.cancel(reason);}
set(key,value){if(!(key in DEFAULT))return;this.prefs[key]=typeof DEFAULT[key]==='boolean'?!!value:Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem(KEY,JSON.stringify(this.prefs));}catch{}if(!this.prefs.voiceOn||this.prefs.voiceVolume===0)this.voice.cancel('muted');this.applyGains();this.sync();this.voice.pump();this.notify();}
stop(){if(!this.bgm)return;this.offset=(this.offset+this.ctx.currentTime-this.startedAt)%Math.min(MUSIC_LOOP_SECONDS,this.buffers['tidy-loop'].duration);this.bgm.stop();this.bgm.disconnect();this.bgm=null;}
sync(){
if(!this.ready||!this.activated||document.hidden||this.backgrounded||!this.prefs.musicOn||this.prefs.musicVolume===0||this.ctx.state!=='running'){this.stop();return;}
if(this.bgm)return;
const source=this.ctx.createBufferSource();source.buffer=this.buffers['tidy-loop'];source.loop=true;source.loopEnd=Math.min(MUSIC_LOOP_SECONDS,source.buffer.duration);source.connect(this.musicGain);source.start(0,this.offset);this.startedAt=this.ctx.currentTime;this.bgm=source;this.starts++;this.notify();
}
play(kind,group=null){
if(!this.ready||document.hidden||this.backgrounded||!this.prefs.sfxOn||this.prefs.sfxVolume===0||this.ctx.state!=='running')return {played:false};
const source=this.ctx.createBufferSource();source.buffer=this.buffers[kind];if(!source.buffer)return {played:false};
source.feedbackGroup=group;source.connect(this.sfxGain);this.plays[kind]=(this.plays[kind]||0)+1;this.sounds.add(source);source.onended=()=>{this.sounds.delete(source);source.disconnect();};source.start();return {played:true,audioTime:this.ctx.currentTime,performanceTime:performance.now()};
}
stopGroup(group){for(const source of this.sounds)if(source.feedbackGroup===group){source.stop();source.disconnect();this.sounds.delete(source);}}
async visibility(){
if(!this.ctx)return;
if(document.hidden||this.backgrounded){this.voice.cancel('background');this.stop();for(const s of this.sounds)s.stop();await this.ctx.suspend();this.notify();}
else if(this.activated){try{await this.ctx.resume();this.sync();this.notify();}catch{this.error='点声音按钮继续播放';this.notify();}}
}
snapshot(){return {prefs:{...this.prefs},ready:this.ready,activated:this.activated,backgrounded:this.backgrounded,contextState:this.ctx?.state||'none',bgmInstances:this.bgm?1:0,sfxInstances:this.sounds.size,bgmStarts:this.starts,musicPath:MUSIC_PATH,loopSeconds:MUSIC_LOOP_SECONDS,decodedMusicSeconds:this.buffers?.['tidy-loop']?.duration||0,sfxPlays:{...this.plays},offset:this.offset,error:this.error,voice:this.voice.snapshot(),mixGains:this.ctx?{music:this.musicGain.gain.value,sfx:this.sfxGain.gain.value,voice:this.voiceGain.gain.value}:null};}
}
return {GameAudio};})();
const __module10=(()=>{
const containerKind=(level,id)=>level.id==='l2'?({toy:'paper',cat:'tools',daily:'daily',recycle:'recycle'}[id]):id;
function containerHTML(level,category,n,total,uid){
const kind=containerKind(level,category.id),front=true;
return `<div class="bin ${front?'l1-front-bin':''}" data-category="${category.id}" data-kind="${kind}" data-state="${n===total?'full':n?'collecting':'empty'}" aria-label="${category.name}，${n} / ${total}"><img class="container-art" src="${front?'./art-047/storage-front.svg':'./art-046/storage-box.webp'}" alt="" draggable="false"><span class="bin-mouth" aria-hidden="true"></span><div class="bin-label"><b>${category.name}</b><span class="bin-count">${n} / ${total}</span></div><span class="bin-complete" aria-hidden="true">收好 ✓</span></div>`;
}
function lockedPlaceholderHTML(enabled=true){return `<button type="button" class="l1-front-bin locked-placeholder" ${enabled?'':'disabled'} aria-label="第三箱已锁，测试帮助，不播放广告"><img class="container-art" src="./art-047/storage-front.svg" alt="" draggable="false"><span class="bin-label"><b>第三箱 · 已锁</b><span class="bin-count">测试帮助</span></span></button>`;}
function finishedPlaceholderHTML(help=true){return `<div class="l1-front-bin locked-placeholder" aria-label="本局收纳箱已收好"><img class="container-art" src="./art-047/storage-front.svg" alt=""><span class="bin-label"><b>收好 ✓</b><span class="bin-count">${help?'本局帮助已开启':'分类已归位'}</span></span></div>`;}
return {containerKind,containerHTML,lockedPlaceholderHTML,finishedPlaceholderHTML};})();
const __module12=(()=>{
const sample={"d5":"d5-towel","c4":"c4-bowl","r3":"r3-paperbag","c1":"c1-catfood","c3":"c3-scratcher","t4":"t4-pinwheel","r2":"r2-bottle","d4":"d4-umbrella","t2":"t2-blocks","t5":"t5-car","c5":"c5-yarn","t3":"t3-top","r4":"r4-newspaper","c2":"c2-wand","d3":"d3-glove","r1":"r1-box","d1":"d1-mug","d2":"d2-clock","r5":"r5-can","t1":"t1-train"};
const office={t1:'notebook',t2:'folder',t3:'notebook',c1:'pencil-cup',c2:'cable',c5:'headphones'};
const spritePath=(id,level)=>level.artOverrides?.[id]?.includes('art-059')?level.artOverrides[id]:level.id==='l3'?`./art-051/${id}.webp`:level.id==='l2'&&office[id]?`./art-050/${office[id]}.webp`:`./art-046/${sample[id]}.webp`;
const scenePath=(level,wide=false)=>level.worldScale?`./art-059/${level.id}/scene.svg`:level.id==='l1'?`./art-046/living${wide?'-wide':''}.webp`:`./art-050/${level.scene}${wide?'-wide':''}.webp`;
const requiredAssets=(level,wide)=>[...new Set([...level.items.map(i=>spritePath(i.id,level)),scenePath(level,wide),'./art-047/storage-front.svg'])];
const extraAssets=['desk','moving','desk-wide','moving-wide',...new Set(Object.values(office))].map(name=>`mvp/art-050/${name}.webp`).concat(['living','living-wide',...Object.values(sample)].map(name=>`mvp/art-046/${name}.webp`)).concat(['mvp/art-047/storage-front.svg']);
function sceneFrame(width,height){return {x:0,y:0,width,height,wide:width>height};}
const expansionAssets=['l4','l5','l6'].flatMap(id=>[`mvp/art-059/${id}/scene.svg`]);
return {spritePath,scenePath,requiredAssets,extraAssets,sceneFrame,expansionAssets};})();
const __module13=(()=>{
function livingFrame(width,height){
const wide=width>height,sourceWidth=wide?1536:1024,top=wide?460:620;
return {wide,top:top/sourceWidth*width,bottom:100/sourceWidth*width,
src:`./art-046/living${wide?'-wide':''}.webp`,sourceWidth};
}
const clusters=[
[68,218,0,[['t1',-12,8],['r1',8,-1]]], // sofa toy spill
[274,223,0,[['d1',-6,-1],['r3',-1,1]]], // cabinet-side mug/bag pile
[144,278,.10,[['t2',-9,5],['r2',-2,-1]]],
[39,289,.08,[['t5',0,0]]],
[82,337,.18,[['t4',0,0]]],
[148,346,.18,[['t3',0,0]]],
[264,316,.18,[['d2',-8,1],['r4',-1,5]]],
[42,396,.85,[['d4',0,0]]], // cleaning things by the near edge
[48,445,.85,[['d3',0,0]]],
[219,439,.85,[['c3',0,0]]], // pet play/feeding corner; clear edges, no false covers
[135,441,.85,[['c2',0,0]]],
[294,442,.85,[['c4',0,0]]],
[309,369,.85,[['c1',0,0]]],
[223,387,.85,[['c5',0,0]]],
[205,240,.05,[['r5',0,0]]]
];
const wideAnchors=[
[.12,0],[.75,0],[.46,0],[.10,.49],[.25,.44],
[.40,.55],[.60,.49],[.08,1],[.27,1],[.45,1],
[.62,1],[.82,1],[.81,.44],[.94,.53],[.94,.02]
];
function fitLiving(level,width,height){
const s=Math.min(width/360,height/405,1.2),wide=width>height,out={};
const bodyScale={t4:1.03,d4:1.08,d5:1.035,c2:1.05,c3:1.015,c5:1.045,r2:1.02};
const place=(id,x,y)=>{const p=level.layout[id];out[id]={x,y,size:p.size*s*(bodyScale[id]||1),angle:id==='c2'?30:0,z:p.z};};
place('d5',width*(wide?.455:.385),width*(wide?.180:.325));
const plane=width/348,extra=height-451*plane;
const top=width*.27+58*s,bottom=height-15*s;
clusters.forEach(([x,y,depth,objects],n)=>{
const a=wide?wideAnchors[n]:null;
for(const [id,dx,dy] of objects)place(id,(wide?a[0]*width:x*plane)+dx*s,(wide?top+a[1]*(bottom-top):y*plane+depth*extra)+dy*s);
});
return out;
}
return {livingFrame,fitLiving};})();
const __module11=(()=>{
const {sceneFrame}=__module12;
const {fitLiving}=__module13;
function fitLayout(level,width,height){if(level.worldScale)return Object.fromEntries(level.items.map(i=>{const p=level.layout[i.id],k=width/720;return [i.id,{...p,x:p.x*k,y:70+(p.y/456)*(height-75),size:Math.max(48,Math.min(p.size*Math.min(width/720,1.15),(height-20)/3))}];}));return level.id==='l1'?fitLiving(level,width,height):fitScene(level,width,height);}
const scenes={
l2:[
[.28,.47,[['t1',-6,7,100,-7],['r1',14,-2,77,2]]],
[.73,.48,[['d1',-13,0,82,-4],['c1',19,4,92,2]]],
[.14,.67,[]],
[.46,.61,[['t3',0,0,86,8]]],
[.83,.69,[['r3',0,0,67,-6]]],
[.26,.86,[['t2',-35,-14,96,-12],['d2',-11,0,81,4],['c2',12,4,107,7]]],
[.66,.86,[['r2',-9,0,73,9],['c5',15,5,82,-5]]],
[.91,.85,[['d3',0,0,49,-15]]]
],
l3:[
[.21,.50,[['t1',-9,5,86,-8],['r1',15,-6,87,3]]],
[.79,.49,[['t2',-9,-3,77,9],['r2',13,9,69,14]]],
[.49,.51,[['t3',0,0,48,-17]]],
[.30,.69,[['d1',-8,0,79,-6],['c1',10,-3,59,9]]],
[.10,.70,[['d5',0,0,49,-14]]],
[.87,.655,[['t5',0,0,51,9]]],
[.58,.78,[['d2',-8,2,78,8],['c2',9,-2,88,5]]],
[.85,.85,[['r3',-7,3,78,-8],['c4',9,-3,75,-4]]],
[.28,.94,[['r4',-9,5,83,-12],['c5',10,-2,61,0]]],
[.62,.97,[['d3',0,0,52,-22]]]
]
};
function fitScene(level,width,height){
const f=sceneFrame(width,height);if(f.wide)return fitWide(level,width,height);const scale=Math.min(width/360,height/405,1.2),out={};
const top=f.width*(level.id==='l2'?.39:.43)+96*scale;
const bottom=Math.min(level.id==='l2'?height-.135*(1619/971)*f.width:height-22*scale,top+260*scale);
const lo=level.id==='l2'?.47:.45,hi=level.id==='l2'?.86:.97;
for(const [x,y,objects] of scenes[level.id])for(const [id,dx,dy,size,angle] of objects){
out[id]={x:f.x+x*f.width+dx*scale,y:top+(y-lo)/(hi-lo)*(bottom-top)+dy*scale,size:Math.max(size,level.layout[id].size)*scale,angle,z:level.layout[id].z};
}
if(level.id!=='l1')for(const [id,p] of Object.entries(out)){p.angle+=((id.charCodeAt(0)+Number(id.slice(1)))%3-1)*5;}return out;
}
const wideAnchors={
l2:[[.20,.51],[.68,.51],[.43,.63],[.43,.84],[.88,.62],[.20,.81],[.66,.83],[.92,.86]],
l3:[[.18,.55],[.81,.55],[.64,.96],[.49,.55],[.35,.96],[.92,.97],[.55,.77],[.87,.78],[.22,.77],[.09,.97]]
};
function fitWide(level,width,height){
const scale=Math.min(width/360,height/405,1.2),out={};
scenes[level.id].forEach(([, ,objects],n)=>{const [x,y]=wideAnchors[level.id][n];for(const [id,dx,dy,size,angle] of objects)out[id]={x:x*width+dx*scale,y:y*height+dy*scale,size:Math.max(size,level.layout[id].size)*scale,angle,z:level.layout[id].z};});
if(level.id!=='l1')for(const [id,p] of Object.entries(out)){p.angle+=((id.charCodeAt(0)+Number(id.slice(1)))%3-1)*5;}return out;
}
return {fitLayout};})();
const __module14=(()=>{
const pockets=Object.freeze({
c2:Object.freeze({cx:.50,cy:.45,rx:.31,ry:.20,maxDistance:24}),
c5:Object.freeze({cx:.50,cy:.49,rx:.23,ry:.20,maxDistance:20})
});
const movingShears=Object.freeze({cx:.50,cy:.53,rx:.15,ry:.16,maxDistance:8});
const pocketFor=(level,id)=>level==='l2'?pockets[id]:level==='l3'&&id==='c5'?movingShears:null;
function inPocket(level,id,u,v){const p=pocketFor(level,id);return !!p&&((u-p.cx)/p.rx)**2+((v-p.cy)/p.ry)**2<=1;}
function distanceToAlpha(mask,u,v,size,limit){
const px=u*128,py=v*128,r=limit/size*128;let best=Infinity;
for(let y=Math.max(0,Math.floor(py-r));y<Math.min(128,Math.ceil(py+r));y++)for(let x=Math.max(0,Math.floor(px-r));x<Math.min(128,Math.ceil(px+r));x++){
if(mask[(y*128+x)*4+3]<128)continue;const d=Math.hypot(x+.5-px,y+.5-py)*size/128;if(d<best)best=d;
}return best<=limit?best:Infinity;
}
return {pockets,pocketFor,inPocket,distanceToAlpha};})();
const __module15=(()=>{
class AssetLoader {
constructor(){this.cache=new Map();}
async image(path,signal){
if(signal.aborted)throw new DOMException('Cancelled','AbortError');
if(this.cache.has(path))return this.cache.get(path);
const img=new Image();
await new Promise((resolve,reject)=>{
let done=false;
const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);img.onload=img.onerror=null;if(error){img.removeAttribute('src');reject(error);}else resolve();};
const abort=()=>finish(new DOMException('Cancelled','AbortError'));
const timer=setTimeout(()=>finish(new Error('Image timeout: '+path)),15000);
signal.addEventListener('abort',abort,{once:true});
img.onerror=()=>finish(new Error('Image unavailable: '+path));
img.onload=async()=>{try{await img.decode();if(signal.aborted)abort();else finish();}catch{finish(new Error('Image decode failed: '+path));}};
img.src=path;
});
if(signal.aborted)throw new DOMException('Cancelled','AbortError');
this.cache.set(path,img);return img;
}
}
return {AssetLoader};})();
const __module16=(()=>{
const recordKey=level=>`ssjwl.best-peak.v1.${level.id}.${level.revision||'original'}`;
const valid=(value,capacity)=>Number.isInteger(value)&&value>=0&&value<=capacity;
function readBest(level,storage){
let raw;
try{raw=storage.getItem(recordKey(level));}catch{return {best:null,available:false};}
if(raw===null||raw.length>256)return {best:null,available:true};
try{const record=JSON.parse(raw);return {best:record?.version===1&&valid(record.bestPeak,level.capacity)?record.bestPeak:null,available:true};}
catch{return {best:null,available:true};}
}
function saveBest(level,peak,storage){
if(!valid(peak,level.capacity))throw new RangeError('Invalid completed route peak');
const previous=readBest(level,storage),best=previous.best===null?peak:Math.min(peak,previous.best);
const result={best,previous:previous.best,first:previous.best===null,improved:previous.best!==null&&peak<previous.best,saved:false};
if(!previous.available)return result;
try{storage.setItem(recordKey(level),JSON.stringify({version:1,bestPeak:best}));result.saved=true;}catch{}
return result;
}
return {recordKey,readBest,saveBest};})();
const __module17=(()=>{
const starBudget=level=>({three:level.minimumPeak,two:Math.min(level.capacity,level.minimumPeak+1),stores:level.starStores??(level.id==='l3'?4:2)});
function rateRoute(level,peak,stores=0){
if(!Number.isInteger(peak)||peak<0||peak>level.capacity)throw new RangeError('Invalid route peak');
if(!Number.isInteger(stores)||stores<0||stores>level.items.length)throw new RangeError('Invalid route stores');
const b=starBudget(level),stars=peak<=b.three&&stores<=b.stores?3:peak<=b.two&&stores<=b.stores+1?2:1;
return {stars,peak,storeCount:stores,...b,reason:`最高暂存${peak}格，共暂存${stores}件。三星：峰值≤${b.three}格且件数≤${b.stores}；二星：峰值≤${b.two}格且件数≤${b.stores+1}；其余通关一星。`};
}
const starKey=(l,help)=>`ssjwl.stars.v1.${l.id}.${l.revision||'original'}.${help?'help':'free'}`;
function readStars(l,help,storage){try{const raw=storage.getItem(starKey(l,help));if(raw?.length>256)return null;const x=JSON.parse(raw);return x?.version===1&&Number.isInteger(x.stars)&&x.stars>=1&&x.stars<=3?x.stars:null;}catch{return null;}}
function saveStars(l,help,stars,storage){
if(!Number.isInteger(stars)||stars<1||stars>3)throw new RangeError('Invalid stars');
try{const raw=storage.getItem(starKey(l,help));const best=Math.max(stars,readStars(l,help,{getItem:()=>raw})||0);storage.setItem(starKey(l,help),JSON.stringify({version:1,stars:best}));return {best,saved:true};}catch{return {best:stars,saved:false};}
}
return {starBudget,rateRoute,starKey,readStars,saveStars};})();
const __module0=(()=>{
const {installSceneGestures}=__module1;
const {PlayClock,formatTime}=__module2;
const {readProgress,writeProgress,replay,PROGRESS_KEY}=__module3;
const {LEVELS,getLevel,sprites,selections}=__module4;
const {createState,take,blocked,count,unlockHelp}=__module7;
const {GameAudio}=__module8;
const {containerHTML,lockedPlaceholderHTML,finishedPlaceholderHTML}=__module10;
const {fitLayout}=__module11;
const {livingFrame}=__module13;
const {spritePath,scenePath,sceneFrame,requiredAssets}=__module12;
const {pocketFor,inPocket,distanceToAlpha}=__module14;
const {AssetLoader}=__module15;
const {readBest,saveBest}=__module16;
const {rateRoute,starBudget,readStars,saveStars}=__module17;
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const playClock=new PlayClock();let timeKnown=true;function timeActive(){return entered&&ready&&state.phase==='playing'&&!document.hidden&&!menusOpen();}
let entered=false,journal=[],completedJournals=new Map(),saveAllowed=true;
function persistProgress(){if(!saveAllowed)return;const ok=writeProgress(localRecords(),{id:level.id,actions:[...journal],elapsedMs:playClock.update(timeActive()),timeKnown},[...completedJournals].map(([id,actions])=>({id,actions})));$('#save-status').textContent=ok?'进度已保存在本机':'无法保存进度，请保持页面打开；旧记录未主动清除。';}
function recordAction(action){journal.push(action);persistProgress();}
let level=LEVELS[0],state=createState(level),busy=false,epoch=0,ready=false,lastHit=null,pendingResult=false,viewingRoom=false;
const masks=new Map(),completed=new Map(),audio=new GameAudio(),assets=new AssetLoader();
let assetEpoch=0,assetKey='',assetController=null,assetState='loading',assetError='',assetPaths=[];const assetWaiters=new Set();
const inputTracing=new URLSearchParams(location.search).has('qa-input'),inputLog=[];
let inputQueue=[],pendingIds=new Set(),activeId=null,runStores=0,runPeak=0,routeResult=null;
let viewLayout={},binView=null,helpToken=null,starResult=null;
const camera=installSceneGestures({viewport:$('.room-viewport'),room:$('.room'),worldScale:()=>level.worldScale||1,canInteract:()=>ready&&!busy&&state.phase==='playing'&&!menusOpen(),onChange:v=>{if($('#camera-status')){$('#camera-status').textContent=`${Math.round(v.z*100)}%`;const w=$('.room-viewport').clientWidth;$('#scene-left').disabled=v.x>=-.5;$('#scene-right').disabled=v.x<=w-w*(level.worldScale||1)*v.z+.5;}}});
const menuWaiters=new Set();
const l1Animations=new Set();let l1SoundEpoch=0;
window.addEventListener('blur',()=>{l1SoundEpoch++;helpToken=null;if($('#help-dialog').open)$('#help-dialog').close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){l1SoundEpoch++;helpToken=null;if($('#help-dialog').open)$('#help-dialog').close();}});
const GUIDE_KEY='ssjwl-guide-v1';let guideDone=false;try{guideDone=localStorage.getItem(GUIDE_KEY)==='done';}catch{}
let guide={active:false,stage:'tap',started:0},guideTimer=null;
function endGuide(){guide.active=false;guideDone=true;try{localStorage.setItem(GUIDE_KEY,'done');}catch{}clearTimeout(guideTimer);refreshGuide();}
function beginGuide(){clearTimeout(guideTimer);guide={active:entered&&level.id==='l1'&&!guideDone,stage:'tap',started:performance.now()};if(guide.active){const token=epoch;guideTimer=setTimeout(()=>{if(epoch===token)refreshGuide();},8100);}refreshGuide();}
function refreshGuide(){
if(guide.active&&((state.moves>=3&&performance.now()-guide.started>=8000)||state.moves>=6||state.phase!=='playing')){endGuide();return;}
const on=guide.active&&entered&&level.id==='l1';$('#guide-copy').hidden=!on;$('#later').hidden=on;$('#guide-skip').hidden=!on;document.querySelectorAll('.guide-focus').forEach(x=>x.classList.remove('guide-focus'));if(!on)return;
$('#guide-copy').textContent=guide.stage==='store'?'暂存格有限，先收当前分类':guide.stage==='sort'?'同类进箱，其余先放暂存格':'轻点露出的物品，自动归类';
if(guide.stage==='store')$('.storage').classList.add('guide-focus');else if(guide.stage==='sort')$('#bins').classList.add('guide-focus');else{const item=level.items.find(i=>state.locations[i.id]==='board'&&!blocked(level,state,i.id).length&&state.active.includes(i.category));if(item)$('#'+item.id)?.classList.add('guide-focus');}
}
function guideEvent(type){if(guide.active&&['sort','store'].includes(type))guide.stage=type;refreshGuide();}
function maybeIntro(){if(entered&&ready)audio.narrate('intro','intro',epoch);}
function enterGame(){if(entered)return;void audio.activate();entered=true;document.documentElement.classList.remove('before-entry');$('#entry').hidden=true;setTimeout(()=>{$('#game').inert=false;$('#level-title').focus({preventScroll:true});},220);try{const target=new URL('./',document.baseURI);const base=document.querySelector('base');if(base)base.href=target.href;if(!location.pathname.endsWith('/mvp/'))history.replaceState(null,'',target.pathname+location.search+location.hash);}catch{}applyLayout();renderBins();beginGuide();maybeIntro();traceInput('entered-room',{moves:state.moves});}
function playCue(kind){return audio.play(kind,'l1-feedback');}
function landingContact(id,kind,token,flight){
if(token!==epoch)return;
const contactAt=performance.now(),allowed=flight?.soundEpoch===l1SoundEpoch;
const sound=allowed?playCue(kind):{played:false};
traceInput('landing-contact',{id,target:kind==='store'?'tray':'mouth',contactAt,durationMs:flight?.durationMs||0,sound,suppressedByBackground:!allowed});
}
function receiverRebound(id,el,token,tray=false){
if(!el||token!==epoch||reduced)return;
const frames=tray?[{transform:'scale(.94)',filter:'drop-shadow(0 0 1px #e2bb7180)'},{offset:.45,transform:'scale(1.06)',filter:'drop-shadow(0 0 2px #e2bb7160)'},{transform:'scale(1)',filter:'none'}]:[{transform:'scale(1,.97)',filter:'drop-shadow(0 0 1px #e2bb7180)'},{offset:.45,transform:'scale(1.018,1.025)',filter:'drop-shadow(0 0 2px #e2bb7160)'},{transform:'scale(1)',filter:'none'}];
traceInput('receiver-rebound-start',{id,target:tray?'tray':'mouth',durationMs:180});
void animateElement(el,frames,180,token).then(()=>traceInput(token===epoch?'receiver-rebound-ended':'receiver-rebound-cancelled',{id,originEpoch:token}));
}
function menusOpen(){return document.querySelector('dialog[open]')||!$('#entry').hidden;}
function resumeQueue(){if(!menusOpen()){for(const done of menuWaiters)done();menuWaiters.clear();}}
async function waitForMenus(token){if(token===epoch&&menusOpen())await new Promise(done=>menuWaiters.add(done));}
function applyLayout(){const board=$('#board'),r={width:board.offsetWidth,height:board.offsetHeight};viewLayout=fitLayout(level,r.width,r.height);for(const [id,p] of Object.entries(viewLayout)){const e=$('#'+id);if(e){e.style.left=p.x+'px';e.style.top=p.y+'px';e.style.width=p.size+'px';e.style.zIndex=p.z;e.firstElementChild.style.transform=`rotate(${p.angle}deg)`;}}if(level.id!=='l1'){const f=sceneFrame(r.width,r.height);const plate=$('#scene-plate');plate.style.left=f.x+'px';plate.style.width=f.width+'px';const top=level.id==='l3'?520:460;plate.style.borderTopWidth=(top/971*f.width)+'px';plate.style.borderImageSlice=top+' 0 170 fill';plate.style.borderBottomWidth=(170/971*f.width)+'px';plate.style.borderImageSource=`url(${scenePath(level)})`;plate.classList.toggle('wide',f.wide);plate.style.backgroundImage=f.wide?`url(${scenePath(level,true)})`:'none';}else{const f=livingFrame(r.width,r.height),plate=$('#living-floor');plate.style.borderTopWidth=f.top+'px';plate.style.borderBottomWidth=f.bottom+'px';plate.style.borderImageSlice=(f.wide?'460':'620')+' 0 100 fill';plate.style.borderImageSource=`url(${f.src})`;$('#room-image').src=f.src;}$('#feedback').style.top=matchMedia('(orientation:landscape) and (min-width:600px) and (max-height:600px)').matches?'8px':($('.hud').getBoundingClientRect().bottom-$('main').getBoundingClientRect().top+8)+'px';ensureCurrentAssets();}
function renderBins(s=state){binView=s;$('#progress').textContent=`${Object.values(s.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;$('#later').textContent=level.categories.slice(s.next).map(c=>`接着 · ${c.name}`).join(' → ')||'每件物品，都回到它的位置';$('#pressure').textContent=`暂存 ${s.buffer.length}/${level.capacity}`;const active=s.phase==='won'?level.categories.slice(s.helpUnlocked?-3:-2).map(c=>c.id):s.active;$('#bins').innerHTML=active.map((id,n)=>{const c=level.categories.find(c=>c.id===id),total=level.items.filter(i=>i.category===id).length;return containerHTML(level,c,count(level,s,id),total,`bin-${epoch}-${n}`);}).join('')+(s.helpUnlocked?Array.from({length:Math.max(0,3-active.length)},()=>finishedPlaceholderHTML()).join(''):Array.from({length:Math.max(0,2-active.length)},()=>finishedPlaceholderHTML(false)).join('')+lockedPlaceholderHTML(entered&&ready&&!busy&&s.phase==='playing'&&s.next<level.categories.length));}
function localRecords(){try{return window.localStorage;}catch{return null;}}
function levelDescription(l){const stars=readStars(l,false,localRecords()),helpStars=readStars(l,true,localRecords());const best=l.routeGoal?readBest(l,localRecords()).best:null;return `${l.items.length}件 · ${completed.has(l.id)?'本次已收好':'等你来收'} · 免费最佳${stars?'★'.repeat(stars):'未记录'} · 帮助最佳${helpStars?'★'.repeat(helpStars):'未记录'}${l.routeGoal?` · 可选${l.routeGoal.targetPeak}格目标${best!==null?` · 本机最佳${best}格`:''}`:''}`;}
function traceInput(kind,detail={}){
if(!inputTracing)return;
inputLog.push({t:performance.now(),kind,...detail,busy,epoch,level:level.id,moves:state.moves,phase:state.phase,buffer:[...state.buffer],queue:[...inputQueue]});
if(inputLog.length>4000)inputLog.shift();
}
const image=id=>`<img src="${spritePath(id,level)}" alt="" draggable="false">`,name=id=>level.items.find(i=>i.id===id)?.name||id,categoryName=id=>level.categories.find(c=>c.id===id)?.name||id;
function syncAssetGate(){
const gate=$('#resource-gate');$('main').dataset.loadState=assetState;gate.hidden=ready;$('#board').inert=!ready;$('#board').setAttribute('aria-busy',String(!ready||busy));
$('#resource-message').textContent=assetState==='error'?'这个角落的图片没准备好，请再试一次。':`正在准备${level.name}…`;
$('#resource-retry').hidden=assetState!=='error';
}
function releaseAssetWaiters(){for(const done of assetWaiters)done();assetWaiters.clear();}
async function waitForAssets(token){if(token===epoch&&!ready)await new Promise(done=>assetWaiters.add(done));}
function ensureCurrentAssets(force=false){
const r=$('.room').getBoundingClientRect(),wide=r.width>r.height,paths=requiredAssets(level,wide),key=level.id+':'+wide;
if(!force&&key===assetKey)return;
assetKey=key;assetController?.abort();const controller=new AbortController();assetController=controller;const token=++assetEpoch,gameToken=epoch,selected=level;
assetPaths=paths;ready=false;assetState='loading';assetError='';syncAssetGate();traceInput('assets-loading',{assetEpoch:token,paths:[...paths]});
void (async()=>{
try{
const decoded=await Promise.all(paths.map(async path=>[path,await assets.image(path,controller.signal)]));
if(token!==assetEpoch||gameToken!==epoch)return;
for(const [path,img] of decoded){if(!selected.items.some(i=>spritePath(i.id,selected)===path)||masks.has(path))continue;const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,128,128);masks.set(path,ctx.getImageData(0,0,128,128).data);}
await Promise.all([...document.querySelectorAll('#board img,.container-art')].map(img=>img.decode()));
if(token!==assetEpoch||gameToken!==epoch||controller.signal.aborted)return;
ready=true;assetState='ready';maybeIntro();syncAssetGate();renderBins();releaseAssetWaiters();traceInput('assets-ready',{assetEpoch:token});
}catch(error){
if(token!==assetEpoch||gameToken!==epoch||error.name==='AbortError')return;
controller.abort();ready=false;assetState='error';assetError=String(error.message);syncAssetGate();traceInput('assets-error',{assetEpoch:token,error:assetError});
}
})();
}
function describe(entry){const e=entry.events[0],n=name(entry.id);let text=e.type==='blocked'?`${n}被${e.blockers.map(name).join('、')}压住`:e.type==='store'?`${n}放进暂存`:e.type==='sort'?`${n}归入${categoryName(level.items.find(i=>i.id===entry.id).category)}`:`${n}放不下：暂存已满`;
const drained=entry.events.filter(e=>e.type==='drain');if(drained.length)text+=`；${drained.map(e=>name(e.id)).join('、')}自动归位，腾出${drained.length}格`;const opened=entry.events.filter(e=>e.type==='open');if(opened.length&&!drained.length)text+=`；${opened.map(e=>categoryName(e.category)).join('、')}打开了`;return text;}
function historyHTML(detail=false){return state.history.map(e=>`<li><span class="step">${e.step}</span><span>${describe(e)}${detail?`<small>暂存 ${e.before.buffer.length} → ${e.after.buffer.length} / ${level.capacity} · 当前：${e.after.buffer.map(name).join('、')||'空'}</small>`:''}</span></li>`).join('')||'<li>还没收第一件，慢慢来。</li>';}
function trayHTML(s){return Array.from({length:level.capacity},(_,i)=>{const id=s.buffer[i];return `<div class="slot ${id?'full':''}" data-slot="${i}" role="img" aria-label="暂存${i+1}：${id?name(id):'空位'}">${id?image(id):i+1}</div>`;}).join('');}
function renderCapacityCopy(){const word=({3:'三',4:'四',5:'五'})[level.capacity]||String(level.capacity);$('.storage').setAttribute('aria-label',word+'个暂存位置');$('#rules-capacity').textContent=`点物件即可自动分类，开放的两只箱子会直接接走它；还没有箱子的物件先放在${word}个暂存位。`;$('#rules-overflow').textContent=`新分类开放后，会自动接走匹配的暂存物。${word}个格子放满仍可继续收当前分类，第${level.capacity+1}件不匹配的物件放不下，这局就结束了。`;$('#rules-locked').hidden=false;$('#rules-locked').textContent='第三箱可自选测试帮助，不播放广告：提前开放下一分类，本局持续换类与自动回流，重开还原。不增加暂存格。';const b=starBudget(level);$('#rules-stars').textContent=`本关三星：最高暂存≤${b.three}格且共暂存≤${b.stores}件；二星≤${b.two}格且≤${b.stores+1}件；其余通关一星。不计时，不惩罚点错遮挡物。免费与帮助成绩分开保存。`;}
function render(){
$('main').dataset.hudLevel=level.id;renderCapacityCopy();
$('#tray').style.gridTemplateColumns=`repeat(${level.capacity},minmax(0,1fr))`;$('#gesture-copy').textContent=level.worldScale?'双指放大 · 左右拖动查看整片场景':'双指放大，拖动查看；轻点收取';$('#level-title').textContent=level.name;$('#level-number').textContent=`${LEVELS.indexOf(level)+1} / ${LEVELS.length}`;$('#session-progress').textContent=`本次完成 ${completed.size} / ${LEVELS.length}`;
$('.room').dataset.scene=level.scene;if(level.id==='l1')$('#room-image').src=scenePath(level,$('.room').clientWidth>$('.room').clientHeight);else if(level.worldScale)$('#room-image').src=scenePath(level);else $('#room-image').removeAttribute('src');$('#room-image').alt=level.name+'场景';$('.room').setAttribute('aria-label',level.name);$('.wall-note').textContent=level.scene==='desk'?'今天到这里 ✓':'下一站，新家';$('.desk-keepsakes').innerHTML=(level.artOverrides?['t1','t2','c1']:['d1','d2']).map(image).join('');
$('#progress').textContent=`${Object.values(state.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;
renderBins();
$('#later').textContent=level.categories.slice(state.next).map(c=>`接着 · ${c.name}`).join('  →  ')||'每件物品，都回到它的位置';
$('#board').innerHTML=level.items.filter(i=>state.locations[i.id]==='board').map(i=>{const p=level.layout[i.id],covers=blocked(level,state,i.id);return `<button id="${i.id}" class="prop ${covers.length?'blocked':''}${pendingIds.has(i.id)&&activeId!==i.id?' queued':''}" style="left:${p.x/360*100}%;top:${p.y/456*100}%;width:${p.size/360*100}%;aspect-ratio:1;z-index:${p.z}" aria-label="${i.name}${covers.length?'，被'+covers.map(name).join('、')+'压住':''}">${image(i.id)}</button>`;}).join('');
for(const i of level.items){const e=$('#'+i.id);if(e){e.firstElementChild.style.transform=`rotate(${level.layout[i.id].angle}deg)`;e.firstElementChild.style.transformOrigin='50% 92%';}}
$('#tray').innerHTML=trayHTML(state);
$('#pressure').textContent=`暂存 ${state.buffer.length}/${level.capacity}`;$('.storage').classList.toggle('danger',state.buffer.length===level.capacity);$('.room').classList.toggle('tidy',state.phase==='won');$('#board').setAttribute('aria-busy',String(!ready||busy));if($('#history-dialog').open)$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;applyLayout();refreshGuide();
}
function alphaAt(id,x,y){
const el=$('#'+id),mask=masks.get(spritePath(id,level));if(!el||!mask)return 0;
const r=el.getBoundingClientRect(),cx=r.x+r.width*.5,cy=r.y+r.height*.92;
const a=-viewLayout[id].angle*Math.PI/180,dx=x-cx,dy=y-cy;
let u=(dx*Math.cos(a)-dy*Math.sin(a)+r.width*.5)/r.width;
let v=(dx*Math.sin(a)+dy*Math.cos(a)+r.height*.92)/r.height;
if(u<0||u>=1||v<0||v>=1)return 0;return mask[(Math.floor(v*128)*128+Math.floor(u*128))*4+3];
}
function hitDetail(x,y){
const order=level.items.filter(i=>state.locations[i.id]==='board'&&$('#'+i.id)?.style.visibility!=='hidden').sort((a,b)=>viewLayout[b.id].z-viewLayout[a.id].z);
const solid=order.find(i=>alphaAt(i.id,x,y)>=64);
for(const i of order){
if(i===solid)break;
const pocket=pocketFor(level.id,i.id);if(!pocket||(solid&&!solid.blockedBy.includes(i.id)))continue;
const el=$('#'+i.id),r=el.getBoundingClientRect(),a=-viewLayout[i.id].angle*Math.PI/180,dx=x-r.x-r.width*.5,dy=y-r.y-r.height*.92;
const u=(dx*Math.cos(a)-dy*Math.sin(a)+r.width*.5)/r.width,v=(dx*Math.sin(a)+dy*Math.cos(a)+r.height*.92)/r.height;
if(u<0||u>=1||v<0||v>=1)continue;
const limit=inPocket(level.id,i.id,u,v)?pocket.maxDistance:solid?3:0;
if(!limit)continue;
const distance=distanceToAlpha(masks.get(spritePath(i.id,level)),u,v,r.width,limit);
if(Number.isFinite(distance))return {id:i.id,kind:limit===3?'cover-edge':'semantic-pocket',distance,underlying:solid?.id||null};
}
if(solid)return {id:solid.id,kind:'solid',distance:0};
let best=null,dist=Infinity;
for(const i of order)for(const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,4],[4,-4],[-4,-4]]){
const d=dx*dx+dy*dy;if(d<dist&&alphaAt(i.id,x+dx,y+dy)>=128){best=i.id;dist=d;}
}
return best?{id:best,kind:'contour',distance:Math.sqrt(dist)}:{id:null,kind:'rejected',distance:null};
}
function resolveHit(x,y){return hitDetail(x,y).id;}
function pointFor(id){
const e=$('#'+id);if(!e)return null;const r=e.getBoundingClientRect(),clip=$('.room-viewport')?.getBoundingClientRect()||$('#board').getBoundingClientRect();let best=null,score=-1;
const left=Math.max(r.left,clip.left,0),right=Math.min(r.right,clip.right,innerWidth),top=Math.max(r.top,clip.top,0),bottom=Math.min(r.bottom,clip.bottom,innerHeight);
for(let y=Math.ceil(top);y<bottom;y+=3)for(let x=Math.ceil(left);x<right;x+=3){
if(alphaAt(id,x,y)<192||resolveHit(x,y)!==id||!document.elementFromPoint(x,y)?.closest('#board'))continue;
let n=0;for(const [dx,dy] of [[-5,0],[5,0],[0,5],[0,-5],[-3,-3],[3,3]])if(resolveHit(x+dx,y+dy)===id)n++;
const v=n*100-Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2);if(v>score){score=v;best={x,y};}
}return best;
}
function pick(id){
traceInput('request',{id});
if(!entered||!ready||state.phase!=='playing'||document.querySelector('dialog[open]')){traceInput('rejected',{id,reason:!ready?'not-ready':'ended'});return;}
if(pendingIds.has(id)||state.locations[id]!=='board'){traceInput('rejected',{id,reason:pendingIds.has(id)?'duplicate-pending':'not-on-board'});return;}
void audio.activate();pendingIds.add(id);inputQueue.push(id);traceInput('queued',{id});
$('#'+id)?.classList.add('queued');traceInput('queue-ack',{id});
if(busy){$('#feedback').textContent=`${name(id)}已排好，接着收。`;return;}
busy=true;$('#board').setAttribute('aria-busy','true');void drainInputs(epoch);
}
async function drainInputs(token){
while(token===epoch&&inputQueue.length&&state.phase==='playing'){
do{await waitForMenus(token);await waitForAssets(token);}while(token===epoch&&(!ready||menusOpen()));if(token!==epoch)return;
const id=inputQueue.shift();activeId=id;$('#'+id)?.classList.remove('queued');
if(state.locations[id]!=='board'){traceInput('cancelled',{id,reason:'no-longer-on-board'});pendingIds.delete(id);continue;}
await performPick(id,token);
if(token!==epoch)return;
pendingIds.delete(id);activeId=null;
}
if(token!==epoch)return;
if(inputQueue.length)traceInput('cancelled',{ids:[...inputQueue],reason:'game-ended'});
inputQueue=[];pendingIds.clear();activeId=null;busy=false;const helpButton=$('button.locked-placeholder');if(helpButton)helpButton.disabled=!entered||!ready||state.phase!=='playing'||state.next>=level.categories.length;document.querySelectorAll('.prop.queued').forEach(el=>el.classList.remove('queued'));$('#board').setAttribute('aria-busy',String(!ready));traceInput('idle');
}
async function performPick(id,token){
lastHit=id;const next=take(level,state,id),event=next.events[0];
if(!event){traceInput('rejected',{id,reason:'no-event'});return;}
traceInput('accepted',{id,event:event.type});
if(event.type==='blocked'){state=next;render();$('#feedback').textContent=describe(next.history.at(-1));playCue('warning');for(const cover of event.blockers){const e=$('#'+cover);e?.classList.add('highlight');if(e)setTimeout(()=>e.classList.remove('highlight'),1800);}traceInput('committed',{id,event:event.type});return;}
if(event.type==='overflow'){state=next;recordAction(id);runPeak=Math.max(runPeak,state.buffer.length);render();void animateElement($('.storage'),[{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],180,token);playCue('warning');traceInput('committed',{id,event:event.type});finish();return;}
const source=$('#'+id),category=level.items.find(i=>i.id===id).category;
const target=event.type==='store'?$(`[data-slot="${state.buffer.length}"]`):$(`[data-category="${category}"] .bin-mouth`);
$('#feedback').textContent=event.type==='store'?`${name(id)}先放这里，留意${level.capacity}个暂存位。`:`${name(id)}归位！`;
const flight=await fly(id,source,target,token,viewLayout[id].angle,event.type==='sort');
if(token!==epoch)return;
landingContact(id,event.type==='store'?'store':'sort',token,flight);
await animateSettlement(next,id,event,token);
if(token!==epoch)return;
state=next;recordAction(id);if(event.type==='store')runStores++;runPeak=Math.max(runPeak,state.buffer.length);render();guideEvent(event.type);const receiver=event.type==='store'?$(`[data-slot="${state.buffer.indexOf(id)}"]`):$(`[data-category="${category}"] .container-art`);if(event.type==='store'||count(level,state,category)<level.items.filter(i=>i.category===category).length)receiverRebound(id,event.type==='store'?receiver?.querySelector('img'):receiver,token,event.type==='store');traceInput('committed',{id,event:event.type});$('#feedback').textContent=describe(state.history.at(-1));if(state.phase!=='playing')finish();
}
async function animateElement(el,frames,duration,token,easing='cubic-bezier(.2,.7,.2,1)'){if(reduced||!el||token!==epoch)return;const anim=el.animate(frames,{duration,easing,fill:'forwards'});const scoped=true;if(scoped)l1Animations.add(anim);try{await anim.finished;}catch{}finally{if(scoped)l1Animations.delete(anim);}if(token===epoch)anim.cancel();}
async function fly(id,source,target,token,angle=0,intoMouth=true){
const soundEpoch=l1SoundEpoch;
if(reduced||!source||!target){traceInput('flight-skipped',{id,reduced,durationMs:0});return {soundEpoch,durationMs:0};}
const duration=650,started=performance.now(),originLevel=level.id;
const start=source.getBoundingClientRect(),end=target.getBoundingClientRect();
const ghost=document.createElement('div');ghost.className='ghost';ghost.dataset.item=id;ghost.dataset.destination=intoMouth?'mouth':'tray';ghost.innerHTML=image(id);
Object.assign(ghost.style,{left:start.x+'px',top:start.y+'px',width:start.width+'px',height:start.height+'px'});document.body.append(ghost);source.style.visibility='hidden';
if(angle){ghost.firstElementChild.style.transformOrigin='50% 92%';void animateElement(ghost.firstElementChild,[{transform:`rotate(${angle}deg)`},{offset:.16,transform:`rotate(${angle*.7}deg)`},{offset:.68,transform:`rotate(${angle*.15}deg)`},{transform:'rotate(0deg)'}],duration,token,'linear');}
const dx=end.x+end.width/2-start.x-start.width/2,dy=end.y+end.height/2-start.y-start.height/2;
traceInput('flight',{id,durationMs:duration,sourceHidden:source.style.visibility==='hidden',to:intoMouth?'mouth':'tray',destination:{x:end.x+end.width/2,y:end.y+end.height/2},source:{x:start.x,y:start.y,width:start.width,height:start.height}});
const rise=Math.min(12,Math.abs(dy)*.12),arc=Math.min(24,Math.abs(dy)*.12),near=Math.min(12,Math.abs(dy)*.08);
const trayScale=Math.min(1,(parseFloat(getComputedStyle(target).getPropertyValue('--tray-icon-size'))||34)/start.width),frames=[{transform:`translate(0,0) rotate(0deg) scale(.97)`,opacity:1,easing:'ease-out'},{offset:.16,transform:`translate(${dx*.035}px,${-rise}px) rotate(0deg) scale(1.04)`,opacity:1,easing:'cubic-bezier(.32,.02,.45,1)'},{offset:.68,transform:`translate(${dx*.78}px,${dy*.7-arc}px) rotate(0deg) scale(.68)`,opacity:1,easing:'ease-out'},{offset:.88,transform:`translate(${dx*.98}px,${dy-near}px) rotate(0deg) scale(${intoMouth ? .38 : Math.max(.42,trayScale)})`,opacity:1,easing:'ease-in'},{transform:`translate(${dx}px,${dy+(intoMouth?3:0)}px) rotate(0deg) scale(${intoMouth ? .16 : trayScale})`,opacity:intoMouth?0:1}];
await animateElement(ghost,frames,duration,token,'linear');ghost.remove();
traceInput(token===epoch?'flight-ended':'flight-cancelled',{id,originLevel,originEpoch:token,durationMs:duration,elapsedMs:performance.now()-started});
return {soundEpoch,durationMs:duration};
}
async function animateSettlement(next,id,event,token){
const view=structuredClone(state);if(event.type==='help'){view.helpUnlocked=true;view.active.push(event.category);view.next++;}else{view.locations[id]=event.type==='store'?'buffer':'sorted';if(event.type==='store')view.buffer.push(id);}
renderBins(view);
const finished=new Set();
async function finishBin(category){const el=$(`[data-category="${category}"]`);if(!el)return;el.dataset.state='full';el.querySelector('.bin-count').textContent=`${count(level,view,category)} / ${level.items.filter(i=>i.category===category).length}`;traceInput('container-full',{category});audio.narrate('box','box:'+category,token);if(level.id==='l1')void animateElement(el.querySelector('.container-art'),[{filter:'none'},{filter:'drop-shadow(0 0 2px #e2bb7180)'},{filter:'none'}],190,token);await animateElement(el,[{transform:'scale(1)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],190,token);finished.add(category);}
for(const e of next.events.slice(1)){
if(token!==epoch)return;
if(e.type==='open'){
const old=view.active.find(c=>count(level,view,c)===level.items.filter(i=>i.category===c).length);if(!old)continue;
await finishBin(old);if(token!==epoch)return;
await animateElement($(`[data-category="${old}"]`),[{transform:'translateY(0)',opacity:1},{transform:'translateY(-15px)',opacity:0}],120,token);if(token!==epoch)return;
view.active[view.active.indexOf(old)]=e.category;view.next++;renderBins(view);traceInput('container-enter',{category:e.category,replaces:old});
await animateElement($(`[data-category="${e.category}"]`),[{transform:'translateY(12px)',opacity:0},{transform:'translateY(0)',opacity:1}],140,token);
}else if(e.type==='drain'){
const slot=view.buffer.indexOf(e.id),category=level.items.find(i=>i.id===e.id).category;
const flight=await fly(e.id,$(`[data-slot="${slot}"] img`),$(`[data-category="${category}"] .bin-mouth`),token,0,true);if(token!==epoch)return;landingContact(e.id,'sort',token,flight);
view.buffer.splice(slot,1);view.locations[e.id]='sorted';renderBins(view);
$('#tray').innerHTML=trayHTML(view);
receiverRebound(e.id,$(`[data-category="${category}"] .container-art`),token);
traceInput('buffer-drained',{id:e.id,category,remaining:[...view.buffer]});
}
}
for(const c of view.active)if(!finished.has(c)&&count(level,view,c)===level.items.filter(i=>i.category===c).length){await finishBin(c);if(token!==epoch)return;}
}
function finish(){const elapsed=playClock.update(false);const win=state.phase==='won';if(win){completedJournals.set(level.id,[...journal]);persistProgress();}if(!win)audio.stopVoice('failed');if(win){starResult={...rateRoute(level,runPeak,runStores),help:!!state.helpUnlocked,...saveStars(level,!!state.helpUnlocked,rateRoute(level,runPeak,runStores).stars,localRecords())};completed.set(level.id,{moves:state.moves,attempts:state.attempts,peak:runPeak,stars:starResult.stars,help:starResult.help});if(level.routeGoal&&!state.helpUnlocked)routeResult=saveBest(level,runPeak,localRecords());playCue('victory');audio.narrate('win','win',epoch);$('#session-progress').textContent=`本次完成 ${completed.size} / ${LEVELS.length}`;if($('#levels-dialog').open)refreshLevelCompletion();}
$('#result-kicker').textContent=level.name+(win?` · ${state.helpUnlocked?'测试帮助':'免费路线'}`:'');$('#result-title').textContent=win?'收好啦，舒服了！':'先缓一缓，位置满了';
const last=state.history.at(-1);$('#result-message').textContent=win?`${level.items.length}件都归位了。这一角，清清爽爽。`:`${name(last.id)}属于${categoryName(level.items.find(i=>i.id===last.id).category)}，现在没有对应箱子。${level.capacity}格暂存已满，放不下第${level.capacity+1}件；它仍留在房间。`;
renderRouteResult(win);renderArtResult(win,elapsed);$('#star-results').hidden=!win;$('#star-results').textContent=win?`${'★'.repeat(starResult.stars)}${'☆'.repeat(3-starResult.stars)} · ${starResult.stars}星\n${starResult.reason}\n${starResult.help?'测试帮助路线':'免费路线'} · ${starResult.saved?`本机最佳${starResult.best}星`:'本机保存不可用'}（两类分开记录）`:'';
$('#result').dataset.outcome=win?'won':'lost';$('#failure-review').hidden=win;$('#failure-review').open=false;
$('#failure-review').innerHTML=win?'':`<summary>回顾最近5步</summary><div class="review-scroll" tabindex="0" role="region" aria-label="失败前的最近五步"><p>暂存里：${state.buffer.map(name).join('、')}。</p><ol>${historyHTML(true)}</ol><p>试着先完成当前一箱，让新分类接走暂存。免费重开可以换一条路线。</p></div>`;
$('#next').hidden=!win;$('#next').textContent=completed.size===LEVELS.length?'看看今天的成果':LEVELS.indexOf(level)<LEVELS.length-1?'下一关':'去收还没完成的角落';$('#tidy-next').textContent=$('#next').textContent;
viewingRoom=win;if(viewingRoom)$('#feedback').textContent='';$('#result-room').hidden=!viewingRoom;pendingResult=!viewingRoom;syncTidyActions();showPendingResult();traceInput('completion-presentation',{roomFirst:viewingRoom});}
function renderArtResult(win,elapsed){
const result=$('#result');result.classList.toggle('art-win',win);$('#result-visual').hidden=!win;$('#result-stars').hidden=!win;$('#result-time').hidden=!win;
if(!win)return;
const hero=$('#result-scene');hero.src=`./result-058/${level.id}.svg`;hero.alt=`${level.name}整理后的原创场景插画`;
$('#result-caption').textContent=level.caption;$('#result-title').textContent='整理完成！';
$('#result-stars').innerHTML=Array.from({length:3},(_,n)=>`<span class="award-star ${n<starResult.stars?'earned':''}" aria-hidden="true"><svg viewBox="0 0 100 100"><defs><linearGradient id="gold-${n}" x2="0" y2="1"><stop stop-color="#fff2a3"/><stop offset=".48" stop-color="#ffd15b"/><stop offset="1" stop-color="#f3a730"/></linearGradient></defs><path d="M50 7 63 33 92 37 71 58 76 87 50 73 24 87 29 58 8 37 37 33Z" fill="${n<starResult.stars?`url(#gold-${n})`:'#e0d3b9'}" stroke="${n<starResult.stars?'#d98924':'#bbaa89'}" stroke-width="5" stroke-linejoin="round"/><path d="m49 17-9 22-19 3" fill="none" stroke="#fff8d0" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg></span>`).join('');$('#result-stars').setAttribute('aria-label',`${starResult.stars}星，满分3星`);
$('#result-duration').textContent=formatTime(elapsed);$('#result-clock-note').textContent=timeKnown?'整理用时 · 不参与星级':'续局用时 · 此前未记录，不参与星级';
$('#result-route-kind').textContent=starResult.help?'测试帮助路线 · 单独记录':'免费路线';
}
function renderRouteResult(win){
const box=$('#route-results');box.hidden=!level.routeGoal||!win||!!state.helpUnlocked;box.replaceChildren();if(box.hidden)return;
const goal=level.routeGoal,record=routeResult,done=runPeak<=goal.targetPeak;
const status=record.saved?(record.first?'本机首次记录':record.improved?'比上次更省位置了':'本机最佳继续保留'):'本次已记下，浏览器未能保存';
const title=document.createElement('b');title.textContent=done?'轻装收桌，达成了':'这一桌，也收得好';box.append(title);
const beforeAfter=document.createElement('p');beforeAfter.className='route-before-after';beforeAfter.textContent=`整理前 ${level.items.length}件散落 → 整理后 全部归位`;box.append(beforeAfter);
const peak=document.createElement('p');peak.className='route-peak';peak.textContent=`本次最高暂存 ${runPeak} / ${level.capacity} 格`;box.append(peak);
const best=document.createElement('p');best.id='route-best';best.textContent=record.saved?`本机最佳 ${record.best} 格 · ${status}`:`${status}${record.previous!==null?`；原记录 ${record.previous} 格`:'，仅供这次查看'}`;box.append(best);
const optional=document.createElement('p');optional.textContent=done?`可选目标已完成：不超过${goal.targetPeak}格。想换条路线也可以。`:`可选挑战：${goal.text}。不影响通关，不用赶时间。`;box.append(optional);
const privacy=document.createElement('small');privacy.textContent='最佳记录仅存在本机浏览器，可随浏览器数据清除；没有上传。';box.append(privacy);
}
function syncTidyActions(){$('#tidy-actions').hidden=!(viewingRoom&&state.phase==='won');}
function showPendingResult(){if(pendingResult&&state.phase!=='playing'&&!menusOpen()){pendingResult=false;$('#result').showModal();$('#result-title').focus({preventScroll:true});$('#result').scrollTop=0;$('.result-body').scrollTop=0;}}
function showRoom(){if(state.phase!=='won')return;pendingResult=false;viewingRoom=true;$('#result').close();syncTidyActions();$('#tidy-result').focus({preventScroll:true});traceInput('tidy-room-view');}
function showRoomResult(){if(state.phase!=='won'||$('#result').open)return;viewingRoom=false;syncTidyActions();pendingResult=true;showPendingResult();traceInput('tidy-result-view');}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function startLevel(id){camera.cancel();playClock.reset();timeKnown=true;journal=[];helpToken=null;starResult=null;const selected=getLevel(id);if(!selected)throw Error('Unknown level');pendingResult=false;viewingRoom=false;syncTidyActions();traceInput('cancelled',{ids:[...pendingIds],reason:'restart-or-level-change'});epoch++;audio.beginRun(epoch);ready=false;assetKey='';assetController?.abort();releaseAssetWaiters();l1SoundEpoch++;for(const anim of l1Animations)anim.cancel();l1Animations.clear();audio.stopGroup('l1-feedback');for(const done of menuWaiters)done();menuWaiters.clear();inputQueue=[];pendingIds.clear();activeId=null;document.querySelectorAll('.ghost').forEach(g=>{g.getAnimations().forEach(a=>a.cancel());g.remove();});busy=false;lastHit=null;runPeak=0;runStores=0;routeResult=null;level=selected;state=createState(level);camera.reset();closeDialogs();render();persistProgress();beginGuide();$('#feedback').textContent=level.hint;$('.room-viewport')?.scrollTo({top:0,behavior:'instant'});window.scrollTo({top:0,behavior:'instant'});}
function refreshLevelCompletion(){for(const l of LEVELS){const label=$(`[data-level="${l.id}"] small`);if(label)label.textContent=levelDescription(l);}}
function renderLevelOptions(){$('#level-options').innerHTML=LEVELS.map((l,n)=>`<button data-level="${l.id}" ${n>=3&&!completed.has(LEVELS[n-1].id)&&!completed.has(l.id)?'disabled':''}><b>${n+1}. ${l.name}</b><small>${n>=3&&!completed.has(LEVELS[n-1].id)&&!completed.has(l.id)?'完成上一关后解锁':levelDescription(l)}</small></button>`).join('');}
function openLevels(){closeDialogs();renderLevelOptions();$('#levels-dialog').showModal();}
function showFinal(){closeDialogs();$('#final-summary').innerHTML=LEVELS.map(l=>`<p>✓ ${l.name}<small>${'★'.repeat(completed.get(l.id).stars)} · ${completed.get(l.id).help?'测试帮助':'免费'} · ${completed.get(l.id).moves}件收取 · ${completed.get(l.id).attempts}次尝试${l.routeGoal?` · 最高暂存${completed.get(l.id).peak}格`:''}</small></p>`).join('');$('#final').showModal();}
function syncAudio(){
const p=audio.prefs,m=Math.round(p.musicVolume*100),f=Math.round(p.sfxVolume*100),v=Math.round(p.voiceVolume*100);
$('#voice-on').checked=p.voiceOn;$('#voice-volume').value=v;$('#voice-value').textContent=`${v}%`;$('#voice-volume').setAttribute('aria-valuetext',`${v}%`);$('#voice-status').textContent=audio.voice.error||'人声播放时，音乐和音效会自动放轻。';$('#music-on').checked=p.musicOn;$('#sfx-on').checked=p.sfxOn;$('#music-volume').value=m;$('#sfx-volume').value=f;
$('#music-value').textContent=`${m}%`;$('#sfx-value').textContent=`${f}%`;
$('#music-volume').setAttribute('aria-valuetext',`${m}%`);$('#sfx-volume').setAttribute('aria-valuetext',`${f}%`);
const music=p.musicOn&&m>0,sfx=p.sfxOn&&f>0;
$('#audio-status').textContent=audio.error||(!audio.activated?'等待点击，开启声音':!audio.ready?'声音加载中…':audio.backgrounded||document.hidden?'声音已暂停，返回后继续':!music&&!sfx&&(!p.voiceOn||v===0)?'已静音，设置已记住':audio.ctx?.state!=='running'?'声音待恢复，请点开启 / 继续声音':`${music?'音乐播放中':'音乐已关闭'} · ${sfx?'音效已开启':'音效已关闭'} · ${p.voiceOn&&v>0?'人声已开启':'人声已关闭'}`);
}
audio.notify=syncAudio;
$('#board').addEventListener('pointerdown',e=>{if(!ready)return;const id=resolveHit(e.clientX,e.clientY);traceInput('pointerdown',{x:e.clientX,y:e.clientY,target:e.target.id,resolved:id});if(id&&!reduced&&state.phase==='playing')$('#'+id)?.classList.add('pressed');});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>document.querySelectorAll('.prop.pressed').forEach(el=>el.classList.remove('pressed')));
$('#board').addEventListener('click',e=>{if(e.detail!==0&&camera.suppressClick()){traceInput('rejected',{reason:'gesture'});return;}if(!ready){traceInput('rejected',{reason:'not-ready'});return;}const keyboard=e.detail===0?e.target.closest('.prop'):null;const id=keyboard?.id||resolveHit(e.clientX,e.clientY);traceInput('click',{x:e.clientX,y:e.clientY,target:e.target.id,resolved:id,source:keyboard?'keyboard':'pointer',hit:keyboard?{id,kind:'keyboard'}:hitDetail(e.clientX,e.clientY)});if(id)pick(id);else{traceInput('rejected',{reason:'empty-hit'});if(!busy&&state.phase==='playing')$('#feedback').textContent='这里没有物件，点物件本身试试。';}});
$('#bins').onclick=e=>{if(!e.target.closest('button.locked-placeholder')||busy||!ready||!entered||state.phase!=='playing'||state.helpUnlocked||state.next>=level.categories.length)return;helpToken={epoch};const request=helpToken;$('#help-confirm').onclick=()=>confirmHelp(request);$('#help-category').textContent=`将开放${categoryName(level.categories[state.next].id)}。匹配暂存自动归位，之后继续满箱换类，直到本局结束。`;$('#help-dialog').showModal();};
async function confirmHelp(request){
const token=request.epoch;if(request!==helpToken||token!==epoch||document.hidden||busy||!ready||state.phase!=='playing')return;
helpToken=null;const next=unlockHelp(level,state);if(next===state)return;
busy=true;$('#help-dialog').close();$('#board').inert=true;renderBins();
await animateSettlement(next,null,next.events[0],token);if(token!==epoch)return;
state=next;recordAction('help');busy=false;$('#board').inert=false;render();$('#feedback').textContent='测试帮助已开启，本局持续有效；没有播放广告。';traceInput('help-committed');if(state.phase!=='playing')finish();
};
$('#help-dialog').addEventListener('close',()=>{helpToken=null;});
$('#help-restart').onclick=()=>startLevel(level.id);
$('#reset').onclick=()=>startLevel(level.id);$('#again').onclick=()=>startLevel(level.id);$('#levels-open').onclick=openLevels;$('#result-levels').onclick=openLevels;$('#final-levels').onclick=openLevels;
$('#level-options').onclick=e=>{const b=e.target.closest('[data-level]');if(b)startLevel(b.dataset.level);};
function advanceLevel(){if(state.phase!=='won')return;if(completed.size===LEVELS.length)showFinal();else{const n=LEVELS.indexOf(level),next=LEVELS[n+1]||LEVELS.find(l=>!completed.has(l.id));startLevel(next.id);}}
$('#next').onclick=advanceLevel;$('#tidy-next').onclick=advanceLevel;$('#tidy-result').onclick=showRoomResult;$('#result-room').onclick=showRoom;
$('#history-open').onclick=()=>{closeDialogs();$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;$('#history-dialog').showModal();};
$('#sound-open').onclick=()=>{closeDialogs();syncAudio();$('#sound-dialog').showModal();void audio.activate(true);};$('#audio-start').onclick=()=>audio.activate(true);
for(const [id,key] of [['music-on','musicOn'],['sfx-on','sfxOn'],['voice-on','voiceOn']])$('#'+id).onchange=e=>audio.set(key,e.target.checked);
for(const [id,key] of [['music-volume','musicVolume'],['sfx-volume','sfxVolume'],['voice-volume','voiceVolume']])$('#'+id).oninput=e=>audio.set(key,Number(e.target.value)/100);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{if(d.id==='result'&&!d.open&&state.phase==='won'&&!pendingResult)viewingRoom=true;syncTidyActions();showPendingResult();resumeQueue();});
$('#settings-open').onclick=()=>{syncAudio();$('#settings-dialog').showModal();void audio.activate(true);};
$('#rules-open').onclick=()=>{closeDialogs();$('#rules-dialog').showModal();};
new ResizeObserver(()=>{camera.resize();applyLayout();}).observe($('.room-viewport'));
$('#resource-retry').onclick=()=>{assetKey='';render();};
const saved=readProgress(localRecords());
if(saved.status==='ok'){level=getLevel(saved.data.current.id);journal=[...saved.data.current.actions];playClock.reset(saved.data.current.elapsedMs||0);timeKnown=saved.data.current.timeKnown??(saved.data.current.elapsedMs!==undefined||journal.length===0);state=saved.current.state;runPeak=saved.current.peak;runStores=saved.current.stores;for(const c of saved.data.completed){const r=replay(c.id,c.actions),rating=rateRoute(getLevel(c.id),r.peak,r.stores);completedJournals.set(c.id,[...c.actions]);completed.set(c.id,{moves:r.state.moves,attempts:r.state.attempts,peak:r.peak,stars:rating.stars,help:!!r.state.helpUnlocked});}}
if(saved.status==='unavailable'){saveAllowed=false;$('#save-status').textContent=saved.message;}
entered=true;document.documentElement.classList.remove('before-entry');$('#entry').hidden=true;$('#game').inert=false;
camera.reset();audio.beginRun(epoch);render();beginGuide();syncAudio();$('#feedback').textContent=level.hint;if(state.phase!=='playing')finish();if(saved.status!=='unavailable')persistProgress();
$('#home-open').onclick=()=>{closeDialogs();$('#entry').hidden=false;$('#game').inert=true;$('#home-progress').textContent=`当前：${level.name} · 已完成${completed.size}/${LEVELS.length}关`;};
$('#enter-game').onclick=()=>{void audio.activate();$('#entry').hidden=true;$('#game').inert=false;showPendingResult();resumeQueue();};
$('#home-levels').onclick=()=>{$('#entry').hidden=true;$('#game').inert=false;openLevels();};
$('#home-sound').onclick=()=>{$('#entry').hidden=true;$('#game').inert=false;$('#settings-open').onclick();};
$('#progress-reset').onclick=()=>$('#progress-reset-dialog').showModal();
$('#progress-reset-confirm').onclick=()=>{try{localRecords().removeItem(PROGRESS_KEY);saveAllowed=true;completed.clear();completedJournals.clear();$('#entry').hidden=true;$('#game').inert=false;startLevel('l1');}catch{$('#save-status').textContent='重置失败，原进度保留。';}};
window.addEventListener('pagehide',()=>{playClock.update(false);persistProgress();});
document.addEventListener('visibilitychange',()=>playClock.update(timeActive()));
document.addEventListener('click',()=>queueMicrotask(()=>playClock.update(timeActive())));
setInterval(()=>playClock.update(timeActive()),250);
$('#enter-game').addEventListener('click',e=>{if(e.isTrusted)enterGame();});
$('#guide-skip').onclick=()=>{endGuide();closeDialogs();};
void audio.preload();
window.ssjwl={snapshot:()=>structuredClone(state),ui:()=>({busy,epoch,ready,entered,guide:{...guide,done:guideDone},assetState,assetEpoch,assetError,assetPaths:[...assetPaths],reduced,lastHit,levelId:level.id,completed:[...completed.keys()],queue:[...inputQueue],activeId,runPeak,runStores,starResult:starResult?{...starResult}:null,routeResult:routeResult?{...routeResult}:null}),inputTrace:()=>structuredClone(inputLog),audioSnapshot:()=>audio.snapshot(),pointFor,resolveHit,hitDetail,alphaAt,layout:()=>structuredClone(viewLayout),camera:()=>camera.snapshot(),containerView:()=>binView?structuredClone(binView):null};
$('#scene-left').onclick=()=>camera.move($('.room-viewport').clientWidth*.65);$('#scene-right').onclick=()=>camera.move(-$('.room-viewport').clientWidth*.65);$('#scene-reset').onclick=()=>camera.reset();$('#board').addEventListener('focusin',e=>{if(e.target.matches('.prop'))camera.reveal(e.target.id);});window.addEventListener('orientationchange',()=>{camera.cancel();requestAnimationFrame(()=>{camera.resize();applyLayout();});});
const vibrateAvailable=typeof navigator.vibrate==='function';$('#vibration-on').disabled=!vibrateAvailable;$('#vibration-status').textContent=vibrateAvailable?'可选设备震动；实际效果取决于设备':'当前浏览器不支持震动';$('#vibration-on').onchange=e=>{if(e.target.checked){const accepted=navigator.vibrate(20);if(!accepted){e.target.checked=false;$('#vibration-status').textContent='浏览器未允许震动';}else $('#vibration-status').textContent='已发送震动请求；不保证设备实际振动';}};
return {};})();
})();
