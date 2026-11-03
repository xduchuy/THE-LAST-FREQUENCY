import {operations,useControl,setControl} from './ui.js';
import {test,expect} from '@playwright/test';
const SAVE='the_last_frequency_save_v3';
const diag=page=>page.evaluate(()=>window.__radioDiagnostics());
async function start(page){await page.goto('/');await page.locator('#btn-start-session').click();await expect(page.locator('#intro-overlay')).toBeHidden();}
for(const [battery,elapsed,reason] of [[4,0,'battery'],[100,710,'timeout'],[4,710,'battery']]){
 test(`wrong code at ${battery}% / ${720-elapsed}s opens one loss report immediately and persists`,async({page})=>{
  await page.addInitScript(({SAVE,battery,elapsed})=>{
   if(!localStorage.getItem(SAVE))localStorage.setItem(SAVE,JSON.stringify({mission:{version:3,difficulty:'operator',status:'paused',battery,elapsed,collected:['borealis','echo7','orpheus','k19','helios4']}}));
  },{SAVE,battery,elapsed});
  await start(page);await useControl(page,'#btn-journal','click');await page.locator('[data-tab="tab-decoder"]').click();
  await page.locator('#btn-verify-code').click();
  await expect(page.locator('#journal-drawer')).toBeHidden();await expect(page.locator('#mission-modal-title')).toHaveText('Tín hiệu đã tắt.');
  const lost=await diag(page);expect(lost.overlay).toBe('mission');expect(lost.missionStatus).toBe('lost');expect(lost.reason).toBe(reason);expect(lost.holdingCapture).toBe(false);expect(lost.powerOn).toBe(false);
  await expect.poll(async()=>(await diag(page)).audioGain).toBeLessThan(.002);
  await page.locator('#mission-modal').focus(); // Space must not activate the deliberately focused New Shift button.
  await page.keyboard.press('Space');await page.keyboard.press('r');await page.keyboard.press('c');
  expect((await diag(page)).battery).toBe(lost.battery);expect((await diag(page)).missionElapsed).toBe(lost.missionElapsed);
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).mission.status,SAVE)).toBe('lost');
  await page.reload();await page.locator('#btn-start-session').click();expect((await diag(page)).missionStatus).toBe('lost');
  await expect(page.locator('#mission-modal')).toBeVisible();await page.screenshot({path:test.info().outputPath('wrong-code-loss.png')});
 });
}
for(const fps of [60,10,5,2])test(`browser mission clock accounts for real time at ${fps} FPS`,async({page})=>{
 // Delay actual RAF callbacks, leaving performance.now and native input untouched.
 await page.addInitScript(fps=>{if(fps<60){const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>raf.call(window,()=>setTimeout(()=>fn(performance.now()),1000/fps));}},fps);
 await start(page);const before=await page.evaluate(()=>({now:performance.now(),d:window.__radioDiagnostics()}));
 await page.waitForTimeout(2200);
 const after=await page.evaluate(()=>({now:performance.now(),d:window.__radioDiagnostics()}));
 await test.info().attach('clock.json',{body:JSON.stringify({fps,realSeconds:(after.now-before.now)/1000,missionSeconds:after.d.missionElapsed-before.d.missionElapsed}),contentType:'application/json'});
 expect(after.d.missionStatus).toBe('playing');
 expect(Math.abs((after.d.missionElapsed-before.d.missionElapsed)-(after.now-before.now)/1000)).toBeLessThan(1/fps+.15);
});
test('pause and hidden intervals freeze resources; resume and reload use fresh anchors',async({page})=>{
 await start(page);await page.locator('#btn-pause').click();const paused=await diag(page);
 await page.waitForTimeout(1000);expect((await diag(page)).missionElapsed).toBe(paused.missionElapsed);expect((await diag(page)).battery).toBe(paused.battery);
 await page.locator('#btn-resume').click();await page.waitForTimeout(300);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 const hidden=await diag(page);await page.waitForTimeout(1000);expect((await diag(page)).missionElapsed).toBe(hidden.missionElapsed);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 expect((await diag(page)).missionStatus).toBe('paused');expect((await diag(page)).audioState).toBe('suspended');
 await page.locator('#btn-resume').click();await page.waitForTimeout(300);expect((await diag(page)).missionElapsed).toBeGreaterThan(hidden.missionElapsed);
 await page.locator('#btn-pause').click();const saved=await diag(page);await page.reload();await page.waitForTimeout(1000);await page.locator('#btn-start-session').click();
 expect(Math.abs((await diag(page)).missionElapsed-saved.missionElapsed)).toBeLessThan(.15);
});
test('an actual blocked main thread counts stall time, gives no recording credit and retains only the actual held input',async({page})=>{
 await start(page);await page.locator('#hud-freq-slider').fill('320');await page.locator('#antenna').fill('35');await expect(page.locator('#capture-status')).toContainText('TÍN HIỆU TỐT');
 await page.locator('#btn-capture').focus();await page.keyboard.down('Space');await page.waitForTimeout(150);const before=await diag(page);
 const observedAt=await page.evaluate(()=>{const until=performance.now()+2300;while(performance.now()<until){/* deliberate real stall */}return performance.now();});
 await expect(page.locator('#mission-feedback')).toContainText('Liên lạc gián đoạn');const sample=await page.evaluate(()=>({now:performance.now(),d:window.__radioDiagnostics()})),after=sample.d;
 expect(after.missionElapsed-before.missionElapsed).toBeGreaterThanOrEqual(2.3);
 // New progress is bounded by time AFTER observations resumed, never the blocked interval.
 expect(after.progress).toBeLessThanOrEqual((sample.now-observedAt)/1000+.05);expect(after.holdingCapture).toBe(true);expect(after.missionStatus).toBe('playing');
 await expect(page.locator('#progress-counter')).toHaveText('0/5 TÍN HIỆU');
 await expect(page.locator('#mission-modal')).toBeHidden();
 await page.keyboard.up('Space');expect((await diag(page)).holdingCapture).toBe(false);
});
test('HUD shares warmup, flywheel, ready and stored-record rules; telemetry stays at 10 Hz',async({page})=>{
 await start(page);await page.locator('#hud-freq-slider').fill('320');await page.locator('#antenna').fill('35');
 await expect(page.locator('#capture-status')).toContainText('TÍN HIỆU TỐT');expect((await diag(page)).reception.canCapture).toBe(true);
 await useControl(page,'#btn-hud-power','click');await expect(page.locator('#capture-status')).toContainText('BẬT PWR');expect((await diag(page)).reception.canCapture).toBe(false);
 await page.waitForTimeout(1800);await useControl(page,'#btn-hud-power','click');await expect(page.locator('#capture-status')).toContainText('LÀM NÓNG');
 await expect(page.locator('#capture-status')).toContainText('TÍN HIỆU TỐT');
 await page.locator('#hud-freq-slider').fill('350');await expect(page.locator('#capture-status')).toContainText('ĐANG TRƯỢT');
 await page.locator('#hud-freq-slider').fill('320');await expect(page.locator('#capture-status')).toContainText('TÍN HIỆU TỐT');
 const before=await diag(page);await page.waitForTimeout(1200);const after=await diag(page);
 await test.info().attach('telemetry.json',{body:JSON.stringify({windowSeconds:1.2,missionPaints:after.telemetryPaints-before.telemetryPaints,hudPaints:after.hudPaints-before.hudPaints}),contentType:'application/json'});
 expect(after.telemetryPaints-before.telemetryPaints).toBeGreaterThan(5);expect(after.telemetryPaints-before.telemetryPaints).toBeLessThanOrEqual(13);expect(after.hudPaints-before.hudPaints).toBeLessThanOrEqual(13);
 await page.locator('#btn-capture').focus();await page.keyboard.down('Space');await expect(page.locator('#progress-counter')).toHaveText('1/5 TÍN HIỆU',{timeout:10000});await page.keyboard.up('Space');
 await expect(page.locator('#capture-status')).toContainText('BẢN TIN ĐÃ LƯU');expect((await diag(page)).reception.reason).toBe('collected');
});
