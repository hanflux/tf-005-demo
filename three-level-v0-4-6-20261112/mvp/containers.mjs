// All categories share one original flat-illustrated ordinary storage box.
export const containerKind=(level,id)=>level.id==='l2'?({toy:'paper',cat:'tools',daily:'daily',recycle:'recycle'}[id]):id;
export function containerHTML(level,category,n,total,uid){
 const kind=containerKind(level,category.id);
 return `<div class="bin" data-category="${category.id}" data-kind="${kind}" data-state="${n===total?'full':n?'collecting':'empty'}" aria-label="${category.name}，${n} / ${total}"><img class="container-art" src="./art-046/storage-box.webp" alt="" draggable="false"><span class="bin-mouth" aria-hidden="true"></span><div class="bin-label"><b>${category.name}</b><span class="bin-count">${n} / ${total}</span></div><span class="bin-complete" aria-hidden="true">收好 ✓</span></div>`;
}
