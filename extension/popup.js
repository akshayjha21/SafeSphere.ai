document.getElementById('checkPageBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'runModerationCheck' }, (response) => {
    const statusMessage = document.getElementById('statusMessage');
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Error connecting to content script.';
      return;
    }
    if (response?.result) {
      statusMessage.textContent = response.result;
    } else {
      statusMessage.textContent = 'No response from content script.';
    }
  });
});
