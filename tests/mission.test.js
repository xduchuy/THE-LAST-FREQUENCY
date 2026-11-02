import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, restoreMission, tickMission, CHANNELS, DIFFICULTIES, stormAt, antennaGain, carrierFrequency, scan, useCoolant, submitCode } from '../src/mission.js';
function play(d='operator') { const m=createMission(d); m.status='playing'; return m; }
function advance(m, seconds, input={}) { const events=[]; for(let i=0;i<Math.ceil(seconds*20);i++) events.push(...tickMission(m,.05,input)); return events; }
const good = id => ({ powerOn:true, holding:true, stationId:id, signal:1, stable:true });
test('power alone never auto-collects and poor reception never records',()=>{
 const m=play(); advance(m,6,{...good('borealis'),holding:false}); advance(m,6,{...good('borealis'),signal:.3});
 assert.deepEqual(m.collected,[]); assert.equal(m.progress,0);
});
test('manual stable capture rewards once; repeated station cannot farm points',()=>{
 const m=play(); advance(m,4.6,good('borealis')); assert.deepEqual(m.collected,['borealis']);
 const score=m.score; advance(m,4.6,good('borealis')); assert.equal(m.score,score);
});
test('loss of signal regresses recording; switching channels cannot transfer progress',()=>{
 const m=play(); advance(m,2,good('borealis')); advance(m,.5,{...good('borealis'),signal:.1});
 assert.ok(m.progress>0&&m.progress<1.2); advance(m,.1,good('echo7')); assert.ok(m.progress<.2); assert.equal(m.captureId,'echo7');
});
test('full route requires five channels, correct code, and eight-second SOS',()=>{
 const m=play(); assert.equal(submitCode(m,'7429'),'locked');
 advance(m,9,good('chronos_final')); assert.equal(m.status,'playing'); assert.equal(m.score,0);
 for(const ch of CHANNELS.slice(0,5)) { advance(m,5,good(ch.id)); advance(m,15,{powerOn:false}); }
 assert.equal(m.collected.length,5); assert.equal(submitCode(m,'0000'),'wrong');
 assert.equal(m.mistakes,1); assert.equal(submitCode(m,'7429'),'correct');
 const score=m.score; assert.equal(submitCode(m,'7429'),'unlocked'); assert.equal(m.score,score);
 advance(m,7,good('chronos_final')); assert.equal(m.status,'playing'); advance(m,1.1,good('chronos_final'));
 assert.equal(m.status,'won'); assert.ok(m.score>10000);
});
test('timeout and exhausted battery each produce a terminal loss',()=>{
 const m=play(); m.elapsed=DIFFICULTIES.operator.duration-.01; advance(m,.1,{powerOn:false}); assert.equal(m.status,'lost'); assert.equal(m.reason,'timeout');
 const n=play(); n.battery=.001; advance(n,.1,{powerOn:true}); assert.equal(n.status,'lost'); assert.equal(n.reason,'battery');
 const elapsed=n.elapsed; advance(n,2,good('borealis')); assert.equal(n.elapsed,elapsed);
});
test('pause and briefing freeze all resources and gameplay',()=>{
 for (const status of ['briefing','paused','lost','won']) { const m=createMission(); m.status=status; const snapshot=JSON.stringify(m); advance(m,3,good('borealis')); assert.equal(JSON.stringify(m),snapshot); }
});
test('overheating trips circuit, costs battery, blocks recording and then recovers',()=>{
 const m=play(); m.heat=99.9; const events=advance(m,.1,good('borealis')); assert.ok(events.some(e=>e.type==='overheat')); assert.ok(m.trip>7); assert.equal(m.progress,0);
 advance(m,7,{powerOn:false}); assert.ok(m.trip>0); advance(m,2,{powerOn:false}); assert.equal(m.trip,0); assert.ok(m.heat<60);
});
test('coolant is finite; power-off recovery spends time',()=>{
 const m=play(); m.heat=90; assert.equal(useCoolant(m),true); assert.equal(m.heat,45); useCoolant(m); useCoolant(m); assert.equal(useCoolant(m),false);
 m.battery=40; advance(m,10,{powerOn:false}); assert.ok(m.battery>41); assert.ok(m.elapsed>=10);
});
test('scanner costs energy, respects cooldown and never unlocks a channel',()=>{
 const m=play(); assert.equal(scan(m).id,'borealis'); assert.equal(m.battery,97); assert.equal(scan(m),null); assert.deepEqual(m.collected,[]);
 advance(m,19,{powerOn:false}); assert.ok(scan(m));
});
test('antenna and storm drift affect reception predictably',()=>{
 const m=play(); const ch=CHANNELS[0]; m.antenna=ch.bearing; assert.equal(antennaGain(m,ch),1); m.antenna=180; assert.ok(antennaGain(m,ch)<.1);
 m.elapsed=55; assert.equal(stormAt(m).warning,true); m.elapsed=65; assert.equal(stormAt(m).active,true); assert.ok(Math.abs(carrierFrequency(m,ch)-ch.freq)<.018);
});
test('saves resume paused with no offline resource drain; invalid data is bounded',()=>{
 const m=play(); advance(m,5,good('borealis')); const loaded=restoreMission(JSON.parse(JSON.stringify(m)));
 assert.equal(loaded.status,'paused'); assert.equal(loaded.elapsed,m.elapsed); assert.deepEqual(loaded.collected,m.collected); assert.equal(loaded.progress,0);
 const bad=restoreMission({...m,battery:-99,antenna:999,collected:['fake','borealis','borealis'],unlocked:true}); assert.equal(bad.battery,0); assert.equal(bad.antenna,180); assert.equal(bad.unlocked,false); assert.deepEqual(bad.collected,['borealis']);
 assert.equal(restoreMission({version:0}).status,'briefing');
});
