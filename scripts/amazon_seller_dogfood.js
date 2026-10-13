const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://price-pilot-ai-369.vercel.app';
const USER_EMAIL = 'rb1@gmail.com';
const USER_PASS = '12345678';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/review/2026-10-13');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const auditLog = {
  timestamp: new Date().toISOString(),
  targetUrl: TARGET_URL,
  user: USER_EMAIL,
  pagesTested: [],
  networkErrors: [],
  consoleErrors: [],
  actionResults: [],
  issuesFound: []
};

function logIssue(category, severity, title, details, screenshot = null) {
  auditLog.issuesFound.push({ category, severity, title, details, screenshot });
  console.log(`[${severity.toUpperCase()}] [${category}] ${title}: ${details}`);
}

(async () => {
  console.log('🚀 Starting Amazon Seller Comprehensive Dogfood Audit on:', TARGET_URL);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Listen to network errors
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('/favicon.ico')) {
      const errEntry = { url, status, statusText: response.statusText() };
      auditLog.networkErrors.push(errEntry);
      console.warn(`⚠️ HTTP ${status} from: ${url}`);
      if (status >= 500) {
        logIssue('Backend API', 'High', `HTTP ${status} Server Error`, `Endpoint ${url} failed with ${response.statusText()}`);
      } else if (status === 429) {
        logIssue('Rate Limiting', 'Medium', `HTTP 429 Too Many Requests`, `Endpoint ${url} was rate limited`);
      }
    }
  });

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      auditLog.consoleErrors.push(text);
      console.error(`🔴 Console Error: ${text}`);
      if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
        logIssue('Frontend Console', 'Low', 'JavaScript Console Error', text);
      }
    }
  });

  try {
    // 1. PUBLIC LANDING PAGE
    console.log('\n--- 1. Testing Landing Page ---');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_landing_page.png') });
    auditLog.pagesTested.push({ name: 'Landing Page', url: TARGET_URL, status: 'Loaded' });

    // 2. LOGIN PAGE & AUTHENTICATION
    console.log('\n--- 2. Testing Authentication (/login) ---');
    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_page.png') });

    // Fill credentials
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASS);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_login_filled.png') });
    
    // Submit login
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(3000);

    const postLoginUrl = page.url();
    console.log('Post-login URL:', postLoginUrl);
    if (!postLoginUrl.includes('/dashboard')) {
      logIssue('Authentication', 'Critical', 'Login failed or did not redirect to /dashboard', `Current URL: ${postLoginUrl}`);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_login_failed.png') });
    } else {
      console.log('✅ Authentication successful! Landed on /dashboard');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_dashboard_overview.png') });
      auditLog.actionResults.push({ action: 'Login', result: 'Success', user: USER_EMAIL });
    }

    // List of dashboard pages to audit systematically
    const sections = [
      { name: 'Dashboard Overview', path: '/dashboard', screenshot: '05_dashboard.png' },
      { name: 'Products Catalog', path: '/dashboard/products', screenshot: '06_products.png' },
      { name: 'Competitor Intelligence', path: '/dashboard/competitors', screenshot: '07_competitors.png' },
      { name: 'Demand Signals', path: '/dashboard/demand', screenshot: '08_demand_signals.png' },
      { name: 'Inventory & Demand Forecasts', path: '/dashboard/forecasts', screenshot: '09_forecasts.png' },
      { name: 'AI Price Recommendations', path: '/dashboard/recommendations', screenshot: '10_recommendations.png' },
      { name: 'A/B Price Testing', path: '/dashboard/ab-tests', screenshot: '11_ab_tests.png' },
      { name: 'Sales & Revenue Analytics', path: '/dashboard/analytics', screenshot: '12_analytics.png' },
      { name: 'Alerts Center', path: '/dashboard/alerts', screenshot: '13_alerts.png' },
      { name: 'Integrations Hub', path: '/dashboard/integrations', screenshot: '14_integrations.png' },
      { name: 'Channel Mapping', path: '/dashboard/channel-mapping', screenshot: '15_channel_mapping.png' },
      { name: 'Settings & Profile', path: '/dashboard/settings', screenshot: '16_settings.png' },
      { name: 'AI Copilot Chat', path: '/dashboard/chat', screenshot: '17_chat_page.png' },
    ];

    for (const sec of sections) {
      console.log(`\n--- Auditing: ${sec.name} (${sec.path}) ---`);
      try {
        await page.goto(`${TARGET_URL}${sec.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
      } catch (e) {
        console.warn(`Timeout loading ${sec.path}: ${e.message}`);
      }

      const shotPath = path.join(SCREENSHOTS_DIR, sec.screenshot);
      await page.screenshot({ path: shotPath, fullPage: false });

      const pageText = await page.evaluate(() => document.body.innerText);
      const hasErrorBanner = pageText.includes('Error') || pageText.includes('Failed to fetch') || pageText.includes('Internal Server Error');
      
      auditLog.pagesTested.push({
        name: sec.name,
        path: sec.path,
        hasErrorBanner,
        textSnippet: pageText.slice(0, 200).replace(/\n/g, ' ')
      });

      if (hasErrorBanner) {
        logIssue('UI Rendering', 'Medium', `Potential Error Displayed on ${sec.name}`, `Page text indicates error state`, sec.screenshot);
      }
    }

    // 3. DEEP FUNCTIONAL TESTING AS AN AMAZON SELLER

    // A. TEST CHATBOT (Ask Copilot as Amazon Seller)
    console.log('\n--- Deep Testing: AI Copilot (/dashboard/chat) ---');
    await page.goto(`${TARGET_URL}/dashboard/chat`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const chatInput = await page.$('input[placeholder*="Ask"], textarea[placeholder*="Ask"], input[type="text"]');
    if (chatInput) {
      console.log('Sending message to Copilot: "so how many products do i have?"');
      await chatInput.fill('so how many products do i have?');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(7000); // Wait for AI response

      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_chat_response_product_count.png') });
      const chatBody = await page.evaluate(() => document.body.innerText);
      
      if (chatBody.includes('AI Quota Reached') || chatBody.includes('temporarily rate-limited')) {
        logIssue('AI Copilot', 'High', 'Chatbot Rate Limit Modal triggered', 'Bot responded with AI Quota Reached instead of local catalog fallback', '18_chat_response_product_count.png');
      } else {
        console.log('✅ Copilot answered without rate-limit quota modal!');
      }

      // Test Amazon-specific What-If simulation
      console.log('Sending What-If query to Copilot: "/what-if @"Wild Stone" to 420"');
      const chatInput2 = await page.$('input[placeholder*="Ask"], textarea[placeholder*="Ask"], input[type="text"]');
      if (chatInput2) {
        await chatInput2.fill('/what-if @"Wild Stone" to 420');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(7000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19_chat_what_if_response.png') });
      }
    } else {
      logIssue('AI Copilot', 'Medium', 'Chat input field not found on /dashboard/chat', 'Could not locate input field to submit message');
    }

    // B. TEST PRODUCTS CATALOG SEARCH & INTERACTION
    console.log('\n--- Deep Testing: Products Catalog Interaction ---');
    await page.goto(`${TARGET_URL}/dashboard/products`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const searchInput = await page.$('input[placeholder*="Search"], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('Stone');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '20_products_search_filter.png') });
      console.log('✅ Product search filter tested');
    }

    // C. TEST INTEGRATIONS (Amazon Seller Central)
    console.log('\n--- Deep Testing: Integrations (/dashboard/integrations) ---');
    await page.goto(`${TARGET_URL}/dashboard/integrations`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const integrationsText = await page.evaluate(() => document.body.innerText);
    const hasAmazon = integrationsText.includes('Amazon') || integrationsText.includes('SP-API') || integrationsText.includes('Seller Central');
    console.log('Amazon Integration present:', hasAmazon);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '21_integrations_amazon.png') });

    // D. TEST CHANNEL MAPPING
    console.log('\n--- Deep Testing: Channel Mapping (/dashboard/channel-mapping) ---');
    await page.goto(`${TARGET_URL}/dashboard/channel-mapping`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '22_channel_mapping_view.png') });

    // E. TEST COMPETITORS PAGE (Live Scrape trigger)
    console.log('\n--- Deep Testing: Competitor Intelligence (/dashboard/competitors) ---');
    await page.goto(`${TARGET_URL}/dashboard/competitors`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '23_competitors_page.png') });

    // F. TEST ALERTS CENTER
    console.log('\n--- Deep Testing: Alerts Center (/dashboard/alerts) ---');
    await page.goto(`${TARGET_URL}/dashboard/alerts`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '24_alerts_center.png') });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '24_alerts_center.png') });

  } catch (err) {
    console.error('Fatal testing error:', err);
    auditLog.fatalError = err.message;
  } finally {
    await browser.close();
    console.log('\n✅ Testing session finished. Compiling audit results...');
    
    // Save audit log JSON
    fs.writeFileSync(path.join(OUTPUT_DIR, 'audit-results.json'), JSON.stringify(auditLog, null, 2));
    console.log('Saved audit log to:', path.join(OUTPUT_DIR, 'audit-results.json'));
  }
})();
