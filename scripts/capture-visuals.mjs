import {chromium} from '@playwright/test';
import {browserLaunch} from '../tests/browser-launch.js';
import {mkdir,writeFile} from 'node:fs/promises';
const phase=process.argv[2]||'after';if(!['before','after'].includes(phase))throw new Error('Use before or after');const dir=new URL('../docs/v4-visuals',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const browser=await chromium.launch(browserLaunch(true));
const metrics=[];
for(const [width,height] of [[1440,900],[1920,1080],[390,844],[320,568],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('the_last_frequency_save_v3',JSON.stringify({highQuality:false,mission:{version:3,difficulty:'operator',status:'briefing'}})));
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__radioDiagnostics?.().webgl && window.__radioDiagnostics().renderFrames>=3);await page.locator('#btn-start-session').click();await page.waitForTimeout(2500);
 await page.screenshot({path:`${dir}/${phase}-${width}x${height}.png`});
 metrics.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,canvas:(()=>{const r=document.querySelector('#canvas-container').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})(),controls:window.__radioDiagnostics().controls})));
 if(phase==='after' && width===390){
   await page.locator('#btn-operations').click();await page.screenshot({path:`${dir}/after-field-operations.png`});
   await page.locator('#btn-mobile-journal').click();await page.screenshot({path:`${dir}/after-journal.png`});
   await page.locator('[data-tab="tab-notes"]').click();await page.screenshot({path:`${dir}/after-notes.png`});
 }
 await context.close();
}await writeFile(`${dir}/${phase}-metrics.json`,JSON.stringify(metrics,null,2));await browser.close();
