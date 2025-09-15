document.getElementById('checkEmailsBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'runModerationCheck' }, (response) => {
    const statusMessage = document.getElementById('statusMessage');
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Error connecting to content script.';
      return;
    }
    statusMessage.textContent = response?.result || 'No response from content script.';
  });
});

document.getElementById('checkCommentsBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'runCommentModeration' }, (response) => {
    const statusMessage = document.getElementById('statusMessage');
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Error connecting to content script.';
      return;
    }
    statusMessage.textContent = response?.result || 'No response from content script.';
  });
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stopModeration' }, (response) => {
    const statusMessage = document.getElementById('statusMessage');
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Error connecting to content script.';
      return;
    }
    statusMessage.textContent = response?.result || 'No response from content script.';
  });
});
