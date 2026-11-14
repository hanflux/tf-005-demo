// Stable route efficiency: no clocks, blocked taps, audio or background penalties.
export const starBudget=level=>({three:level.minimumPeak,two:Math.min(level.capacity,level.minimumPeak+1),stores:level.id==='l3'?4:2});
export function rateRoute(level,peak,stores=0){
 if(!Number.isInteger(peak)||peak<0||peak>level.capacity)throw new RangeError('Invalid route peak');
 if(!Number.isInteger(stores)||stores<0||stores>level.items.length)throw new RangeError('Invalid route stores');
 const b=starBudget(level),stars=peak<=b.three&&stores<=b.stores?3:peak<=b.two&&stores<=b.stores+1?2:1;
 return {stars,peak,storeCount:stores,...b,reason:`最高暂存${peak}格，共暂存${stores}件。三星：峰值≤${b.three}格且件数≤${b.stores}；二星：峰值≤${b.two}格且件数≤${b.stores+1}；其余通关一星。`};
}
export const starKey=(l,help)=>`ssjwl.stars.v1.${l.id}.${l.revision||'original'}.${help?'help':'free'}`;
export function readStars(l,help,storage){try{const raw=storage.getItem(starKey(l,help));if(raw?.length>256)return null;const x=JSON.parse(raw);return x?.version===1&&Number.isInteger(x.stars)&&x.stars>=1&&x.stars<=3?x.stars:null;}catch{return null;}}
export function saveStars(l,help,stars,storage){
 if(!Number.isInteger(stars)||stars<1||stars>3)throw new RangeError('Invalid stars');
 try{const raw=storage.getItem(starKey(l,help));const best=Math.max(stars,readStars(l,help,{getItem:()=>raw})||0);storage.setItem(starKey(l,help),JSON.stringify({version:1,stars:best}));return {best,saved:true};}catch{return {best:stars,saved:false};}
}
