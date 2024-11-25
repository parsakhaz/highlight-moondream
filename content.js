// Add at the beginning of the file
let isHighlightingEnabled = true;
let hasInitialized = false;

// Check if highlighting is enabled for this domain
async function checkDomainStatus() {
  try {
    const domain = window.location.hostname;
    const { disabledDomains = [] } = await chrome.storage.sync.get('disabledDomains');
    isHighlightingEnabled = !disabledDomains.includes(domain);
    
    // If highlighting is disabled, remove existing highlights
    if (!isHighlightingEnabled) {
      removeHighlights();
    }
    return isHighlightingEnabled;
  } catch (error) {
    console.error('Error checking domain status:', error);
    return true; // Default to enabled on error
  }
}

// Function to remove all highlights
function removeHighlights() {
  try {
    const marks = document.querySelectorAll('mark');
    marks.forEach(mark => {
      const text = mark.textContent;
      mark.replaceWith(text);
    });
    
    // Clear the highlighted status from containers
    const containers = document.querySelectorAll('.highlighted');
    containers.forEach(container => {
      container.classList.remove('highlighted');
    });
  } catch (error) {
    console.error('Error removing highlights:', error);
  }
}

// Function to initialize highlighting
async function initializeHighlighting() {
  if (hasInitialized) return;
  
  const isEnabled = await checkDomainStatus();
  if (isEnabled) {
    observeTextContainers();
  }
  hasInitialized = true;
}

// Update the message listener to handle toggle more robustly
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggleHighlighting') {
    isHighlightingEnabled = message.isEnabled;
    hasInitialized = false; // Reset initialization flag
    
    if (isHighlightingEnabled) {
      removeHighlights(); // Clear existing highlights first
      initializeHighlighting(); // Re-initialize highlighting
    } else {
      removeHighlights();
    }
    
    sendResponse({ success: true }); // Acknowledge receipt of message
  }
  return true; // Keep message channel open for async response
});

// Update the initial setup
document.addEventListener('DOMContentLoaded', initializeHighlighting);

// If DOMContentLoaded already fired, initialize immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeHighlighting();
}

// List of terms to highlight
const terms = [
  // Core Moondream terms
  "moondream",
  "moon dream",
  "moon-dream",
  "MoonDream",
  
  // Vision Language Models
  "vision language model",
  "vision-language model",
  "vision language models",
  "vision-language models",
  "VLM",
  "VLMs",
  "Vision AI",
  "vision model",
  "vision models",
  "visual language model",
  "visual language models",
  "visual-language model",
  "visual-language models",
  "small language model",
  "small-language model",
  "small language models", 
  "small-language models",
  "SLM",
  "SLMs",
  "vision capabilities",
  "vision capability",
  "visual capabilities",
  "visual capability",
  
  // Related Vision AI terms
  "multimodal AI",
  "multi-modal AI",
  "multimodal model",
  "multi-modal model",
  "multimodal models",
  "multi-modal models",
  "image understanding",
  "visual reasoning",
  "visual recognition",
  "computer vision",
  "CV model",
  "CV models",
  "image recognition",
  "image analysis",
  "visual AI",
  "Visual AI",
  "vision intelligence",
  "visual intelligence",
  "vision transformer",
  "vision transformers",
  "ViT",
  "ViTs",
  
  // Similar models/companies
  "GPT-4V",
  "GPT4V",
  "GPT4 Vision",
  "GPT-4 Vision",
  "Claude Vision",
  "Claude 3",
  "Claude3",
  "Claude-3",
  "Gemini Vision",
  "Gemini Pro Vision",
  "DALL-E",
  "DALL·E",
  "DALLE",
  "Dall-E",
  "Midjourney",
  "Stable Diffusion",
  "StableDiffusion",
  "Stable-Diffusion",
  
  // Additional AI Vision terms
  "image-to-text",
  "image to text",
  "text-to-image",
  "text to image",
  "image captioning",
  "visual question answering",
  "VQA",
  "visual grounding",
  "scene understanding",
  "object detection",
  "image segmentation",
  "visual reasoning",
  "visual chat",
  "visual conversation",
  "image understanding",
  "vision understanding",
  "visual perception",
  "visual processing",
  
  // Research/Technical terms
  "foundation model",
  "foundation models",
  "large vision model",
  "large vision models",
  "LVM",
  "LVMs",
  "multimodal transformer",
  "multi-modal transformer",
  "visual encoder",
  "visual decoder",
  "vision encoder",
  "vision decoder",
  
  // Additional variations
  "visual foundation model",
  "visual foundation models",
  "vision foundation model",
  "vision foundation models",
  "image model",
  "image models",
  "visual AI model",
  "visual AI models",
  "vision AI model",
  "vision AI models",
  
  // Common abbreviations
  "CV/AI",
  "AI vision",
  "AI/ML vision",
  "ML vision",
  
  // Research frameworks
  "visual bert",
  "visualbert",
  "visual-bert",
  "CLIP",
  "OpenCLIP",
  "Open-CLIP"
];

// Function to escape special characters for RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

// Create a regex to match any of the terms, case-insensitive
const regex = new RegExp(
  `(^|[^a-zA-Z])(${terms.map(escapeRegExp).join('|')})(\\s|$|[.,!?;:)]|[^a-zA-Z])`
, 'gi');

// Helper function to check if an element is visible
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetParent !== null;
}

// Function to highlight text nodes
function highlightText(node) {
  if (!isHighlightingEnabled) return;
  
  try {
    // Skip if node is invalid or in excluded elements
    if (!node || !node.parentElement) return;
    
    // Skip if parent element is not visible
    if (!isVisible(node.parentElement)) return;
    
    // Skip highlighting in these elements
    const excludedElements = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'MARK', 'CODE', 'PRE'];
    if (excludedElements.includes(node.parentElement.nodeName)) return;
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const match = text.match(regex);
      if (match) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, '$1<mark>$2</mark>$3');
        node.replaceWith(span);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(child => highlightText(child));
    }
  } catch (error) {
    console.error('Error highlighting text:', error);
  }
}

// Function to process visible elements
function processVisibleElements(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      highlightText(entry.target);
      // Unobserve after highlighting to prevent re-processing
      observer.unobserve(entry.target);
    }
  });
}

// Create intersection observer
const intersectionObserver = new IntersectionObserver(processVisibleElements, {
  root: null,
  rootMargin: '100px', // Start loading slightly before elements come into view
  threshold: 0.1
});

// Function to set up intersection observer for text containers
function observeTextContainers() {
  // Common text container elements
  const textContainers = document.querySelectorAll(
    'p, div, article, section, main, h1, h2, h3, h4, h5, h6, li, td, th, span'
  );
  
  textContainers.forEach(container => {
    if (!container.classList.contains('highlighted')) {
      intersectionObserver.observe(container);
      container.classList.add('highlighted');
    }
  });
}

// Function to handle dynamic content
function handleDynamicContent(mutations) {
  try {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // If it's a text container, observe it
          if (node.matches('p, div, article, section, main, h1, h2, h3, h4, h5, h6, li, td, th, span')) {
            if (!node.classList.contains('highlighted')) {
              intersectionObserver.observe(node);
              node.classList.add('highlighted');
            }
          }
          // Also check for text containers within the new node
          const textContainers = node.querySelectorAll(
            'p, div, article, section, main, h1, h2, h3, h4, h5, h6, li, td, th, span'
          );
          textContainers.forEach(container => {
            if (!container.classList.contains('highlighted')) {
              intersectionObserver.observe(container);
              container.classList.add('highlighted');
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in mutation observer:', error);
  }
}

// Observe DOM changes for dynamic content
const mutationObserver = new MutationObserver(handleDynamicContent);

// Configure the mutation observer
mutationObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle dynamic content loaded via AJAX
let lastScrollY = window.scrollY;
let scrollTimeout;

// Throttled scroll handler
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  scrollTimeout = setTimeout(() => {
    if (window.scrollY !== lastScrollY) {
      observeTextContainers();
      lastScrollY = window.scrollY;
    }
  }, 100);
}); 