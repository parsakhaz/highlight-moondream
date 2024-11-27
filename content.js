// Add at the beginning of the file
let isHighlightingEnabled = true;
let hasInitialized = false;

// Function to check if element is in viewport
function isInViewport(element) {
	const rect = element.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

// Function to get visible text nodes
function getVisibleTextNodes(root = document.body) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: function (node) {
			// Skip empty text nodes and nodes in hidden elements
			if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;

			const parent = node.parentElement;
			if (!parent) return NodeFilter.FILTER_REJECT;

			// Skip if parent is hidden or is a script/style/etc
			if (parent.tagName.match(/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE|MARK)$/)) {
				return NodeFilter.FILTER_REJECT;
			}

			// Skip if parent or any ancestor is hidden
			let element = parent;
			while (element) {
				const style = window.getComputedStyle(element);
				if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
					return NodeFilter.FILTER_REJECT;
				}
				element = element.parentElement;
			}

			return NodeFilter.FILTER_ACCEPT;
		},
	});

	const nodes = [];
	let node;
	while ((node = walker.nextNode())) {
		if (isInViewport(node.parentElement)) {
			nodes.push(node);
		}
	}
	return nodes;
}

// Function to highlight text nodes
function highlightText(node) {
	if (!isHighlightingEnabled) return;

	try {
		const text = node.textContent;
		const match = text.match(regex);
		if (match) {
			const span = document.createElement('span');
			span.innerHTML = text.replace(regex, '$1<mark>$2</mark>$3');
			node.replaceWith(span);
		}
	} catch (error) {
		console.error('Error highlighting text:', error);
	}
}

// Function to highlight visible content
function highlightVisibleContent() {
	if (!isHighlightingEnabled) return;

	const visibleNodes = getVisibleTextNodes();
	visibleNodes.forEach(highlightText);
}

// Initialize highlighting
async function initializeHighlighting() {
	if (hasInitialized) return;

	const isEnabled = await checkDomainStatus();
	if (isEnabled) {
		highlightVisibleContent();
	}
	hasInitialized = true;
}

// Update the message listener
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

		sendResponse({ success: true });
	}
	return true;
});

// Set up initial highlighting
document.addEventListener('DOMContentLoaded', initializeHighlighting);

// If DOMContentLoaded already fired, initialize immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	initializeHighlighting();
}

// Throttled scroll handler
let scrollTimeout;
window.addEventListener('scroll', () => {
	if (!isHighlightingEnabled) return;

	if (scrollTimeout) {
		clearTimeout(scrollTimeout);
	}

	scrollTimeout = setTimeout(() => {
		highlightVisibleContent();
	}, 150); // Adjust this value based on performance needs
});

// List of terms to highlight
const terms = [
	// Core Moondream terms
	'moondream',
	'moon dream',
	'moon-dream',
	'MoonDream',

	// Vision Language Models
	'vision language model',
	'vision-language model',
	'vision language models',
	'vision-language models',
	'VLM',
	'VLMs',
	'Vision AI',
	'vision model',
	'vision models',
	'visual language model',
	'visual language models',
	'visual-language model',
	'visual-language models',
	'small language model',
	'small-language model',
	'small language models',
	'small-language models',
	'SLM',
	'SLMs',
	'vision capabilities',
	'vision capability',
	'visual capabilities',
	'visual capability',

	// Related Vision AI terms
	'multimodal AI',
	'multi-modal AI',
	'multimodal model',
	'multi-modal model',
	'multimodal models',
	'multi-modal models',
	'image understanding',
	'visual reasoning',
	'visual recognition',
	'computer vision',
	'CV model',
	'CV models',
	'image recognition',
	'image analysis',
	'visual AI',
	'Visual AI',
	'vision intelligence',
	'visual intelligence',
	'vision transformer',
	'vision transformers',
	'ViT',
	'ViTs',

	// Similar models/companies
	'GPT-4V',
	'GPT4V',
	'GPT4 Vision',
	'GPT-4 Vision',
	'Claude Vision',
	'Claude 3',
	'Claude3',
	'Claude-3',
	'Gemini Vision',
	'Gemini Pro Vision',
	'DALL-E',
	'DALL·E',
	'DALLE',
	'Dall-E',
	'Midjourney',
	'Stable Diffusion',
	'StableDiffusion',
	'Stable-Diffusion',

	// Additional AI Vision terms
	'image-to-text',
	'image to text',
	'text-to-image',
	'text to image',
	'image captioning',
	'visual question answering',
	'VQA',
	'visual grounding',
	'scene understanding',
	'object detection',
	'image segmentation',
	'visual reasoning',
	'visual chat',
	'visual conversation',
	'image understanding',
	'vision understanding',
	'visual perception',
	'visual processing',

	// Research/Technical terms
	'foundation model',
	'foundation models',
	'large vision model',
	'large vision models',
	'LVM',
	'LVMs',
	'multimodal transformer',
	'multi-modal transformer',
	'visual encoder',
	'visual decoder',
	'vision encoder',
	'vision decoder',

	// Additional variations
	'visual foundation model',
	'visual foundation models',
	'vision foundation model',
	'vision foundation models',
	'image model',
	'image models',
	'visual AI model',
	'visual AI models',
	'vision AI model',
	'vision AI models',

	// Common abbreviations
	'CV/AI',
	'AI vision',
	'AI/ML vision',
	'ML vision',

	// Research frameworks
	'visual bert',
	'visualbert',
	'visual-bert',
	'CLIP',
	'OpenCLIP',
	'Open-CLIP',
];

// Function to escape special characters for RegExp
function escapeRegExp(string) {
	return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

// Create a regex to match any of the terms, case-insensitive
const regex = new RegExp(`(^|[^a-zA-Z])(${terms.map(escapeRegExp).join('|')})(\\s|$|[.,!?;:)]|[^a-zA-Z])`, 'gi');

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
		marks.forEach((mark) => {
			const text = mark.textContent;
			mark.replaceWith(text);
		});

		// Clear the highlighted status from containers
		const containers = document.querySelectorAll('.highlighted');
		containers.forEach((container) => {
			container.classList.remove('highlighted');
		});
	} catch (error) {
		console.error('Error removing highlights:', error);
	}
}