const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://price-pilot-ai-369.vercel.app/');

  console.log('--- PAGE LOADED ---');
  console.log('Title:', await page.title());

  // Wait for network idle or main content to load
  await page.waitForTimeout(3000);

  // Dump text content to see what's on the page
  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- INNER TEXT ---');
  console.log(text);

  await browser.close();
})();
