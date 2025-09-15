// document.getElementById('checkEmailsBtn').addEventListener('click', async () => {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   chrome.tabs.sendMessage(tab.id, { action: 'runModerationCheck' }, (response) => {
//     const statusMessage = document.getElementById('statusMessage');
//     if (chrome.runtime.lastError) {
//       statusMessage.textContent = 'Error connecting to content script.';
//       return;
//     }
//     statusMessage.textContent = response?.result || 'No response from content script.';
//   });
// });

// document.getElementById('checkCommentsBtn').addEventListener('click', async () => {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   chrome.tabs.sendMessage(tab.id, { action: 'runCommentModeration' }, (response) => {
//     const statusMessage = document.getElementById('statusMessage');
//     if (chrome.runtime.lastError) {
//       statusMessage.textContent = 'Error connecting to content script.';
//       return;
//     }
//     statusMessage.textContent = response?.result || 'No response from content script.';
//   });
// });

// document.getElementById('stopBtn').addEventListener('click', async () => {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   chrome.tabs.sendMessage(tab.id, { action: 'stopModeration' }, (response) => {
//     const statusMessage = document.getElementById('statusMessage');
//     if (chrome.runtime.lastError) {
//       statusMessage.textContent = 'Error connecting to content script.';
//       return;
//     }
//     statusMessage.textContent = response?.result || 'No response from content script.';
//   });
// });

// Helper function to send a message to the active tab and update status message
async function sendAction(action, successMsg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action }, (response) => {
    const statusMessage = document.getElementById('statusMessage');
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Error connecting to content script.';
      return;
    }
    statusMessage.textContent = response?.result || successMsg;
  });
}

document.getElementById('checkEmailsBtn').addEventListener('click', () =>
  sendAction('runModerationCheck', 'Email Moderation started.')
);

document.getElementById('checkCommentsBtn').addEventListener('click', () =>
  sendAction('runCommentModeration', 'Comment Moderation started.')
);

document.getElementById('checkImagesBtn').addEventListener('click', () =>
  sendAction('runImageModeration', 'Image Moderation started.')
);

document.getElementById('stopBtn').addEventListener('click', () =>
  sendAction('stopModeration', 'Moderation stopped.')
);
