document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadSettings();
  loadApiUrl();
  loadStats();
  updateSessionStatus();
  detectCurrentPage();
  
  document.getElementById('saveBtn').addEventListener('click', saveUserData);
  document.getElementById('syncBtn').addEventListener('click', syncWithBackend);
  document.getElementById('apiUrl').addEventListener('change', saveApiUrl);
  
  document.getElementById('maxActionsPerHour').addEventListener('change', saveSettings);
  document.getElementById('cooldownMinutes').addEventListener('change', saveSettings);
  
  document.getElementById('autofillEnabled').addEventListener('change', saveSettings);
  document.getElementById('showFloatingBtn').addEventListener('change', saveSettings);
  document.getElementById('highlightBtn').addEventListener('change', saveSettings);
});

const loadApiUrl = () => {
  chrome.storage.local.get(['autoapply_api_url'], (result) => {
    document.getElementById('apiUrl').value = result.autoapply_api_url || 'http://localhost:5000';
  });
};

const saveApiUrl = () => {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  chrome.storage.local.set({ autoapply_api_url: apiUrl }, () => {
    showNotification('API URL saved!', 'success');
  });
};

const API_URL = 'http://localhost:5000/api';

const loadUserData = () => {
  chrome.storage.local.get(['autoapply_user_data'], (result) => {
    const data = result.autoapply_user_data || {};
    document.getElementById('name').value = data.name || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('linkedin').value = data.linkedin || '';
    document.getElementById('coverLetter').value = data.coverLetter || '';
  });
};

const saveUserData = () => {
  const userData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    linkedin: document.getElementById('linkedin').value.trim(),
    coverLetter: document.getElementById('coverLetter').value.trim(),
  };
  
  chrome.storage.local.set({ autoapply_user_data: userData }, () => {
    showNotification('Profile saved!', 'success');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'autofill', 
          data: userData 
        }).catch(() => {});
      }
    });
  });
};

const loadSettings = () => {
  chrome.storage.local.get(['autoapply_settings'], (result) => {
    const settings = result.autoapply_settings || {};
    document.getElementById('autofillEnabled').checked = settings.autofillEnabled !== false;
    document.getElementById('showFloatingBtn').checked = settings.showFloatingButton !== false;
    document.getElementById('highlightBtn').checked = settings.highlightSubmitButton !== false;
    document.getElementById('maxActionsPerHour').value = settings.maxActionsPerHour || 20;
    document.getElementById('cooldownMinutes').value = settings.cooldownMinutes || 30;
  });
};

const saveSettings = () => {
  const settings = {
    autofillEnabled: document.getElementById('autofillEnabled').checked,
    showFloatingButton: document.getElementById('showFloatingBtn').checked,
    highlightSubmitButton: document.getElementById('highlightBtn').checked,
    maxActionsPerHour: parseInt(document.getElementById('maxActionsPerHour').value) || 20,
    cooldownMinutes: parseInt(document.getElementById('cooldownMinutes').value) || 30,
  };
  
  chrome.storage.local.set({ autoapply_settings: settings }, () => {
    console.log('[AutoApply] Settings saved');
  });
};

const loadStats = () => {
  chrome.storage.local.get(['autoapply_stats'], (result) => {
    const stats = result.autoapply_stats || { fieldsFilled: 0, applicationsStarted: 0, sessionsUsed: 0 };
    document.getElementById('fieldsFilled').textContent = stats.fieldsFilled || 0;
    document.getElementById('appsStarted').textContent = stats.applicationsStarted || 0;
  });
};

const updateSessionStatus = () => {
  chrome.runtime.sendMessage({ action: 'getSessionStatus' }, (response) => {
    if (response) {
      const remaining = response.maxActions - response.actionsThisHour;
      document.getElementById('actionsRemaining').textContent = remaining;
      
      const rateLimitSection = document.getElementById('rateLimitSection');
      const rateLimitMsg = document.getElementById('rateLimitMsg');
      
      if (response.isOnCooldown) {
        rateLimitSection.style.display = 'block';
        const remainingSecs = Math.ceil((response.cooldownEndTime - Date.now()) / 1000);
        rateLimitMsg.textContent = `⏳ On cooldown. Try again in ${Math.ceil(remainingSecs / 60)} minutes.`;
      } else if (remaining <= 5) {
        rateLimitSection.style.display = 'block';
        rateLimitMsg.textContent = `⚠️ Only ${remaining} actions remaining this hour.`;
        rateLimitMsg.style.background = 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)';
      } else {
        rateLimitSection.style.display = 'none';
      }
    }
  });
};

const detectCurrentPage = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const url = tabs[0].url || '';
      const pageInfo = document.getElementById('currentPage');
      
      if (url.includes('linkedin.com/jobs')) {
        pageInfo.innerHTML = '<strong>LinkedIn Jobs</strong> - Autofill ready';
      } else if (url.includes('naukri.com')) {
        pageInfo.innerHTML = '<strong>Naukri</strong> - Autofill ready';
      } else if (url.includes('indeed.com')) {
        pageInfo.innerHTML = '<strong>Indeed</strong> - Autofill ready';
      } else if (url.includes('glassdoor.com')) {
        pageInfo.innerHTML = '<strong>Glassdoor</strong> - Autofill ready';
      } else if (url.includes('monster.com')) {
        pageInfo.innerHTML = '<strong>Monster</strong> - Autofill ready';
      } else if (url.includes('jobs') || url.includes('career') || url.includes('apply')) {
        pageInfo.innerHTML = '<strong>Job Page Detected</strong> - Checking for forms...';
      } else {
        pageInfo.innerHTML = '<strong>Not a job page</strong> - Visit a job site to use autofill';
      }
    }
  });
};

const syncWithBackend = () => {
  const syncBtn = document.getElementById('syncBtn');
  syncBtn.textContent = 'Syncing...';
  syncBtn.disabled = true;
  
  chrome.runtime.sendMessage({ 
    action: 'syncWithBackend', 
    data: {} 
  }, (response) => {
    syncBtn.disabled = false;
    syncBtn.textContent = 'Sync with Backend';
    
    if (response && response.success) {
      loadUserData();
      showNotification('Synced with backend!', 'success');
    } else {
      showNotification('Sync failed - using local data', 'error');
    }
  });
};

const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#333'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideUp 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(10px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    detectCurrentPage();
    updateSessionStatus();
  }
});

setInterval(updateSessionStatus, 10000);
