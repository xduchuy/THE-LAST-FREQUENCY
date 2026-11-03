import test from 'node:test';import assert from 'node:assert/strict';
import {contextualMessage} from '../src/minimal-ui.js';
const sample=(patch={})=>({mission:{status:'playing',trip:0,battery:100,heat:12},reception:{canCapture:false,reason:'search'},storm:{active:false,warning:false},holding:false,frequency:3.2,signal:.7,tuning:false,...patch});
test('one contextual message gives resource danger priority over recording, storms and notices',()=>{
 const s=sample({holding:true,reception:{canCapture:true},storm:{active:true},notice:'SAVED'});
 assert.equal(contextualMessage({...s,mission:{...s.mission,trip:5}}).tone,'danger');
 assert.match(contextualMessage({...s,mission:{...s.mission,battery:10}}).text,/PIN YẾU/);
 assert.match(contextualMessage({...s,mission:{...s.mission,heat:95}}).text,/NHIỆT CAO/);
 assert.match(contextualMessage(s).text,/ĐANG THU/);
 assert.equal(contextualMessage({...s,holding:false}).text,'SAVED');
});
test('contextual lock requires actual reception eligibility; inactive and ordinary searching stay quiet',()=>{
 for(const reason of ['warming','tuning','antenna','off','collected','locked','search']){
  assert.doesNotMatch(contextualMessage(sample({reception:{reason,canCapture:false},tuning:true})).text,/ĐÃ KHÓA/);
 }
 assert.match(contextualMessage(sample({reception:{canCapture:true}})).text,/ĐÃ KHÓA/);
 assert.equal(contextualMessage(sample()).text,'');
 for(const status of ['paused','briefing','won','lost'])assert.equal(contextualMessage(sample({mission:{status},notice:'SAVED'})).text,'');
 assert.match(contextualMessage(sample({nearby:true})).text,/LÂN CẬN/);
 assert.match(contextualMessage(sample({tuning:true})).text,/3.20 MHz/);
});
