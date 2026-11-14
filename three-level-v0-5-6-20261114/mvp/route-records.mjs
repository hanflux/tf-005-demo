// Per-device, per-level-revision optional records. No account or network calls.
export const recordKey=level=>`ssjwl.best-peak.v1.${level.id}.${level.revision||'original'}`;
const valid=(value,capacity)=>Number.isInteger(value)&&value>=0&&value<=capacity;
export function readBest(level,storage){
 let raw;
 try{raw=storage.getItem(recordKey(level));}catch{return {best:null,available:false};}
 if(raw===null||raw.length>256)return {best:null,available:true};
 try{const record=JSON.parse(raw);return {best:record?.version===1&&valid(record.bestPeak,level.capacity)?record.bestPeak:null,available:true};}
 catch{return {best:null,available:true};}
}
export function saveBest(level,peak,storage){
 if(!valid(peak,level.capacity))throw new RangeError('Invalid completed route peak');
 const previous=readBest(level,storage),best=previous.best===null?peak:Math.min(peak,previous.best);
 const result={best,previous:previous.best,first:previous.best===null,improved:previous.best!==null&&peak<previous.best,saved:false};
 // If reads fail, do not risk overwriting an unknown older personal best.
 if(!previous.available)return result;
 try{storage.setItem(recordKey(level),JSON.stringify({version:1,bestPeak:best}));result.saved=true;}catch{}
 return result;
}
