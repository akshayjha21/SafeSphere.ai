const MODERATION_API = 'http://127.0.0.1:3000/moderation/analyzeComment';

console.log("SafeSpace Lite content script loaded!");

// Create icon element with color and tooltip
function createStatusIcon(color, title) {
  const icon = document.createElement('span');
  icon.style.display = 'inline-block';
  icon.style.width = '14px';
  icon.style.height = '14px';
  icon.style.borderRadius = '50%';
  icon.style.backgroundColor = color;
  icon.style.marginLeft = '8px';
  icon.title = title;
  icon.className = 'toxicity-status-icon';
  return icon;
}

function createLoadingIcon() {
  const icon = document.createElement('span');
  icon.className = 'toxicity-loading-icon';
  icon.style.display = 'inline-block';
  icon.style.width = '14px';
  icon.style.height = '14px';
  icon.style.borderRadius = '50%';
  icon.style.marginLeft = '8px';
  icon.style.border = '2px solid #ccc';
  icon.style.borderTop = '2px solid #333';
  icon.style.animation = 'spin 1s linear infinite';
  icon.title = 'Checking for toxicity...';
  return icon;
}

// Add keyframes for spinner animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
.toxicity-loading-icon {
  box-sizing: border-box;
}
`;
document.head.appendChild(style);

function updateStatusIcon(row, rating) {
  let existingIcon = row.querySelector('.toxicity-status-icon, .toxicity-loading-icon');
  if (existingIcon) {
    existingIcon.remove();
  }

  const color = getColorByRating(rating);
  const icon = createStatusIcon(color, `Toxicity rating: ${rating}`);

  const lastTd = row.querySelector('td:last-child');
  if (lastTd) {
    lastTd.appendChild(icon);
  }
}

function getColorByRating(rating) {
  if (rating > 7) return 'red';
  if (rating > 4) return 'yellow';
  return 'green';
}

function extractEmailText(row) {
  const subject = row.querySelector('.bog')?.innerText || '';
  const snippet = row.querySelector('.y2')?.innerText || '';
  return (subject + ' ' + snippet).trim();
}

// UTF-8 safe base64 encoding
function base64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode('0x' + p1)
    )
  );
}

const CLIENT_CACHE_KEY_PREFIX = 'SafeSpaceLite_ToxicityResult_';

function getCachedResult(text) {
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
  return ageMs < 300; // 1 day
}

async function moderateRow(row) {
  const emailText = extractEmailText(row);
  if (!emailText) return;

  // Check client cache
  const cachedData = getCachedResult(emailText);
  if (cachedData && isCacheValid(cachedData)) {
    updateStatusIcon(row, cachedData.result.rating);
    return;
  }

  // Show loading spinner icon
  let existingIcon = row.querySelector('.toxicity-status-icon, .toxicity-loading-icon');
  if (existingIcon) {
    existingIcon.remove();
  }
  const lastTd = row.querySelector('td:last-child');
  if (lastTd) {
    lastTd.appendChild(createLoadingIcon());
  }

  try {
    const res = await fetch(MODERATION_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: emailText }),
    });
    if (!res.ok) {
      console.error('API response not OK:', res.status, await res.text());
      return;
    }
    const data = await res.json();
    if (data.rating !== undefined) {
      setCachedResult(emailText, data);
      updateStatusIcon(row, data.rating);
    }
  } catch (err) {
    console.error('Moderation API error:', err);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Sequentially scan and moderate emails (limit 5 emails per scan)
async function scanInboxSequential() {
  const rows = Array.from(document.querySelectorAll('tr.zA')).slice(0, 5);
  for (const row of rows) {
    if (!row.querySelector('.toxicity-status-icon') && !row.querySelector('.toxicity-loading-icon')) {
      await moderateRow(row);
      await delay(500);
    }
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "runModerationCheck") {
    scanInboxSequential().then(() => {
      sendResponse({ result: "Moderation completed." });
    });
    return true; // Async response
  }
});

// Observe inbox changes and rerun scan
const observer = new MutationObserver(() => {
  scanInboxSequential();
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial scan on load
scanInboxSequential();
