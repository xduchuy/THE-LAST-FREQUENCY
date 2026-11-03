import {test,expect} from '@playwright/test';
import {operations,useControl} from './ui.js';
const diag=page=>page.evaluate(()=>window.__radioDiagnostics());
async function start(page){await page.goto('/');await page.locator('#btn-start-session').click();await expect(page.locator('#intro-overlay')).toBeHidden();}
test('Field Operations freezes time and input, keeps urgent actions one menu away, and restores focus',async({page})=>{
 await start(page);await page.locator('#btn-capture').focus();await page.keyboard.down('Space');
 await operations(page);await page.keyboard.up('Space');const before=await diag(page);expect(before.holdingCapture).toBe(false);
 await page.waitForTimeout(600);const frozen=await diag(page);expect(frozen.missionElapsed).toBe(before.missionElapsed);expect(frozen.battery).toBe(before.battery);
 // Focus the dialog, not its native Close button: Space on Close correctly activates it.
 await page.locator('#operations-drawer').focus();
 for(const key of ['p','r','c','ArrowRight','Space'])await page.keyboard.press(key);
 const after=await diag(page);expect(after.overlay).toBe('operations');expect(after.powerOn).toBe(before.powerOn);expect(after.targetFrequency).toBe(before.targetFrequency);expect(after.holdingCapture).toBe(false);
 for(let i=0;i<12;i++){await page.keyboard.press('Tab');expect(await page.locator('#operations-drawer').evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');await expect(page.locator('#btn-operations')).toBeFocused();await expect(page.locator('#mission-modal')).toBeHidden();
 await operations(page);await expect(page.locator('#btn-scan')).toBeInViewport();await expect(page.locator('#btn-coolant')).toBeInViewport();
 await page.locator('#btn-scan').click();await expect(page.locator('#operations-drawer')).toBeHidden();expect((await diag(page)).battery).toBeLessThan(before.battery-2.9);
 await operations(page);await page.locator('#btn-coolant').click();await expect(page.locator('#operations-drawer')).toBeHidden();await expect(page.locator('#coolant-count')).toContainText('2 BÌNH');
});
test('rotation preserves focused drawer controls; four dossier tabs preserve notes after reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);await operations(page);await page.locator('#antenna').fill('35');await page.locator('#antenna').focus();
 await page.setViewportSize({width:844,height:390});await expect(page.locator('#antenna')).toBeFocused();await expect(page.locator('#antenna')).toHaveValue('35');
 await page.setViewportSize({width:1440,height:900});await expect(page.locator('#antenna')).toBeFocused();
 await page.locator('#btn-mobile-journal').click();await expect(page.locator('.journal-tab')).toHaveCount(4);
 await page.locator('[data-tab="tab-notes"]').click();await page.locator('#operator-note').fill('Trạm 07 / ghi chú V4');await page.locator('#btn-save-operator-note').click();
 for(const tab of ['tab-clues','tab-decoder','tab-workbench','tab-notes']){await page.locator(`[data-tab="${tab}"]`).click();await expect(page.locator(`#${tab}`)).toBeVisible();}
 await expect(page.locator('#operator-note')).toHaveValue('Trạm 07 / ghi chú V4');await page.reload();await page.locator('#btn-start-session').click();await useControl(page,'#btn-journal');await page.locator('[data-tab="tab-notes"]').click();await expect(page.locator('#operator-note')).toHaveValue('Trạm 07 / ghi chú V4');
});
test('context fades after tuning; reception, recording and completion share one visible message',async({page})=>{
 await start(page);await page.locator('#hud-freq-slider').fill('350');await expect(page.locator('#context-readout')).toContainText('MHz');
 await expect(page.locator('#context-readout')).toHaveCSS('opacity','0',{timeout:4000});
 await page.locator('#hud-freq-slider').fill('320');await page.locator('#antenna').fill('35');await expect(page.locator('#context-readout')).toContainText('ĐÃ KHÓA');
 await page.locator('#btn-capture').focus();await page.keyboard.down('Space');await expect(page.locator('#context-readout')).toContainText('ĐANG THU');await expect(page.locator('#mobile-recording')).toHaveClass(/is-recording/);
 await expect(page.locator('#context-readout')).toContainText('BẢN TIN ĐÃ LƯU',{timeout:12000});await page.keyboard.up('Space');await expect(page.locator('#mobile-log-count')).toHaveText('1/5');
});

test('Fine focuses the relocated fallback slider and reopening Menu exposes urgent actions',async({page})=>{
 await page.setViewportSize({width:320,height:568});await start(page);
 await page.locator('#btn-fine').click();await expect(page.locator('#hud-freq-slider')).toBeFocused();await expect(page.locator('#hud-freq-slider')).toBeInViewport();
 await page.locator('#hud-freq-slider').fill('320');await page.locator('#btn-close-operations').click();await expect(page.locator('#btn-fine')).toBeFocused();
 await operations(page);await expect(page.locator('#btn-scan')).toBeInViewport();await expect(page.locator('#btn-coolant')).toBeInViewport();await expect(page.locator('#hud-freq-slider')).toHaveValue('320');
 await page.locator('#instrument-details').scrollIntoViewIfNeeded();await page.locator('#instrument-details summary').click();await page.locator('#btn-close-operations').click();
 await operations(page);expect(await page.locator('.operations-body').evaluate(el=>el.scrollTop)).toBe(0);
 await expect(page.locator('#btn-scan')).toBeInViewport();await expect(page.locator('#btn-coolant')).toBeInViewport();
 await page.keyboard.press('Escape');await expect(page.locator('#btn-operations')).toBeFocused();
});
