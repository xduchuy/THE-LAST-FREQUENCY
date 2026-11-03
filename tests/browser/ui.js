import {expect} from '@playwright/test';
// Exercise the visible V4 navigation path; no forced clicks or state mutation.
export async function operations(page){
 if(!(await page.locator('#operations-drawer').isVisible()))await page.locator('#btn-operations').click();
 await expect(page.locator('#operations-drawer')).toBeVisible();
}
export async function useControl(page,selector,method='click'){
 if(selector==='#btn-journal' && !(await page.locator(selector).isVisible()))selector='#btn-mobile-journal';
 if(!(await page.locator(selector).isVisible()))await operations(page);
 await page.locator(selector)[method]();
 if(await page.locator('#operations-drawer').isVisible())await page.locator('#btn-close-operations').click();
}
export async function setControl(page,selector,value){
 if(!(await page.locator(selector).isVisible()))await operations(page);
 await page.locator(selector).fill(value);
 if(await page.locator('#operations-drawer').isVisible())await page.locator('#btn-close-operations').click();
}
