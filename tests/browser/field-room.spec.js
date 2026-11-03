import {test,expect} from '@playwright/test';
import {browserLaunch} from '../browser-launch.js';
test.use({launchOptions:browserLaunch(true)});
for(const reducedMotion of [false,true])test(`storm room, aged radio and ${reducedMotion?'reduced':'normal'} motion share mission lifecycle`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(reducedMotion=>localStorage.setItem('the_last_frequency_save_v3',JSON.stringify({highQuality:false,reducedMotion,mission:{version:3,difficulty:'operator',status:'paused',elapsed:63,battery:90}})),reducedMotion);
 await page.goto('/');await expect.poll(()=>page.evaluate(()=>window.__radioDiagnostics?.().renderFrames>=3),{timeout:30000}).toBe(true);await page.locator('#btn-start-session').click();
 const diag=()=>page.evaluate(()=>window.__radioDiagnostics());
 await expect.poll(async()=>(await diag()).weather.storm).toBe(true);expect((await diag()).weather.rain).toBe(1.5);
 if(reducedMotion)expect((await diag()).lampIntensity).toBe(5.8);else await expect.poll(async()=>(await diag()).lampIntensity).toBeLessThan(5.79);
 const initial=await diag();await page.screenshot({path:test.info().outputPath('storm-radio.png')});
 await page.locator('#btn-operations').click();await expect.poll(async()=>(await diag()).weather.storm).toBe(false);await expect.poll(async()=>(await diag()).lampIntensity).toBe(5.8);const paused=(await diag()).missionElapsed;await page.waitForTimeout(300);expect((await diag()).missionElapsed).toBe(paused);
 await page.keyboard.press('Escape');await expect.poll(async()=>(await diag()).weather.storm).toBe(true);expect((await diag()).textures).toBeLessThanOrEqual(initial.textures+1);
 await expect(page.locator('#mobile-bottom-nav > button')).toHaveCount(4);expect(errors).toEqual([]);
});
