import * as T from 'three';
export function restoreMachinery(scene){
 const steel=new T.MeshStandardMaterial({color:0xaeb6bb,metalness:.85,roughness:.3}),dark=new T.MeshStandardMaterial({color:0x303a42,metalness:.6,roughness:.5}),blue=new T.MeshStandardMaterial({color:0x304e65,metalness:.55,roughness:.4}),red=new T.MeshStandardMaterial({color:0x933e36}),white=new T.MeshStandardMaterial({color:0xd1d7d5});
 const add=(geo,mat,x,y,z)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;scene.add(o);return o;};
 const box=(x,y,z,w,h,d,m=steel)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
 const pipe=(a,b,r,m=steel)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=add(new T.CylinderGeometry(r,r,av.distanceTo(bv),24),m,...av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;};
 function gauge(x,y,z){pipe([x,y,z-.05],[x,y,z+.05],.13,dark);pipe([x,y,z+.05],[x,y,z+.06],.11,white);const needle=box(x,y+.025,z+.07,.012,.13,.012,dark);needle.rotation.z=-.6;}
 const rotors=[];
 function pump(x,z){box(x,.25,z,.85,.22,.6,dark);pipe([x-.3,.65,z],[x+.15,.65,z],.18,blue);for(let i=0;i<9;i++)box(x-.28+i*.045,.65,z,.015,.4,.4,steel);const head=add(new T.SphereGeometry(.23,24,12),steel,x+.27,.65,z);head.scale.x=.6;pipe([x+.27,.65,z],[x+.27,1.05,z],.05);pipe([x+.27,.65,z],[x+.27,.65,z+.3],.05);gauge(x+.27,1.2,z);}
 // Horizontal separator: ellipsoidal end caps, saddles, sight tube and two drain outlets.
 pipe([-9,1.5,2.8],[-6.8,1.5,2.8],.55);for(const x of [-9,-6.8]){const cap=add(new T.SphereGeometry(.55,32,20),steel,x,1.5,2.8);cap.scale.x=.35;}
 for(const x of [-8.7,-7.1]){box(x,.65,2.8,.18,1.1,1.2,dark);pipe([x,1.05,2.8],[x,.5,2.8],.065);pipe([x,.5,2.8],[x,.5,3.45],.065);}
 box(-7.8,1.5,3.36,.16,.68,.05,dark);box(-7.8,1.5,3.4,.06,.53,.025,white);pipe([-8.7,2,2.8],[-8.7,2.5,2.8],.065);gauge(-8.7,2.5,2.8);
 // Contained sump with removable grate, two clearly separate transfer pump sets.
 box(-4.2,.12,2.8,2.2,.24,1.5,dark);for(let x=-5.2;x<-3.2;x+=.1)box(x,.26,2.8,.025,.04,1.4,steel);pump(-4.8,2.8);pump(-3.5,2.8);pipe([-4.8,.5,2.8],[-4.8,.2,2.8],.07);box(-3.35,1.5,3.2,.17,.32,.12,blue);
 // Full polish-filter skid: shell, clamp ring, bolted lid, gauges and pump.
 box(4.2,.2,2.8,1.9,.22,1.5,dark);pipe([4.35,.65,2.8],[4.35,2.1,2.8],.38);
 for(const y of [.7,1.95,2.1]){const r=add(new T.TorusGeometry(.39,.028,8,32),steel,4.35,y,2.8);r.rotation.x=Math.PI/2;}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;box(4.35+Math.cos(a)*.37,2.1,2.8+Math.sin(a)*.37,.06,.1,.06,dark);}pump(3.65,2.8);
 for(const x of [3.55,4.85]){pipe([x,.8,2.8],[x,1.7,2.8],.055);gauge(x,1.85,2.8);}pipe([3.55,1.2,2.8],[4.85,1.2,2.8],.055);
 // Centrifugal fan: scroll-like housing, belt-drive motor and square discharge transition.
 box(7.7,.2,2.8,2,.2,1.5,dark);const housing=pipe([7.5,1.2,2.5],[7.5,1.2,3.05],.65,blue);box(8,1.8,2.8,.7,.6,.55,steel);box(8.2,2.55,2.8,.5,1,.55,steel);pipe([6.9,.65,2.7],[7.3,.65,2.7],.2,dark);
 const fan=new T.Group();fan.position.set(7.5,1.2,3.07);scene.add(fan);for(let i=0;i<6;i++){const blade=new T.Mesh(new T.BoxGeometry(.08,.95,.035),steel);blade.rotation.z=i*Math.PI/3;fan.add(blade);}rotors.push(fan);for(let x=7.05;x<=7.96;x+=.12)box(x,1.2,3.12,.018,1.04,.03,dark);
 // Restored gas detector heads and emergency isolation panel.
 for(const x of [-7.3,1.5,6.1]){box(x,1.4,-1.05,.22,.3,.15,white);pipe([x,1.25,-1.05],[x,1.1,-1.05],.065,dark);box(x,1.45,-.965,.11,.06,.01,blue);pipe([x,1.55,-1.05],[x,3.4,-1.05],.012,dark);}
 box(-12.5,1.55,5.5,.45,.7,.22,white);pipe([-12.5,1.7,5.62],[-12.5,1.7,5.7],.085,red);box(-12.5,1.35,5.64,.2,.12,.02,dark);
 // Reactor relief and pressure instrument assembly, routed toward a closed rear header.
 pipe([-8.1,4.6,-4.6],[-8.1,5.25,-4.6],.065);box(-8.1,5.15,-4.6,.2,.25,.2,blue);pipe([-8.1,5.2,-4.6],[-8.1,5.2,-7],.065);gauge(-8.4,4.9,-3.65);
 return {update(dt,power){rotors.forEach(o=>o.rotation.z+=dt*power*7);}};
}
