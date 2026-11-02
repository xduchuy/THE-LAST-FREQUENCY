import {test,expect} from '@playwright/test';
const old={operatorNote:'Ghi chú từ năm 1974',discoveredIds:['borealis','echo7'],bandMemory:[[12,88]],volume:.3,frequency:6.18,muted:true,reducedMotion:true,highQuality:false,gameCompleted:true,codeUnlocked:true};
test('legacy choice imports an archive without granting a Night Shift unlock; no repeat prompt',async({page})=>{
 await page.addInitScript(save=>{if(!localStorage.getItem('legacy-fixture')){localStorage.setItem('the_last_frequency_save_v1',JSON.stringify(save));localStorage.setItem('legacy-fixture','set');}},old);
 await page.goto('/');await expect(page.locator('#legacy-recovery')).toBeVisible();await page.locator('#btn-import-legacy').click();
 await expect(page.locator('#legacy-recovery')).toBeHidden();
 await expect(page.locator('#btn-reduced-motion')).toContainText('BẬT');await expect(page.locator('#btn-quality-toggle')).toContainText('TIẾT KIỆM');await expect(page.locator('#slider-volume')).toHaveValue('30');
 await expect(page.locator('#progress-counter')).toHaveText('0/5 TÍN HIỆU');
 await page.locator('#btn-start-session').click();await page.locator('#btn-journal').click();
 await expect(page.locator('#legacy-archive')).toBeVisible();await expect(page.locator('#archive-notes')).toHaveText(old.operatorNote);
 await expect(page.locator('#archive-stations')).toContainText('BOREALIS');await expect(page.locator('#decoder-lock-badge')).toContainText('CHƯA');
 await page.reload();await expect(page.locator('#legacy-recovery')).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem('the_last_frequency_save_v1_backup_v31'))).toBe(JSON.stringify(old));
});
test('declining legacy preserves the original and does not repeat the prompt',async({page})=>{
 await page.addInitScript(save=>{if(!sessionStorage.getItem('fixture')){localStorage.setItem('the_last_frequency_save_v1',JSON.stringify(save));sessionStorage.setItem('fixture','yes');}},old);
 await page.goto('/');await page.locator('#btn-decline-legacy').click();await page.reload();await expect(page.locator('#legacy-recovery')).toBeHidden();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('the_last_frequency_save_v1')).operatorNote)).toBe(old.operatorNote);
});
test('unavailable LocalStorage reports the limitation and leaves gameplay usable',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError');}}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#storage-notice')).not.toBeEmpty();
 await page.locator('#btn-start-session').click();await expect(page.locator('#intro-overlay')).toBeHidden();
 await page.locator('#btn-pause').click();await expect(page.locator('#mission-modal')).toBeVisible();expect(errors).toEqual([]);
});
