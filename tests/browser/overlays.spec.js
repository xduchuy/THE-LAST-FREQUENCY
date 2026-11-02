import {test,expect} from '@playwright/test';
const diagnostics=page=>page.evaluate(()=>window.__radioDiagnostics());
async function start(page){await page.goto('/');await page.locator('#btn-start-session').click();await expect(page.locator('#intro-overlay')).toBeHidden();}
for(const [button,id] of [['btn-journal','journal'],['btn-sound','settings'],['btn-help','help']]){
 test(`Escape closes ${id} without pausing and restores focus`,async({page})=>{
  await start(page);await page.locator(`#${button}`).click();
  await expect.poll(async()=>(await diagnostics(page)).overlay).toBe(id);
  expect(await page.locator('#btn-hud-power').evaluate(el=>Boolean(el.closest('[inert]')))).toBe(true);
  await page.keyboard.press('Escape');await expect.poll(async()=>(await diagnostics(page)).overlay).toBeUndefined();
  expect((await diagnostics(page)).missionStatus).toBe('playing');await expect(page.locator('#mission-modal')).toBeHidden();
  await expect(page.locator(`#${button}`)).toBeFocused();
 });
}
test('Escape pauses/resumes once, repeated keydown cannot toggle twice, and modal traps Tab',async({page})=>{
 await start(page);await page.keyboard.down('Escape');await page.keyboard.down('Escape');await page.keyboard.up('Escape');
 expect((await diagnostics(page)).missionStatus).toBe('paused');
 for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await page.locator('#mission-modal').evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');expect((await diagnostics(page)).missionStatus).toBe('playing');
 await expect(page.locator('#mission-modal')).toBeHidden();
});
test('notes, modifiers, and modal hotkeys never tune, power or capture',async({page})=>{
 await start(page);const initial=await diagnostics(page);await page.locator('#btn-workbench').click();
 await page.locator('#operator-note').fill('Note');await page.keyboard.type(' p r c j k ');await page.keyboard.press('Space');
 const after=await diagnostics(page);expect(after.holdingCapture).toBe(false);expect(after.powerOn).toBe(initial.powerOn);expect(after.targetFrequency).toBe(initial.targetFrequency);
 await expect(page.locator('#operator-note')).toHaveValue('Note p r c j k  ');
 await page.keyboard.press('Escape');await page.locator('body').click({position:{x:3,y:3}});
 await page.keyboard.press('Control+p');expect((await diagnostics(page)).powerOn).toBe(initial.powerOn);
});
test('capture blur releases pointer and freezes the mission',async({page})=>{
 await start(page);const box=await page.locator('#btn-capture').boundingBox();await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();
 await expect.poll(async()=>(await diagnostics(page)).holdingCapture).toBe(true);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect.poll(async()=>(await diagnostics(page)).holdingCapture).toBe(false);
 await expect(page.locator('#mission-modal')).toBeVisible();await page.mouse.up();
});
for(const status of ['lost','won'])test(`Escape preserves terminal ${status} state`,async({page})=>{
 await page.addInitScript(status=>localStorage.setItem('the_last_frequency_save_v3',JSON.stringify({mission:{version:3,difficulty:'operator',status,battery:status==='lost'?0:80,elapsed:60,collected:status==='won'?['borealis','echo7','orpheus','k19','helios4']:[],unlocked:status==='won'}})),status);
 await start(page);await page.keyboard.press('Escape');expect((await diagnostics(page)).missionStatus).toBe(status);
 await expect(page.locator(status==='won'?'#victory-modal':'#mission-modal')).toBeVisible();
});

test('the focused Capture button supports keyboard hold and releases on keyup',async({page})=>{
 await start(page);await page.locator('#btn-capture').focus();await page.keyboard.down('Space');
 await expect.poll(async()=>(await diagnostics(page)).holdingCapture).toBe(true);
 await page.keyboard.up('Space');await expect.poll(async()=>(await diagnostics(page)).holdingCapture).toBe(false);
});

test('freeplay resumes the existing AudioContext after victory and returning from a hidden tab',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('the_last_frequency_save_v3',JSON.stringify({mission:{version:3,difficulty:'operator',status:'won',battery:80,collected:['borealis','echo7','orpheus','k19','helios4'],unlocked:true}})));
 await start(page);await expect(page.locator('#victory-modal')).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect.poll(async()=>(await diagnostics(page)).audioState).toBe('suspended');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.locator('#btn-continue-freeplay').click();await expect.poll(async()=>(await diagnostics(page)).audioState).toBe('running');
 expect((await diagnostics(page)).missionStatus).toBe('won');await expect(page.locator('#victory-modal')).toBeHidden();
});
