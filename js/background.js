import { SYSTEM_PROMPT } from "./system-prompt.js";

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
    // Create a session with Gemini
    const session = await chrome.aiOriginTrial.languageModel.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
      },
      systemPrompt: SYSTEM_PROMPT,
    })

    // Get the response stream
    const stream = await session.promptStreaming(request.data)

    // Collect the full response
    let convertedText = ''
    for await (const chunk of stream) {
      convertedText += chunk
    }
  
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
