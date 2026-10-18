/** VisualViewport shrinks on iOS; Android may resize both the layout and visual viewports. */
export function mobileViewport({width,height,offsetTop=0,baselineHeight,focused=false,daily=false,scale=1}){
 const mobile=width<=900;
 const zoomed=scale>1.05;
 const visibleHeight=zoomed?baselineHeight:height;
 const keyboard=mobile&&focused&&scale<=1.05&&(baselineHeight-height>120||height<500);
 return {height:Math.max(180,Math.round(visibleHeight)),top:zoomed?0:Math.max(0,Math.round(offsetTop)),keyboard,dailyTyping:keyboard&&daily,short:mobile&&!zoomed&&height<560,tight:mobile&&!zoomed&&height<360};
}
