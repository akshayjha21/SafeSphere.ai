(function () {
  const IMAGE_MODERATION_API = 'http://127.0.0.1:3000/moderation/analyzeImage';
  let moderationActive = true;

  console.log("SafeSpace Lite Twitter image moderation script loaded!");

  function base64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode('0x' + p1)
    ));
  }

  function getCachedResult(url) {
    const key = 'SafeSpaceLite_ImageModeration_' + base64EncodeUnicode(url);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try { return JSON.parse(cached); } catch { return null; }
  }

  function setCachedResult(url, result) {
    const key = 'SafeSpaceLite_ImageModeration_' + base64EncodeUnicode(url);
    const data = { cachedAt: Date.now(), result };
    localStorage.setItem(key, JSON.stringify(data));
  }

  function isCacheValid(data) {
    return !!(data && data.cachedAt && (Date.now() - data.cachedAt) < 86400000);
  }

  function createStatusIcon(color, title, isAlert = false) {
    const icon = document.createElement('span');
    icon.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${color};
      color: white;
      font-weight: bold;
      font-size: 12px;
      margin-left: 6px;
      user-select: none;
      cursor: default;
    `;
    icon.title = title;
    icon.className = 'image-moderation-status-icon';
    if (isAlert) icon.textContent = '!';
    return icon;
  }

  function updateImageStatusIcon(imageElem, rating) {
    const existingIcon = imageElem.parentNode.querySelector('.image-moderation-status-icon');
    if (existingIcon) existingIcon.remove();
    const harmful = rating > 7;
    const color = harmful ? 'red' : 'green';
    const title = harmful
      ? 'Potentially harmful image content detected'
      : 'Image looks clean';
    const icon = createStatusIcon(color, title, harmful);
    imageElem.parentNode.insertBefore(icon, imageElem.nextSibling);
  }

  function applyImageLoadingUI(imageElem) {
    imageElem.style.opacity = '0.6';
    imageElem.dataset.safespaceLoading = 'true';
  }

  function applyImageUI(imageElem, rating) {
    imageElem.style.opacity = '1';
    imageElem.dataset.safespaceLoading = 'false';
    imageElem.style.border = '';
    updateImageStatusIcon(imageElem, rating);
    const container = imageElem.closest('[data-testid="tweet"], article');
    if (container) {
      if (rating > 7) {
        container.style.filter = 'blur(40px)';
        container.style.transition = 'filter 0.3s ease';
        container.title = 'This image contains potentially harmful content and is blurred';
      } else {
        container.style.filter = '';
        container.title = '';
      }
    }
  }

  function cleanImageUrl(url) {
    if (!url) return null;
    return url
      .replace(/(:small|:large|:medium|:orig)$/, '')
      .replace(/&amp;/g, '&')
      .trim();
  }

  function extractImageUrl(imageElem) {
    if (!imageElem) return null;
    let url = imageElem.src || imageElem.getAttribute('data-src') || '';
    return cleanImageUrl(url);
  }

  async function moderateImageElement(imageElem) {
    if (!moderationActive) return;
    if (!imageElem || imageElem.dataset.safespaceProcessed === "true") return;
    const imageUrl = extractImageUrl(imageElem);
    if (!imageUrl) return;
    const cachedData = getCachedResult(imageUrl);
    if (cachedData && isCacheValid(cachedData)) {
      applyImageUI(imageElem, cachedData.result.rating);
      imageElem.dataset.safespaceProcessed = "true";
      return;
    }
    applyImageLoadingUI(imageElem);
    try {
      const res = await fetch(IMAGE_MODERATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) {
        console.error('Image moderation API error:', res.status);
        imageElem.dataset.safespaceProcessed = "true";
        return;
      }
      const data = await res.json();
      if (data.rating !== undefined) {
        setCachedResult(imageUrl, data);
        applyImageUI(imageElem, data.rating);
      }
      imageElem.dataset.safespaceProcessed = "true";
    } catch (err) {
      console.error('Error moderating image:', err);
      imageElem.dataset.safespaceProcessed = "true";
    }
  }

  async function scanImagesInitial() {
    const images = Array.from(document.querySelectorAll(
      'article img.css-9pa8cd[src], ' +
      'div[data-testid="tweet"] img.css-9pa8cd[src], ' +
      'div[data-testid="tweetPhoto"] img[src]'
    ));

    const unprocessedImages = images.filter(img => !img.dataset.safespaceChecked);
    const imagesToProcess = unprocessedImages.slice(0, 5);  // Limit to 5 images max

    for (const imageElem of imagesToProcess) {
      imageElem.dataset.safespaceChecked = "true";
      if (imageElem.dataset.safespaceLoading === 'true' || imageElem.dataset.safespaceProcessed === 'true') continue;
      await moderateImageElement(imageElem);
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'runImageModeration') {
      moderationActive = true;
      scanImagesInitial();
      sendResponse({ result: 'Image Moderation started.' });
      return true;
    }
    if (request.action === 'stopModeration') {
      moderationActive = false;
      sendResponse({ result: 'Moderation stopped.' });
      return true;
    }
  });

  const observerTargets = [
    document.body,
    document.querySelector('[aria-label="Timeline: Your Home Timeline"]'),
    document.querySelector('[data-testid="primaryColumn"]')
  ].filter(Boolean);

  for (const target of observerTargets) {
    new MutationObserver(mutations => {
      if (!moderationActive) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === 1 &&
            (node.matches('img.css-9pa8cd[src]') || node.querySelector('img.css-9pa8cd[src]'))
          ) {
            scanImagesInitial();
            return;
          }
        }
      }
    }).observe(target, { childList: true, subtree: true });
  }

  scanImagesInitial();
})();
