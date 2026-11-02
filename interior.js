import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original, procedural architectural model based on the approved eight concept views.
export function buildInterior(scene) {
  const labels=[], needles=[], rotors=[], lamps=[], screens=[], blockers=[];
  const mat=(color,metalness=0,roughness=.6)=>new T.MeshStandardMaterial({color,metalness,roughness});
  let seed=137;
  const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  function surface(kind){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    g.fillStyle=kind==='floor'?'#92918b':kind==='concrete'?'#aaa8a2':'#c6c6c3';g.fillRect(0,0,512,512);
    for(let i=0;i<32000;i++){const a=rand()*512,b=rand()*512;g.fillStyle=i%2?'#ffffff0c':'#0000000b';g.fillRect(a,b,rand()*3+1,rand()*2+1);}
    if(kind==='steel'){for(let i=0;i<1200;i++){g.fillStyle=i%2?'#ffffff07':'#00000007';g.fillRect(rand()*512,0,1,512);}}
    else{for(let i=0;i<130;i++){g.strokeStyle='#29282408';g.lineWidth=rand()*2;const x=rand()*512,y=rand()*512;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*40,y+rand()*8);g.stroke();}
      g.strokeStyle='#32322f32';g.lineWidth=1;g.strokeRect(0,0,512,512);}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
  }
  const steelTexture=surface('steel'),floorTexture=surface('floor'),concreteTexture=surface('concrete');
  floorTexture.repeat.set(12,9);concreteTexture.repeat.set(3,2);
  const silver=new T.MeshStandardMaterial({color:0xc7ccd0,map:steelTexture,metalness:.85,roughness:.29,bumpMap:steelTexture,bumpScale:.008});
  const galvanized=new T.MeshStandardMaterial({color:0xb0b5bb,map:steelTexture,metalness:.65,roughness:.48});
  const concrete=new T.MeshStandardMaterial({map:concreteTexture,roughness:.95,bumpMap:concreteTexture,bumpScale:.025});
  const floor=new T.MeshStandardMaterial({map:floorTexture,color:0xb4b1ab,roughness:.66,metalness:.08,bumpMap:floorTexture,bumpScale:.013});
  new T.TextureLoader().load('./floor-concrete.png',texture=>{texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(12,9);texture.anisotropy=4;floor.map=texture;floor.bumpMap=texture;floor.bumpScale=.025;floor.needsUpdate=true;});
  const panel=mat(0xd1d0ca,.15,.58),graphite=mat(0x343a40,.65,.43),black=mat(0x171c22,.3,.62),yellow=mat(0xe9b72d,.2,.42),blue=mat(0x244f77,.45,.36),red=mat(0xa52a20,.25,.36);
  const white=new T.MeshBasicMaterial({color:0xfff9ed,toneMapped:false});
  const glass=new T.MeshStandardMaterial({color:0xb6c9d4,transparent:true,opacity:.16,metalness:.1,roughness:.12,depthWrite:false});
  function mesh(geo,m,x,y,z,parent=scene){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(x,y,z,w,h,d,m=graphite,p=scene)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
  const cyl=(x,y,z,r,h,m=silver,p=scene,r2=r,n=32)=>mesh(new T.CylinderGeometry(r,r2,h,n),m,x,y,z,p);
  const sphere=(x,y,z,r,m=silver,p=scene)=>mesh(new T.SphereGeometry(r,32,20),m,x,y,z,p);
  function ring(x,y,z,r,t=.025,m=silver,axis='y',p=scene){const o=mesh(new T.TorusGeometry(r,t,8,40),m,x,y,z,p);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
  function line(a,b,r=.035,m=yellow,p=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=cyl(0,0,0,r,v.length(),m,p,r,12);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
  function route(points,r=.1,m=silver){
    const pts=points.map(p=>new T.Vector3(...p)),curve=new T.CurvePath();let start=pts[0];
    for(let i=1;i<pts.length-1;i++){const prev=pts[i-1],v=pts[i],next=pts[i+1],d=Math.min(.3,v.distanceTo(prev)*.25,v.distanceTo(next)*.25);const a=v.clone().add(prev.clone().sub(v).normalize().multiplyScalar(d)),b=v.clone().add(next.clone().sub(v).normalize().multiplyScalar(d));curve.add(new T.LineCurve3(start,a));curve.add(new T.QuadraticBezierCurve3(a,v,b));start=b;}
    curve.add(new T.LineCurve3(start,pts.at(-1)));return mesh(new T.TubeGeometry(curve,Math.max(12,points.length*10),r,10,false),m,0,0,0);
  }
  function flange(x,y,z,r=.22,axis='y'){
    const g=new T.Group();g.position.set(x,y,z);scene.add(g);if(axis==='x')g.rotation.z=Math.PI/2;if(axis==='z')g.rotation.x=Math.PI/2;
    cyl(0,0,0,r,.1,silver,g);cyl(0,0,0,r*.96,.016,black,g);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(Math.cos(a)*r*.78,.075,Math.sin(a)*r*.78,.025,.09,graphite,g,.025,6);}
  }
  function valve(x,y,z,axis='y',r=.22){
    const g=new T.Group();g.position.set(x,y,z);scene.add(g);const body=sphere(0,0,0,r*.65,silver,g);body.scale.set(.8,1.1,.8);
    line([0,0,0],[0,.35,.1],.025,silver,g);ring(0,.35,.1,r,.024,graphite,'z',g);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line([0,.35,.1],[Math.sin(a)*r,.35+Math.cos(a)*r,.1],.012,graphite,g);}flange(x,y-.13,z,.15,axis);
  }
  function tag(text,x,y,z,w=1.7,h=.25,physical=false){
    const c=document.createElement('canvas');c.width=768;c.height=112;const g=c.getContext('2d');g.fillStyle='#20262c';g.fillRect(0,0,768,112);g.fillStyle='#e6b62f';g.fillRect(0,0,12,112);g.strokeStyle='#abb0b4';g.strokeRect(1,1,766,110);g.fillStyle='#f1f2ef';g.textAlign='center';g.textBaseline='middle';g.font='600 34px Arial';g.fillText(text,390,57,720);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const o=physical?mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}),x,y,z):new T.Sprite(new T.SpriteMaterial({map,depthTest:true,depthWrite:false}));
    if(!physical){o.position.set(x,y,z);o.scale.set(w,h,1);o.userData.labelSize=[w,h];scene.add(o);labels.push(o);}return o;
  }
  function gauge(x,y,z,r=.13){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#eeeae0';g.fillRect(0,0,128,128);g.strokeStyle='#30343b';g.lineWidth=2;
    for(let i=0;i<21;i++){const a=(i/20*1.5+.75)*Math.PI;g.beginPath();g.moveTo(64+Math.cos(a)*44,64+Math.sin(a)*44);g.lineTo(64+Math.cos(a)*53,64+Math.sin(a)*53);g.stroke();}g.fillStyle='#333';g.font='12px Arial';g.textAlign='center';g.fillText('bar',64,93);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const face=mesh(new T.CircleGeometry(r,24),new T.MeshBasicMaterial({map:tex}),x,y,z+.045);ring(x,y,z,r+.012,.024,silver,'z');
    const needle=new T.Group();needle.position.set(x,y,z+.055);needle.userData.noMerge=true;scene.add(needle);box(0,r*.25,0,.012,r*.65,.008,red,needle);needles.push(needle);line([x,y-r,z],[x,y-r-.18,z],.025,silver);
  }
  function foot(x,z,w,d){box(x,.11,z,w,.22,d,concrete);box(x,.25,z,w-.15,.07,d-.15,graphite);for(const a of [-1,1])for(const b of [-1,1]){cyl(x+a*(w/2-.16),.32,z+b*(d/2-.16),.045,.14,silver,scene,.045,6);}}
  function rail(a,b,y=1.1){line([a[0],y,a[1]],[b[0],y,b[1]]);line([a[0],y-.5,a[1]],[b[0],y-.5,b[1]],.025);const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/1.4);for(let i=0;i<=n;i++){const t=i/n;line([a[0]+(b[0]-a[0])*t,y-1.1,a[1]+(b[1]-a[1])*t],[a[0]+(b[0]-a[0])*t,y,a[1]+(b[1]-a[1])*t]);}}
  function grate(x,y,z,w,d){box(x,y-.03,z,w,.06,d,black);for(let a=-w/2;a<=w/2;a+=.12)box(x+a,y+.02,z,.025,.055,d,galvanized);for(let b=-d/2;b<=d/2;b+=.6)box(x,y+.04,z+b,w,.035,.025,galvanized);}
  function motor(x,y,z,size=.8){
    const body=cyl(x,y,z,size*.38,size*1.2,blue);body.rotation.z=Math.PI/2;
    for(let i=-5;i<=5;i++)ring(x+i*size*.09,y,z,size*.39,.018,blue,'x');
    const end=cyl(x+size*.66,y,z,size*.4,.12,graphite);end.rotation.z=Math.PI/2;
    box(x,y+size*.44,z,size*.5,.18,size*.44,blue);box(x,y-size*.3,z,size,.12,size*.65,blue);
    for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)if(a*a+b*b<7){const hole=cyl(x+size*.73,y+a*size*.105,z+b*size*.105,.026,.014,black,scene,.026,8);hole.rotation.z=Math.PI/2;}
  }
  function pump(x,z,id,name){
    foot(x,z,3.3,1.35);motor(x+.65,.85,z,1);const v=sphere(x-.65,.83,z,.42,blue);v.scale.set(.55,1,1);const guard=cyl(x-.02,.83,z,.24,.5,galvanized);guard.rotation.z=Math.PI/2;
    for(let i=-2;i<=2;i++)ring(x-.02+i*.08,.83,z,.245,.015,black,'x');
    route([[x-1.9,.8,z],[x-.65,.8,z]],.13);route([[x-.65,1.05,z],[x-.65,2.8,z],[x-2,2.8,z],[x-2,5.7,z]],.12);flange(x-1.25,.8,z,.22,'x');flange(x-.65,1.6,z,.22);valve(x-.65,2.1,z);gauge(x-.35,1.85,z+.3);box(x+1.15,1.55,z+.36,.3,.4,.16,panel);tag(id+' / '+name,x,2.55,z+.55,2.7,.32);blockers.push([x-1.8,x+1.8,z-.85,z+.85]);
  }
  function vessel(x,z,r,h,id,name,mixer=false){
    const base=1.5;for(const a of [-1,1])for(const b of [-1,1]){foot(x+a*r*.7,z+b*r*.7,.5,.5);box(x+a*r*.7,.93,z+b*r*.7,.15,1.55,.15,graphite);}
    cyl(x,base+h/2,z,r,h,silver);const top=sphere(x,base+h,z,r);top.scale.y=.34;const bottom=sphere(x,base,z,r);bottom.scale.y=.45;
    for(let y=base;y<=base+h;y+=.65)ring(x,y,z,r+.018,.018,galvanized);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;line([x+Math.sin(a)*r,base,z+Math.cos(a)*r],[x+Math.sin(a)*r,base+h,z+Math.cos(a)*r],.008,galvanized);}
    const man=cyl(x,base+h*.45,z+r+.06,r*.26,.13,silver);man.rotation.x=Math.PI/2;flange(x,base+h*.45,z+r+.15,r*.3,'z');
    route([[x,base-.2,z],[x,.65,z],[x+1.4,.65,z],[x+1.4,.65,z+1.9]],.12);valve(x+1.4,.65,z+1.6);gauge(x+r+.2,2,z+.3);
    if(mixer){cyl(x,base+h+r*.4+.45,z,.24,.8,blue);box(x,base+h+r*.4+.1,z,.68,.12,.68,graphite);for(let i=0;i<8;i++)ring(x,base+h+r*.4+.15+i*.08,z,.25,.015,blue);}
    tag(id+' / '+name,x,base+h*.58,z+r+.4,r*2+.5,.36);blockers.push([x-r-.35,x+r+.35,z-r-.35,z+r+.35]);return base+h;
  }
  function drum(x,z){cyl(x,.72,z,.38,1.08,blue);for(const y of [.21,.48,.99,1.25])ring(x,y,z,.385,.02,galvanized);cyl(x+.12,1.27,z,.06,.025,graphite);tag('SEALED / RESIN',x,.8,z+.385,.5,.13,true);}
  function doorPanel(x,z,width=1.8){box(x,1.65,z,width,3.3,.16,galvanized);for(const dx of [-width/2,width/2])box(x+dx,1.7,z+.02,.09,3.4,.22,graphite);box(x,3.37,z,width+.16,.1,.22,graphite);line([x+width*.32,1.3,z+.15],[x+width*.32,1.9,z+.15],.025,silver);}

  // Continuous building shell: lowered, proportionate high ceiling; every bay is enclosed.
  box(0,-.18,-5,36,.35,26.6,floor);box(0,4.5,-18.3,36,9,.4,concrete);box(-18,4.5,-5,.4,9,26.6,concrete);box(18,4.5,-5,.4,9,26.6,concrete);
  box(-4.76,4.5,8.3,26.48,9,.35,concrete);box(14.71,4.5,8.3,6.58,9,.35,concrete);box(9.95,6.48,8.3,3.2,5.04,.35,panel);box(0,9.1,-5,36.4,.4,27,concrete);
  for(let x=-17;x<=17;x+=1.5){box(x,5.1,-18.06,1.48,7.3,.08,panel);for(const y of [1.7,8.4])cyl(x-.68,y,-17.99,.022,.03,graphite).rotation.x=Math.PI/2;}
  for(const x of [-17.76,17.76])for(let z=-17;z<8;z+=1.5){box(x,5.1,z,.08,7.3,1.48,panel);box(x,1.3,z,.12,.1,1.5,graphite);}
  for(const z of [-16,-10,-4,2,7]){box(0,8.7,z,36,.36,.18,graphite);box(0,8.49,z,36,.06,.35,graphite);for(const x of [-17.5,17.5]){box(x,4.3,z,.25,8.6,.25,graphite);foot(x,z,.6,.6);}}
  // Neutral work fixtures, visible suspension wires and localized pools of light.
  for(const z of [-13,-4,5])for(const x of [-12,-3,7,14]){line([x,8.5,z],[x,7.9,z],.012,black);box(x,7.86,z,1.7,.12,.25,graphite);box(x,7.79,z,1.6,.025,.2,white);}
  for(const [x,z] of [[-12,-12],[-10,2],[0,-10],[2,4],[12,-12],[12,-2]]){const l=new T.PointLight(0xf3f4f5,135,25,2);l.position.set(x,7.35,z);scene.add(l);}
  for(const x of [1.1,5.2])box(x,.015,-4.2,.055,.018,22.5,yellow);
  for(const z of [-15,-7,1]){box(3.15,.018,z,.3,.02,.75,yellow);const a=box(3.04,.018,z-.3,.07,.021,.3,yellow);a.rotation.y=-.65;const b=box(3.26,.018,z-.3,.07,.021,.3,yellow);b.rotation.y=.65;}
  // Overhead services separated from the clear central aisle.
  for(const x of [-8.4,-7.8,-7.2,7,7.6]){route([[x,1,-16],[x,6.4,-16],[x,6.4,5],[x+1.5,6.4,5]],.12);for(const z of [-14,-8,-2,4]){flange(x,6.4,z,.19,'z');line([x,6.6,z],[x,8.45,z],.018,graphite);}}
  for(const x of [-9.4,6.1]){box(x,7.1,-5,.65,.06,22,galvanized);for(const dx of [-.33,.33])box(x+dx,7.22,-5,.04,.22,22,galvanized);for(let z=-16;z<6;z+=.6)box(x,7.22,z,.7,.04,.03,graphite);for(const dx of [-.2,-.07,.08,.21])line([x+dx,7.18,-16],[x+dx,7.18,6],.022,black);}
  tag('B1 / RESIN PROCESS GALLERY',3.3,4.2,-16.8,4,.45,true);

  // 01 — Access stair, retaining the approved closed PIN door.
  box(9.95,-.2,14,4.1,.4,12,concrete);box(7.8,4,14,.35,8,12,concrete);box(12.1,4,14,.35,8,12,concrete);box(9.95,8,14,4.6,.35,12,concrete);box(9.95,4,20,4.6,8,.35,concrete);
  for(const x of [8,11.9])for(let z=9;z<20;z+=1.25)box(x,5.4,z,.05,4.7,1.23,panel);
  for(let i=0;i<12;i++){const z=12+i*.55,h=(i+1)*.24;box(9.95,h/2,z,3.85,h,.55,concrete);box(9.95,h+.018,z-.22,3.8,.025,.06,yellow);}
  for(const x of [8.15,11.75]){line([x,1.2,11.5],[x,4.1,18.5]);for(let i=0;i<6;i++)line([x,i*.48,12+i*1.1],[x,1.3+i*.48,12+i*1.1]);}
  for(const z of [10,14,18]){box(9.95,6.9,z,1.6,.12,.22,graphite);box(9.95,6.83,z,1.5,.02,.2,white);const l=new T.PointLight(0xfff5e5,95,13,2);l.position.set(9.95,6.4,z);scene.add(l);}
  for(const x of [8.22,8.36,8.5])line([x,5.7,9],[x,5.7,19],.025,graphite);
  const door=new T.Group();door.position.set(8.48,0,8.45);door.userData.noMerge=true;scene.add(door);box(1.47,1.98,0,2.94,3.96,.24,galvanized,door);box(1.47,1.98,.14,2.72,3.75,.04,panel,door);
  for(const x of [.1,2.84])box(x,1.98,.18,.045,3.8,.03,black,door);for(const y of [.1,3.87])box(1.47,y,.18,2.8,.04,.03,black,door);
  line([2.5,1.4,.33],[2.5,2.05,.33],.035,silver,door);for(const y of [.6,2,3.4])cyl(.04,y,.1,.06,.23,graphite,door);box(2.25,3.68,.22,.5,.12,.13,graphite,door);
  box(11.65,1.65,8.55,.3,.58,.14,black);for(let i=0;i<12;i++)box(11.56+(i%3)*.085,1.82-Math.floor(i/3)*.1,8.64,.05,.05,.02,white);
  tag('B1 / PROCESS ACCESS',9.95,4.3,8.55,3.2,.4,true);tag('PIN ACCESS',11.65,2.15,8.58,.7,.16,true);

  // 03 — Dry motor-control room: partitioned, with a clear walk-through opening.
  box(-12.7,2.3,7.9,9.5,4.6,.12,panel);box(-17.35,2.3,4.2,.15,4.6,7.3,panel);box(-8,2.3,5.7,.12,4.6,4.4,panel);box(-8,2.3,1.15,.12,4.6,1.5,panel);box(-8,4.1,2.55,.15,1,2.6,panel);
  box(-12.7,1.2,.5,9.5,2.4,.15,panel);box(-12.7,3.5,.5,9.5,2.2,.05,glass);for(const x of [-17.4,-14.2,-11.1,-8])box(x,3.5,.5,.08,2.2,.12,graphite);box(-12.7,4.65,4.2,9.5,.15,7.4,panel);
  blockers.push([-17.5,-8,.3,.7],[-8.2,-7.8,3.5,8],[-8.2,-7.8,.4,1.9],[-17.5,-8,7.6,8]);
  tag('03 / MCC & LOCAL CONTROL',-11.8,3.2,.65,3.8,.35,true);
  const meterCanvas=document.createElement('canvas');meterCanvas.width=256;meterCanvas.height=96;const mg=meterCanvas.getContext('2d');mg.fillStyle='#182b42';mg.fillRect(0,0,256,96);mg.fillStyle='#bcdcf1';mg.font='23px monospace';mg.fillText('400 V   50 Hz',15,38);mg.font='15px monospace';mg.fillText('MCC / LINE MONITOR',15,74);const meterMap=new T.CanvasTexture(meterCanvas);meterMap.colorSpace=T.SRGBColorSpace;
  for(let i=0;i<5;i++){const x=-16.1+i*1.55;box(x,1.65,6.9,1.4,3.2,.65,panel);box(x,1.65,7.27,1.35,3.05,.04,graphite);box(x,1.65,7.3,1.3,3,.03,panel);
    // Cabinet fronts face into the room, toward negative Z.
    box(x,1.7,6.55,1.3,3.05,.03,panel);box(x,2.65,6.51,.75,.35,.04,black);const meter=mesh(new T.PlaneGeometry(.68,.26),new T.MeshBasicMaterial({map:meterMap}),x,2.65,6.48);meter.rotation.y=Math.PI;tag('MCC-0'+(i+1),x,3.5,6.5,1.2,.22);
    for(const yy of [.55,1.6,2.7])box(x-.62,yy,6.49,.04,.15,.045,galvanized);line([x,3.25,6.9],[x,4.1,6.9],.04,graphite);
    for(let j=0;j<3;j++){const m=new T.MeshStandardMaterial({color:[0x9ac591,0xf1b628,0xd63b27][j],emissive:[0x44aa33,0xffa800,0xcc3322][j],emissiveIntensity:.1});const lamp=cyl(x-.36+j*.35,2.15,6.48,.07,.05,m);lamp.rotation.x=Math.PI/2;lamps.push(lamp);}
    box(x-.25,1.55,6.46,.23,.25,.06,yellow);const knob=cyl(x-.25,1.55,6.4,.065,.1,red);knob.rotation.x=Math.PI/2;box(x+.48,1.3,6.45,.035,.35,.06,black);for(let j=0;j<6;j++)box(x,.4+j*.055,6.47,.8,.015,.025,black);
  }
  box(-10.2,.85,3.7,2.4,1.7,.7,graphite);box(-10.2,1.72,3.7,2.5,.1,.9,panel);blockers.push([-11.6,-8.8,3.15,4.25],[-17,-8.5,6.4,7.5]);
  function processScreen(x,y,z){const c=document.createElement('canvas');c.width=512;c.height=320;const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;box(x,y,z,1.05,.7,.08,black);const screen=mesh(new T.PlaneGeometry(.96,.6),new T.MeshBasicMaterial({map}),x,y,z-.047);screen.rotation.y=Math.PI;screens.push({canvas:c,map});}
  processScreen(-10.8,2.15,3.8);processScreen(-9.6,2.15,3.8);
  for(let i=0;i<6;i++)cyl(-11.1+i*.35,1.82,4,.055,.06,i%3?graphite:red);
  tag('MCC-01 / PROCESS ENABLE',-10.2,2.8,4.1,2.8,.3);
  box(-12.7,4.15,6.95,8.8,.1,.45,galvanized);for(let x=-17;x<-8;x+=.4)box(x,4.3,6.95,.03,.3,.45,graphite);
  for(const x of [-15,-10.5]){box(x,4.45,3.7,1.6,.1,.2,graphite);box(x,4.39,3.7,1.5,.015,.17,white);const l=new T.PointLight(0xf4f3ed,45,7,2);l.position.set(x,4.1,3.7);scene.add(l);}
  blockers.push([-17.5,-17.2,.5,7.9]);

  // 04 — Pump line. Motor housings stay fixed; instrument needles show circulation.
  pump(-4.2,0,'P-201','RESIN TRANSFER');pump(-4.2,-4,'P-301','PRODUCT TRANSFER');pump(-4.2,-8,'P-401','COOLING WATER');
  for(const z of [0,-4,-8]){route([[-6.2,5.7,z],[-6.2,6.4,z],[-7.2,6.4,z]],.12);route([[-6.1,.8,z],[-6.8,.8,z],[-6.8,4.7,z],[-6.8,4.7,-13]],.13);}
  tag('04 / PUMP GALLERY',-4.3,4.1,-8.9,3.2,.4);

  // 05 — Reaction and reflux: floor-supported vessels and a proper grated platform.
  vessel(-3.4,-13.6,1.5,3.8,'R-201','JACKETED REACTOR',true);vessel(2.5,-14.8,1.05,2.7,'T-301','BLEND / HOLD',true);vessel(6,-15,.55,1.8,'D-202','CONDENSATE SEPARATOR');
  for(const x of [-6,-.5])for(const z of [-16,-11]){foot(x,z,.6,.6);box(x,2.4,z,.18,4.8,.18,graphite);}
  grate(-3.3,4.8,-16.4,6.1,1.4);grate(-.45,4.8,-13.6,1.2,4.3);rail([-6.3,-17.1],[.2,-17.1],5.9);rail([.2,-17.1],[.2,-11.3],5.9);
  // Service stair terminates at the platform; visitor cameras remain on floor level.
  for(let i=0;i<20;i++){const z=-10-i*.32,y=.24*(i+1);grate(-7.1,y,z,1.3,.31);box(-7.1,y+.035,z+.13,1.3,.025,.035,yellow);}
  for(const x of [-7.8,-6.4]){line([x,1.2,-9.8],[x,5.9,-16.2]);line([x,.2,-9.8],[x,4.9,-16.2],.08,graphite);for(let i=0;i<6;i++)line([x,i*.96,-10-i*1.28],[x,1.2+i*.96,-10-i*1.28]);}
  blockers.push([-8,-6.2,-16.7,-9.6]);
  const exchanger=cyl(5.5,5.5,-12,.5,3.6,silver);exchanger.rotation.z=Math.PI/2;for(const x of [4.2,6.8]){flange(x,5.5,-12,.56,'x');box(x,2.5,-12,.15,5,.15,graphite);box(x,4.9,-12,.5,.2,.9,graphite);foot(x,-12,.65,1.1);}
  route([[-3.4,6.2,-13.6],[-3.4,7,-13.6],[5.5,7,-13.6],[5.5,5.95,-12]],.14);route([[7.3,5.5,-12],[8,5.5,-12],[8,3.8,-15],[6,3.8,-15]],.1);route([[6,1.2,-15],[6,.6,-15],[-3.4,.6,-15],[-3.4,1.5,-13.6]],.1);
  tag('E-202 / REFLUX CONDENSER',5.5,6.3,-11.5,3.3,.3);tag('05 / REACTION & RECOVERY',-2.8,7.5,-17.8,4.2,.4,true);

  // 06 — Segregated day tank, sealed drums, containment and pallet handling.
  box(9.3,2.7,-14,.15,5.4,8,panel);box(13.6,2.7,-9.7,8.6,5.4,.15,panel);box(13.6,5.5,-14,8.6,.2,8.4,panel);
  // Side doorway in the partition (opening -12.2 .. -10.2).
  scene.remove(scene.children.find(o=>o.isMesh&&o.position.x===9.3&&o.position.z===-14));
  box(9.3,2.7,-15.3,.15,5.4,5.4,panel);box(9.3,4.5,-11.2,.15,1.8,2.8,panel);blockers.push([9.1,9.5,-18,-12.4],[9.5,18,-9.85,-9.55]);
  tag('06 / FEED & SEALED STORAGE',13.5,4.5,-9.58,4.1,.35,true);
  const tank=cyl(13.3,1.7,-15.5,.85,4.4,silver);tank.rotation.z=Math.PI/2;for(const x of [11.1,15.5]){const cap=sphere(x,1.7,-15.5,.85);cap.scale.x=.28;}
  for(const x of [11.8,14.8]){box(x,.55,-15.5,.45,1.1,1.6,galvanized);ring(x,1.7,-15.5,.87,.03,galvanized,'x');}
  for(const z of [-16.8,-14.2])box(13.3,.14,z,6,.28,.12,concrete);for(const x of [10.3,16.3])box(x,.14,-15.5,.12,.28,2.7,concrete);
  route([[11,1.7,-15.5],[10.1,1.7,-15.5],[10.1,3.2,-15.5],[10.1,3.2,-11.5],[7.6,3.2,-11.5],[7.6,6.4,-11.5]],.12);valve(10.1,2.5,-15.5);gauge(10.4,2.5,-15.1);tag('TK-101 / CLOSED DAY TANK',13.3,2.9,-14.7,3.3,.32);
  box(15.8,.12,-11.7,2.5,.24,1.8,yellow);for(const x of [15.2,16.3]){drum(x,-11.6);drum(x,-12.3);}blockers.push([10.2,16.5,-16.9,-14],[14.4,17.2,-13,-10.6]);
  for(const x of [12.6,13.2])box(x,.16,-11.2,.15,.12,1.5,yellow);line([13.3,.15,-10.55],[13.3,1.25,-10.4],.04,black);ring(13.3,1.3,-10.4,.23,.035,black,'z');

  // 07 — Filtration, transfer, filling hood and a short drum roller table.
  for(const x of [10,11.4]){foot(x,-3.8,.9,.9);cyl(x,1.65,-3.8,.36,2.2,silver);flange(x,2.8,-3.8,.43);ring(x,2.9,-3.8,.22,.035,graphite,'z');route([[x,1,-3.8],[x,1,-2.6],[12,1,-2.6]],.075);gauge(x+.45,2,-3.4);tag(x===10?'F-401 / FILTER A':'F-402 / FILTER B',x,3.3,-3.35,1.8,.25);blockers.push([x-.5,x+.5,-4.3,-3.2]);}
  vessel(14.5,-5.8,1.05,2.2,'T-402','PRODUCT HOLD');pump(14.5,-2.7,'P-402','FILTER FEED');
  route([[14.5,.65,-4],[14.5,.65,-3],[12,.65,-3],[12,1,-2.6]],.08);box(11.1,.14,1.4,1.65,.28,1.6,yellow);grate(11.1,.3,1.4,1.5,1.4);drum(11.1,1.4);
  route([[12,1,-2.6],[12,2.7,-2.6],[12,2.7,1.4],[11.1,2.7,1.4],[11.1,1.27,1.4]],.055,black);box(11.1,3.2,1.4,1.8,.18,1.5,galvanized);box(11.1,3.6,1.4,.6,.7,.6,galvanized);route([[11.1,3.9,1.4],[11.1,5.8,1.4],[17,5.8,1.4]],.3,galvanized);
  box(14,.62,1.4,3.6,.12,1.25,graphite);for(let x=12.3;x<15.8;x+=.22){const r=cyl(x,.73,1.4,.07,1.2,galvanized);r.rotation.x=Math.PI/2;}for(const x of [12.5,15.5])for(const z of [.9,1.9])box(x,.3,z,.08,.6,.08,graphite);
  for(const x of [13.3,14.6]){const g=new T.Group();scene.add(g);const before=scene.children.length;drum(x,1.4);const objects=scene.children.slice(before);objects.forEach(o=>{o.position.y+=.6;});}
  blockers.push([10,12.1,.4,2.4],[12.1,16,0.6,2.3]);tag('07 / FILTRATION & PRODUCT TRANSFER',12.4,4.7,-7.3,4.7,.4);

  // 08 — Utilities, extraction and enclosed drainage.
  box(-13.3,2.3,-16.8,5,.25,1.7,graphite);for(const x of [-15,-11.5]){box(x,1.1,-16.8,.12,2.2,.12,graphite);foot(x,-16.8,.5,.5);}
  for(let i=0;i<3;i++){const x=-15.1+i*1.2;route([[x,.5,-16.8],[x,6.5,-16.8],[x,6.5,-4],[x+1,6.5,-4]],.22,galvanized);for(const y of [1,3,5]){ring(x,y,-16.8,.23,.025,silver);flange(x,y+.15,-16.8,.28);}valve(x,1.6,-16.4);gauge(x+.3,2.2,-16.35);}
  box(-13.3,1.7,-11.5,1.5,2.7,.8,blue);for(let i=0;i<20;i++)box(-13.3,1.7,-11.85+i*.045,1.25,2.4,.022,galvanized);for(const x of [-14.05,-12.55])for(const y of [.7,2.7])line([x,y,-12],[x,y,-10.8],.035,graphite);
  pump(-13.5,-7.9,'P-501','UTILITY CIRCULATION');tag('HX-501 / PLATE HEAT EXCHANGER',-13.3,3.4,-11,3.8,.3);tag('08 / UTILITIES & EXTRACTION',-12.7,5.2,-17.8,4.2,.4,true);
  box(-16.8,6.6,-10,1.2,1.1,14,galvanized);for(let z=-16;z<-3;z+=1.5){box(-16.8,6.6,z,1.25,1.16,.06,graphite);line([-16.8,7.2,z],[-16.8,8.6,z],.035,graphite);}
  const fanGroup=new T.Group();fanGroup.position.set(-16.1,2.6,-3.6);fanGroup.userData.noMerge=true;scene.add(fanGroup);for(let i=0;i<6;i++){const b=box(0,0,0,.16,1.3,.08,galvanized,fanGroup);b.rotation.z=i*Math.PI/3;}rotors.push(fanGroup);ring(-16.1,2.6,-3.5,.75,.14,graphite,'z');for(let i=-4;i<=4;i++)box(-16.1+i*.16,2.6,-3.35,.015,1.4,.025,galvanized);box(-16.1,4.6,-3.8,1.5,2,.9,galvanized);
  tag('EF-501 / EXTRACTION FAN',-15.8,3.75,-2.9,3,.3);blockers.push([-17.7,-15,-5,-2.8],[-14.4,-12.2,-12.3,-10.8],[-16,-11.2,-17.8,-15.7]);
  grate(-10.5,.025,-8.5,.5,14);box(-10.5,.02,-1.1,2.6,.05,1.8,galvanized);for(const x of [-11.6,-9.4])for(const z of [-1.8,-.4])cyl(x,.08,z,.035,.08,graphite,scene,.035,6);box(-10.5,.055,-1.1,.8,.035,.65,graphite);line([-10.7,.1,-1.1],[-10.3,.1,-1.1],.025,silver);tag('S-501 / CONTAINED SUMP',-10.5,.9,-.8,2.8,.3);
  // Brief contained utility-steam effect; not normal chemical vapour in the occupied hall.
  box(-11.3,2,-14,1.1,.15,.9,galvanized);box(-11.3,2.8,-14,.4,1.6,.4,galvanized);tag('UTILITY DEMO / CAPTURE HOOD',-11.3,3.8,-13.5,3.4,.3);
  const pc=document.createElement('canvas');pc.width=pc.height=64;const pg=pc.getContext('2d'),gradient=pg.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#edf0f299');gradient.addColorStop(1,'#edf0f200');pg.fillStyle=gradient;pg.fillRect(0,0,64,64);const ptex=new T.CanvasTexture(pc),particles=[];
  for(let i=0;i<18;i++){const p=new T.Sprite(new T.SpriteMaterial({map:ptex,transparent:true,opacity:0,depthWrite:false}));scene.add(p);particles.push(p);}
  // Clear area section plates supplement the switchable machine labels.
  for(const [s,x,z] of [['PUMP GALLERY',-4.2,1.7],['PRODUCT TRANSFER',12.5,3.1],['UTILITIES',-12.8,-5]]){const plate=tag(s,x,.025,z,3,.4,true);plate.rotation.x=-Math.PI/2;}
  const views={entrance:{p:[3.1,1.75,5.2],t:[1.4,3,-10],name:'02 / MAIN PROCESS GALLERY'},electrical:{p:[-14.5,1.75,2.7],t:[-11.9,2,6.8],name:'03 / MCC & CONTROL ROOM'},pumps:{p:[.2,1.75,1.4],t:[-4.6,1.7,-3.2],name:'04 / PUMP GALLERY'},reactor:{p:[2.3,1.75,-8.8],t:[-2.8,4.1,-13.6],name:'05 / REACTION & RECOVERY'},feed:{p:[10.3,1.75,-11.4],t:[13.4,1.8,-15.4],name:'06 / FEED & SEALED STORAGE'},filtration:{p:[7.6,1.75,3.6],t:[12,1.8,-2],name:'07 / FILTRATION & TRANSFER'},utilities:{p:[-9.4,1.75,-12.8],t:[-13.4,2.3,-15.5],name:'08 / UTILITIES & EXTRACTION'},drainage:{p:[-8.8,1.75,-.7],t:[-11.4,1,-3.5],name:'S-501 / CONTAINED DRAINAGE'}};
  views.utilities={p:[-9.3,1.75,-5.6],t:[-14,2.8,-11.8],name:'08 / UTILITIES & EXTRACTION'};
  views.reactor={p:[2.2,1.75,-6.8],t:[-3.4,3.6,-13.6],name:'05 / REACTION & RECOVERY'};
  box(13.3,5.25,-13.6,1.6,.1,.2,graphite);box(13.3,5.19,-13.6,1.5,.02,.17,white);
  const feedLight=new T.PointLight(0xf3f2ee,45,10,2);feedLight.position.set(13.3,4.9,-13.6);scene.add(feedLight);
  const canWalk=(x,z)=>x>-17.5&&x<17.4&&z>-17.7&&z<7.75&&!blockers.some(([a,b,c,d])=>x>a-.28&&x<b+.28&&z>c-.28&&z<d+.28);
  // Batch all fixed geometry by material. Moving door, needles and fan remain separate.
  scene.updateMatrixWorld(true);const batches=new Map(),originals=[];
  scene.traverse(o=>{if(!o.isMesh||o.material.transparent||o.material.isMeshBasicMaterial)return;let p=o;while(p){if(p.userData.noMerge)return;p=p.parent;}const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geo);originals.push(o);});
  originals.forEach(o=>o.parent.remove(o));for(const [m,geos] of batches){const merged=mergeGeometries(geos,false);if(merged){const o=new T.Mesh(merged,m);o.castShadow=o.receiveShadow=true;scene.add(o);}geos.forEach(g=>g.dispose());}
  let screenAge=0;
  function update(time,power,steam,dt,camera,showLabels=true){
    rotors.forEach(o=>o.rotation.z+=dt*power*7);needles.forEach((o,i)=>o.rotation.z=1.8-power*2.7+Math.sin(time*2+i)*power*.025);lamps.forEach((o,i)=>o.material.emissiveIntensity=i%3===0?.1+power*.6:.08);
    labels.forEach(o=>{const d=camera.position.distanceTo(o.position),[w,h]=o.userData.labelSize,f=Math.min(1,d*.32/w);o.visible=showLabels&&d<16;o.scale.set(w*f,h*f,1);});
    particles.forEach((p,i)=>{const t=(time*.5+i/18)%1;p.position.set(-11.3+Math.sin(i*7+t*3)*.12,1+t*.9,-14);p.scale.setScalar(.12+t*.4);p.material.opacity=steam*Math.sin(t*Math.PI)*.25;});
    screenAge+=dt;if(screenAge<.2)return;screenAge=0;screens.forEach(({canvas:c,map})=>{const g=c.getContext('2d');g.fillStyle='#1c2634';g.fillRect(0,0,512,320);g.fillStyle='#f3f0e8';g.font='22px monospace';g.fillText('RESIN UNIT / MCC-01',20,35);g.strokeStyle='#a2b7c6';g.lineWidth=4;g.strokeRect(70,70,90,110);g.strokeRect(290,70,90,110);g.beginPath();g.moveTo(160,130);g.lineTo(290,130);g.stroke();g.fillStyle=power>.4?'#e7bb42':'#8c9cac';g.fillRect(215,120,25,20);g.font='24px monospace';g.fillText(power>.4?'CIRCULATION ACTIVE':'STANDBY',20,235);g.fillText((power*12.8).toFixed(1)+' m3/h   '+(24+power*38).toFixed(0)+' C',20,280);map.needsUpdate=true;});
  }
  return {door,canWalk,update,views};
}
