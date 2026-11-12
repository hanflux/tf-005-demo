import {sceneFrame} from './scene-art.mjs';
// L1's existing fitter is deliberately unchanged below the dispatch.
export function fitLayout(level,width,height){
 if(level.id!=='l1')return fitScene(level,width,height);
 const parent=Object.fromEntries(level.items.map(i=>[i.id,i.id]));
 const root=id=>parent[id]===id?id:parent[id]=root(parent[id]);
 for(const i of level.items)for(const b of i.blockedBy)parent[root(i.id)]=root(b);
 const groups=new Map();for(const i of level.items){const k=root(i.id);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i.id);}
 const scale=Math.min(width/360,height/405,1.2),offsetX=(width-360*scale)/2;
 const clusters=[...groups.values()].map(ids=>({ids,y:ids.reduce((n,id)=>n+level.layout[id].y,0)/ids.length}));
 const min=Math.min(...clusters.map(g=>g.y)),max=Math.max(...clusters.map(g=>g.y));
 const top=105*scale,bottom=height-27*scale,out={};
 for(const g of clusters){const anchor=top+(g.y-min)/(max-min)*(bottom-top);for(const id of g.ids){const p=level.layout[id];out[id]={...p,x:offsetX+p.x*scale,y:anchor+(p.y-g.y)*scale,size:p.size*scale};}}
 // Keep the rotated square envelopes inside the room, translating each cover
 // component as a unit. This also protects opaque edge pixels on narrow screens.
 for(const g of clusters){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const id of g.ids){const p=out[id],a=p.angle*Math.PI/180;for(const [u,v] of [[-.5,-.92],[.5,-.92],[.5,.08],[-.5,.08]]){const x=p.x+p.size*(u*Math.cos(a)-v*Math.sin(a)),y=p.y+p.size*(u*Math.sin(a)+v*Math.cos(a));minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
  const dx=minX<3?3-minX:maxX>width-3?width-3-maxX:0,dy=minY<3?3-minY:maxY>height-3?height-3-maxY:0;
  for(const id of g.ids){out[id].x+=dx;out[id].y+=dy;}
 }
 return out;
}

// Bottom contact anchors on illustrated support planes. Dependency pairs share
// an anchor; offsets/sizes are design pixels and x/y are plate fractions.
const scenes={
 l2:[
  [.28,.47,[['t1',-6,7,100,-7],['r1',14,-2,77,2]]],
  [.73,.48,[['d1',-13,0,82,-4],['c1',19,4,92,2]]],
  [.16,.62,[['t2',0,0,96,-8]]],
  [.46,.61,[['t3',0,0,86,8]]],
  [.83,.69,[['r3',0,0,67,-6]]],
  [.26,.86,[['d2',-11,0,81,4],['c2',12,4,107,7]]],
  [.66,.86,[['r2',-9,0,73,9],['c5',15,5,82,-5]]],
  [.91,.85,[['d3',0,0,49,-15]]]
 ],
 l3:[
  [.21,.50,[['t1',-9,5,86,-8],['r1',15,-6,87,3]]],
  [.79,.49,[['t2',-9,-3,77,9],['r2',13,9,69,14]]],
  [.49,.51,[['t3',0,0,48,-17]]],
  [.30,.69,[['d1',-8,0,79,-6],['c1',10,-3,59,9]]],
  [.10,.65,[['d5',0,0,49,-14]]],
  [.92,.62,[['t5',0,0,51,9]]],
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
 return out;
}

// Separate wide composition: all original prop sizes, no compressed portrait.
const wideAnchors={
 l2:[[.20,.51],[.68,.51],[.43,.63],[.43,.84],[.88,.62],[.20,.81],[.66,.83],[.92,.86]],
 l3:[[.18,.55],[.81,.55],[.64,.96],[.49,.55],[.35,.96],[.92,.97],[.55,.77],[.87,.78],[.22,.77],[.09,.97]]
};
function fitWide(level,width,height){
 const scale=Math.min(width/360,height/405,1.2),out={};
 scenes[level.id].forEach(([, ,objects],n)=>{const [x,y]=wideAnchors[level.id][n];for(const [id,dx,dy,size,angle] of objects)out[id]={x:x*width+dx*scale,y:y*height+dy*scale,size:Math.max(size,level.layout[id].size)*scale,angle,z:level.layout[id].z};});
 return out;
}
