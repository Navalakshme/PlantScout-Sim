export function buildIndustry(T,scene){
 const mat=(c,r=.5,m=.1)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const steel=mat(0xb9bec0,.27,.92),steelDark=mat(0x30363b,.48,.65),galvanized=mat(0x969da0,.38,.8),concrete=mat(0x969590,.85),concreteDark=mat(0x777b7b,.7),floorMat=mat(0xa0a4a4,.28,.24),blue=mat(0x243e52,.4,.5);
 function box(x,y,z,w,h,d,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o;}
 function pipe(a,b,r,m=steel){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),32),m);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());scene.add(o);return o;}
 function ring(x,y,z,r,t=.025){const o=new T.Mesh(new T.TorusGeometry(r,t,8,48),steel);o.rotation.x=Math.PI/2;o.position.set(x,y,z);scene.add(o);}
 function flange(x,y,z,r=.14){pipe([x,y,z-.045],[x,y,z+.045],r);for(let i=0;i<8;i++){const a=i*Math.PI/4;pipe([x+Math.cos(a)*r*.79,y+Math.sin(a)*r*.79,z-.06],[x+Math.cos(a)*r*.79,y+Math.sin(a)*r*.79,z+.06],.018,steelDark);}}
 function tag(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=80;const g=c.getContext('2d');g.fillStyle='#d5d7d5';g.fillRect(0,0,512,80);g.fillStyle='#252c30';g.font='26px monospace';g.fillText(text,12,50);const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c)}));s.position.set(x,y,z);s.scale.set(1.5,.24,1);scene.add(s);}
 box(0,-.14,0,27,.28,16.6,floorMat);box(0,3.2,-8.2,27,6.4,.3,concrete);
 box(0,6.7,0,27,.3,16.6,concrete);
 for(const x of [-11,-5.5,0,5.5,11]){box(x,3.3,-.75,.55,6.6,.65,concrete);box(x,6.25,0,.6,.45,16,concrete);}
 // Raised continuous process curb, with a clear pedestrian gallery in front.
 box(0,.18,-4.5,25,.36,6.2,concreteDark);
 for(const [i,x] of [-8.7,-3.2,2.3,7.8].entries()){
 const z=-4.6,r=1.13,h=3.1;
 pipe([x,1.55,z],[x,1.55+h,z],r);
 for(const [y,sy] of [[1.55,.42],[4.65,.42]]){const o=new T.Mesh(new T.SphereGeometry(r,48,24),steel);o.scale.y=sy;o.position.set(x,y,z);scene.add(o);}
 for(const y of [1.55,2.6,3.65,4.65])ring(x,y,z,r+.012,.018);
 for(const dx of [-.8,.8])for(const dz of [-.65,.65]){pipe([x+dx,.4,z+dz],[x+dx,1.7,z+dz],.065);box(x+dx,.45,z+dz,.3,.08,.3,steelDark);}
 pipe([x,5.1,z],[x,5.7,z],.11);box(x,5.34,z,.32,.45,.32,blue);
 pipe([x,1.4,z],[x,1.4,-1.8],.085);flange(x,1.4,-2.3);flange(x,1.4,-1.9);
 box(x+.7,.58,-2.2,1.4,.22,.85,steelDark);
 pipe([x+.55,.93,-2.2],[x+1.25,.93,-2.2],.23,steelDark);
 for(let j=0;j<12;j++)ring(x+.8,.83+j*.018,-2.2,.22,.009);
 pipe([x+.18,.93,-2.2],[x+.55,.93,-2.2],.3,blue);
 for(const dx of [-1.55,1.55]){pipe([x+dx,.65,-3],[x+dx,5.8,-3],.055);for(const y of [1.3,2.4,4]){flange(x+dx,y,-3);pipe([x+dx,y,-3],[x+dx,y,-2.7],.05);const wheel=new T.Mesh(new T.TorusGeometry(.11,.016,8,24),blue);wheel.position.set(x+dx,y,-2.65);scene.add(wheel);}}
 tag(['R-101 / RESIN REACTOR','R-102 / BLEND VESSEL','V-201 / HOLD TANK','V-202 / PRODUCT'][i],x,2.7,-3.42);
 }
 // Dense ceiling services with realistic small diameters and support spacing.
 for(let j=0;j<14;j++){const z=-7+j*.46,y=5.7+(j%3)*.16;pipe([-12.8,y,z],[12.8,y,z],j%4===0?.10:.035);for(const x of [-11,-6,-1,4,9]){box(x,y-.15,z,.04,.04,.28,steelDark);pipe([x,y,z],[x,6.5,z],.012,galvanized);}}
 for(const x of [-9,-3,3,9]){pipe([x,5.8,-6],[x,4.9,-6],.065);pipe([x,4.9,-6],[x,4.9,-4.6],.065);}
 // Folded galvanized ventilation trunk with seams and suspension rods.
 box(0,5.85,2.3,25,.55,1.1,galvanized);
 for(let x=-12;x<13;x+=1.5){box(x,5.85,2.3,.025,.59,1.14,steel);pipe([x,6.15,1.85],[x,6.6,1.85],.012);pipe([x,6.15,2.75],[x,6.6,2.75],.012);}
 for(const x of [-10,-5,0,5,10]){const m=new T.MeshBasicMaterial({color:0xf8f5ed});box(x,6.25,4.2,1.5,.045,.13,m);const l=new T.PointLight(0xf1f0e9,48,12,2);l.position.set(x,5.8,3.4);scene.add(l);}
 for(let x=-12;x<-6;x+=.8){box(x,1.3,7.7,.76,2.6,.45,galvanized);box(x+.25,1.3,7.44,.03,.24,.04,steelDark);}
 return {facilityLights:[],panelStatusLights:[],materials:{steel,steelDark,galvanized,concrete,concreteDark,floorMat,processSteel:steel}};
}
