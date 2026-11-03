// Shared conservative floor plan for walking, rover footprint and route planning.
export const obstacles = [
 [-13,13,-8.3,-1.18], [10.55,13,2.15,6.95],
 [-10.5,-5.3,5.65,8],[-4.4,-1.9,6,8],[-.45,.8,6.5,8],[2.9,4.5,7.1,8],[5,7.2,6.1,8],
 [-.4,1.9,2.5,3.7],[-9.5,-6.3,2.1,3.65],[-5.3,-3.1,2.15,3.65],[3.2,5.2,2.05,3.65],[6.6,8.7,2.1,3.65],
 ...[-11,-5.5,0,5.5,11].map(x=>[x-.3,x+.3,-1.1,-.4])
];
export function free(x,z,r=.25){return x>-13+r&&x<13-r&&z>-8+r&&z<7.95-r&&!obstacles.some(([a,b,c,d])=>x>a-r&&x<b+r&&z>c-r&&z<d+r);}
export function clearSegment(a,b,r=.46){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1));for(let i=0;i<=n;i++){const t=i/n;if(!free(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,r))return false;}return true;}
export function planPath(start,goal,r=.46){
 if(!free(...start,r)||!free(...goal,r))return null;
 if(clearSegment(start,goal,r))return [goal];
 const step=.4, key=(x,z)=>`${x},${z}`,pos=(x,z)=>[-12.4+x*step,-.4+z*step];
 const nearest=p=>{let best=null,d=Infinity;for(let x=0;x<=62;x++)for(let z=0;z<=19;z++){const q=pos(x,z),v=Math.hypot(q[0]-p[0],q[1]-p[1]);if(v<d&&clearSegment(p,q,r)){d=v;best=[x,z];}}return best;};
 const a=nearest(start),b=nearest(goal);if(!a||!b)return null;
 const open=[a],g=new Map([[key(...a),0]]),parent=new Map(),closed=new Set();
 while(open.length){open.sort((u,v)=>(g.get(key(...u))+Math.hypot(u[0]-b[0],u[1]-b[1]))-(g.get(key(...v))+Math.hypot(v[0]-b[0],v[1]-b[1])));const u=open.shift(),uk=key(...u);if(closed.has(uk))continue;closed.add(uk);
 if(uk===key(...b)){const path=[goal];let k=uk;while(k){path.unshift(pos(...k.split(',').map(Number)));k=parent.get(k);}path.unshift(start);const smooth=[];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clearSegment(path[i],path[j],r))j--;smooth.push(path[j]);i=j;}return smooth;}
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const v=[u[0]+dx,u[1]+dz],vk=key(...v);if(v[0]<0||v[0]>62||v[1]<0||v[1]>19||closed.has(vk)||!clearSegment(pos(...u),pos(...v),r))continue;const ng=g.get(uk)+Math.hypot(dx,dz);if(ng<(g.get(vk)??Infinity)){g.set(vk,ng);parent.set(vk,uk);open.push(v);}}
 }return null;
}
export function range(x,z,angle,max=8){for(let d=.1;d<max;d+=.1)if(!free(x+Math.sin(angle)*d,z+Math.cos(angle)*d,0))return d;return max;}
