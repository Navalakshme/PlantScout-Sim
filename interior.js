import * as T from 'three';
import {buildIndustry} from './industrial-layout.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function buildInterior(scene){
 const equipment=buildIndustry(T,scene);
 // Keep the original compact plant composition and its equipment labels.
 const labels=[];scene.traverse(o=>{if(o.isSprite){o.userData.labelScale=o.scale.clone();labels.push(o);}});
 equipment.facilityLights.forEach(l=>scene.remove(l));
 equipment.materials.floorMat.color.setHex(0xb0b1af);equipment.materials.floorMat.roughness=.32;
 equipment.materials.concrete.color.setHex(0x969590);
 equipment.materials.concreteDark.color.setHex(0x777b7b);
 // Ground the old plant in textured, darker concrete and steel instead of white room partitions.
 new T.TextureLoader().load('./floor-concrete.png',floorTexture=>{
  floorTexture.colorSpace=T.SRGBColorSpace;floorTexture.wrapS=floorTexture.wrapT=T.RepeatWrapping;floorTexture.repeat.set(8,5);floorTexture.anisotropy=4;
  equipment.materials.floorMat.map=floorTexture;equipment.materials.floorMat.bumpMap=floorTexture;equipment.materials.floorMat.bumpScale=.02;equipment.materials.floorMat.needsUpdate=true;
  const wallTexture=floorTexture.clone();wallTexture.repeat.set(3,2);wallTexture.needsUpdate=true;
  for(const m of [equipment.materials.concrete,equipment.materials.concreteDark]){m.map=wallTexture;m.bumpMap=wallTexture;m.bumpScale=.025;m.needsUpdate=true;}
 });
 scene.children.filter(o=>o.isGridHelper).forEach(o=>scene.remove(o));
 scene.children.filter(o=>o.isMesh&&o.position.z>8.1&&o.position.z<8.3&&o.position.x>8&&o.position.x<12&&o.position.y>1&&o.position.y<3).forEach(o=>scene.remove(o));
 const texture=(base,noise,grid=false)=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);let seed=38;for(let i=0;i<22000;i++){seed=(seed*16807)%2147483647;const a=seed%512;seed=(seed*16807)%2147483647;const b=seed%512;x.fillStyle=i%2?'#ffffff09':'#0000000d';x.fillRect(a,b,noise,noise);}if(grid){x.strokeStyle='#16201d55';x.lineWidth=3;x.strokeRect(1,1,510,510);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,4);return t;};
 const wall=new T.MeshStandardMaterial({map:texture('#4a4b4b',3,true),roughness:.78,metalness:.22});
 const concrete=new T.MeshStandardMaterial({map:texture('#68635d',4),roughness:.94});
 const metal=new T.MeshStandardMaterial({color:0x62666b,metalness:.6,roughness:.43});
 const dark=new T.MeshStandardMaterial({color:0x282c31,metalness:.5,roughness:.65});
 const yellow=new T.MeshStandardMaterial({color:0x747f85,roughness:.65});
 const oxidized=new T.MeshStandardMaterial({map:texture('#5a5852',3),metalness:.46,roughness:.82});
 const blue=new T.MeshStandardMaterial({color:0x4b6879,metalness:.55,roughness:.51});
 const lamp=new T.MeshBasicMaterial({color:0xf3e6ce,toneMapped:false});
 function box(x,y,z,w,h,d,m=metal,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function pipe(a,b,r=.035,m=yellow,parent=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),12),m);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());parent.add(o);return o;}
 function sign(text,x,y,z,w=2.5,h=.48,color='#e5d5b0'){const c=document.createElement('canvas');c.width=768;c.height=128;const g=c.getContext('2d');g.fillStyle='#20252b';g.fillRect(0,0,768,128);g.strokeStyle=color;g.lineWidth=6;g.strokeRect(6,6,756,116);g.fillStyle=color;g.font='600 38px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,64,720);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}));o.position.set(x,y,z);scene.add(o);return o;}
 // Insulated panel liners, continuous structural roof and full-height front wall.
 box(0,9,-8.3,27.4,8.8,.4,wall);box(-13.45,6.8,0,.4,13.6,16.8,wall);box(13.45,6.8,0,.4,13.6,16.8,wall);
 box(-2.46,6.8,8.28,21.88,13.6,.38,wall);box(12.46,6.8,8.28,2.08,13.6,.38,wall);box(9.95,8.78,8.28,3.2,9.64,.38,wall);
 box(0,13.65,0,27.6,.5,17,concrete);
 for(let x=-12;x<14;x+=3){box(x,8.7,-8.02,.08,9.8,.08,dark);box(x,13.15,0,.22,.55,16.4,dark);}
 for(const z of [-6,0,6]){box(0,12.7,z,27,.45,.28,dark);for(const x of [-9,0,9])box(x,12.35,z,2.2,.12,.22,lamp);}
 for(const x of [-8,0,8]){const l=new T.PointLight(0xe7e7e5,85,22,2);l.position.set(x,10.7,-3);scene.add(l);}
 for(const x of [-9,-1,8]){const l=new T.PointLight(0xffdbab,32,13,2);l.position.set(x,3.8,3.7);scene.add(l);}
 // Keep the original narrow operator deck so the vessels remain visible from the entrance.
 const deckSteel=new T.MeshStandardMaterial({color:0x555b60,metalness:.65,roughness:.54});
 // Metal-clad wall seams, anchor plates and a lower maintenance band.
 for(let x=-12;x<13;x+=1.5){box(x,8.6,-8.04,.025,8.9,.03,deckSteel);for(const y of [5.1,9.1,12.7])box(x,y,-8,.07,.07,.025,deckSteel);}
 for(const z of [-6,-3,0,3,6])for(const x of [-13.2,13.2]){box(x,3.6,z,.05,.12,1.5,dark);pipe([x,3.8,z],[x,3.8,z+1.5],.025,deckSteel);}
 // Pipe bridges tie the visible bays into one plant rather than isolated displays.
 // Front-wall service run: bunded utility vessels, instrument air, cable tray and drainage.
 // These continue the process language across the aisle while leaving a walkable route.
 for(const [height,radius,material] of [[2.85,.072,blue],[3.18,.065,metal],[3.52,.05,yellow]]){
  pipe([-12.2,height,7.68],[6.9,height,7.68],radius,material);
  for(const x of [-11,-8,-5,-2,1,4,6.5]){box(x,height,7.94,.08,.16,.42,dark);box(x,height,8.08,.32,.2,.12,metal);}
 }
 for(let x=-12;x<7;x+=.36){box(x,5.18,7.76,.035,.035,.62,deckSteel);}
 box(-2.55,5.12,7.8,19.2,.09,.67,dark);
 for(let x=-11.5;x<7;x+=1.8){box(x,5.44,7.94,.06,.6,.08,dark);box(x,5.72,7.94,.32,.08,.08,metal);}
 const vessel=(x,tag)=>{
  box(x,.15,6.65,2.15,.3,2.0,oxidized);
  for(const offset of [-.75,.75])for(const z of [5.85,7.45])box(x+offset,.38,z,.12,.48,.12,dark);
  const body=new T.Mesh(new T.CylinderGeometry(.52,.52,2.15,32),oxidized);body.position.set(x,1.67,6.65);body.castShadow=body.receiveShadow=true;scene.add(body);
  for(const y of [.72,1.72,2.68]){const band=new T.Mesh(new T.TorusGeometry(.523,.035,8,32),metal);band.rotation.x=Math.PI/2;band.position.set(x,y,6.65);scene.add(band);}
  pipe([x,2.8,6.65],[x,3.18,6.65],.075,blue);
  pipe([x-.52,1.1,6.65],[x-1,1.1,6.65],.065,metal);
  const dial=new T.Mesh(new T.CylinderGeometry(.16,.16,.055,24),lamp);dial.rotation.z=Math.PI/2;dial.position.set(x-.72,1.35,6.65);scene.add(dial);
  box(x,.55,7.19,.88,.19,.045,dark);
  sign(tag,x,.55,7.23,.82,.17);
 };
 vessel(-9.3,'UT-01 / CONDENSATE');vessel(-6.55,'UT-02 / COOLING');
 for(const x of [-9.3,-6.55]){
  pipe([x,3.18,7.68],[x,3.18,6.65],.065,metal);
  const wheel=new T.Mesh(new T.TorusGeometry(.18,.027,8,24),yellow);wheel.position.set(x,3.38,7.15);scene.add(wheel);
 }
 for(const x of [-3.4,1.25,5.5]){
  box(x,2,7.91,.9,1.25,.34,dark);box(x,2.05,7.72,.75,.72,.045,metal);
  for(let i=0;i<3;i++){const gauge=new T.Mesh(new T.CylinderGeometry(.085,.085,.035,20),lamp);gauge.rotation.x=Math.PI/2;gauge.position.set(x-.23+i*.23,2.1,7.685);scene.add(gauge);}
  pipe([x,2.65,7.75],[x,3.52,7.68],.025,metal);
 }
 // Segmented grated drain and worn aisle edge markings.
 box(-1.75,.018,5.12,19.9,.025,.68,dark);
 for(let x=-11.65;x<8.1;x+=.13)box(x,.044,5.12,.032,.035,.62,deckSteel);
 for(const z of [4.82,5.42])box(-1.75,.055,z,19.9,.025,.03,metal);
 for(const z of [4.7,5.54])for(let x=-11.6;x<8.2;x+=1.2)box(x,.028,z,.72,.015,.025,yellow);
 for(const x of [-11.7,-7.6,-3.5,.6,4.7])box(x,.03,5.96,.035,.02,.52,oxidized);
 // A small drum-handling station sits beside the product line, clear of the entry path.
 const drumPaint=new T.MeshStandardMaterial({color:0x354656,metalness:.4,roughness:.46});
 for(const x of [.2,1.3]){box(x,.12,3.1,.9,.22,1.1,dark);const body=new T.Mesh(new T.CylinderGeometry(.34,.34,1.04,28),drumPaint);body.position.set(x,.75,3.1);body.castShadow=true;scene.add(body);for(const y of [.25,.52,1.02,1.25]){const rim=new T.Mesh(new T.TorusGeometry(.345,.018,8,28),metal);rim.rotation.x=Math.PI/2;rim.position.set(x,y,3.1);scene.add(rim);}}
 // Stair enclosure: 12 risers descending to a closed thermal door.
 box(9.95,-.2,14,4.1,.4,12,concrete);box(7.8,4,14,.35,8,12,wall);box(12.1,4,14,.35,8,12,wall);box(9.95,8,14,4.6,.35,12,concrete);box(9.95,4,20,4.6,8,.35,wall);
 for(let i=0;i<12;i++){const z=12+i*.55,h=(i+1)*.24;box(9.95,h/2,z,3.85,h,.55,concrete);box(9.95,h+.018,z-.22,3.8,.03,.07,yellow);}
 for(const x of [8.15,11.75]){pipe([x,1.2,11.5],[x,4.1,18.5]);for(let i=0;i<6;i++)pipe([x,i*.48,12+i*1.1],[x,1.3+i*.48,12+i*1.1]);}
 for(const z of [10,14,18]){box(9.95,6.9,z,1.8,.1,.22,lamp);const l=new T.PointLight(0xf0d7a9,70,12,2);l.position.set(9.95,6.4,z);scene.add(l);}
 sign('B1 / RESIN PROCESS GALLERY',9.95,4.25,8.55,3.1);
 const door=new T.Group();door.position.set(8.48,0,8.45);door.userData.noMerge=true;scene.add(door);
 box(1.47,1.98,0,2.94,3.96,.25,metal,door);box(1.47,1.98,.14,2.7,3.7,.04,wall,door);
 for(const y of [.22,3.72])box(1.47,y,.19,2.78,.05,.06,dark,door);
 for(const x of [.14,2.8])box(x,1.98,.19,.06,3.55,.06,dark,door);
 pipe([2.5,1.5,.33],[2.5,2.2,.33],.045,yellow,door);box(2.5,1.85,.24,.15,.8,.1,dark,door);
 box(11.68,1.65,8.55,.3,.58,.14,dark);
 for(let i=0;i<12;i++)box(11.58+(i%3)*.09,1.82-Math.floor(i/3)*.1,8.64,.05,.05,.02,lamp);
 sign('PIN ACCESS',11.65,2.15,8.58,.65,.16);
 sign('POWER / LOCAL CONTROL',-9.9,3.3,-3.2,3.3);
 sign('UTILITY STEAM / DEMO VENT',-7.5,2.7,4.7,2.5,.32);
 // Enclosed control station visible immediately after entering.
 box(12,1.15,6.5,2.6,2.3,.7,dark);box(12,1.6,6.88,2.4,1.1,.05,metal);
 const screen=document.createElement('canvas');screen.width=512;screen.height=256;const screenMap=new T.CanvasTexture(screen);screenMap.colorSpace=T.SRGBColorSpace;
 const display=new T.Mesh(new T.PlaneGeometry(1.6,.8),new T.MeshBasicMaterial({map:screenMap}));display.position.set(11.7,1.7,6.93);scene.add(display);
 for(let i=0;i<3;i++)box(12.75,1.95-i*.25,6.96,.12,.12,.08,new T.MeshBasicMaterial({color:[0xb5d5a0,0xcaa353,0xe6755b][i]}));
 sign('MCC-01 / PROCESS ENABLE',12,2.65,6.91,2.5,.3);
 // Ventilation fan rotor inside a stationary protective grille.
 const fan=new T.Group();fan.position.set(-10,3.2,7.88);fan.userData.noMerge=true;scene.add(fan);
 for(let i=0;i<6;i++){const blade=box(0,0,0,.16,1.35,.06,metal,fan);blade.rotation.z=i*Math.PI/3;}
 for(let i=-4;i<=4;i++)box(-10+i*.18,3.2,7.72,.025,1.55,.04,dark);
 const flowRotors=[];for(const x of [-5.1,-.8,3.5,7.8]){const rotor=new T.Mesh(new T.TorusGeometry(.18,.025,8,20),yellow);rotor.position.set(x,1.55,-1.66);rotor.userData.noMerge=true;scene.add(rotor);const spoke=box(0,0,0,.32,.025,.025,yellow,rotor);flowRotors.push(rotor);}
 const mixers=[];
 for(const [x,y,z] of [[-3.2,12.0,-5.4],[8,11.0,-4.9]]){const r=new T.Group();r.position.set(x,y,z);r.userData.noMerge=true;scene.add(r);for(let i=0;i<3;i++){const b=box(0,0,0,.62,.05,.08,metal,r);b.rotation.y=i*Math.PI/3;}mixers.push(r);}
 let screenAge=0;
 const particles=[];const puffCanvas=document.createElement('canvas');puffCanvas.width=puffCanvas.height=64;const pg=puffCanvas.getContext('2d'),grad=pg.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'#e4ebeac0');grad.addColorStop(1,'#e4ebea00');pg.fillStyle=grad;pg.fillRect(0,0,64,64);const puffTex=new T.CanvasTexture(puffCanvas);
 for(let i=0;i<28;i++){const p=new T.Sprite(new T.SpriteMaterial({map:puffTex,transparent:true,opacity:0,depthWrite:false}));scene.add(p);particles.push(p);}
 // Walking clearance keeps the visitor away from equipment bases and walls.
 const blocked=[[-12.8,12.8,-8,-1.25],[10.6,12.9,2.2,6.9],[-10.5,-5.3,5.65,7.6],[-4.4,-1.9,6.0,7.6],[-.4,.8,6.5,7.8],[2.9,4.5,7.1,7.9],[5,7.2,6.1,7.5],[ -.4,1.9,2.5,3.7]];
 const canWalk=(x,z)=>x>-12.7&&x<12.7&&z>-7.5&&z<7.85&&!blocked.some(([a,b,c,d])=>x>a-.18&&x<b+.18&&z>c-.18&&z<d+.18)&&![-11.2,-5.6,0,5.6,11.2].some(cx=>[-5.8,0].some(cz=>Math.hypot(x-cx,z-cz)<.52));
 function update(time,power,steam,dt,camera,showLabels=true){labels.forEach(o=>{const d=o.position.distanceTo(camera.position),scale=o.userData.labelScale,f=Math.min(1,d*.30/scale.x);o.visible=showLabels&&d<9;o.scale.copy(scale).multiplyScalar(f);});fan.rotation.z+=power*dt*8;mixers.forEach(r=>r.rotation.y+=power*dt*3);flowRotors.forEach(r=>r.rotation.z+=power*dt*4);equipment.panelStatusLights.forEach((l,i)=>{l.visible=power>.05||i%3===0;});particles.forEach((p,i)=>{const t=(time*.27+i/28)%1;p.position.set(-7.6+Math.sin(i*8+t*4)*t*.5,1.3+t*2.7,4.4-t*.35);p.scale.setScalar(.25+t*1.4);p.material.opacity=steam*Math.sin(t*Math.PI)*.23;});screenAge+=dt;if(screenAge<.2)return;screenAge=0;const g=screen.getContext('2d');g.fillStyle='#18232e';g.fillRect(0,0,512,256);g.fillStyle='#e7c477';g.font='24px monospace';g.fillText('MCC-01 / RESIN UNIT',24,42);g.font='38px monospace';g.fillText(power>.4?'PROCESS RUNNING':'STANDBY',24,105);g.font='20px monospace';g.fillText('CIRCULATION '+(power*12.8).toFixed(1)+' m3/h',24,165);g.fillText('EXTRACTION '+(power>.05?'ON':'OFF'),24,215);screenMap.needsUpdate=true;}
 // Batch fixed plant meshes while preserving moving assemblies and status lamps.
 equipment.panelStatusLights.forEach(o=>o.userData.noMerge=true);
 scene.updateMatrixWorld(true);const batches=new Map(),originals=[];
 scene.traverse(o=>{if(!o.isMesh||!o.visible||o.material.transparent||o.material.isMeshBasicMaterial)return;let p=o;while(p){if(!p.visible||p.userData.noMerge)return;p=p.parent;}const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geo);originals.push(o);});
 originals.forEach(o=>o.parent.remove(o));for(const [m,geos] of batches){const merged=mergeGeometries(geos,false);if(merged){const o=new T.Mesh(merged,m);o.castShadow=o.receiveShadow=true;scene.add(o);}geos.forEach(g=>g.dispose());}
 return {door,canWalk,update};

}
