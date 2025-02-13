chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: true,
  });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/**
 * Handles incoming requests from content scripts
 * @param {Object} request - The request object
 * @param {string} request.type - The type of request
 * @param {any} request.data - The request data
 * @param {number} request.timestamp - The request timestamp
 * @param {Object} sender - Information about the sender
 * @param {function} sendResponse - Function to send response back
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received request:', request)

  switch (request.type) {
    case 'CONVERT_PROMPT':
      handleConvertPrompt(request, sendResponse)
      break
    
    default:
      sendResponse({
        success: false,
        error: 'Unknown request type'
      })
  }

  // Return true to indicate we will send response asynchronously
  return true
})

/**
 * Handles prompt conversion requests
 * @param {Object} request - The request object
 * @param {function} sendResponse - Function to send response back
 */
async function handleConvertPrompt(request, sendResponse) {
  try {
    // TODO: 실제 프롬프트 변환 로직 구현
    const convertedText = '변환된 프롬프트'

    // Send the result to the side panel
    chrome.runtime.sendMessage({
      type: 'CHATGPT_DATA_TO_PANEL',
      data: {
        userInput: request.data
      }
    })

    // Send success response back to content script
    sendResponse({
      success: true,
      data: {
        originalText: request.data,
        convertedText
      }
    })
  } catch (error) {
    console.error('Error converting prompt:', error)
    sendResponse({
      success: false,
      error: error.message || 'Failed to convert prompt'
    })
  }
}
