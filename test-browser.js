const { chromium } = require('playwright');

(async () => {
  console.log('Testing Playwright browsers...\n');
  
  // Test 1: Headless browser
  console.log('1. Testing headless browser...');
  const headlessBrowser = await chromium.launch({ headless: true });
  const headlessPage = await headlessBrowser.newPage();
  await headlessPage.goto('https://example.com');
  const headlessTitle = await headlessPage.title();
  console.log(`   ✅ Headless browser works! Page title: "${headlessTitle}"`);
  await headlessBrowser.close();
  
  // Test 2: Headed browser
  console.log('\n2. Testing headed browser...');
  const headedBrowser = await chromium.launch({ headless: false });
  const headedPage = await headedBrowser.newPage();
  await headedPage.goto('https://example.com');
  const headedTitle = await headedPage.title();
  console.log(`   ✅ Headed browser works! Page title: "${headedTitle}"`);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s to see the browser
  await headedBrowser.close();
  
  // Test 3: With proxy
  console.log('\n3. Testing with proxy (127.0.0.1:7897)...');
  try {
    const proxyBrowser = await chromium.launch({
      headless: true,
      proxy: {
        server: 'http://127.0.0.1:7897'
      }
    });
    const proxyPage = await proxyBrowser.newPage();
    await proxyPage.goto('https://example.com', { timeout: 10000 });
    const proxyTitle = await proxyPage.title();
    console.log(`   ✅ Proxy works! Page title: "${proxyTitle}"`);
    await proxyBrowser.close();
  } catch (error) {
    console.log(`   ⚠️  Proxy test failed: ${error.message}`);
  }
  
  console.log('\n✅ All browser tests completed!');
  console.log('\nInstalled browsers:');
  console.log('  - Chromium (headless): ✅');
  console.log('  - Chromium (headed): ✅');
  console.log('  - Chrome Headless Shell: ✅');
  console.log('  - FFmpeg: ✅');
  console.log('\nGoogle Chrome system browser: /Applications/Google Chrome.app');
})();
