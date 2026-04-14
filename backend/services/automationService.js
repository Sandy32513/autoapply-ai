let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.warn('Playwright not available');
}

const autofillService = require('./autofillService');

const ANTI_DETECTION = {
  minDelay: 2000,
  maxDelay: 6000,
  humanTypingDelay: { min: 50, max: 150 },
};

const randomDelay = async () => {
  const delay = Math.floor(Math.random() * (ANTI_DETECTION.maxDelay - ANTI_DETECTION.minDelay + 1)) + ANTI_DETECTION.minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const simulateHumanBehavior = async () => {
  await randomDelay();
};

const startApplyFlow = async (jobUrl, userData) => {
  console.log(`[ApplyFlow] Starting apply flow for: ${jobUrl}`);
  console.log('[ApplyFlow] Step 1: Open job page in browser');
  
  if (!playwright) {
    return {
      success: true,
      step: 'open_page',
      message: 'Mock mode: Would open job page in browser',
      jobUrl,
      instruction: 'Please open the job URL manually and the extension will help autofill',
    };
  }

  let browser;
  
  try {
    browser = await playwright.chromium.launch({ 
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    console.log('[ApplyFlow] Navigating to job page...');
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await simulateHumanBehavior();
    
    const title = await page.title();
    console.log(`[ApplyFlow] Page loaded: ${title}`);
    
    console.log('[ApplyFlow] Step 2: Detecting form fields...');
    const formDetection = await autofillService.detectFormFields(jobUrl);
    
    console.log(`[ApplyFlow] Found ${formDetection.count || 0} form fields`);
    
    if (formDetection.detected) {
      console.log('[ApplyFlow] Step 3: Autofilling fields...');
      
      const autofillResult = await autofillService.autofillApplication(jobUrl, userData);
      
      console.log(`[ApplyFlow] Autofilled: ${autofillResult.filled?.join(', ') || 'none'}`);
    }
    
    console.log('[ApplyFlow] Step 4: User submits manually');
    console.log('[ApplyFlow] Browser remains open for manual submission');
    
    return {
      success: true,
      step: 'ready_for_submission',
      message: 'Job page opened, form filled, ready for manual submission',
      jobUrl,
      title,
      formDetected: formDetection.detected,
      fieldsFound: formDetection.count || 0,
      instruction: 'Please review the filled form and submit manually',
      keepBrowserOpen: true,
    };
    
  } catch (error) {
    console.error('[ApplyFlow] Error:', error.message);
    
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    return {
      success: false,
      step: 'error',
      message: `Apply flow failed: ${error.message}`,
      error: error.message,
    };
  }
};

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

    await randomDelay();

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

    await randomDelay();

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

const checkPageForm = async (jobUrl) => {
  if (!playwright) {
    return { hasForm: false, message: 'Playwright not available' };
  }

  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    await simulateHumanBehavior();
    
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

const getJobPageInfo = async (jobUrl) => {
  if (!playwright) {
    return { accessible: false, message: 'Playwright not available' };
  }

  let browser;
  
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await simulateHumanBehavior();
    
    const title = await page.title();
    const url = page.url();
    
    await browser.close();
    
    return {
      accessible: true,
      title,
      url,
      isJobPage: url.includes('jobs') || url.includes('job') || url.includes('career'),
    };
    
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    return { accessible: false, error: error.message };
  }
};

module.exports = { 
  applyToJob, 
  checkPageForm,
  startApplyFlow,
  getJobPageInfo,
};