import { browserLaunch } from './tests/browser-launch.js';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 90000, workers: 1,
  reporter: [['list'], ['html',{open:'never'}]],
  use: { trace:'retain-on-failure', baseURL: 'http://127.0.0.1:5173', headless: true,
    launchOptions: browserLaunch(),
    viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }
});
