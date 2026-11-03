import {test,expect} from '@playwright/test';
import {useControl,setControl} from './ui.js';
const SAVE='the_last_frequency_save_v3',ids=['borealis','echo7','orpheus','k19','helios4'];
const diag=page=>page.evaluate(()=>window.__radioDiagnostics());
async function ready(page,won=true){
 await page.addInitScript(({SAVE,ids,won})=>{if(!localStorage.getItem(SAVE))localStorage.setItem(SAVE,JSON.stringify({highQuality:false,mission:{version:3,difficulty:'operator',status:won?'won':'paused',battery:80,elapsed:120,score:10000,collected:won?ids:['borealis'],unlocked:won}}));},{SAVE,ids,won});
 await page.goto('/');await page.locator('#btn-start-session').click();if(won)await page.locator('#btn-continue-freeplay').click();
 await useControl(page,'#btn-workbench');
}
test('tape plays real PCM, slows/seeks, pauses with other overlays and keeps campaign resources frozen',async({page})=>{
 await ready(page);const before=await diag(page);await expect(page.locator('#tape-station option')).toHaveCount(5);
 await page.locator('.tape-deck').screenshot({path:test.info().outputPath('tape-deck.png')});await page.locator('#tape-play').click();await expect.poll(async()=>(await diag(page)).tapePosition).toBeGreaterThan(.2);expect((await diag(page)).tapePlaying).toBe(true);
 await page.locator('#tape-speed').selectOption('.5');expect((await diag(page)).tapeRate).toBe(.5);
 await page.locator('#tape-position').fill('1');await page.locator('#tape-play').click();const paused=await diag(page);expect(paused.tapePlaying).toBe(false);await page.waitForTimeout(300);expect((await diag(page)).tapePosition).toBe(paused.tapePosition);
 await page.locator('#tape-play').click();await page.keyboard.press('Escape');expect((await diag(page)).tapePlaying).toBe(false);
 const after=await diag(page);expect(after.missionElapsed).toBe(before.missionElapsed);expect(after.battery).toBe(before.battery);
 await useControl(page,'#btn-workbench');await page.locator('#tape-play').click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(async()=>(await diag(page)).tapePlaying).toBe(false);
});
test('board pins only collected clues, circles numbers, connects evidence and persists notes/links across reload',async({page})=>{
 await page.setViewportSize({width:320,height:568});await ready(page);await page.locator('[data-tab="tab-notes"]').click();
 for(const id of ['borealis','orpheus']){await page.locator('#board-station').selectOption(id);await page.locator('#board-pin').click();}
 await page.locator('#board-mark').fill('3');await page.locator('#board-highlight').click();await expect(page.locator('#board-cards mark').first()).toHaveText('3');
 await page.locator('#board-from').selectOption('borealis');await page.locator('#board-to').selectOption('orpheus');await page.locator('#board-connect').click();await expect(page.locator('#board-links li')).toHaveCount(1);
 await page.locator('#board-cards article').first().scrollIntoViewIfNeeded();await page.screenshot({path:test.info().outputPath('investigation-board.png')});await page.locator('#operator-note').fill('D2 = số kỹ sư + 1');await page.locator('#btn-save-operator-note').click();
 await page.reload();await page.locator('#btn-start-session').click();await page.locator('#btn-continue-freeplay').click();await useControl(page,'#btn-journal');await page.locator('[data-tab="tab-notes"]').click();await expect(page.locator('#board-cards article')).toHaveCount(2);await expect(page.locator('#board-links li')).toHaveCount(1);await expect(page.locator('#operator-note')).toHaveValue('D2 = số kỹ sư + 1');
 await page.locator('#board-cards button').first().click();await expect(page.locator('#board-links li')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const id of ['relay','telegram','bearing'])test(`post-CHRONOS ${id} contract uses real manual radio input and keeps campaign won`,async({page})=>{
 await ready(page);const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).mission,SAVE);
 await page.locator('#side-contract').selectOption(id);await page.locator('#side-start').click();await expect(page.locator('#journal-drawer')).toBeHidden();
 const targets=id==='relay'?[[320,35],[890,145]]:id==='telegram'?[[475,110]]:[[618,65]];
 for(const [freq,bearing] of targets){await setControl(page,'#hud-freq-slider',String(freq));await setControl(page,'#antenna',String(bearing));await expect.poll(async()=>(await diag(page)).powerOn).toBe(true);await page.waitForTimeout(1300);
  const index=(await diag(page)).fieldOperations.shift.index;await page.locator('#btn-capture').focus();await page.keyboard.down('Space');await expect.poll(async()=>(await diag(page)).fieldOperations.shift.index,{timeout:12000}).toBeGreaterThan(index);await page.keyboard.up('Space');
 }
 if(id==='relay')await expect(page.locator('#side-live')).toBeHidden();
 await useControl(page,'#btn-workbench');
 if(id!=='relay'){await page.locator('#side-answer').fill(id==='telegram'?'47':'65');await page.locator('#side-submit').click();}
 await expect(page.locator('#side-state')).toContainText('HOÀN TẤT');await expect(page.locator(`#side-records [data-contract="${id}"]`)).toContainText('HOÀN TẤT');const after=await diag(page);expect(after.missionStatus).toBe('won');expect(after.battery).toBe(before.battery);expect(after.missionElapsed).toBe(before.elapsed);expect(after.fieldOperations.completed).toContain(id);
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).mission,SAVE);expect(saved.score).toBe(before.score);await page.reload();await page.locator('#btn-start-session').click();await page.locator('#btn-continue-freeplay').click();expect((await diag(page)).fieldOperations.completed).toContain(id);
});
test('side contracts remain locked before CHRONOS and only recorded station tapes/evidence are exposed',async({page})=>{
 await ready(page,false);await expect(page.locator('#side-start')).toBeDisabled();await expect(page.locator('#tape-station option')).toHaveCount(1);await page.locator('[data-tab="tab-notes"]').click();await expect(page.locator('#board-station option')).toHaveCount(1);
});

test('side pause/reload excludes offline time, clears partial capture, and campaign restart ends the side shift',async({page})=>{
 await ready(page);await page.locator('#side-contract').selectOption('telegram');await page.locator('#side-start').click();
 await page.locator('#hud-freq-slider').fill('475');await page.locator('#antenna').fill('110');await page.waitForTimeout(1500);
 await page.locator('#btn-capture').focus();await page.keyboard.down('Space');await expect.poll(async()=>(await diag(page)).fieldOperations.shift.progress).toBeGreaterThan(.2);await page.locator('#btn-operations').click();await page.keyboard.up('Space');
 const paused=await diag(page);await page.waitForTimeout(500);expect((await diag(page)).fieldOperations.shift.elapsed).toBe(paused.fieldOperations.shift.elapsed);expect((await diag(page)).holdingCapture).toBe(false);
 await page.reload();await page.waitForTimeout(400);await page.locator('#btn-start-session').click();const restored=await diag(page);expect(Math.abs(restored.fieldOperations.shift.elapsed-paused.fieldOperations.shift.elapsed)).toBeLessThan(.15);expect(restored.fieldOperations.shift.progress).toBe(0);
 await page.locator('#btn-replay-reset').click();const reset=await diag(page);expect(reset.missionStatus).toBe('briefing');expect(reset.fieldOperations.shift.status).toBe('lost');expect(reset.holdingCapture).toBe(false);
});

test('hidden tab pauses an optional shift until the operations menu is explicitly closed',async({page})=>{
 await ready(page);await page.locator('#side-start').click();
 await expect.poll(async()=>(await diag(page)).fieldOperations.shift.elapsed).toBeGreaterThan(.15);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('#operations-drawer')).toBeVisible();
 const paused=(await diag(page)).fieldOperations.shift.elapsed;
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(300);expect((await diag(page)).fieldOperations.shift.elapsed).toBe(paused);
 await page.locator('#btn-close-operations').click();
 await expect.poll(async()=>(await diag(page)).fieldOperations.shift.elapsed).toBeGreaterThan(paused+.15);
 await expect.poll(async()=>(await diag(page)).audioState).toBe('running');
});
