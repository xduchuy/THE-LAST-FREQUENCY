import { test, expect } from '@playwright/test';
async function start(page) { await page.goto('/'); await page.locator('#btn-start-session').click(); await expect(page.locator('#intro-overlay')).toBeHidden(); }
test.use({launchOptions:{executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test('real WebGL boots with local dependencies and no uncaught exceptions',async({page})=>{
 const errors=[]; const remote=[]; page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{ if(!r.url().startsWith('http://127.0.0.1:5173')&&!r.url().startsWith('data:')) remote.push(r.url()); });
 await start(page,true); await expect(page.locator('#canvas-container canvas')).toBeVisible();
 await expect(page.locator('#mission-time')).toHaveText(/11:|12:/);
 await page.screenshot({path:'/tmp/frequency-desktop.png',fullPage:true});
 expect(errors).toEqual([]); expect(remote).toEqual([]);
});
