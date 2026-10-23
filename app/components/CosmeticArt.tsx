import {COSMETICS} from '../../lib/cosmetics';
import {morphology} from '../../lib/puppet-morphology';
export default function CosmeticArt({id,shape,body}:{id?:number;shape:number;body:number}){
 const item=COSMETICS.find(c=>c.id===id);if(!item)return null;
 const m=morphology(shape,body),y=m.forehead+(['beret','top','pirate','crown','wizard'].includes(item.kind)?9:-5),c=item.color;
 const stitch={stroke:'#fff4d7',strokeWidth:1.5,strokeDasharray:'3 4',fill:'none',opacity:.65};
 let art;
 switch(item.kind){
 case 'beret':art=<><path d="M-76 2 Q-85-44-18-42 Q47-53 76-9 L64 7Z"/><path d="M-65-3 Q0 8 64-4" {...stitch}/><path d="M0-40L4-53" stroke={c} strokeWidth="9"/></>;break;
 case 'beanie':art=<><path d="M-67 8 Q-69-60 0-60 Q69-60 67 8Z"/><rect x="-73" y="-6" width="146" height="28" rx="9"/><circle cy="-67" r="15"/><path d="M-60 6H60 M-46-12Q-45-41-20-47 M0-12V-47 M46-12Q45-41 20-47" {...stitch}/></>;break;
 case 'top':art=<><path d="M-49 0L-54-70Q0-80 54-70L49 0Z"/><ellipse cy="1" rx="83" ry="14"/><path d="M-51-18Q0-11 51-18" stroke="#ebbc71" strokeWidth="12"/><path d="M-44-63Q0-70 44-63" {...stitch}/></>;break;
 case 'pirate':art=<><path d="M-90 12Q-64-52-28-36Q0-72 28-36Q64-52 90 12Q0-3-90 12Z"/><path d="M-77 4Q0-35 77 4" {...stitch}/><circle cy="-23" r="12" fill="#f5e9c7"/><path d="M-10-10L10-2M10-10L-10-2" stroke="#f5e9c7" strokeWidth="4"/><circle cx="-4" cy="-25" r="2" fill="#403b45"/><circle cx="4" cy="-25" r="2" fill="#403b45"/></>;break;
 case 'antenna':art=<><path d="M-44 1Q-58-45-41-54M44 1Q58-45 41-54" stroke={c} strokeWidth="7" fill="none"/><circle cx="-41" cy="-59" r="15"/><circle cx="41" cy="-59" r="15"/><path d="M-48-63L-40-67M34-63L42-67" {...stitch}/></>;break;
 case 'headphones':art=<><path d="M-84 59Q-88-42 0-42Q88-42 84 59" fill="none" stroke={c} strokeWidth="14"/><rect x="-98" y="40" width="30" height="64" rx="14"/><rect x="68" y="40" width="30" height="64" rx="14"/><path d="M-83 49V94M83 49V94M-65-17Q0-61 65-17" {...stitch}/></>;break;
 case 'crown':art=<><path d="M-68 8L-80-48L-37-26L0-67L37-26L80-48L68 8Z"/><path d="M-60-1H60" {...stitch}/><circle cy="-28" r="10" fill="#b45680"/><circle cx="-46" cy="-17" r="6" fill="#77b9bb"/><circle cx="46" cy="-17" r="6" fill="#77b9bb"/></>;break;
 case 'halo':art=<><ellipse cy="-47" rx="72" ry="16" stroke={c} strokeWidth="12" fill="none"/><ellipse cy="-47" rx="72" ry="16" {...stitch}/></>;break;
 case 'wizard':art=<><path d="M-63 4L-16-89L23-61L63 4Z"/><ellipse cy="5" rx="84" ry="13"/><path d="M-51-6L-13-76L17-56" {...stitch}/><path d="M0-46L4-36L15-35L7-28L10-17L0-23L-10-17L-7-28L-15-35L-4-36Z" fill="#f4d97d"/></>;break;
 case 'bow':art=<g transform={`translate(0 ${m.chin-y+14})`}><path d="M-6 0Q-63-38-57 0Q-63 38-6 8M6 0Q63-38 57 0Q63 38 6 8"/><rect x="-10" y="-9" width="20" height="26" rx="7"/><path d="M-19 2L-48-15M19 2L48-15" {...stitch}/></g>;break;
 case 'heart':art=<g transform={`translate(57 ${m.chin-y+64}) scale(.65)`}><path d="M0 30C-65-5-40-52 0-23C40-52 65-5 0 30Z"/><path d="M0 19C-45-6-32-37 0-14C32-37 45-6 0 19Z" {...stitch}/></g>;break;
 case 'star':art=<g transform={`translate(57 ${m.chin-y+62}) scale(.7)`}><path d="M0-40L12-13L43-12L20 8L27 38L0 21L-27 38L-20 8L-43-12L-12-13Z"/><path d="M0-28L9-7L30-6L14 8L18 27L0 14L-18 27L-14 8L-30-6L-9-7Z" {...stitch}/></g>;break;
 case 'sparkles':art=<>{[[-96,8,1],[97,45,.8],[-100,128,.6],[69,-44,.65]].map(([x,dy,s],i)=><g key={i} transform={`translate(${x} ${dy}) scale(${s})`}><path d="M0-23L6-6L23 0L6 6L0 23L-6 6L-23 0L-6-6Z"/><path d="M0-11V11M-11 0H11" {...stitch}/></g>)}</>;break;
 }
 return <g className="puppet-cosmetic" aria-hidden="true" data-cosmetic={item.id} transform={`translate(128 ${y})`} fill={c} stroke="#493d49" strokeWidth="2.5" strokeLinejoin="round">{art}</g>;
}
