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
 expect(errors).toEqual([]);await context.close();
});
