// R3.2 display only. Coordinates: 360×456 room, x=center, y=bottom contact anchor.
// Core item IDs and blockedBy remain in frozen ../../level.mjs.
export const layout={
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
// PNG selected for trial after small-size inspection; WebP alternatives measured in manifest.
export const sprites={t1:'t1-train',t2:'t2-blocks',d1:'d1-mug',d2:'d2-clock',r1:'r1-box',r2:'r2-bottle',c4:'c4-bowl',c2:'c2-wand',d4:'d4-umbrella',d5:'d5-towel',c3:'c3-scratcher',t3:'t3-top',t4:'t4-pinwheel',t5:'t5-car',d3:'d3-glove',c1:'c1-catfood',c5:'c5-yarn',r3:'r3-paperbag',r4:'r4-newspaper',r5:'r5-can'};
export const selections={t1:256,t2:128,d1:128,d2:256,r1:256,r2:128,c4:128,c2:256,d4:256,d5:256,c3:256,t3:256,t4:256,t5:256,d3:256,c1:256,c5:256,r3:256,r4:256,r5:256};
export const spritePath=id=>`exports/${sprites[id]}-${selections[id]}.png`;
