# AutoApply AI - Chrome Extension

Smart job application assistant that helps autofill forms on LinkedIn, Naukri, and other job sites safely.

## Features

### Autofill Engine
- **Dynamic Field Detection**: Automatically detects form fields (name, email, phone, resume)
- **Human-like Typing**: Simulates realistic typing with random delays (30-80ms per character)
- **Multi-site Support**: LinkedIn, Naukri, Indeed, Glassdoor, Monster

### Behavior Layer
- **Random Delays**: Pre-configured delays between actions (300-1000ms)
- **Scroll Simulation**: Human-like scrolling patterns before filling
- **Mouse Movement**: Simulates mouse hover before interactions

### Apply Flow
- **Autofill Only**: Fills forms without auto-submitting
- **Highlight Submit**: Visually highlights the apply button for user confirmation
- **User Control**: Always waits for user action to complete submission

### Session Control
- **Rate Limiting**: Max 20 actions per hour
- **Cooldown System**: 30-minute cooldown after 18 actions
- **Visual Feedback**: Badge shows remaining actions

### Backend Sync
- **Profile Sync**: Fetches user data from backend API
- **Application Logging**: Tracks applications to backend

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder

## Usage

1. **Configure Profile**: Click the extension icon and enter your:
   - Full Name
   - Email
   - Phone
   - LinkedIn URL
   - Default Cover Letter
2. **Save Profile**: Click "Save Profile"
3. **Navigate to Job Page**: Visit a job listing on supported sites
4. **Autofill**: Click the floating button or use popup to autofill
5. **Review & Submit**: Verify filled data and click submit manually

## File Structure

```
extension/
├── manifest.json      # Manifest v3 configuration
├── background.js      # Service worker (session control, API sync)
├── content.js         # Content script (autofill, UI)
├── popup.html         # Popup UI
├── popup.js           # Popup logic
└── icons/
    └── icon16.svg     # Extension icon
```

## Permissions

- `activeTab`: Access current tab
- `storage`: Store user data locally
- `scripting`: Execute content scripts

## Host Permissions

- `*.linkedin.com/*`
- `*.naukri.com/*`
- `*.indeed.com/*`
- `*.glassdoor.com/*`
- `*.monster.com/*`

## Security Notes

- No auto-submission - user always reviews before applying
- Rate limiting prevents aggressive automation
- Local storage only - no sensitive data transmitted
- Designed for human-assisted flow