const AUTOAPPLY_VERSION = '1.0.0';

const DEFAULT_CONFIG = {
  rateLimit: {
    maxActionsPerHour: 20,
    cooldownMinutes: 30,
  },
  delays: {
    minTyping: 30,
    maxTyping: 80,
    betweenFields: 400,
    beforeScroll: 300,
  },
};

let CONFIG = { ...DEFAULT_CONFIG };

const loadConfig = () => {
  chrome.storage.local.get(['autoapply_settings'], (result) => {
    const settings = result.autoapply_settings || {};
    CONFIG = {
      rateLimit: {
        maxActionsPerHour: settings.maxActionsPerHour || DEFAULT_CONFIG.rateLimit.maxActionsPerHour,
        cooldownMinutes: settings.cooldownMinutes || DEFAULT_CONFIG.rateLimit.cooldownMinutes,
      },
      delays: DEFAULT_CONFIG.delays,
    };
  });
};

loadConfig();

const JOB_PAGE_PATTERNS = [
  /linkedin\.com\/jobs/,
  /naukri\.com/,
  /indeed\.com/,
  /glassdoor\.com/,
  /monster\.com/,
  /timesjobs\.com/,
];

const SITE_CONFIGS = {
  linkedin: {
    name: 'LinkedIn',
    selectors: {
      firstName: ['input[name="firstName"]', 'input[id="firstName"]', 'input[aria-label="First name"]'],
      lastName: ['input[name="lastName"]', 'input[id="lastName"]', 'input[aria-label="Last name"]'],
      fullName: ['input[name="name"]', 'input[id="fullName"]'],
      email: ['input[name="emailAddress"]', 'input[type="email"]', 'input[id="email"]', 'input[aria-label="Email"]'],
      phone: ['input[name="phoneNumber"]', 'input[type="tel"]', 'input[id="phone"]', 'input[aria-label="Phone number"]'],
      resume: ['input[type="file"]', 'input[name="resume"]', 'input[id="resume"]'],
      workExperience: ['input[name="currentPosition"]', 'textarea[name="workExperience"]'],
    },
    applyButton: [
      'button[aria-label="Easy Apply"]',
      'button[data-control-name="apply"]',
      '.jobs-apply-button button',
      'button:contains("Easy Apply")',
    ],
  },
  naukri: {
    name: 'Naukri',
    selectors: {
      firstName: ['input[name="firstName"]', 'input[id="firstName"]', 'input[placeholder*="Name"]'],
      lastName: ['input[name="lastName"]', 'input[id="lastName"]'],
      fullName: ['input[name="name"]', 'input[id="name"]', 'input[placeholder="Name *"]'],
      email: ['input[name="email"]', 'input[type="email"]', 'input[id="email"]', 'input[placeholder="Email *"]'],
      phone: ['input[name="phone"]', 'input[type="tel"]', 'input[id="phone"]', 'input[placeholder="Mobile *"]'],
      resume: ['input[type="file"]', 'input[name="resume"]', 'input[id="resume"]', 'input[accept*="pdf,doc"]'],
      coverLetter: ['textarea[name="coverLetter"]', 'textarea[id="coverLetter"]'],
    },
    applyButton: [
      'button.apply-button',
      'button[class*="apply"]',
      'button:contains("Apply")',
      '.btn-primary.apply-button',
    ],
  },
  indeed: {
    name: 'Indeed',
    selectors: {
      firstName: ['input[name="firstName"]', 'input[id="firstName"]'],
      lastName: ['input[name="lastName"]', 'input[id="lastName"]'],
      fullName: ['input[name="name"]', 'input[id="name"]'],
      email: ['input[name="email"]', 'input[type="email"]', 'input[id="email"]'],
      phone: ['input[name="phoneNumber"]', 'input[type="tel"]', 'input[id="phoneNumber"]'],
      resume: ['input[type="file"]', 'input[name="resume"]'],
    },
    applyButton: [
      'button[data-testid="apply-button"]',
      '.jobsearch-ApplyButton-button',
      'button:contains("Submit Application")',
    ],
  },
};

let sessionStats = {
  actionsThisHour: 0,
  lastActionTime: 0,
  isOnCooldown: false,
  cooldownEndTime: 0,
};

const getCurrentSite = () => {
  const url = window.location.href;
  for (const site of Object.keys(SITE_CONFIGS)) {
    if (url.includes(site)) {
      return site;
    }
  }
  return null;
};

const isJobPage = () => {
  const url = window.location.href;
  return JOB_PAGE_PATTERNS.some(pattern => pattern.test(url));
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = (min, max) => {
  return delay(Math.floor(Math.random() * (max - min + 1)) + min);
};

const canPerformAction = () => {
  const now = Date.now();
  
  if (sessionStats.isOnCooldown && now < sessionStats.cooldownEndTime) {
    return { allowed: false, message: 'On cooldown. Please wait.' };
  }
  
  if (sessionStats.actionsThisHour >= CONFIG.rateLimit.maxActionsPerHour) {
    return { allowed: false, message: 'Hourly limit reached. Try again later.' };
  }
  
  return { allowed: true };
};

const recordAction = () => {
  const now = Date.now();
  
  if (sessionStats.lastActionTime && now - sessionStats.lastActionTime > 3600000) {
    sessionStats.actionsThisHour = 0;
  }
  
  sessionStats.actionsThisHour++;
  sessionStats.lastActionTime = now;
  
  if (sessionStats.actionsThisHour >= CONFIG.rateLimit.maxActionsPerHour - 2) {
    sessionStats.isOnCooldown = true;
    sessionStats.cooldownEndTime = now + (CONFIG.rateLimit.cooldownMinutes * 60 * 1000);
  }
};

const simulateScroll = async () => {
  const scrollHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = scrollHeight - viewportHeight;
  
  const steps = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < steps; i++) {
    const scrollAmount = Math.random() * (maxScroll * 0.3);
    window.scrollBy({
      top: Math.random() > 0.5 ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
    await randomDelay(500, 1000);
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await randomDelay(300, 600);
};

const simulateMouseMove = async (element) => {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  for (let i = 0; i < 3; i++) {
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    
    const mouseEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: centerX + offsetX,
      clientY: centerY + offsetY,
    });
    document.dispatchEvent(mouseEvent);
    await randomDelay(50, 150);
  }
};

const findField = (fieldType) => {
  const site = getCurrentSite();
  const siteConfig = SITE_CONFIGS[site];
  
  let selectors = [];
  
  if (siteConfig?.selectors?.[fieldType]) {
    selectors = siteConfig.selectors[fieldType];
  }
  
  const fallbackSelectors = {
    firstName: ['input[name="firstName"]', 'input[id="firstName"]', 'input[placeholder*="First"]'],
    lastName: ['input[name="lastName"]', 'input[id="lastName"]', 'input[placeholder*="Last"]'],
    fullName: ['input[name="name"]', 'input[id="name"]', 'input[placeholder*="Name"]'],
    email: ['input[name="email"]', 'input[type="email"]', 'input[id="email"]', 'input[placeholder*="Email"]'],
    phone: ['input[name="phone"]', 'input[type="tel"]', 'input[id="phone"]', 'input[placeholder*="Phone"]'],
    resume: ['input[type="file"]', 'input[name="resume"]', 'input[name="cv"]'],
    coverLetter: ['textarea[name="coverLetter"]', 'textarea[id="coverLetter"]'],
  };
  
  selectors = [...selectors, ...(fallbackSelectors[fieldType] || [])];
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.offsetParent !== null && element.type !== 'hidden') {
          return element;
        }
      }
    } catch (e) {
      continue;
    }
  }
  return null;
};

const detectFormFields = () => {
  const fields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'resume', 'coverLetter'];
  const detected = [];
  
  for (const fieldType of fields) {
    const element = findField(fieldType);
    if (element) {
      detected.push({
        type: fieldType,
        found: true,
        tagName: element.tagName.toLowerCase(),
        typeAttr: element.type || 'text',
      });
    }
  }
  
  return detected;
};

const fillField = async (fieldType, value) => {
  const check = canPerformAction();
  if (!check.allowed) {
    return { success: false, message: check.message };
  }
  
  const element = findField(fieldType);
  if (!element) {
    return { success: false, message: `Field ${fieldType} not found` };
  }
  
  try {
    await simulateMouseMove(element);
    await delay(200);
    
    element.focus();
    element.value = '';
    
    await randomDelay(CONFIG.delays.beforeScroll, CONFIG.delays.beforeScroll * 2);
    
    const chars = String(value).split('');
    for (let i = 0; i < chars.length; i++) {
      element.value += chars[i];
      await randomDelay(CONFIG.delays.minTyping, CONFIG.delays.maxTyping);
    }
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    element.blur();
    
    recordAction();
    
    return { success: true, field: fieldType };
  } catch (error) {
    return { success: false, error: error.message, field: fieldType };
  }
};

const fillAllFields = async (userData) => {
  const results = [];
  const site = getCurrentSite();
  
  console.log(`[AutoApply] Starting autofill on ${site || 'unknown site'}`);
  
  await simulateScroll();
  await randomDelay(500, 1000);
  
  if (userData.name) {
    const result = await fillField('fullName', userData.name);
    results.push(result);
    await randomDelay(CONFIG.delays.betweenFields, CONFIG.delays.betweenFields * 1.5);
  }
  
  if (!findField('fullName') && userData.name) {
    const nameParts = userData.name.split(' ');
    if (nameParts.length > 0) {
      const firstResult = await fillField('firstName', nameParts[0]);
      results.push(firstResult);
      await randomDelay(CONFIG.delays.betweenFields, CONFIG.delays.betweenFields * 1.5);
      
      if (nameParts.length > 1) {
        const lastResult = await fillField('lastName', nameParts.slice(1).join(' '));
        results.push(lastResult);
        await randomDelay(CONFIG.delays.betweenFields, CONFIG.delays.betweenFields * 1.5);
      }
    }
  }
  
  if (userData.email) {
    const result = await fillField('email', userData.email);
    results.push(result);
    await randomDelay(CONFIG.delays.betweenFields, CONFIG.delays.betweenFields * 1.5);
  }
  
  if (userData.phone) {
    const result = await fillField('phone', userData.phone);
    results.push(result);
    await randomDelay(CONFIG.delays.betweenFields, CONFIG.delays.betweenFields * 1.5);
  }
  
  if (userData.coverLetter) {
    const result = await fillField('coverLetter', userData.coverLetter);
    results.push(result);
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`[AutoApply] Filled ${successCount}/${results.length} fields`);
  
  return results;
};

const findSubmitButton = () => {
  const site = getCurrentSite();
  const siteConfig = SITE_CONFIGS[site];
  
  let selectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[data-testid="apply-button"]',
    '.jobs-apply-button button',
    'button:contains("Apply")',
    'button:contains("Submit")',
    'button:contains("Submit Application")',
    'button.apply-button',
    'button[class*="apply-button"]',
    'a.apply-button',
  ];
  
  if (siteConfig?.applyButton) {
    selectors = [...siteConfig.applyButton, ...selectors];
  }
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.offsetParent !== null) {
          const text = element.textContent?.toLowerCase() || '';
          if (text.includes('apply') || text.includes('submit')) {
            return element;
          }
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
};

const highlightSubmitButton = () => {
  const button = findSubmitButton();
  if (!button) {
    return { found: false, message: 'No submit button found' };
  }
  
  button.style.outline = '3px solid #667eea';
  button.style.outlineOffset = '2px';
  button.style.animation = 'pulse 2s infinite';
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { outline-color: #667eea; }
      50% { outline-color: #764ba2; }
    }
  `;
  document.head.appendChild(style);
  
  button.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  return {
    found: true,
    message: 'Submit button highlighted. Review and click to apply.',
    buttonText: button.textContent?.trim(),
  };
};

const createFloatingButton = () => {
  const existingBtn = document.getElementById('autoapply-floating-btn');
  if (existingBtn) return;
  
  const btn = document.createElement('div');
  btn.id = 'autoapply-floating-btn';
  btn.innerHTML = `
    <style>
      #autoapply-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #autoapply-floating-btn:hover {
        transform: scale(1.15);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.7);
      }
      #autoapply-floating-btn svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
    </style>
    <svg viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  `;
  
  btn.addEventListener('click', showAutofillPanel);
  document.body.appendChild(btn);
};

const showAutofillPanel = async () => {
  const existing = document.getElementById('autoapply-panel');
  if (existing) {
    existing.remove();
    return;
  }
  
  const site = getCurrentSite();
  const siteName = SITE_CONFIGS[site]?.name || 'Job Site';
  
  const panel = document.createElement('div');
  panel.id = 'autoapply-panel';
  panel.innerHTML = `
    <style>
      #autoapply-panel {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 340px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 999999;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .autoapply-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .autoapply-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .autoapply-site {
        font-size: 12px;
        opacity: 0.9;
      }
      .autoapply-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        line-height: 1;
      }
      .autoapply-close:hover {
        background: rgba(255,255,255,0.3);
      }
      .autoapply-body {
        padding: 20px;
      }
      .autoapply-status {
        padding: 14px;
        background: #f8f9ff;
        border-radius: 10px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #444;
        border-left: 3px solid #667eea;
      }
      .autoapply-rate-limit {
        padding: 12px;
        background: #fff3cd;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 12px;
        color: #856404;
        display: none;
      }
      .autoapply-rate-limit.show {
        display: block;
      }
      .autoapply-field {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      .autoapply-field:last-child {
        border-bottom: none;
      }
      .autoapply-field-label {
        font-size: 13px;
        color: #555;
        font-weight: 500;
      }
      .autoapply-field-status {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 500;
      }
      .autoapply-field-status.found {
        background: #d4edda;
        color: #155724;
      }
      .autoapply-field-status.not-found {
        background: #f8f9fa;
        color: #6c757d;
      }
      .autoapply-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 16px;
        transition: opacity 0.2s, transform 0.1s;
      }
      .autoapply-btn:hover {
        opacity: 0.92;
      }
      .autoapply-btn:active {
        transform: scale(0.98);
      }
      .autoapply-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
      }
      .autoapply-btn-secondary {
        background: #f5f5f5;
        color: #444;
        margin-top: 8px;
      }
      .autoapply-btn-secondary:hover {
        background: #e9ecef;
      }
      .autoapply-job-info {
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        padding: 14px;
        border-radius: 10px;
        margin-bottom: 16px;
      }
      .autoapply-job-info h4 {
        margin: 0 0 6px 0;
        font-size: 13px;
        color: #333;
        font-weight: 600;
      }
      .autoapply-job-info p {
        margin: 0;
        font-size: 11px;
        color: #666;
      }
      .autoapply-success {
        background: #d4edda !important;
        border-left-color: #28a745 !important;
      }
    </style>
    <div class="autoapply-header">
      <div>
        <h3>AutoApply AI</h3>
        <span class="autoapply-site">${siteName}</span>
      </div>
      <button class="autoapply-close">&times;</button>
    </div>
    <div class="autoapply-body">
      <div class="autoapply-job-info">
        <h4>${document.title.substring(0, 60)}</h4>
        <p>${window.location.hostname}</p>
      </div>
      <div class="autoapply-rate-limit" id="rateLimitMsg"></div>
      <div class="autoapply-status" id="statusMsg">
        Detecting form fields...
      </div>
      <div class="autoapply-fields-list" id="fieldsList">
      </div>
      <button class="autoapply-btn" id="fillBtn">Fill Fields</button>
      <button class="autoapply-btn autoapply-btn-secondary" id="highlightBtn">Highlight Apply Button</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  panel.querySelector('.autoapply-close').addEventListener('click', () => panel.remove());
  
  setTimeout(async () => {
    updateRateLimitDisplay();
    const fields = detectFormFields();
    updateFieldStatus(fields);
    
    const fillBtn = document.getElementById('fillBtn');
    fillBtn.addEventListener('click', async () => {
      fillBtn.disabled = true;
      fillBtn.textContent = 'Filling...';
      
      chrome.storage.local.get(['autoapply_user_data'], async (result) => {
        const userData = result.autoapply_user_data || {};
        
        const check = canPerformAction();
        if (!check.allowed) {
          fillBtn.disabled = false;
          fillBtn.textContent = 'Fill Fields';
          showNotification(check.message, 'error');
          return;
        }
        
        const fillResults = await fillAllFields(userData);
        
        const successCount = fillResults.filter(r => r.success).length;
        fillBtn.textContent = `Filled ${successCount} fields`;
        
        if (successCount > 0) {
          const statusDiv = document.getElementById('statusMsg');
          statusDiv.classList.add('autoapply-success');
          statusDiv.textContent = `Successfully filled ${successCount} field(s)! Review and submit manually.`;
        }
        
        setTimeout(() => {
          fillBtn.disabled = false;
          fillBtn.textContent = 'Fill Fields';
        }, 3000);
      });
    });
    
    const highlightBtn = document.getElementById('highlightBtn');
    highlightBtn.addEventListener('click', async () => {
      const result = highlightSubmitButton();
      showNotification(result.message, result.found ? 'success' : 'error');
    });
    
  }, 800);
};

const updateFieldStatus = (detectedFields) => {
  const statusMap = {};
  detectedFields.forEach(f => {
    statusMap[f.type] = f.found;
  });
  
  const fields = [
    { type: 'fullName', label: 'Full Name' },
    { type: 'firstName', label: 'First Name' },
    { type: 'email', label: 'Email' },
    { type: 'phone', label: 'Phone' },
    { type: 'resume', label: 'Resume' },
    { type: 'coverLetter', label: 'Cover Letter' },
  ];
  
  const statusContainer = document.getElementById('fieldsList');
  if (!statusContainer) return;
  
  statusContainer.innerHTML = fields.map(f => `
    <div class="autoapply-field">
      <span class="autoapply-field-label">${f.label}</span>
      <span class="autoapply-field-status ${statusMap[f.type] ? 'found' : 'not-found'}">
        ${statusMap[f.type] ? 'Found' : 'Not found'}
      </span>
    </div>
  `).join('');
  
  const statusDiv = document.getElementById('statusMsg');
  const foundCount = detectedFields.length;
  statusDiv.textContent = foundCount > 0 
    ? `Found ${foundCount} form field${foundCount > 1 ? 's' : ''}. Click "Fill Fields" to autofill.`
    : 'No form fields detected. Try navigating to the application form.';
};

const updateRateLimitDisplay = () => {
  const rateLimitDiv = document.getElementById('rateLimitMsg');
  if (!rateLimitDiv) return;
  
  const check = canPerformAction();
  if (!check.allowed) {
    rateLimitDiv.classList.add('show');
    rateLimitDiv.textContent = check.message;
  } else {
    const remaining = CONFIG.rateLimit.maxActionsPerHour - sessionStats.actionsThisHour;
    rateLimitDiv.classList.remove('show');
  }
};

const showNotification = (message, type = 'info') => {
  const statusDiv = document.getElementById('statusMsg');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = 'autoapply-status';
    if (type === 'success') statusDiv.classList.add('autoapply-success');
  }
};

if (isJobPage()) {
  console.log('[AutoApply AI] Job page detected, loading...');
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      createFloatingButton();
    }, 1500);
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'autofill') {
      fillAllFields(message.data).then(results => {
        sendResponse({ success: true, results });
      });
      return true;
    }
    
    if (message.action === 'detectFields') {
      const fields = detectFormFields();
      sendResponse({ detected: fields });
      return true;
    }
    
    if (message.action === 'showPanel') {
      showAutofillPanel();
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === 'getSessionStats') {
      sendResponse({ stats: sessionStats, config: CONFIG.rateLimit });
      return true;
    }
    
    if (message.action === 'highlightButton') {
      const result = highlightSubmitButton();
      sendResponse(result);
      return true;
    }
  });
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
    } else {
      if (isJobPage()) {
      }
    }
  });
}