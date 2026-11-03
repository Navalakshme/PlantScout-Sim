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
 for(const dx of [1.55]){pipe([x+dx,.65,-3],[x+dx,5.8,-3],.055);for(const y of [1.3]){flange(x+dx,y,-3);pipe([x+dx,y,-3],[x+dx,y,-2.7],.05);const wheel=new T.Mesh(new T.TorusGeometry(.11,.016,8,24),blue);wheel.position.set(x+dx,y,-2.65);scene.add(wheel);}}
 tag(['R-101 / RESIN REACTOR','R-102 / BLEND VESSEL','V-201 / HOLD TANK','V-202 / PRODUCT'][i],x,2.7,-3.42);
 }

 // Supporting process line: feed, condensation, filtration, filling and utilities.
 function unit(x,z,r,h,label){box(x,.3,z,r*2+.35,.3,r*2+.35,steelDark);pipe([x,.6,z],[x,h,z],r);for(const y of [.6,h])ring(x,y,z,r,.025);for(const dx of [-r*.7,r*.7])pipe([x+dx,.35,z],[x+dx,.8,z],.045);pipe([x,.85,z],[x,.85,z+.6],.045);flange(x,.85,z+.5,.1);tag(label,x,h+.35,z);}
 function motor(x,z,label){box(x,.45,z,1.3,.2,.7,steelDark);pipe([x-.5,.8,z],[x+.2,.8,z],.18,blue);pipe([x+.2,.8,z],[x+.45,.8,z],.24);for(let i=0;i<10;i++)box(x-.45+i*.055,.8,z,.018,.4,.4,steelDark);pipe([x+.35,.8,z],[x+.35,1.3,z],.05);tag(label,x,1.6,z);}
 unit(-11.9,-5,.44,2.4,'TK-01 / RESIN FEED');unit(-10.8,-6.8,.44,2.4,'TK-02 / SOLVENT FEED');motor(-11.4,-2.2,'P-01 / DOSING');pipe([-11.05,1.3,-2.2],[-11.05,3.3,-2.2],.05);pipe([-11.05,3.3,-2.2],[-8.7,3.3,-2.2],.05);pipe([-8.7,3.3,-2.2],[-8.7,3.3,-4.6],.05);
 // Condenser and condensate receiver between the reactor and blend vessel.
 pipe([-6,3.5,-6],[-6,3.5,-3.9],.34);for(const z of [-6,-5.8,-4.1,-3.9])flange(-6,3.5,z,.4);for(const z of [-5.7,-4.2])box(-6,2,z,.12,3,.12,galvanized);unit(-6,-5,.4,1.9,'V-103 / RECEIVER');tag('E-101 / CONDENSER',-6,4.1,-4);pipe([-8.7,5.1,-4.6],[-6,5.1,-4.6],.085);pipe([-6,5.1,-4.6],[-6,3.5,-4.6],.085);pipe([-6,3.15,-4],[-6,1.6,-4],.045);pipe([-6,1.6,-4],[-6,1.6,-5],.045);
 // Duplex filter skid feeds the product transfer and closed filling station.
 box(4.9,.35,-2.5,1.7,.25,1.3,steelDark);for(const x of [4.45,5.3]){unit(x,-2.5,.24,2.1,x<5?'F-301 / FILTER A':'F-302 / FILTER B');ring(x,2.1,-2.5,.28,.025);pipe([x,.85,-1.9],[x,1.1,-1.8],.045);}pipe([2.3,1.1,-1.8],[10.5,1.1,-1.8],.05);motor(10.5,-2.2,'P-401 / TRANSFER');unit(11.5,-5.4,.35,1.6,'PK-401 / DRUM FILLING');box(11.5,.45,-5.4,1.3,.12,1.3,galvanized);pipe([12.1,.5,-5.8],[12.1,2.5,-5.8],.05);pipe([12.1,2.5,-5.8],[11.5,2.5,-5.4],.045);pipe([11.5,2.5,-5.4],[11.5,1.65,-5.4],.045);
 // Plate heat exchanger, instrument air receiver, and local drive cabinet.
 box(-3.1,.4,6.8,2.2,.2,1.2,steelDark);for(let i=0;i<20;i++)box(-3.7+i*.055,1.35,6.8,.025,1.25,.6,steel);for(const x of [-3.8,-2.55])box(x,1.35,6.8,.1,1.5,.85,blue);for(const y of [.95,1.75]){pipe([-3.9,y,6.5],[-4.2,y,6.5],.065);pipe([-4.2,y,6.5],[-4.2,3.18,6.5],.065);}tag('HX-501 / COOLING LOOP',-3.1,2.4,6.8);unit(.2,7.1,.35,2.6,'AIR-501 / INSTRUMENT AIR');box(3.7,1.65,7.65,1.25,2.4,.45,galvanized);box(3.7,2.1,7.4,.65,.43,.035,steelDark);for(let i=0;i<3;i++)pipe([3.4+i*.3,1.5,7.38],[3.4+i*.3,1.5,7.33],.055,blue);tag('MCC-02 / PROCESS DRIVES',3.7,3.25,7.4);

 // Recognisable machinery on accessible service skids, separate from the vessels.
 // Plate exchanger: compressed plate stack, tie rods, feet and four connections.
 box(-.6,.45,-2.25,2.3,.22,1.05,steelDark);
 for(let i=0;i<28;i++)box(-1.25+i*.045,1.35,-2.25,.022,1.35,.72,steel);
 for(const x of [-1.4,.15]){box(x,1.35,-2.25,.14,1.65,.95,blue);for(const y of [.7,2])for(const z of [-2.65,-1.85])pipe([-1.55,y,z],[.35,y,z],.025);}
 for(const y of [.95,1.75])for(const z of [-2.55,-1.95])pipe([.2,y,z],[.65,y,z],.08);
 tag('E-202 / PLATE COOLER',-.6,2.55,-2.1);
 // Twin centrifugal pumps: finned motors, coupling guards, volutes and flanged outlets.
 for(const [x,z] of [[-8.6,-1.95],[-6.9,-1.95]]){box(x,.5,z,1.5,.15,.9,steelDark);pipe([x-.6,.9,z],[x+.05,.9,z],.22,steelDark);for(let i=0;i<12;i++)box(x-.57+i*.048,.9,z,.018,.5,.5,galvanized);box(x-.3,1.2,z,.27,.18,.26,blue);pipe([x+.08,.9,z],[x+.4,.9,z],.16,galvanized);const v=new T.Mesh(new T.SphereGeometry(.3,32,16),blue);v.scale.x=.55;v.position.set(x+.48,.9,z);scene.add(v);pipe([x+.48,1.05,z],[x+.48,1.55,z],.075);pipe([x+.48,.9,z],[x+.48,.9,z+.45],.075);flange(x+.48,.9,z+.45,.13);tag(x<-8?'P-101A / CIRCULATION':'P-101B / STANDBY',x,1.9,z);}
 // Metering skid with diaphragm heads, drive housings, small-bore lines and control box.
 box(-10.9,.6,-3,1.7,.16,.85,galvanized);for(const x of [-11.35,-10.65]){box(x,.95,-3,.35,.55,.4,blue);pipe([x,.95,-2.8],[x,.95,-2.58],.16);pipe([x,1.1,-2.65],[x,1.65,-2.65],.025);box(x,1.7,-2.65,.13,.15,.1,steelDark);}box(-10.9,2.05,-3.3,.65,.6,.22,galvanized);tag('DS-101 / METERING SKID',-10.9,2.6,-3);
 // Filling machine with roller bed, overhead lance and weighing terminal.
 for(const x of [9.1,11.8])box(x,.65,-5.1,.12,1.25,1.25,galvanized);
 for(let x=9.15;x<11.8;x+=.18)pipe([x,1.1,-5.7],[x,1.1,-4.5],.055,steel);
 for(const z of [-5.78,-4.42])box(10.45,1.12,z,2.9,.14,.08,steelDark);
 box(10.5,2.8,-5.8,2.4,.12,.12,galvanized);box(9.35,1.7,-5.8,.12,2.2,.12,galvanized);pipe([10.5,2.8,-5.8],[10.5,2.8,-5.1],.04);pipe([10.5,2.8,-5.1],[10.5,1.7,-5.1],.04);box(11.8,1.9,-4.55,.48,.38,.16,steelDark);tag('FL-401 / WEIGH & FILL',10.4,3.25,-5.1);
 // Enclosed utility package: compressor enclosure with grille and electrical isolator.
 box(6.1,.3,6.8,1.9,.3,1.2,steelDark);box(6.1,1.05,6.8,1.75,1.25,1.05,galvanized);for(let y=.65;y<1.5;y+=.09)box(5.8,y,6.26,.75,.025,.035,steelDark);box(6.6,1.25,6.25,.28,.32,.03,blue);tag('AC-501 / AIR COMPRESSOR',6.1,2,6.6);
 // Three utility headers routed at the back wall.
 for(let j=0;j<3;j++){const z=-7+j*.3,y=5.7+(j%3)*.16;pipe([-12.8,y,z],[12.8,y,z],j%4===0?.10:.035);for(const x of [-11,-6,-1,4,9]){box(x,y-.15,z,.04,.04,.28,steelDark);pipe([x,y,z],[x,6.5,z],.012,galvanized);}}
 for(const x of [-9,-3,3,9]){pipe([x,5.8,-6],[x,4.9,-6],.065);pipe([x,4.9,-6],[x,4.9,-4.6],.065);}
 // Folded galvanized ventilation trunk with seams and suspension rods.
 box(0,5.85,2.3,25,.55,1.1,galvanized);
 for(let x=-12;x<13;x+=1.5){box(x,5.85,2.3,.025,.59,1.14,steel);pipe([x,6.15,1.85],[x,6.6,1.85],.012);pipe([x,6.15,2.75],[x,6.6,2.75],.012);}
 for(const x of [-10,-5,0,5,10]){const m=new T.MeshBasicMaterial({color:0xf8f5ed});box(x,6.25,4.2,1.5,.045,.13,m);const l=new T.PointLight(0xf1f0e9,48,12,2);l.position.set(x,5.8,3.4);scene.add(l);}
 for(let x=-12;x<-6;x+=.8){box(x,1.3,7.7,.76,2.6,.45,galvanized);box(x+.25,1.3,7.44,.03,.24,.04,steelDark);}
 return {facilityLights:[],panelStatusLights:[],materials:{steel,steelDark,galvanized,concrete,concreteDark,floorMat,processSteel:steel}};
}
