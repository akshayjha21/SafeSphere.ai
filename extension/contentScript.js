chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'runModerationCheck') {
    // Example extraction for Gmail inbox email row (adjust selectors for other platforms)
    const subject = document.querySelector('.bog')?.innerText || '';
    const snippet = document.querySelector('.y2')?.innerText || '';
    const emailText = `${subject} ${snippet}`.trim();

    if (!emailText) {
      sendResponse({ result: 'No email text found on this page.' });
      return true; // async response
    }

fetch('http://localhost:3000/moderation/analyzeComment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: emailText })
})
.then(res => {
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  return res.json();
})
.then(data => {
  // handle response
})
.catch(err => {
  sendResponse({ result: `Error analyzing content: ${err.message}` });
});
    return true; // Keep message channel open for async response
  }
});
