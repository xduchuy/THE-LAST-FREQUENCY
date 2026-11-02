import { test, expect } from '@playwright/test';
test.use({ isMobile: true, hasTouch: true });
async function start(page, viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.locator('#btn-start-session').tap();
  await expect(page.locator('#intro-overlay')).toBeHidden();
}
async function controlIsReachable(page, selector, minHeight = 0) {
  await expect.poll(() => page.locator(selector).evaluate(el => {
    const r=el.getBoundingClientRect();
    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return r.x >= 0 && r.y >= 0 && r.right <= innerWidth+1 && r.bottom <= innerHeight+1 && (el===hit || el.contains(hit));
  })).toBe(true);
  const result = await page.locator(selector).evaluate(el => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
    return { x:r.x, y:r.y, right:r.right, bottom:r.bottom, height:r.height, hit:el === hit || el.contains(hit), vw:innerWidth, vh:innerHeight };
  });
  expect(result.x).toBeGreaterThanOrEqual(0);
  expect(result.y).toBeGreaterThanOrEqual(0);
  expect(result.right).toBeLessThanOrEqual(result.vw + 1);
  expect(result.bottom).toBeLessThanOrEqual(result.vh + 1);
  expect(result.height).toBeGreaterThanOrEqual(minHeight);
  expect(result.hit).toBe(true);
}
for (const [width, height] of [[320,568],[360,640],[390,844],[414,896],[667,375],[844,390],[768,1024]]) {
  test(`touch controls stay visible without overlap at ${width}x${height}`, async ({page}) => {
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await start(page,{width,height});
    await expect(page.locator('#mobile-console')).toBeVisible();
    for (const selector of ['#antenna','#hud-freq-slider']) await controlIsReachable(page,selector);
    for (const selector of ['#btn-capture','#btn-hud-power','#btn-mobile-journal','#btn-mobile-pause','.btn-step[data-step="0.01"]']) await controlIsReachable(page,selector,44);
    const boxes=await page.evaluate(()=>['mobile-receiver','mobile-workspace','mobile-dock','mobile-nav'].map(id=>{
      const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
    }));
    const [receiver,workspace,dock,nav]=boxes;
    if(width>height) { expect(workspace.right).toBeLessThanOrEqual(receiver.x+1); expect(receiver.bottom).toBeLessThanOrEqual(dock.y+1); }
    else { expect(receiver.bottom).toBeLessThanOrEqual(workspace.y+1); expect(workspace.bottom).toBeLessThanOrEqual(dock.y+1); }
    expect(dock.bottom).toBeLessThanOrEqual(nav.y+1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('#radio-fallback')).toBeVisible();
    await page.locator('#btn-mobile-journal').tap();await controlIsReachable(page,'#btn-close-journal',44);await page.keyboard.press('Escape');
    await page.locator('#btn-mobile-settings').tap();await controlIsReachable(page,'#btn-close-settings',44);await page.keyboard.press('Escape');
    await page.locator('#btn-mobile-pause').tap();await expect(page.locator('#mission-modal')).toBeVisible();await page.locator('#btn-resume').tap();
    await page.screenshot({path:test.info().outputPath('console.png')});
    expect(errors).toEqual([]);
  });
}
test('real touch hold records, touch cancel releases, and scrolling leaves controls in place', async ({page}) => {
  await start(page,{width:320,height:568});
  const dock=await page.locator('#mobile-dock').boundingBox();
  await page.locator('#mission-panel').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  expect(await page.locator('#mobile-dock').boundingBox()).toEqual(dock);
  await page.locator('#hud-freq-slider').fill('320'); await page.locator('#antenna').fill('35');
  await expect(page.locator('#capture-status')).toContainText('TÍN HIỆU TỐT');
  const box=await page.locator('#btn-capture').boundingBox();
  const cdp=await page.context().newCDPSession(page);
  const points=[{x:box.x+box.width/2,y:box.y+box.height/2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  await expect(page.locator('#btn-capture')).toHaveClass(/receiving/);
  await page.waitForTimeout(400);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await expect(page.locator('#btn-capture')).not.toHaveClass(/receiving/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  await expect(page.locator('#progress-counter')).toHaveText('1/5 TÍN HIỆU',{timeout:25000});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.screenshot({path:test.info().outputPath('mobile-capture.png')});
});
test('phone journal, code wheels, notes and settings remain usable in a short viewport',async({page})=>{
  await start(page,{width:320,height:568});
  await page.locator('#btn-mobile-journal').tap();
  await controlIsReachable(page,'#btn-close-journal',44);
  await page.locator('[data-tab="tab-decoder"]').tap();
  const digit=page.locator('.digit-btn[data-digit="0"][data-dir="1"]');
  await digit.scrollIntoViewIfNeeded(); await digit.tap();
  await expect(page.locator('#digit-val-0')).toHaveText('1');
  expect(await digit.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await controlIsReachable(page,'#btn-close-journal',44);
  await page.locator('[data-tab="tab-workbench"]').tap();
  await page.locator('#operator-note').fill('Ghi chú ca trực trên điện thoại.');
  await page.setViewportSize({width:320,height:380});
  await expect.poll(()=>page.locator('#journal-drawer').evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(381);
  await controlIsReachable(page,'#btn-close-journal',44);
  await page.locator('#btn-close-journal').tap();
  await page.setViewportSize({width:320,height:568});
  await page.locator('#btn-mobile-settings').tap();
  await controlIsReachable(page,'#btn-close-settings',44);
  await page.locator('#btn-close-settings').tap();
  await page.locator('#btn-mobile-help').tap();
  await controlIsReachable(page,'#btn-close-help',44);
});
test('rotation and desktop resize preserve one set of controls and saved state',async({page})=>{
  await start(page); await page.locator('#antenna').fill('35');
  await page.locator('.btn-step[data-step="0.10"]').tap();
  await expect(page.locator('#hud-freq')).toHaveText('3.10');
  await page.setViewportSize({width:844,height:390});
  await controlIsReachable(page,'#btn-capture',44);
  await expect(page.locator('#antenna')).toHaveValue('35');
  await page.setViewportSize({width:1440,height:1000});
  await expect(page.locator('#mobile-console')).toBeHidden();
  await expect(page.locator('#equipment-header')).toBeVisible();
  await expect(page.locator('#btn-hud-power')).toHaveCount(1);
  await expect(page.locator('#mission-panel #antenna')).toHaveCount(1);
  await expect(page.locator('#radio-controls #btn-hud-power')).toHaveCount(1);
  await expect(page.locator('#hud-freq')).toHaveText('3.10');
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#mobile-console')).toBeVisible();
  await controlIsReachable(page,'#btn-capture',44);
  await expect(page.locator('#antenna')).toHaveValue('35');
});
