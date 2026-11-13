// Decode only the selected level's resources. Cache completed images, never a
// shared in-flight promise: cancelling one level cannot poison the next one.
export class AssetLoader {
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
