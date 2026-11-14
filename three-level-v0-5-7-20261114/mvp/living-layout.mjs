// L1 display only: source data/dependencies remain frozen.
export function livingFrame(width,height){
 const wide=width>height,sourceWidth=wide?1536:1024,top=wide?460:620;
 return {wide,top:top/sourceWidth*width,bottom:100/sourceWidth*width,
  src:`./art-046/living${wide?'-wide':''}.webp`,sourceWidth};
}
// 348 x 451 contact coordinates. Different depth rates keep semantic clusters
// together on tall phones, instead of distributing everything on equal rows.
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
export function fitLiving(level,width,height){
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
