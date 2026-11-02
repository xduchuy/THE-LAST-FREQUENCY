import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, restoreMission, tickMission, CHANNELS, DIFFICULTIES, stormAt, antennaGain, carrierFrequency, scan, useCoolant, submitCode } from '../src/mission.js';
function play(d='operator') { const m=createMission(d); m.status='playing'; return m; }
function advance(m, seconds, input={}) { const events=[]; for(let i=0;i<Math.ceil(seconds*20);i++) events.push(...tickMission(m,.05,input)); return events; }
const good = id => ({ powerOn:true, holding:true, stationId:id, signal:1, stable:true,frequency:CHANNELS.find(c=>c.id===id).freq,targetFrequency:CHANNELS.find(c=>c.id===id).freq,distance:0,warmUpLevel:1 });
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

import { evaluateReception, terminalReason } from '../src/mission.js';
import { MissionClock } from '../src/mission-clock.js';
function unlockedCandidate(){const m=play();m.collected=CHANNELS.slice(0,5).map(c=>c.id);return m;}
for(const [battery,remaining,reason] of [[4,100,'battery'],[100,10,'timeout'],[4,10,'battery']])test(`wrong code immediately loses with battery ${battery} and ${remaining}s left`,()=>{
 const m=unlockedCandidate();m.battery=battery;m.elapsed=DIFFICULTIES.operator.duration-remaining;m.progress=2;
 assert.equal(submitCode(m,'0000'),'lost');assert.equal(m.status,'lost');assert.equal(m.reason,reason);assert.equal(m.progress,0);
 const snapshot=JSON.stringify(m);assert.equal(submitCode(m,'7429'),'locked');assert.equal(useCoolant(m),false);assert.equal(scan(m),null);assert.deepEqual(tickMission(m,60,good('borealis')),[]);assert.equal(JSON.stringify(m),snapshot);
 const loaded=restoreMission(JSON.parse(snapshot));assert.equal(loaded.status,'lost');assert.equal(loaded.reason,reason);
});
test('valid code awards once; invalid values have no penalty or NaN mutations',()=>{
 const m=unlockedCandidate(),before=JSON.stringify(m);for(const code of [null,undefined,{},NaN,'abc','12345'])assert.equal(submitCode(m,code),'invalid');assert.equal(JSON.stringify(m),before);
 assert.equal(submitCode(m,'7429'),'correct');const score=m.score;assert.equal(submitCode(m,'7429'),'unlocked');assert.equal(m.score,score);
 for(const dt of [NaN,Infinity,-1,0])assert.deepEqual(tickMission(m,dt,good('borealis')),[]);
});
test('deadline has priority over an exactly simultaneous SOS; a strictly earlier SOS wins',()=>{
 const lost=unlockedCandidate();lost.unlocked=true;lost.elapsed=719.95;lost.progress=7.95;lost.captureId='chronos_final';
 tickMission(lost,.05,good('chronos_final'));assert.equal(lost.status,'lost');assert.equal(lost.reason,'timeout');assert.equal(lost.score,0);
 const won=unlockedCandidate();won.unlocked=true;won.elapsed=719.9;won.progress=7.95;won.captureId='chronos_final';
 tickMission(won,.05,good('chronos_final'));assert.equal(won.status,'won');const state=JSON.stringify(won);tickMission(won,10,good('chronos_final'));assert.equal(JSON.stringify(won),state);
});
test('zero battery cannot recharge back out of loss; overheat and battery exhaustion are atomic',()=>{
 const m=play();m.battery=0;tickMission(m,.05,{powerOn:false});assert.equal(m.status,'lost');assert.equal(m.reason,'battery');
 const hot=play();hot.battery=7;hot.heat=99.99;hot.progress=1;const events=tickMission(hot,.05,good('borealis'));
 assert.ok(events.some(e=>e.type==='overheat'));assert.ok(events.some(e=>e.type==='lost'));assert.equal(hot.progress,0);
});
test('scanner exactly three percent refuses; cooling during trip does not bypass fuse time',()=>{
 const m=play();m.battery=3;assert.equal(scan(m),null);assert.equal(m.battery,3);
 m.trip=5;m.heat=90;assert.equal(useCoolant(m),true);assert.equal(m.heat,45);assert.equal(m.trip,5);assert.equal(evaluateReception(m,good('borealis')).reason,'trip');
});
test('storm boundaries, combo and duplicate recordings retain original rules',()=>{
 const m=play();for(const [time,active] of [[59.95,false],[60,true],[77.95,true],[78,false],[150,true]]){m.elapsed=time;assert.equal(stormAt(m).active,active);}
 m.elapsed=0;tickMission(m,4.5,good('borealis')); // long unsampled gap must not decode.
 assert.equal(m.collected.length,0);advance(m,4.5,good('borealis'));assert.equal(m.score,1000);m.heat=0;
 advance(m,4.5,good('echo7'));assert.equal(m.score,2200);const score=m.score;advance(m,5,good('echo7'));assert.equal(m.score,score);
});
test('reception eligibility has one reason for warmup, flywheel, signal, trip, archive and final lock',()=>{
 const m=play(),input=good('borealis');assert.equal(evaluateReception(m,input).canCapture,true);
 for(const [patch,reason] of [[{warmUpLevel:.8},'warming'],[{targetFrequency:3.3},'tuning'],[{signal:.2},'antenna'],[{distance:.05},'search'],[{signal:NaN},'invalid'],[{frequency:Infinity},'invalid'],[{powerOn:false},'off']]){
  const r=evaluateReception(m,{...input,...patch});assert.equal(r.canCapture,false);assert.equal(r.reason,reason);
 }
 assert.equal(evaluateReception(m,good('chronos_final')).reason,'locked');m.collected=['borealis'];assert.equal(evaluateReception(m,input).reason,'collected');m.status='paused';assert.equal(evaluateReception(m,input).reason,'inactive');
});
test('restore cannot turn exhausted resources into a paused playable mission',()=>{
 for(const saved of [{battery:0},{elapsed:720},{status:'won',unlocked:true,collected:CHANNELS.slice(0,5).map(c=>c.id),battery:0}]){
  const m=restoreMission({...createMission(),status:'playing',...saved});assert.equal(m.status,'lost');assert.ok(terminalReason(m));
 }
});
function runClock(fps,seconds,input={powerOn:true}){
 const m=play(),clock=new MissionClock();clock.advance(m,0,true,input);
 for(let i=1;i<=Math.round(fps*seconds);i++)clock.advance(m,i*1000/fps,true,input);
 return m;
}
test('authoritative mission time and deterministic resources agree at 60/30/10/5/2 FPS',()=>{
 const baseline=runClock(60,180);
 for(const fps of [60,30,10,5,2]){const m=runClock(fps,180);assert.ok(Math.abs(m.elapsed-180)<1e-7);assert.ok(Math.abs(m.battery-baseline.battery)<1e-7);assert.ok(Math.abs(m.heat-baseline.heat)<1e-7);}
});
test('18/12/9 minute deadlines remain exact at all tested frame rates',()=>{
 for(const difficulty of Object.keys(DIFFICULTIES))for(const fps of [60,10,5,2]){
  const m=play(difficulty),clock=new MissionClock();clock.advance(m,0,true,{powerOn:false});const duration=DIFFICULTIES[difficulty].duration;
  for(let i=1;i<=fps*duration;i++)clock.advance(m,i*1000/fps,true,{powerOn:false});
  assert.equal(m.status,'lost');assert.equal(m.reason,'timeout');assert.ok(Math.abs(m.elapsed-duration)<1e-6);
 }
});
test('pause/hidden intervals, resume anchors, and reload never add offline time',()=>{
 const m=play(),clock=new MissionClock();clock.advance(m,0,true,{powerOn:true});clock.advance(m,500,true,{powerOn:true});clock.advance(m,700,false,{powerOn:true});
 assert.ok(Math.abs(m.elapsed-.7)<1e-9);const battery=m.battery;clock.advance(m,30700,false,{powerOn:true});assert.equal(m.battery,battery);assert.equal(m.elapsed,.7);
 clock.advance(m,31000,true,{powerOn:true});clock.advance(m,31500,true,{powerOn:true});assert.ok(Math.abs(m.elapsed-1.2)<1e-9);
 const restored=restoreMission(JSON.parse(JSON.stringify(m))),fresh=new MissionClock();fresh.advance(restored,900000,false,{});assert.equal(restored.elapsed,m.elapsed);assert.equal(restored.status,'paused');
});
test('long stalls charge full time/resources with no capture credit and bounded catch-up',()=>{
 const m=play(),clock=new MissionClock(),input=good('borealis');clock.advance(m,0,true,input);
 const result=clock.advance(m,30000,true,input);assert.equal(result.stall,true);assert.equal(m.elapsed,30);assert.equal(m.collected.length,0);assert.equal(m.progress,0);assert.ok(Math.abs(m.battery-(100-.085*30))<1e-6);assert.ok(result.steps<=601);
 const next=clock.advance(m,30500,true,input);
 assert.equal(next.stall,false);assert.equal(m.elapsed,30.5);assert.equal(m.collected.length,0);assert.equal(m.progress,0);
 clock.advance(m,31000,true,input);assert.ok(Math.abs(m.progress-.5)<1e-9); // Only new, valid endpoint observations earn progress.
 const fatal=play(),other=new MissionClock();other.advance(fatal,0,true,input);const end=other.advance(fatal,1e12,true,input);assert.equal(fatal.status,'lost');assert.ok(end.steps<=21601);assert.equal(fatal.collected.length,0);
});
test('clock ignores invalid/backward samples and preserves fractional active time',()=>{
 const m=play(),clock=new MissionClock();clock.advance(m,100,true,{});clock.advance(m,125,true,{});assert.equal(m.elapsed,.025);
 clock.advance(m,NaN,true,{});clock.advance(m,120,true,{});clock.advance(m,150,true,{});assert.equal(m.elapsed,.05);
});

test('fixed-step capture and holding resource costs agree at 60/30/10/5/2 FPS',()=>{
 const input=good('borealis'),baseline=runClock(60,6,input);
 for(const fps of [60,30,10,5,2]){
  const m=runClock(fps,6,input);assert.deepEqual(m.collected,['borealis']);assert.equal(m.score,baseline.score);
  assert.ok(Math.abs(m.battery-baseline.battery)<1e-7);assert.ok(Math.abs(m.heat-baseline.heat)<1e-7);assert.ok(Math.abs(m.elapsed-6)<1e-7);
 }
});
test('capture needs continuous valid samples; no credit transfers across power or tuning changes',()=>{
 const m=play(),clock=new MissionClock(),input=good('borealis');clock.advance(m,0,true,input);
 clock.advance(m,500,true,{...input,warmUpLevel:.2});assert.equal(m.progress,0);
 clock.advance(m,1000,true,input);assert.equal(m.progress,0);clock.advance(m,1500,true,input);assert.ok(Math.abs(m.progress-.5)<1e-9);
 clock.advance(m,2000,true,{...good('echo7')});assert.ok(m.progress<.5);clock.advance(m,2500,true,good('echo7'));assert.equal(m.captureId,'echo7');assert.ok(m.progress<=.5);
});
test('intro, pause and terminal states refuse scanner, coolant, codes and recording without mutation',()=>{
 for(const status of ['briefing','paused','lost','won']){
  const m=unlockedCandidate();m.status=status;const snapshot=JSON.stringify(m);
  assert.equal(scan(m),null);assert.equal(useCoolant(m),false);assert.equal(submitCode(m,'7429'),'locked');tickMission(m,.5,good('chronos_final'));assert.equal(JSON.stringify(m),snapshot);
 }
});
