const AUTOAPPLY_CONFIG = {
  API_URL: null,
  RATE_LIMIT: {
    maxActionsPerHour: 20,
    cooldownMinutes: 30,
  },
  SESSION_KEY: 'autoapply_session',
  USER_DATA_KEY: 'autoapply_user_data',
  SETTINGS_KEY: 'autoapply_settings',
  STATS_KEY: 'autoapply_stats',
};

const DEFAULT_RATE_LIMIT = {
  maxActionsPerHour: 20,
  cooldownMinutes: 30,
};

const loadConfigFromStorage = (callback) => {
  chrome.storage.local.get(['autoapply_settings'], (result) => {
    const settings = result.autoapply_settings || {};
    
    const config = {
      apiUrl: settings.apiUrl || 'http://localhost:5000',
      rateLimit: {
        maxActionsPerHour: settings.maxActionsPerHour || DEFAULT_RATE_LIMIT.maxActionsPerHour,
        cooldownMinutes: settings.cooldownMinutes || DEFAULT_RATE_LIMIT.cooldownMinutes,
      }
    };
    
    callback(config);
  });
};

function getApiUrl(callback) {
  if (AUTOAPPLY_CONFIG.API_URL) {
    callback(AUTOAPPLY_CONFIG.API_URL);
    return;
  }
  
  chrome.storage.local.get(['autoapply_settings'], (result) => {
    const settings = result.autoapply_settings || {};
    callback(settings.apiUrl || 'http://localhost:5000');
  });
}

// Allow updating API URL dynamically
const setApiUrl = (url) => {
  localStorage.setItem('autoapply_api_url', url);
  AUTOAPPLY_CONFIG.API_URL = url;
};

const getStoredApiUrl = (callback) => {
  chrome.storage.local.get(['autoapply_api_url'], (result) => {
    callback(result.autoapply_api_url || AUTOAPPLY_CONFIG.API_URL);
  });
};

let sessionState = {
  actionsThisHour: 0,
  lastResetTime: Date.now(),
  isOnCooldown: false,
  cooldownEndTime: 0,
};

const initializeSession = () => {
  chrome.storage.local.get([AUTOAPPLY_CONFIG.SESSION_KEY, AUTOAPPLY_CONFIG.SETTINGS_KEY], (result) => {
    const saved = result[AUTOAPPLY_CONFIG.SESSION_KEY];
    const settings = result[AUTOAPPLY_CONFIG.SETTINGS_KEY] || {};
    
    if (settings.maxActionsPerHour) {
      AUTOAPPLY_CONFIG.RATE_LIMIT.maxActionsPerHour = settings.maxActionsPerHour;
    }
    if (settings.cooldownMinutes) {
      AUTOAPPLY_CONFIG.RATE_LIMIT.cooldownMinutes = settings.cooldownMinutes;
    }
    
    const now = Date.now();
    if (saved) {
      if (now - saved.lastResetTime > 3600000) {
        sessionState = {
          actionsThisHour: 0,
          lastResetTime: now,
          isOnCooldown: false,
          cooldownEndTime: 0,
        };
      } else {
        sessionState = saved;
        if (sessionState.isOnCooldown && now > sessionState.cooldownEndTime) {
          sessionState.isOnCooldown = false;
          sessionState.cooldownEndTime = 0;
        }
      }
    }
    saveSession();
  });
};

const saveSession = () => {
  chrome.storage.local.set({ [AUTOAPPLY_CONFIG.SESSION_KEY]: sessionState });
};

const canPerformAction = () => {
  const now = Date.now();
  
  if (sessionState.isOnCooldown && now < sessionState.cooldownEndTime) {
    const remaining = Math.ceil((sessionState.cooldownEndTime - now) / 1000);
    return { allowed: false, remaining, message: `On cooldown. Try again in ${remaining} seconds.` };
  }
  
  if (sessionState.actionsThisHour >= AUTOAPPLY_CONFIG.RATE_LIMIT.maxActionsPerHour) {
    return { allowed: false, message: 'Hourly limit reached. Try again in ~30 minutes.' };
  }
  
  return { allowed: true, remaining: AUTOAPPLY_CONFIG.RATE_LIMIT.maxActionsThisHour - sessionState.actionsThisHour };
};

const recordAction = () => {
  const now = Date.now();
  
  if (now - sessionState.lastResetTime > 3600000) {
    sessionState.actionsThisHour = 0;
    sessionState.lastResetTime = now;
  }
  
  sessionState.actionsThisHour++;
  
  if (sessionState.actionsThisHour >= AUTOAPPLY_CONFIG.RATE_LIMIT.maxActionsPerHour - 2) {
    sessionState.isOnCooldown = true;
    sessionState.cooldownEndTime = now + (AUTOAPPLY_CONFIG.RATE_LIMIT.cooldownMinutes * 60 * 1000);
  }
  
  saveSession();
  updateBadge();
};

const updateBadge = () => {
  const remaining = AUTOAPPLY_CONFIG.RATE_LIMIT.maxActionsPerHour - sessionState.actionsThisHour;
  chrome.action.setBadgeText({ text: remaining < 10 ? String(remaining) : '' });
  chrome.action.setBadgeBackgroundColor({ color: remaining < 5 ? '#dc3545' : '#28a745' });
};

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[AutoApply AI] Extension installed', details.reason);
  
  initializeSession();
  
  chrome.storage.local.set({
    [AUTOAPPLY_CONFIG.USER_DATA_KEY]: {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      coverLetter: '',
    },
    [AUTOAPPLY_CONFIG.SETTINGS_KEY]: {
      autofillEnabled: true,
      showFloatingButton: true,
      autoDetectFields: true,
      highlightSubmitButton: true,
    },
    [AUTOAPPLY_CONFIG.STATS_KEY]: {
      fieldsFilled: 0,
      applicationsStarted: 0,
      sessionsUsed: 0,
    },
  });
  
  updateBadge();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getUserData') {
    chrome.storage.local.get([AUTOAPPLY_CONFIG.USER_DATA_KEY], (result) => {
      sendResponse(result[AUTOAPPLY_CONFIG.USER_DATA_KEY] || {});
    });
    return true;
  }

  if (message.action === 'saveUserData') {
    chrome.storage.local.set({ [AUTOAPPLY_CONFIG.USER_DATA_KEY]: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'syncWithBackend') {
    syncWithBackend(message.data).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === 'getSettings') {
    chrome.storage.local.get([AUTOAPPLY_CONFIG.SETTINGS_KEY], (result) => {
      sendResponse(result[AUTOAPPLY_CONFIG.SETTINGS_KEY] || {});
    });
    return true;
  }

  if (message.action === 'saveSettings') {
    chrome.storage.local.set({ [AUTOAPPLY_CONFIG.SETTINGS_KEY]: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'trackApplication') {
    trackApplication(message.data).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === 'getSessionStatus') {
    const status = canPerformAction();
    sendResponse({
      allowed: status.allowed,
      remaining: status.remaining,
      isOnCooldown: sessionState.isOnCooldown,
      cooldownEndTime: sessionState.cooldownEndTime,
      actionsThisHour: sessionState.actionsThisHour,
      maxActions: AUTOAPPLY_CONFIG.RATE_LIMIT.maxActionsPerHour,
    });
    return true;
  }

  if (message.action === 'checkRateLimit') {
    sendResponse(canPerformAction());
    return true;
  }

  if (message.action === 'recordAction') {
    recordAction();
    chrome.storage.local.get([AUTOAPPLY_CONFIG.STATS_KEY], (result) => {
      const stats = result[AUTOAPPLY_CONFIG.STATS_KEY] || { fieldsFilled: 0, applicationsStarted: 0, sessionsUsed: 0 };
      stats.fieldsFilled++;
      chrome.storage.local.set({ [AUTOAPPLY_CONFIG.STATS_KEY]: stats });
    });
    sendResponse({ success: true });
    return true;
  }
});

const getApiBaseUrl = (callback) => {
  chrome.storage.local.get(['autoapply_api_url'], (result) => {
    callback(result.autoapply_api_url || 'http://localhost:5000');
  });
};

const syncWithBackend = async (userData) => {
  return new Promise((resolve) => {
    getApiBaseUrl(async (baseUrl) => {
      try {
        const response = await fetch(`${baseUrl}/api/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return resolve({ success: false, error: 'Failed to sync with backend' });
        }

        const profile = await response.json();
        
        const mergedData = {
          name: profile.name || userData.name || '',
          email: profile.email || userData.email || '',
          phone: profile.phone || userData.phone || '',
          linkedin: profile.linkedin_url || userData.linkedin || '',
          coverLetter: userData.coverLetter || '',
        };
        
        await chrome.storage.local.set({
          [AUTOAPPLY_CONFIG.USER_DATA_KEY]: mergedData,
        });

        resolve({ success: true, synced: true, data: mergedData });
      } catch (error) {
        console.error('[AutoApply] Sync error:', error);
        resolve({ success: false, error: error.message });
      }
    });
  });
};

const trackApplication = async (applicationData) => {
  recordAction();
  
  return new Promise((resolve) => {
    getApiBaseUrl(async (baseUrl) => {
      try {
        const response = await fetch(`${baseUrl}/api/applications/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_url: applicationData.jobUrl,
            job_title: applicationData.jobTitle,
            company: applicationData.company,
            status: applicationData.status || 'started',
            source: 'extension',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to track application');
        }

        const result = await response.json();

        chrome.storage.local.get([AUTOAPPLY_CONFIG.STATS_KEY], (res) => {
          const stats = res[AUTOAPPLY_CONFIG.STATS_KEY] || { fieldsFilled: 0, applicationsStarted: 0, sessionsUsed: 0 };
          stats.applicationsStarted++;
          chrome.storage.local.set({ [AUTOAPPLY_CONFIG.STATS_KEY]: stats });
        });

        resolve({ success: true, applicationId: result.application?.id });
      } catch (error) {
        console.error('[AutoApply] Track error:', error);
        
        chrome.storage.local.get(['pendingApplications'], (res) => {
          const pending = res.pendingApplications || [];
          pending.push({
            ...applicationData,
            timestamp: Date.now(),
          });
          chrome.storage.local.set({ pendingApplications: pending });
        });
        
        resolve({ success: false, error: error.message, queued: true });
      }
    });
  });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const jobPatterns = [
      /linkedin\.com\/jobs/,
      /naukri\.com/,
      /indeed\.com/,
      /glassdoor\.com/,
      /monster\.com/,
    ];

    const isJobPage = jobPatterns.some(pattern => pattern.test(tab.url));

    if (isJobPage) {
      chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }).catch(() => {});
    }
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'showPanel' }).catch(() => {
    console.log('[AutoApply] Could not show panel');
  });
});

setInterval(() => {
  initializeSession();
}, 60000);

console.log('[AutoApply AI] Background service worker loaded');