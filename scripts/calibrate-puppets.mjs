import {writeFileSync} from 'node:fs';
import {measurePuppets} from './puppet-anchors.mjs';
const data=await measurePuppets();
writeFileSync('lib/puppet-registration.json',JSON.stringify(data,null,2)+'\n');
console.log('Measured nose, eyes, mouth, hairline and collar anchors for every atlas image.');
