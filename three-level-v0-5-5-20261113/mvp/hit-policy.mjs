// Small, authored inner pockets, not a transparent bounding rectangle.
// They only belong to these two L2 illustrations and rotate with the image.
export const pockets=Object.freeze({
 c2:Object.freeze({cx:.50,cy:.45,rx:.31,ry:.20,maxDistance:24}),
 c5:Object.freeze({cx:.50,cy:.49,rx:.23,ry:.20,maxDistance:20})
});
const movingShears=Object.freeze({cx:.50,cy:.53,rx:.15,ry:.16,maxDistance:8});
export const pocketFor=(level,id)=>level==='l2'?pockets[id]:level==='l3'&&id==='c5'?movingShears:null;
export function inPocket(level,id,u,v){const p=pocketFor(level,id);return !!p&&((u-p.cx)/p.rx)**2+((v-p.cy)/p.ry)**2<=1;}
export function distanceToAlpha(mask,u,v,size,limit){
 const px=u*128,py=v*128,r=limit/size*128;let best=Infinity;
 for(let y=Math.max(0,Math.floor(py-r));y<Math.min(128,Math.ceil(py+r));y++)for(let x=Math.max(0,Math.floor(px-r));x<Math.min(128,Math.ceil(px+r));x++){
  if(mask[(y*128+x)*4+3]<128)continue;const d=Math.hypot(x+.5-px,y+.5-py)*size/128;if(d<best)best=d;
 }return best<=limit?best:Infinity;
}
