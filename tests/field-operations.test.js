import test from 'node:test';import assert from 'node:assert/strict';
import {cleanFieldData,CONTRACTS,startContract,advanceContract,answerContract,morseEvents,receptionSound,roomWeather} from '../src/field-operations.js';
import {renderTape} from '../src/tape-deck.js';
const radio=(stationId='borealis')=>({stationId,powerOn:true,holding:true,warmUpLevel:1,frequency:3.2,targetFrequency:3.2,distance:0,signal:.95});
test('field save is bounded, preserves valid evidence and rejects invalid IDs/links/input',()=>{
 const raw={pinned:['borealis','borealis','evil','k19'],links:[['borealis','k19'],['evil','k19'],['borealis','borealis']],marks:{borealis:'7',evil:'x'},completed:['relay','evil']};
 const d=cleanFieldData(raw);assert.deepEqual(d.pinned,['borealis','k19']);assert.deepEqual(d.links,[['borealis','k19']]);assert.deepEqual(d.completed,['relay']);assert.equal(d.marks.borealis,'7');assert.equal(d.marks.evil,undefined);assert.deepEqual(cleanFieldData(null).pinned,[]);
});
test('contracts require CHRONOS, accept only continuous manual reception, and never mutate campaign',()=>{
 const campaign={status:'won',score:12000,collected:['borealis','echo7','orpheus','k19','helios4']},saved=JSON.stringify(campaign),d=cleanFieldData();
 assert.equal(startContract(d,'relay',false),false);assert.equal(startContract(d,'relay',true),true);assert.equal(startContract(d,'telegram',true),false);
 advanceContract(d,30,radio(),true);assert.equal(d.shift.progress,0);assert.equal(d.shift.elapsed,30);
 advanceContract(d,1,radio(),false);assert.equal(d.shift.progress,0);
 for(let i=0;i<7;i++)advanceContract(d,.5,radio(),true);assert.equal(d.shift.index,1);
 advanceContract(d,1,radio(),true);assert.equal(d.shift.progress,0);
 for(let i=0;i<7;i++)advanceContract(d,.5,radio('k19'),true);assert.equal(d.shift.status,'won');assert.deepEqual(d.completed,['relay']);
 advanceContract(d,100,radio('k19'),true);assert.deepEqual(d.completed,['relay']);assert.equal(JSON.stringify(campaign),saved);
});
test('telegram/bearing require correct report; deadline wins over capture and terminal refuses progress',()=>{
 for(const id of ['telegram','bearing']){
  const d=cleanFieldData();startContract(d,id,true);const c=CONTRACTS.find(c=>c.id===id);
  for(let i=0;i<7;i++)advanceContract(d,.5,radio(c.targets[0]),true);assert.equal(d.shift.status,'awaiting');
  assert.equal(answerContract(d,'<script>'),false);assert.equal(answerContract(d,id==='telegram'?'47':'66'),true);assert.equal(answerContract(d,c.answer),false);assert.equal(d.completed.length,1);
 }
 const d=cleanFieldData();startContract(d,'relay',true);d.shift.elapsed=179.5;d.shift.progress=2.9;advanceContract(d,.5,radio(),true);assert.equal(d.shift.status,'lost');assert.equal(d.shift.progress,0);assert.equal(d.completed.length,0);
});
test('saved side shift restores deadline but clears unobserved recording progress',()=>{
 const d=cleanFieldData({shift:{id:'telegram',elapsed:50,status:'playing',index:0,progress:2.9}});assert.equal(d.shift.elapsed,50);assert.equal(d.shift.progress,0);
 assert.equal(cleanFieldData({shift:{id:'relay',elapsed:180,status:'playing'}}).shift.status,'lost');
});
test('tape uses ITU 1/3 tone timing, actual finite PCM and bounded amplitude',()=>{
 const e=morseEvents('.-');assert.equal(e[0].duration,.105);assert.equal(e[2].duration,.315);
 const tape=renderTape({morseCodeString:'--...',carrierPitch:680},8000);assert.ok(tape.length>8000);let max=0;for(const n of tape){assert.ok(Number.isFinite(n));max=Math.max(max,Math.abs(n));}assert.ok(max>.2&&max<.3);
});
test('audible static responds to antenna/signal and storm while room respects pause and reduced motion',()=>{
 const low=receptionSound({...radio(),signal:.1},{}),high=receptionSound({...radio(),signal:.95},{});assert.ok(low.noise>high.noise);assert.ok(receptionSound({...radio(),signal:.95},{active:true}).noise>high.noise);
 assert.equal(roomWeather({elapsed:55,status:'playing'},false,false).storm,false);
 const m={elapsed:65,status:'playing'};assert.equal(roomWeather(m,false,false).rain,1.5);assert.equal(roomWeather(m,false,true).storm,false);assert.equal(roomWeather(m,true,false).lamp,1);assert.equal(roomWeather(m,true,false).flash,0);
});

import {validateCurrent} from '../src/storage.js';
test('optional content cannot keep running in an unfinished campaign or bypass a corrupt report state',()=>{
 const save=validateCurrent({mission:{version:3,difficulty:'operator',status:'playing'},fieldOperations:{shift:{id:'relay',status:'playing',elapsed:10}}});assert.equal(save.fieldOperations.shift.status,'lost');
 assert.equal(cleanFieldData({shift:{id:'telegram',status:'won',index:0}}).shift.status,'playing');
});
