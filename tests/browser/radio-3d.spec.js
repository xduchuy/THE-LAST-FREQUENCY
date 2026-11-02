import {test,expect} from '@playwright/test';import {browserLaunch} from '../browser-launch.js';
test.use({launchOptions:browserLaunch(true)});
const diag=page=>page.evaluate(()=>window.__radioDiagnostics());
async function ready(page){await page.goto('/');await page.locator('#btn-start-session').click();await expect(page.locator('#intro-overlay')).toBeHidden();
 await expect.poll(async()=>{const d=await diag(page);return d.webgl&&d.renderFrames>=3;},{timeout:30000}).toBe(true);}
async function drag(page,type,touch,dx){
 const d=await diag(page),p=d.controls[type];
 expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,p)).toBe('CANVAS');
 if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
  await expect.poll(async()=>(await diag(page)).drag).toBe(type);
  for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+dx*i/5,y:p.y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 }else{await page.mouse.move(p.x,p.y);await page.mouse.down();await expect.poll(async()=>(await diag(page)).drag).toBe(type);
  await page.mouse.move(p.x+dx,p.y,{steps:5});await page.mouse.up();}
}
for(const [width,height] of [[320,568],[360,640],[390,844],[414,896],[667,375],[844,390],[768,1024],[1440,900],[1920,1080]]){
 test(`real ${width<1000?'touch':'mouse'} radio tuning, volume and power at ${width}x${height}`,async({browser})=>{
  test.setTimeout(120000);const touch=width<1000;
  const context=await browser.newContext({baseURL:'http://127.0.0.1:5173',viewport:{width,height},hasTouch:touch,isMobile:touch});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  const before=await diag(page);const rect=await page.locator('#canvas-container canvas').boundingBox();
  for(const p of Object.values(before.controls)){expect(p.x).toBeGreaterThan(rect.x);expect(p.x).toBeLessThan(rect.x+rect.width);expect(p.y).toBeGreaterThan(rect.y);expect(p.y).toBeLessThan(rect.y+rect.height);}
  await drag(page,'tuning',touch,30);await expect.poll(async()=>(await diag(page)).targetFrequency).toBeGreaterThan(before.targetFrequency);
  const tuned=await diag(page);await expect(page.locator('#hud-freq-slider')).toHaveValue(String(Math.round(tuned.targetFrequency*100)));
  await drag(page,'volume',touch,-20);const quieter=await diag(page);expect(quieter.volume).toBeLessThan(before.volume);expect(quieter.targetFrequency).toBe(tuned.targetFrequency);
  const p=quieter.controls.power;if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
  await expect.poll(async()=>(await diag(page)).powerOn).toBe(false);await expect(page.locator('#btn-hud-power')).toHaveAttribute('aria-pressed','false');
  await expect.poll(async()=>(await diag(page)).audioGain).toBeLessThan(.002);
  await page.locator('#btn-hud-power').click();await expect.poll(async()=>(await diag(page)).powerRotation).toBeLessThan(0);
  await page.locator('#hud-freq-slider').fill('350');await expect.poll(async()=>Math.abs((await diag(page)).knobRotation+Math.PI/3)).toBeLessThan(.03);
  await page.mouse.move(0,0);await page.screenshot({path:test.info().outputPath('radio.png')});expect(errors).toEqual([]);
  await context.close();
 });
}
test('overlay, blur and pointercancel release 3D gestures; resize and overlays do not duplicate loops/audio/timers',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  window.__perf={audio:0,pending:0,maxPending:0,intervals:new Set(),writes:0};
  const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>{window.__perf.pending++;window.__perf.maxPending=Math.max(window.__perf.maxPending,window.__perf.pending);return raf.call(window,time=>{window.__perf.pending--;fn(time);});};
  const Audio=window.AudioContext;window.AudioContext=new Proxy(Audio,{construct(target,args){window.__perf.audio++;return Reflect.construct(target,args);}});
  const interval=window.setInterval,clear=window.clearInterval;window.setInterval=(...args)=>{const id=interval(...args);window.__perf.intervals.add(id);return id;};window.clearInterval=id=>{window.__perf.intervals.delete(id);clear(id);};
  const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='the_last_frequency_save_v3')window.__perf.writes++;return write.call(this,key,value);};
 });
 await ready(page);const initial=await diag(page);const initialIntervals=await page.evaluate(()=>window.__perf.intervals.size);const p=initial.controls.tuning;
 await page.mouse.move(p.x,p.y);await page.mouse.down();await expect.poll(async()=>(await diag(page)).drag).toBe('tuning');
 await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));await page.mouse.up();await expect.poll(async()=>(await diag(page)).drag).toBeNull();
 for(let i=0;i<3;i++){await page.locator('#btn-mobile-journal').click();await page.locator('#journal-drawer').focus();await page.keyboard.press('Space');expect((await diag(page)).holdingCapture).toBe(false);await page.keyboard.press('Escape');}
 await page.setViewportSize({width:844,height:390});await page.setViewportSize({width:390,height:844});
 await expect.poll(async()=>(await diag(page)).renderFrames).toBeGreaterThan(initial.renderFrames);
 const stats=await page.evaluate(()=>({audio:window.__perf.audio,maxPending:window.__perf.maxPending,intervals:window.__perf.intervals.size,writes:window.__perf.writes}));
 expect(stats.audio).toBe(1);expect(stats.maxPending).toBe(1);expect(stats.intervals).toBe(initialIntervals);expect(stats.writes).toBeLessThan(25);
 expect((await diag(page)).textures).toBeLessThanOrEqual(initial.textures+1);await expect(page.locator('#canvas-container canvas')).toHaveCount(1);
 await page.locator('#btn-hud-power').click();await expect.poll(async()=>(await diag(page)).powerOn).toBe(false);
 const frame=(await diag(page)).renderFrames;await expect.poll(async()=>(await diag(page)).renderFrames).toBeGreaterThan(frame+2);
 const version=(await diag(page)).scopeVersion;const next=(await diag(page)).renderFrames;
 await expect.poll(async()=>(await diag(page)).renderFrames).toBeGreaterThan(next+3);
 expect((await diag(page)).scopeVersion).toBe(version);
});

for(const touch of [true,false])test(`one-pixel ${touch?'touch':'Shift mouse'} drags retain fine-tuning movement`,async({browser})=>{
 test.setTimeout(90000);const context=await browser.newContext({baseURL:'http://127.0.0.1:5173',viewport:touch?{width:390,height:844}:{width:1440,height:900},isMobile:touch,hasTouch:touch});
 const page=await context.newPage();await ready(page);const initial=await diag(page),p=initial.controls.tuning;
 if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
  expect((await diag(page)).targetFrequency).toBe(initial.targetFrequency);
  for(let i=1;i<=30;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+i,y:p.y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 }else{await page.keyboard.down('Shift');await page.mouse.move(p.x,p.y);await page.mouse.down();expect((await diag(page)).targetFrequency).toBe(initial.targetFrequency);await page.mouse.move(p.x+30,p.y,{steps:30});await page.mouse.up();await page.keyboard.up('Shift');}
 await expect.poll(async()=>(await diag(page)).targetFrequency).toBeGreaterThan(initial.targetFrequency+.02);
 const after=await diag(page);expect(after.targetFrequency).toBeLessThan(initial.targetFrequency+.11);expect(after.volume).toBe(initial.volume);expect(after.drag).toBeNull();await context.close();
});
