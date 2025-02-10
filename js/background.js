chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: true,
  });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHATGPT_DATA') {
    console.log('message ::', message.data)
    // TODO: 프롬프트 변환 로직 추가
    // TODO: 변환된 프름프트 content-script로 메시지 전달
  }
})
