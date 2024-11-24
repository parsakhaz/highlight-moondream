// Get current domain and update UI
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function getDomain(url) {
  const domain = new URL(url).hostname;
  return domain;
}

async function updateUI() {
  try {
    const tab = await getCurrentTab();
    const domain = getDomain(tab.url);
    const status = document.getElementById('status');
    const button = document.getElementById('toggleButton');
    
    // Get current disabled state
    const { disabledDomains = [] } = await chrome.storage.sync.get('disabledDomains');
    const isDisabled = disabledDomains.includes(domain);
    
    button.textContent = isDisabled ? 
      'Enable highlighting' : 
      'Disable highlighting';
    button.className = isDisabled ? 'disabled' : 'enabled';
    
    status.textContent = `Current domain: ${domain}`;
  } catch (error) {
    console.error('Error updating UI:', error);
    document.getElementById('status').textContent = 'Error: Could not update status';
  }
}

async function toggleDomain() {
  try {
    const tab = await getCurrentTab();
    const domain = getDomain(tab.url);
    
    // Get current disabled domains
    const { disabledDomains = [] } = await chrome.storage.sync.get('disabledDomains');
    
    // Toggle domain in the list
    const isCurrentlyDisabled = disabledDomains.includes(domain);
    const newDisabledDomains = isCurrentlyDisabled
      ? disabledDomains.filter(d => d !== domain)
      : [...disabledDomains, domain];
    
    // Save updated list
    await chrome.storage.sync.set({ disabledDomains: newDisabledDomains });
    
    // Update UI
    await updateUI();
    
    // Notify content script and wait for response
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: 'toggleHighlighting',
        isEnabled: isCurrentlyDisabled
      });
      
      if (!response?.success) {
        throw new Error('Toggle not acknowledged');
      }
    } catch (error) {
      console.error('Error sending message to content script:', error);
      // Attempt to reload the content script if communication failed
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  } catch (error) {
    console.error('Error toggling domain:', error);
    document.getElementById('status').textContent = 'Error: Could not toggle highlighting';
  }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', updateUI);
document.getElementById('toggleButton').addEventListener('click', toggleDomain); 