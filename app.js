import * as T from 'three';
import {buildInterior} from './interior.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color(0x52555a);scene.fog=new T.FogExp2(0x777b81,.004);
const camera=new T.PerspectiveCamera(66,innerWidth/innerHeight,.06,100);camera.rotation.order='YXZ';
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('viewport').append(renderer.domElement);
renderer.toneMappingExposure=.82;
const pmrem=new T.PMREMGenerator(renderer),roomEnvironment=new RoomEnvironment();
scene.environment=pmrem.fromScene(roomEnvironment,.04).texture;scene.environmentIntensity=.4;roomEnvironment.dispose();pmrem.dispose();
scene.add(new T.HemisphereLight(0xf2f3f5,0x73706a,.45));
const fill=new T.DirectionalLight(0xfff9ee,1.4);fill.position.set(4,8,5);fill.target.position.set(-3,0,-8);fill.castShadow=true;fill.shadow.mapSize.set(2048,2048);fill.shadow.camera.left=-23;fill.shadow.camera.right=23;fill.shadow.camera.top=26;fill.shadow.camera.bottom=-26;fill.shadow.camera.far=65;fill.shadow.normalBias=.025;scene.add(fill,fill.target);
const interior=buildInterior(scene);
let mode='stair',transition=null,doorOpen=0,unlocked=false,running=false,elapsed=0,power=0,steamTime=0,last=performance.now(),audio=null,muted=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const views=interior.views;
let showLabels=true;
$('labels').onclick=()=>{showLabels=!showLabels;$('labels').textContent=showLabels?'Labels on':'Labels off';$('labels').setAttribute('aria-pressed',String(showLabels));};
function pose(p,t){camera.position.set(...p);camera.lookAt(...t);}
pose([9.95,4.72,18.1],[9.95,1.9,8.4]);
function travel(points,done){transition={points,index:0,age:0,from:camera.position.clone(),fromQ:camera.quaternion.clone(),done};mode='transition';}
function setView(name){const v=views[name];pose(v.p,v.t);$('location').textContent=v.name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===name));}
function inside(){mode='inside';$('plant').hidden=false;$('plant').open=false;$('locations').hidden=false;$('movement').hidden=false;$('return').hidden=false;setView('entrance');$('hint').textContent='Drag to look · W A S D to walk · choose a labelled section';}
$('descend').onclick=()=>{$('entry').hidden=true;travel([{p:[9.95,1.75,10.4],t:[9.95,2,8.4],duration:4}],()=>{mode='door';$('keypad').hidden=false;$('pin').focus();$('location').textContent='THERMAL ACCESS DOOR / LOCKED';});};
$('unlockForm').onsubmit=e=>{e.preventDefault();if($('pin').value!=='2048'){$('pinMessage').textContent='Incorrect PIN. Try 2048.';$('pin').value='';return;}unlocked=true;$('keypad').hidden=true;$('location').textContent='ACCESS GRANTED / ENTERING B1';travel([{p:[9.95,1.75,10.4],t:[9.95,2,8],duration:1.5},{p:[9.3,1.75,5.2],t:[3,2,1],duration:3},{p:[3,1.75,5.3],t:[-2,2,-2],duration:2}],inside);};
function stop(){running=false;elapsed=0;steamTime=0;$('start').disabled=false;$('steam').disabled=true;$('stop').disabled=true;$('status').textContent='Stopping · circulation winding down';}
$('start').onclick=()=>{running=true;elapsed=0;$('start').disabled=true;$('stop').disabled=false;};
$('stop').onclick=stop;
$('steam').onclick=()=>{if(running&&elapsed>6){steamTime=8;$('steam').disabled=true;setView('utilities');}};
$('return').onclick=()=>{stop();clearKeys();mode='stair';unlocked=false;transition=null;['plant','locations','movement','return','keypad'].forEach(id=>$(id).hidden=true);$('entry').hidden=false;pose([9.95,4.72,18.1],[9.95,1.9,8.4]);$('pin').value='';$('pinMessage').textContent='Demo PIN: 2048';$('location').textContent='ACCESS STAIR / B1';$('hint').textContent='A closed industrial interior, explored at human scale.';};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function clearKeys(){keys.clear();}
$('help').onclick=()=>{clearKeys();$('helpDialog').showModal();};$('closeHelp').onclick=$('helpDone').onclick=()=>$('helpDialog').close();
const keys=new Set();window.addEventListener('keydown',e=>{if(mode!=='inside'||$('helpDialog').open||/INPUT|TEXTAREA/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{clearKeys();if(document.hidden&&audio)audio.context.suspend();else if(audio&&!muted)audio.context.resume();});
document.querySelectorAll('[data-move]').forEach(b=>{const key={forward:'w',back:'s',left:'a',right:'d'}[b.dataset.move];b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(key);});
let drag=null;renderer.domElement.onpointerdown=e=>{if(mode!=='inside')return;drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(!drag)return;camera.rotation.y-=(e.clientX-drag.x)*.003;camera.rotation.x=T.MathUtils.clamp(camera.rotation.x-(e.clientY-drag.y)*.003,-1.2,1.2);camera.rotation.z=0;drag={x:e.clientX,y:e.clientY};};renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>{drag=null;};
function createAudio(){const context=new (window.AudioContext||window.webkitAudioContext)(),master=context.createGain(),hum=context.createGain(),air=context.createGain(),hiss=context.createGain();master.gain.value=.45;master.connect(context.destination);hum.gain.value=0;air.gain.value=0;hiss.gain.value=0;hum.connect(master);air.connect(master);hiss.connect(master);[50,100,151].forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain();o.frequency.value=hz;o.type='sine';g.gain.value=.4/(i+1);o.connect(g).connect(hum);o.start();});const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.3;const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;const low=context.createBiquadFilter();low.type='lowpass';low.frequency.value=450;noise.connect(low).connect(air);const high=context.createBiquadFilter();high.type='highpass';high.frequency.value=1800;noise.connect(high).connect(hiss);noise.start();return{context,master,hum,air,hiss};}
$('sound').onclick=async()=>{try{audio??=createAudio();muted=!muted;if(!muted)await audio.context.resume();audio.master.gain.setTargetAtTime(muted?0:.45,audio.context.currentTime,.2);$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!muted));}catch{$('sound').textContent='Audio unavailable';}};
let uiAge=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
 if(transition){const tr=transition,item=tr.points[tr.index];tr.age+=dt;const u=Math.min(tr.age/(reduced?.35:item.duration),1),s=u*u*(3-2*u);camera.position.lerpVectors(tr.from,new T.Vector3(...item.p),s);const dummy=new T.PerspectiveCamera();dummy.position.set(...item.p);dummy.lookAt(...item.t);camera.quaternion.slerpQuaternions(tr.fromQ,dummy.quaternion,s);if(u===1){tr.index++;tr.age=0;tr.from=camera.position.clone();tr.fromQ=camera.quaternion.clone();if(tr.index===tr.points.length){transition=null;tr.done();}}}
 const targetDoor=unlocked?1:0;doorOpen=T.MathUtils.damp(doorOpen,targetDoor,3,dt);interior.door.rotation.y=-doorOpen*Math.PI*.48;
 if(mode==='inside'&&!$('helpDialog').open){let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const len=Math.hypot(x,z)||1;x/=len;z/=len;const yaw=camera.rotation.y,dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*dt*2.3,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))*dt*2.3;if(interior.canWalk(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(interior.canWalk(camera.position.x,camera.position.z+dz))camera.position.z+=dz;camera.position.y=1.75;}
 if(running)elapsed+=dt;const target=running?(elapsed>6?1:elapsed>3?.6:.15):0;power=T.MathUtils.damp(power,target,1.3,dt);steamTime=Math.max(0,steamTime-dt);const steam=steamTime>0?Math.min(1,steamTime/2):0;interior.update(now/1000,power,steam,dt,camera,showLabels);
 if(audio){const t=audio.context.currentTime;audio.hum.gain.setTargetAtTime(power*.16,t,.2);audio.air.gain.setTargetAtTime(power*.45+.015,t,.3);audio.hiss.gain.setTargetAtTime(steam*.4,t,.2);}
 uiAge+=dt;if(uiAge>.2){uiAge=0;const phase=!running?0:elapsed>6?3:elapsed>3?2:1;$('status').textContent=['Standby · plant stopped','Starting extraction fans','Priming circulation loop','Process running · simulated'][phase];$('statusDot').style.background=phase?'#b5d5a0':'#a89869';for(let i=1;i<=3;i++)$('s'+i).classList.toggle('on',phase>=i);$('flow').innerHTML=(power*12.8).toFixed(1)+' <small>m³/h</small>';$('pressure').innerHTML=(power*2.4).toFixed(1)+' <small>bar</small>';$('temperature').innerHTML=Math.round(24+power*38)+' <small>°C</small>';$('extraction').textContent=phase?'ON':'OFF';$('steam').disabled=phase!==3||steamTime>0;$('steam').textContent=steamTime>0?'Steam clearing…':'Utility steam demonstration';}
 renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;});
$('loading').hidden=true;requestAnimationFrame(animate);
