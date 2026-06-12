import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-cache'] });
const context = await browser.newContext();
await context.clearCookies();
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:5199/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@example.com');
await page.fill('input[type="password"]', 'password');
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

const url = page.url();
console.log('Current URL:', url);

const html = await page.content();
const hasRoutePerf = html.includes("Today's Progress") || html.includes("Route Performance") || html.includes("Active Routes");
console.log('RoutePerformanceCard in HTML:', hasRoutePerf);
console.log('ERRORS:', errors);

await page.screenshot({ path: '/Users/michal.cesarczyk/.claude/jobs/5c004d7b/dashboard.png', fullPage: true });
await browser.close();
