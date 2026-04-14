let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.warn('Playwright not available - autofill will use mock mode');
}

const ANTI_DETECTION = {
  minDelay: 2000,
  maxDelay: 5000,
  humanTypingDelay: { min: 50, max: 150 },
  mouseMoveDelay: { min: 100, max: 300 },
};

const randomDelay = async () => {
  const delay = Math.floor(Math.random() * (ANTI_DETECTION.maxDelay - ANTI_DETECTION.minDelay + 1)) + ANTI_DETECTION.minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const simulateTyping = async (page, selector, text) => {
  await page.click(selector);
  await page.fill(selector, '');
  
  for (const char of text) {
    await page.type(selector, char, { delay: Math.floor(Math.random() * (ANTI_DETECTION.humanTypingDelay.max - ANTI_DETECTION.humanTypingDelay.min + 1)) + ANTI_DETECTION.humanTypingDelay.min });
  }
};

const humanLikeClick = async (page, selector) => {
  await page.hover(selector);
  await randomDelay();
  await page.click(selector);
};

const FIELD_SELECTORS = {
  firstName: ['input[name="firstName"]', 'input[id="firstName"]', 'input[placeholder*="First"]', 'input[name="first_name"]', 'input[id="first_name"]'],
  lastName: ['input[name="lastName"]', 'input[id="lastName"]', 'input[placeholder*="Last"]', 'input[name="last_name"]', 'input[id="last_name"]'],
  fullName: ['input[name="name"]', 'input[id="name"]', 'input[placeholder*="Name"]', 'input[name="fullName"]', 'input[id="fullName"]'],
  email: ['input[name="email"]', 'input[type="email"]', 'input[id="email"]', 'input[placeholder*="Email"]'],
  phone: ['input[name="phone"]', 'input[type="tel"]', 'input[id="phone"]', 'input[placeholder*="Phone"]', 'input[name="phoneNumber"]'],
  resume: ['input[type="file"]', 'input[name="resume"]', 'input[name="cv"]', 'input[id="resume"]', 'input[name="uploadResume"]'],
  coverLetter: ['textarea[name="coverLetter"]', 'textarea[id="coverLetter"]', 'textarea[placeholder*="Cover"]', 'textarea[name="cover_letter"]'],
  linkedin: ['input[name="linkedin"]', 'input[name="linkedinUrl"]', 'input[id="linkedin"]', 'input[placeholder*="LinkedIn"]'],
  github: ['input[name="github"]', 'input[name="githubUrl"]', 'input[id="github"]', 'input[placeholder*="GitHub"]'],
  portfolio: ['input[name="portfolio"]', 'input[name="website"]', 'input[id="portfolio"]', 'input[placeholder*="Portfolio"]'],
};

const findFieldSelector = async (page, fieldType) => {
  const selectors = FIELD_SELECTORS[fieldType] || [];
  
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        return selector;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
};

const autofillApplication = async (jobUrl, userData) => {
  console.log(`[Autofill] Starting autofill for: ${jobUrl}`);
  
  if (!playwright) {
    return {
      success: true,
      message: 'Mock autofill (Playwright not installed)',
      filled: [],
      url: jobUrl,
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
    
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await randomDelay();
    
    const filled = [];
    
    if (userData.name) {
      const nameSelector = await findFieldSelector(page, 'fullName');
      if (nameSelector) {
        await simulateTyping(page, nameSelector, userData.name);
        filled.push('name');
        await randomDelay();
      }
    }
    
    if (userData.email) {
      const emailSelector = await findFieldSelector(page, 'email');
      if (emailSelector) {
        await page.fill(emailSelector, userData.email);
        filled.push('email');
        await randomDelay();
      }
    }
    
    if (userData.phone) {
      const phoneSelector = await findFieldSelector(page, 'phone');
      if (phoneSelector) {
        await page.fill(phoneSelector, userData.phone);
        filled.push('phone');
        await randomDelay();
      }
    }
    
    if (userData.resumePath) {
      const resumeSelector = await findFieldSelector(page, 'resume');
      if (resumeSelector) {
        await page.setInputFiles(resumeSelector, userData.resumePath);
        filled.push('resume');
        await randomDelay();
      }
    }
    
    if (userData.coverLetter) {
      const coverLetterSelector = await findFieldSelector(page, 'coverLetter');
      if (coverLetterSelector) {
        await simulateTyping(page, coverLetterSelector, userData.coverLetter);
        filled.push('coverLetter');
        await randomDelay();
      }
    }
    
    if (userData.linkedin) {
      const linkedinSelector = await findFieldSelector(page, 'linkedin');
      if (linkedinSelector) {
        await page.fill(linkedinSelector, userData.linkedin);
        filled.push('linkedin');
        await randomDelay();
      }
    }
    
    console.log(`[Autofill] Filled fields: ${filled.join(', ')}`);
    console.log('[Autofill] Please review and submit manually');
    
    return {
      success: true,
      message: `Autofilled ${filled.length} fields. Please review and submit.`,
      filled,
      url: jobUrl,
    };
    
  } catch (error) {
    console.error('[Autofill] Error:', error.message);
    
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    return {
      success: false,
      message: `Autofill failed: ${error.message}`,
      error: error.message,
    };
  }
};

const detectFormFields = async (jobUrl) => {
  if (!playwright) {
    return { detected: false, fields: [], message: 'Playwright not available' };
  }

  let browser;
  
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await randomDelay();
    
    const detectedFields = [];
    
    for (const [fieldType, selectors] of Object.entries(FIELD_SELECTORS)) {
      for (const selector of selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const tagName = await element.evaluate(el => el.tagName);
            const type = await element.evaluate(el => el.type || 'text');
            
            detectedFields.push({
              type: fieldType,
              selector,
              tagName: tagName.toLowerCase(),
              inputType: type,
            });
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    await browser.close();
    
    return {
      detected: detectedFields.length > 0,
      fields: detectedFields,
      count: detectedFields.length,
    };
    
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    return { detected: false, error: error.message };
  }
};

module.exports = {
  autofillApplication,
  detectFormFields,
  FIELD_SELECTORS,
};