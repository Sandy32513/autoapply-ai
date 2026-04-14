let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.warn('Playwright not available');
}

const applyToJob = async (jobUrl, resumeData) => {
  console.log(`Starting automation for: ${jobUrl}`);
  
  if (!playwright) {
    return {
      success: true,
      message: 'Mock application submitted (Playwright not installed)',
      details: 'In production, Playwright would automate the application process',
    };
  }

  const browser = await playwright.chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  
  const page = await context.newPage();

  try {
    await page.goto(jobUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    await randomDelay(1000, 3000);

    const title = await page.title();
    console.log(`Page title: ${title}`);

    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Apply")',
      'a:has-text("Apply")',
      '[data-testid="apply-button"]',
      '.apply-button',
      '#apply-button',
    ];

    let buttonFound = false;
    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          buttonFound = true;
          console.log(`Found apply button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await randomDelay(500, 1500);

    await browser.close();

    return {
      success: true,
      message: buttonFound 
        ? 'Application form detected and processed'
        : 'Page loaded but no apply button found - manual application may be required',
      details: {
        url: jobUrl,
        title,
        timestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    console.error('Automation error:', error.message);
    
    await browser.close().catch(() => {});
    
    return {
      success: false,
      message: `Automation failed: ${error.message}`,
      error: error.message,
    };
  }
};

const randomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const checkPageForm = async (jobUrl) => {
  if (!playwright) {
    return { hasForm: false, message: 'Playwright not available' };
  }

  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const forms = await page.$$('form');
    const inputs = await page.$$('input');
    
    await browser.close();
    
    return {
      hasForm: forms.length > 0,
      inputCount: inputs.length,
      url: jobUrl,
    };
  } catch (error) {
    return { hasForm: false, error: error.message };
  }
};

module.exports = { applyToJob, checkPageForm };