import assert from 'node:assert/strict';
import {mobileViewport} from '../lib/mobile-viewport.mjs';
// iOS: layout stays tall while VisualViewport shrinks and pans to the focused field.
let v=mobileViewport({width:390,height:340,offsetTop:120,baselineHeight:780,focused:true});
assert.equal(v.keyboard,true);assert.equal(v.height,340);assert.equal(v.top,120);assert.equal(v.tight,true);
// Android: both viewports shrink; the pre-keyboard baseline preserves detection.
v=mobileViewport({width:412,height:460,baselineHeight:820,focused:true,daily:true});
assert.equal(v.keyboard,true);assert.equal(v.dailyTyping,true);assert.equal(v.tight,false);
// Closing the keyboard restores the ordinary game, and blurring exits daily typing mode.
v=mobileViewport({width:390,height:780,baselineHeight:780,focused:true,daily:true});
assert.equal(v.keyboard,false);assert.equal(v.dailyTyping,false);assert.equal(v.short,false);
assert.equal(mobileViewport({width:390,height:340,baselineHeight:780,focused:false,daily:true}).dailyTyping,false);
// Landscape fits a compact game even when no software keyboard is visible.
v=mobileViewport({width:844,height:350,baselineHeight:350});assert.equal(v.short,true);assert.equal(v.tight,true);assert.equal(v.keyboard,false);
// Desktop fields and pinch zoom must not activate mobile keyboard mode.
assert.equal(mobileViewport({width:1280,height:400,baselineHeight:900,focused:true}).keyboard,false);
assert.equal(mobileViewport({width:390,height:340,baselineHeight:780,focused:true,scale:2}).keyboard,false);
assert.equal(mobileViewport({width:390,height:500,offsetTop:-3,baselineHeight:780}).top,0);
console.log('Passed: iOS visual viewport, Android resized layout, daily focus, keyboard closure, compact landscape, desktop and pinch zoom.');

assert.equal(mobileViewport({width:390,height:340,baselineHeight:780,focused:true,scale:2}).height,780,'Pinch zoom must not shrink the app to counteract magnification');
