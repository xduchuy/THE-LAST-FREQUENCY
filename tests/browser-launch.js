import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
export function browserLaunch(webgl = false) {
  const executablePath = process.env.CHROMIUM_PATH || (existsSync(chromium.executablePath()) ? undefined : existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  return { ...(executablePath ? {executablePath} : {}), args:['--no-sandbox',...(webgl ? ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] : ['--disable-webgl'])] };
}
