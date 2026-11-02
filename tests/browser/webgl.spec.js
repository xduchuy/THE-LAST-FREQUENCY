import { browserLaunch } from '../browser-launch.js';
import { test, expect } from '@playwright/test';
async function start(page) { await page.goto('/'); await page.locator('#btn-start-session').click(); await expect(page.locator('#intro-overlay')).toBeHidden(); }
test.use({launchOptions:browserLaunch(true)});
test('real WebGL boots with local dependencies and no uncaught exceptions',async({page})=>{
 const errors=[]; const remote=[]; page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 page.on('request',r=>{ if(!r.url().startsWith('http://127.0.0.1:5173')&&!r.url().startsWith('data:')) remote.push(r.url()); });
 await start(page,true); await expect(page.locator('#canvas-container canvas')).toBeVisible();
 await expect(page.locator('#mission-time')).toHaveText(/11:|12:/);
 await page.screenshot({path:test.info().outputPath('desktop.png'),fullPage:true});
 expect(errors).toEqual([]); expect(remote).toEqual([]);
});

test('touch devices render the mobile console with the low-cost graphics default',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.goto('/');await page.locator('#btn-start-session').tap();
 await expect(page.locator('#intro-overlay')).toBeHidden();
 await expect(page.locator('#canvas-container canvas')).toBeVisible();
 await expect(page.locator('#mobile-console')).toBeVisible();
 await expect(page.locator('#btn-quality-toggle')).toContainText('TIẾT KIỆM');
 const dimensions=await page.locator('#canvas-container canvas').evaluate(el=>({width:el.width,cssWidth:el.getBoundingClientRect().width}));
 expect(dimensions.width/dimensions.cssWidth).toBeLessThanOrEqual(1.16);
 await page.locator('#btn-mobile-settings').tap();await page.locator('#btn-quality-toggle').tap();
 expect((await page.evaluate(()=>window.__radioDiagnostics())).shadows).toBe(true);
 await page.locator('#btn-quality-toggle').tap();expect((await page.evaluate(()=>window.__radioDiagnostics())).shadows).toBe(false);
 const pixels=await page.locator('#canvas-container canvas').evaluate(el=>el.width*el.height);expect(pixels).toBeLessThanOrEqual(360000);
 await page.locator('#btn-close-settings').tap();
 expect(errors).toEqual([]);await context.close();
});

test('WebGL context restoration preserves the existing radio and mission',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);const before=await page.evaluate(()=>window.__radioDiagnostics());expect(before.webgl).toBe(true);
 const supported=await page.locator('#canvas-container canvas').evaluate(el=>{const gl=el.getContext('webgl2')||el.getContext('webgl');window.__lose=gl?.getExtension('WEBGL_lose_context');return Boolean(window.__lose);});
 test.skip(!supported,'Renderer does not expose WEBGL_lose_context');
 await page.evaluate(()=>window.__lose.loseContext());await expect.poll(()=>page.evaluate(()=>window.__radioDiagnostics().webgl)).toBe(false);
 await expect(page.locator('#radio-fallback')).toBeVisible();await page.waitForTimeout(250);await page.evaluate(()=>window.__lose.restoreContext());
 await expect.poll(()=>page.evaluate(()=>window.__radioDiagnostics().webgl),{timeout:15000}).toBe(true);await expect(page.locator('#radio-fallback')).toBeHidden();
 await expect(page.locator('#canvas-container canvas')).toHaveCount(1);expect((await page.evaluate(()=>window.__radioDiagnostics())).targetFrequency).toBe(before.targetFrequency);
 await page.screenshot({path:test.info().outputPath('restored-radio.png')});
});
