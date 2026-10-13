const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://price-pilot-ai-369.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'rb1@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.goto('https://price-pilot-ai-369.vercel.app/dashboard/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click "+ New Chat" button to ensure a fresh session
  const newChatBtn = await page.$('button:has-text("New Chat"), button:has-text("+")');
  if (newChatBtn) {
    console.log('Clicking New Chat to test fresh conversation...');
    await newChatBtn.click();
    await page.waitForTimeout(2000);
  }

  // Find input
  const input = await page.$('input[placeholder*="Ask"], textarea[placeholder*="Ask"], input[type="text"]');
  if (input) {
    console.log('Sending fresh query: "how many products do i have in my catalog?"');
    await input.fill('how many products do i have in my catalog?');
    await page.keyboard.press('Enter');
    
    // Wait up to 25s for completion
    await page.waitForTimeout(16000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('--- SCREEN CONTENT AFTER COMPLETION ---');
    console.log(text.slice(text.indexOf('how many products'), text.indexOf('how many products') + 900));
    await page.screenshot({ path: './docs/review/2026-10-13/screenshots/fresh_chat_reply.png' });
  }

  await browser.close();
})();
