import test from 'node:test';import assert from 'node:assert/strict';
import { keyboardAction,dragDelta,pointerCoordinates,accumulateDrag } from '../src/input-manager.js';
import { escapeAction } from '../src/overlay-manager.js';
const event=(key,extra={})=>({key,code:key===' '?'Space':`Key${key.toUpperCase()}`,target:{tagName:'BODY'},...extra});
test('Escape consumes exactly one overlay/state transition including terminal states',()=>{
 for(const id of ['journal','settings','help'])assert.deepEqual(escapeAction([id],'playing'),{type:'close',id});
 assert.deepEqual(escapeAction(['settings','help'],'playing'),{type:'close',id:'help'});
 assert.equal(escapeAction([],'playing').type,'pause');assert.equal(escapeAction(['mission'],'paused').type,'resume');
 for(const status of ['won','lost'])assert.equal(escapeAction(['mission'],status).type,'consume');
 assert.equal(escapeAction(['victory'],'won').type,'consume');assert.equal(escapeAction(['intro'],'briefing').type,'consume');
});
test('keyboard ignores composing, modifiers, text fields, native buttons and all overlay hotkeys',()=>{
 for(const key of ['p','r','c','j','k',' ']){assert.equal(keyboardAction(event(key),true),null);assert.equal(keyboardAction(event(key,{ctrlKey:true})),null);assert.equal(keyboardAction(event(key,{target:{tagName:'TEXTAREA'}})),null);}
 assert.equal(keyboardAction(event(' ',{target:{closest:()=>true}})),null);
 assert.equal(keyboardAction(event(' ',{target:{closest:()=>({id:'btn-capture'})}})),'capture');assert.equal(keyboardAction(event('p',{repeat:true})),null);
 assert.equal(keyboardAction(event('Escape',{repeat:true})),null);assert.equal(keyboardAction(event('Escape'),true),'escape');
 assert.equal(keyboardAction(event(' ',{isComposing:true})),null);assert.equal(keyboardAction(event('p')),'power');
 assert.equal(keyboardAction(event(' ',{repeat:true})),null);
});
test('canvas-relative coordinates and incremental bounded dragging keep controls independent',()=>{
 assert.deepEqual(pointerCoordinates(250,200,{left:100,top:100,width:300,height:200}),{x:0,y:0});
 assert.equal(dragDelta('tuning',0,0),0);assert.equal(dragDelta('tuning',10000,0),.24);
 assert.ok(dragDelta('tuning',20,0,false,true)<dragDelta('tuning',20,0));assert.equal(dragDelta('volume',10,0),.04);
});

test('one registered keyboard pipeline dispatches one action and preserves native modified shortcuts',async()=>{
 const {setupInputManager}=await import('../src/input-manager.js');
 const win=new EventTarget(),doc=new EventTarget();const calls=[];
 setupInputManager({overlays:{top:()=>null,handleTab(){},containFocus(){}},escape:()=>calls.push('escape'),actions:{power:()=>calls.push('power')},release(){},blur(){},visibility(){}},win,doc);
 function press(props){const event=new Event('keydown',{cancelable:true});Object.assign(event,props);win.dispatchEvent(event);return event.defaultPrevented;}
 assert.equal(press({key:'p',code:'KeyP'}),true);press({key:'p',code:'KeyP',repeat:true});
 assert.equal(press({key:'p',code:'KeyP',metaKey:true}),false);press({key:'Escape'});
 assert.deepEqual(calls,['power','escape']);
});

test('slow one-pixel drags accumulate fractional movement instead of losing fine tuning',()=>{
 let touch=3, fine=3;
 for(let i=0;i<30;i++){touch=accumulateDrag(touch,'tuning',1,0,false,true);fine=accumulateDrag(fine,'tuning',1,0,true,false);}
 assert.ok(Math.abs(touch-3.09)<1e-9);assert.ok(Math.abs(fine-3.045)<1e-9);
 assert.equal(accumulateDrag(12,'tuning',20,0),12);assert.ok(accumulateDrag(12,'tuning',-1,0)<12);
 assert.equal(accumulateDrag(0,'volume',-20,0),0);
});

import { ownsPointer, smoothApproach } from '../src/input-manager.js';
test('only the owner can release or cancel a pointer; keyboard has no pointer owner',()=>{
 for(const type of ['pointerup','pointercancel','lostpointercapture']){assert.equal(ownsPointer(7,{pointerId:8,type}),false);assert.equal(ownsPointer(7,{pointerId:7,type}),true);assert.equal(ownsPointer(null,{pointerId:7,type}),false);}
});
test('warmup/flywheel smoothing consumes real time equally at 60 and 2 FPS',()=>{
 for(const fps of [60,30,10,5,2]){let value=0;for(let i=0;i<fps;i++)value=smoothApproach(value,1,3.2,1/fps);assert.ok(Math.abs(value-(1-Math.exp(-3.2)))<1e-9);}
});
