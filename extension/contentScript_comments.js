const COMMENT_MODERATION_API = 'http://127.0.0.1:3000/moderation/analyzeComment';

let moderationActive = true;

console.log("SafeSpace Lite Twitter comment moderation script loaded!");

// Helper: Encode string to base64 for cache keys
function base64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode('0x' + p1)
  ));
}



function getCachedResult(text) {
    const CLIENT_CACHE_KEY_PREFIX = 'SafeSpaceLite_Toxicity_';
  const key = CLIENT_CACHE_KEY_PREFIX + base64EncodeUnicode(text);
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setCachedResult(text, result) {
  const key = CLIENT_CACHE_KEY_PREFIX + base64EncodeUnicode(text);
  const data = {
    cachedAt: Date.now(),
    result,
  };
  localStorage.setItem(key, JSON.stringify(data));
}

function isCacheValid(data) {
  if (!data || !data.cachedAt) return false;
  const ageMs = Date.now() - data.cachedAt;
  return ageMs < 24 * 60 * 60 * 1000; // Valid 1 day
}

// Extract comment text from Twitter tweetText span
function extractCommentText(commentElem) {
  return commentElem?.innerText?.trim() || '';
}

// Create colored dot icon with optional alert symbol
function createStatusIcon(color, title, isAlert = false) {
  const icon = document.createElement('span');
  icon.style.display = 'inline-flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.width = '16px';
  icon.style.height = '16px';
  icon.style.borderRadius = '50%';
  icon.style.backgroundColor = color;
  icon.style.color = 'white';
  icon.style.fontWeight = 'bold';
  icon.style.fontSize = '12px';
  icon.style.marginLeft = '6px';
  icon.title = title;
  icon.className = 'toxicity-status-icon';
  icon.style.userSelect = 'none';
  if (isAlert) icon.textContent = '!';
  return icon;
}

// Add or update colored dot icon next to comment
function updateCommentStatusIcon(commentElem, rating) {
  const existingIcon = commentElem.parentNode.querySelector('.toxicity-status-icon');
  if (existingIcon) existingIcon.remove();

  const isToxic = rating > 7;
  const color = isToxic ? 'red' : 'green';
  const title = isToxic ? 'Harassment comment detected' : 'Comment looks clean';

  const icon = createStatusIcon(color, title, isToxic);
  commentElem.parentNode.insertBefore(icon, commentElem.nextSibling);
}

// Show loading indicator for comment
function applyCommentLoadingUI(commentElem) {
  commentElem.style.opacity = '0.6';
  commentElem.dataset.safespaceLoading = 'true';
}

// Update comment UI with moderation results including blur and icon
function applyCommentUI(commentElem, rating) {
  commentElem.style.opacity = '1';
  commentElem.dataset.safespaceLoading = 'false';
  commentElem.style.border = '';

  updateCommentStatusIcon(commentElem, rating);

  const commentContainer = commentElem.closest('div[data-testid="tweetText"]');
  if (commentContainer) {
    if (rating > 7) {
      commentContainer.style.filter = 'blur(7px)';
      commentContainer.style.transition = 'filter 0.3s ease';
      commentContainer.title = 'This comment contains potentially harmful content and is blurred';
    } else {
      commentContainer.style.filter = '';
      commentContainer.title = commentElem.title;
    }
  }
}

// Moderate a single comment element by sending it to backend
async function moderateCommentElement(commentElem) {
  if (!moderationActive) return;
  const commentText = extractCommentText(commentElem);
  if (!commentText) return;

  const cachedData = getCachedResult(commentText);
  if (cachedData && isCacheValid(cachedData)) {
    applyCommentUI(commentElem, cachedData.result.rating);
    return;
  }

  applyCommentLoadingUI(commentElem);

  try {
    const res = await fetch(COMMENT_MODERATION_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });
    if (!res.ok) {
      console.error('Comment moderation API error:', res.status);
      return;
    }
    const data = await res.json();
    if (data.rating !== undefined) {
      setCachedResult(commentText, data);
      applyCommentUI(commentElem, data.rating);
    }
  } catch (err) {
    console.error('Error moderating comment:', err);
  }
}

// Scan first 5 unprocessed comments on the page
async function scanCommentsInitial() {
  const comments = Array.from(document.querySelectorAll(
    'div[data-testid="tweetText"] > span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3'
  )).slice(0, 10);

  for (const commentElem of comments) {
    if (commentElem.dataset.safespaceLoading === 'true' || commentElem.dataset.safespaceProcessed === 'true') continue;
    await moderateCommentElement(commentElem);
    commentElem.dataset.safespaceProcessed = 'true';
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runCommentModeration') {
    moderationActive = true;
    scanCommentsInitial();
    sendResponse({ result: 'Comment Moderation started.' });
    return true;
  }
  if (request.action === 'stopModeration') {
    moderationActive = false;
    sendResponse({ result: 'Moderation stopped.' });
    return true;
  }
});

// Observe DOM for new comments added dynamically
const commentObserver = new MutationObserver(mutations => {
  if (!moderationActive) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (
        node.nodeType === 1 &&
        node.matches('div[data-testid="tweetText"] > span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3')
      ) {
        scanCommentsInitial();
        return;
      }
    }
  }
});

commentObserver.observe(document.body, { childList: true, subtree: true });
