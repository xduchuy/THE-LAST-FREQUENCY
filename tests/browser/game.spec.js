import { test, expect } from '@playwright/test';
const SAVE='the_last_frequency_save_v3';
async function start(page, webgl=false) {
  await page.goto('/'); await page.locator('#btn-start-session').click();
  await expect(page.locator('#intro-overlay')).toBeHidden();
}
async function tune(page,freq,antenna) {
  await page.locator('#hud-freq-slider').fill(String(Math.round(freq*100)));
  await page.locator('#antenna').fill(String(antenna));
  await page.waitForTimeout(1500);
}
async function hold(page,seconds=5) {
  const btn=page.locator('#btn-capture');
  await btn.scrollIntoViewIfNeeded();
  const b=await btn.boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.mouse.down();
  const before=await page.locator('#progress-counter').textContent();
  try {
    await expect.poll(async()=> (await page.locator('#progress-counter').textContent()) !== before || await page.locator('#victory-modal').isVisible(), {timeout:25000}).toBe(true);
  } finally { await page.mouse.up(); }
}
test('power-on is not auto-capture, scanner costs pin, manual capture persists and pause freezes time',async({page})=>{
 await start(page); await tune(page,3.2,35);
 await page.waitForTimeout(5000); await expect(page.locator('#progress-counter')).toHaveText('0/5 TÍN HIỆU');
 await page.locator('#btn-scan').click(); await expect(page.locator('#mission-feedback')).toContainText('QUÉT:');
 await tune(page,3.2,35); await hold(page);
 await expect(page.locator('#progress-counter')).toHaveText('1/5 TÍN HIỆU');
 await page.locator('#btn-pause').click(); const time=await page.locator('#mission-time').textContent();
 await page.waitForTimeout(1500); await expect(page.locator('#mission-time')).toHaveText(time);
 await page.reload(); await page.locator('#btn-start-session').click(); await expect(page.locator('#progress-counter')).toHaveText('1/5 TÍN HIỆU');
 await page.locator('#btn-pause').click(); await expect(page.locator('#mission-summary')).toContainText('Bản tin: 1/5');
});
test('all five live captures, mechanical code and final SOS reach victory',async({page})=>{
 test.setTimeout(120000);
 await start(page);
 for(const [freq,antenna] of [[3.2,35],[4.75,110],[6.18,65],[8.9,145],[11.4,95]]) {
  if (Number((await page.locator('#heat-value').textContent()).replace(/[^0-9]/g,'')) > 65) await page.locator('#btn-coolant').click();
  await tune(page,freq,antenna); await hold(page,5.3);
 }
 await expect(page.locator('#progress-counter')).toHaveText('5/5 TÍN HIỆU');
 await page.locator('#btn-journal').click();
 await page.locator('[data-tab="tab-decoder"]').click();
 for(const [index,count] of [7,4,2,9].entries()) for(let i=0;i<count;i++) await page.locator(`.digit-btn[data-digit="${index}"][data-dir="1"]`).click();
 await page.locator('#btn-verify-code').click();
 await expect(page.locator('#decoder-lock-badge')).toContainText('ĐÃ MỞ');
 await page.locator('#btn-close-journal').click();
 await tune(page,9.65,80); await page.locator('#btn-coolant').click(); await hold(page,8.7);
 await expect(page.locator('#victory-modal')).toBeVisible(); await expect(page.locator('#victory-score')).toContainText('Bản tin: 5/5');
 await page.locator('#btn-replay-reset').click(); await expect(page.locator('#intro-overlay')).toBeVisible();
 await expect(page.locator('#progress-counter')).toHaveText('0/5 TÍN HIỆU');
});
test('loss report is restored; restart clears the failed run',async({page})=>{
 await page.goto('/');
 await page.addInitScript(key=>localStorage.setItem(key,JSON.stringify({mission:{version:3,difficulty:'operator',status:'lost',battery:0,elapsed:60}})),SAVE);
 await page.reload(); await page.locator('#btn-start-session').click();
 await expect(page.locator('#mission-modal-title')).toHaveText('Tín hiệu đã tắt.');
 await expect(page.locator('#mission-modal-text')).toContainText('Ắc quy');
 await page.locator('#btn-new-shift').click(); await expect(page.locator('#intro-overlay')).toBeVisible();
 await expect(page.locator('#battery-value')).toHaveText('100%');
});
test('mobile console has usable capture and tuning controls',async({page})=>{
 await page.setViewportSize({width:390,height:844}); await start(page);
 await expect(page.locator('#equipment-header')).toBeHidden();
 await tune(page,3.2,35); await hold(page,5.3);
 await expect(page.locator('#progress-counter')).toHaveText('1/5 TÍN HIỆU');
 await page.screenshot({path:test.info().outputPath('mobile.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
