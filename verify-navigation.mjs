import {planPath,clearSegment,free} from './navigation.mjs';
import {equipment,stations} from './equipment.mjs';
let p=[9.4,5.1];for(const [name,q] of stations){let path=planPath(p,q);if(!path)throw Error('No path '+name+' '+q);for(const next of path){if(!clearSegment(p,next))throw Error('Bad segment '+name);p=next;}console.log(name,path.length);}
for(const e of equipment){if(!planPath([9.4,5.1],e.view,.25))throw Error('Equipment unreachable '+e.id);}
console.log(equipment.length+' equipment viewpoints reachable; all route legs clear');

if(new Set(equipment.map(e=>e.id)).size!==equipment.length)throw Error('Duplicate equipment IDs');
if(free(4.2,2.8,.46))throw Error('Filter skid must block the rover');
if(planPath([4.2,2.8],[9.4,5.1]))throw Error('Must reject a start inside equipment');
if(clearSegment([-8,1],[-8,4.6]))throw Error('Separator blocks a direct crossing');
if(!planPath([-8,1],[-8,4.6]))throw Error('Must find a detour around the separator');
console.log('Collision rejection, detour and unique equipment IDs verified');
