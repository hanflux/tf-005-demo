export const categories = [
  {id:'toy', name:'玩具篮', color:'#e79451'},
  {id:'daily', name:'日用柜', color:'#72a9b0'},
  {id:'recycle', name:'回收袋', color:'#94a868'},
  {id:'cat', name:'猫咪箱', color:'#b79acb'}
];
// Both initial containers require two covered items: no zero-buffer bypass.
const groups = [
  ['t','toy',['小火车','积木','陀螺','小风车','玩具车'],[6,77,148,219,290],10],
  ['d','daily',['水杯','小闹钟','手套','雨伞','毛巾'],[6,77,148,219,290],100],
  ['c','cat',['猫罐头','逗猫棒','猫抓板','猫碗','毛线球'],[6,77,148,219,290],190],
  ['r','recycle',['纸盒','饮料瓶','纸袋','报纸','易拉罐'],[20,91,20,91,290],280]
];
// Scatter free items across the rug rather than grouping each category in a row.
const scattered={t3:[148,190],t4:[219,280],t5:[290,100],d3:[148,280],d4:[219,190],d5:[290,10],c1:[148,10],c2:[219,100],c3:[148,100],c4:[219,10]};
export const items = groups.flatMap(([prefix,category,names,xs,y]) => names.map((name,i)=>({
  id:prefix+(i+1), category, name, x:scattered[prefix+(i+1)]?.[0]??xs[i], y:scattered[prefix+(i+1)]?.[1]??(prefix==='r'&&i<4?(i<2?32:122):y),
  blockedBy:prefix==='t'&&i<2?['r'+(i+1)]:prefix==='d'&&i<2?['r'+(i+3)]:[]
})));
export const capacity=3;
