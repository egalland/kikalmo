import assets from './costume-assets.json';
export const COSTUME_IDS=[25,26,27,28,29,30,31,32,39,40,41] as const;
export function costumeAsset(id?:number){return assets.find(asset=>asset.id===id);}
/** Uniform asset scale: no stretching of the felt, regardless of the original sprite size. */
export function costumePlacement(id?:number){
 const asset=costumeAsset(id);if(!asset)return undefined;
 const scale=Math.min(460/asset.bounds.height,400/asset.bounds.width);
 return {...asset,scale,x:128-(asset.face.x+asset.face.width/2)*scale,y:122-(asset.face.y+asset.face.height/2)*scale,renderWidth:asset.width*scale,renderHeight:asset.height*scale,faceWidth:asset.face.width*scale,faceHeight:asset.face.height*scale,faceScale:Math.min(asset.face.width*scale/150,asset.face.height*scale/160)*.96};
}
