import "./popup.scss";

/**
 * Popup Script: Manages the extension's popup UI and user interactions
 * Responsibilities:
 * - Displays and updates video detection status
 * - Handles shortcut key customization
 * - Controls filter intensity slider
 * - Manages extension enable/disable toggle
 */

// ===== Initialization =====
// Query current tab for video status
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  // ===== UI Elements =====
  const status = document.getElementById('status');
  const shortcutContainer = document.getElementById('shortcut-container');
  const shortcutKey = document.getElementById('shortcut-key');
  const intensityContainer = document.getElementById('intensity-container');
  const intensitySlider = document.getElementById('filter-intensity');
  const intensityValue = document.getElementById('intensity-value');
  const enableSwitch = document.getElementById('enableSwitch');
  const mainView = document.getElementById('mainView');
  const donateView = document.getElementById('donateView');
  const supportButton = document.getElementById('supportButton');
  const backButton = document.querySelector('.back-button');
  
  // Updated filter type dropdown elements
  const filterSelect = document.getElementById('filter-type');
  const filterSelectItems = filterSelect.nextElementSibling;
  
  const autoFilterSwitch = document.getElementById('autoFilterSwitch');
  const settingsButton = document.getElementById('settingsButton');
  const settingsView = document.getElementById('settingsView');
  const settingsBackButton = document.querySelector('#settingsView .back-button');
  
  // Keyboard layout dropdown elements
  const keyboardLayoutSelect = document.getElementById('keyboard-layout');
  const keyboardLayoutItems = keyboardLayoutSelect.nextElementSibling;
  
  // Add to UI elements section
  const resetKey = document.getElementById('reset-key');
  
  // ===== Event Handlers =====
  // Add intensity slider handler
  intensitySlider.addEventListener('input', () => {
    const value = intensitySlider.value;
    intensityValue.textContent = `${value}%`;
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_FILTER_INTENSITY',
      intensity: parseInt(value)
    });
  });

  // Filter type dropdown handler
  filterSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    filterSelectItems.classList.toggle('hidden');
    // Hide the currently selected option
    const currentValue = filterSelect.textContent;
    filterSelectItems.querySelectorAll('.select-item').forEach(item => {
      if (item.textContent === currentValue) {
        item.style.display = 'none';
      } else {
        item.style.display = 'block';
        item.style.background = 'var(--bg-color)';
      }
    });
  });

  // Handle filter type selection
  filterSelectItems.querySelectorAll('.select-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = item.dataset.value;
      filterSelect.textContent = value;
      filterSelectItems.classList.add('hidden');
      // Reset display of all items
      filterSelectItems.querySelectorAll('.select-item').forEach(i => {
        i.style.display = 'block';
      });
      chrome.runtime.sendMessage({ 
        type: 'UPDATE_FILTER_TYPE',
        filterType: value
      });
    });
  });

  // Close ALL dropdowns when clicking outside
  document.addEventListener('click', () => {
    filterSelectItems.classList.add('hidden');
    keyboardLayoutItems.classList.add('hidden');
  });

  console.log('[Popup] Opened for tab:', tab?.id);
  
  if (!tab) {
    status.textContent = 'Unable to determine video status';
    return;
  }

  // ===== Message Listeners =====
  // Listen for video status updates
  chrome.runtime.onMessage.addListener((message) => {
    console.log('[Popup] Received message:', message);
    
    if (message.tabId === tab.id) {
      console.log('[Popup] Message matches current tab');
      
      if (message.type === 'VIDEO_DETECTED') {
        console.log('[Popup] Updating status: Video detected');
        status.textContent = 'Video detected in this page';
        shortcutContainer.classList.remove('hidden');
        intensityContainer.classList.remove('hidden');
      } else if (message.type === 'VIDEO_STATUS_CHANGED' && !message.hasVideo) {
        console.log('[Popup] Updating status: No video');
        status.textContent = 'No video detected in this page';
        shortcutContainer.classList.add('hidden');
        intensityContainer.classList.add('hidden');
      }
    }
  });

  // ===== Shortcut Key Management =====
  // Get current shortcut from background
  console.log('[Popup] Requesting current shortcut');
  chrome.runtime.sendMessage({ type: 'GET_SHORTCUT' }, (response) => {
    console.log('[Popup] Received shortcut response:', response);
    
    if (chrome.runtime.lastError) {
      console.log('[Popup] Error getting shortcut:', chrome.runtime.lastError);
      shortcutKey.textContent = ',';  // fallback to default
      return;
    }
    if (response?.key) {
      shortcutKey.textContent = response.key;
    }
  });

  // Handle shortcut key changes
  shortcutKey.addEventListener('click', () => {
    shortcutKey.classList.add('listening');
    shortcutKey.textContent = 'key'; // Shorter message

    // One-time keyboard listener
    const keyHandler = (e) => {
      e.preventDefault();
      
      if (e.key === 'Escape') {
        // Cancel shortcut change, revert to current shortcut
        chrome.runtime.sendMessage({ type: 'GET_SHORTCUT' }, (response) => {
          shortcutKey.textContent = response?.key || ',';
        });
        shortcutKey.classList.remove('listening');
        document.removeEventListener('keydown', keyHandler);
        return;
      }

      const newKey = e.key.toLowerCase();
      
      // Update UI immediately
      shortcutKey.textContent = newKey;
      shortcutKey.classList.remove('listening');

      // Inform background to update shortcut
      chrome.runtime.sendMessage({ 
        type: 'UPDATE_SHORTCUT',
        key: newKey
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('[Popup] Error updating shortcut:', chrome.runtime.lastError);
          // Get current shortcut from background if update fails
          chrome.runtime.sendMessage({ type: 'GET_SHORTCUT' }, (response) => {
            if (response?.key) {
              shortcutKey.textContent = response.key;
            } else {
              shortcutKey.textContent = ',';  // fallback to default
            }
          });
        }
      });

      // Remove listener
      document.removeEventListener('keydown', keyHandler);
    };

    document.addEventListener('keydown', keyHandler);
  });

  // ===== Initial State Setup =====
  // Get initial status from background
  console.log('[Popup] Requesting initial video status');
  chrome.runtime.sendMessage({ 
    type: 'GET_VIDEO_STATUS',
    tabId: tab.id 
  }, (response) => {
    console.log('[Popup] Received status response:', response);
    
    if (chrome.runtime.lastError) {
      console.log('[Popup] Error getting status:', chrome.runtime.lastError);
      status.textContent = 'Unable to determine video status';
      return;
    }
    
    if (response?.hasVideo) {
      console.log('[Popup] Initial status: Video detected');
      status.textContent = 'Video detected in this page';
      shortcutContainer.classList.remove('hidden');
      intensityContainer.classList.remove('hidden');
    } else {
      console.log('[Popup] Initial status: No video');
      status.textContent = 'No video detected in this page';
      shortcutContainer.classList.add('hidden');
      intensityContainer.classList.add('hidden');
    }
  });

  // Get initial intensity value
  chrome.runtime.sendMessage({ type: 'GET_FILTER_INTENSITY' }, (response) => {
    if (response?.intensity) {
      intensitySlider.value = response.intensity;
      intensityValue.textContent = `${response.intensity}%`;
    }
  });

  // Get initial auto-filter state
  console.log('[Popup] Requesting initial auto-filter state');
  chrome.runtime.sendMessage({ type: 'GET_FILTER_ON_DETECTION' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Popup] Error getting auto-filter state:', chrome.runtime.lastError.message);
      return;
    }
    autoFilterSwitch.checked = response.autoFilter ?? false;
  });

  // ===== Extension State Management =====
  // Load initial extension enabled state and show/hide UI accordingly
  chrome.runtime.sendMessage({ type: 'GET_IS_ENABLED' }, (response) => {
    enableSwitch.checked = response.isEnabled ?? true;
    if (response.isEnabled) {
      status.classList.remove('hidden');
    }
  });
  
  // Handle enable/disable switch
  enableSwitch.addEventListener('change', (e) => {
    console.log('[Popup] Switch toggled:', e.target.checked);
    if (!e.target.checked) {
      status.classList.add('hidden');
      shortcutContainer.classList.add('hidden');
      intensityContainer.classList.add('hidden');
    } else {
      status.classList.remove('hidden');
    }
    chrome.runtime.sendMessage({ 
      type: 'TOGGLE_EXTENSION',
      enabled: e.target.checked 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Popup] Toggle error:', chrome.runtime.lastError);
        return;
      }
      console.log('[Popup] Extension toggled response:', response);
    });
  });

  // ===== Settings View Management =====
  // Handle settings button click
  settingsButton.addEventListener('click', () => {
    console.log('[Popup] Opening settings view');
    mainView.classList.remove('active');
    settingsView.classList.add('active');
    
    // Get current auto-filter state
    chrome.runtime.sendMessage({ type: 'GET_FILTER_ON_DETECTION' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Popup] Auto-filter toggle error:', chrome.runtime.lastError.message);
        return;
      }
      autoFilterSwitch.checked = response.autoFilter ?? false;
    });

    // Get current keyboard layout
    chrome.runtime.sendMessage({ type: 'POPUP_GET_KEYBOARD_LAYOUT' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Popup] Keyboard layout get error:', chrome.runtime.lastError.message);
        return;
      }
      keyboardLayoutSelect.textContent = response.layout;
    });

    // Get current reset key
    chrome.runtime.sendMessage({ type: 'GET_RESET_KEY' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Popup] Reset key get error:', chrome.runtime.lastError.message);
        return;
      }
      resetKey.textContent = response.key;
    });
  });

  // Handle settings back button
  settingsBackButton.addEventListener('click', () => {
    console.log('[Popup] Closing settings view');
    settingsView.classList.remove('active');
    mainView.classList.add('active');
  });

  // Handle auto-filter toggle
  autoFilterSwitch.addEventListener('change', (e) => {
    console.log('[Popup] Auto-filter toggled:', e.target.checked);
    chrome.runtime.sendMessage({ 
      type: 'TOGGLE_FILTER_ON_DETECTION',
      enabled: e.target.checked 
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Popup] Auto-filter toggle error:', chrome.runtime.lastError.message);
      }
    });
  });

  // Keyboard layout dropdown handler
  keyboardLayoutSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    keyboardLayoutItems.classList.toggle('hidden');
    // Hide the currently selected option
    const currentValue = keyboardLayoutSelect.textContent;
    keyboardLayoutItems.querySelectorAll('.select-item').forEach(item => {
      if (item.dataset.value === currentValue) {
        item.style.display = 'none';
      } else {
        item.style.display = 'block';
        item.style.background = 'var(--bg-color)';
      }
    });
  });

  // Handle keyboard layout selection
  keyboardLayoutItems.querySelectorAll('.select-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = item.dataset.value;
      keyboardLayoutSelect.textContent = value;
      keyboardLayoutItems.classList.add('hidden');
      // Reset display of all items
      keyboardLayoutItems.querySelectorAll('.select-item').forEach(i => {
        i.style.display = 'block';
      });
      chrome.runtime.sendMessage({ 
        type: 'POPUP_UPDATE_KEYBOARD_LAYOUT',
        layout: value
      });
    });
  });

  // ===== Support View Management =====
  // Handle support button click
  supportButton.addEventListener('click', () => {
    console.log('[Popup] Opening support view');
    mainView.classList.remove('active');
    donateView.classList.add('active');
  });

  // Handle back button click
  backButton.addEventListener('click', () => {
    console.log('[Popup] Closing support view');
    donateView.classList.remove('active');
    mainView.classList.add('active');
  });

  // Get initial filter type
  chrome.runtime.sendMessage({ type: 'GET_FILTER_TYPE' }, (response) => {
    if (response?.filterType) {
      filterSelect.textContent = response.filterType;
      filterSelectItems.querySelectorAll('.select-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.value === response.filterType);
      });
    }
  });

  // Add reset key handler
  resetKey.addEventListener('click', () => {
    resetKey.classList.add('listening');
    resetKey.textContent = 'key';

    const keyHandler = (e) => {
      e.preventDefault();
      
      if (e.key === 'Escape') {
        chrome.runtime.sendMessage({ type: 'GET_RESET_KEY' }, (response) => {
          resetKey.textContent = response?.key;
        });
        resetKey.classList.remove('listening');
        document.removeEventListener('keydown', keyHandler);
        return;
      }

      const newKey = e.key.toLowerCase();
      resetKey.textContent = newKey;
      resetKey.classList.remove('listening');

      chrome.runtime.sendMessage({ 
        type: 'UPDATE_RESET_KEY',
        key: newKey
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('[Popup] Error updating reset key:', chrome.runtime.lastError);
          chrome.runtime.sendMessage({ type: 'GET_RESET_KEY' }, (response) => {
            resetKey.textContent = response?.key;
          });
        }
      });

      document.removeEventListener('keydown', keyHandler);
    };

    document.addEventListener('keydown', keyHandler);
  });
}); 