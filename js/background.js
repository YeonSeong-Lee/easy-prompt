import { SYSTEM_PROMPT, CODY_PROMPT } from "./system-prompt.js";

// Keep track of active sessions
const sessions = new Map()

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: true,
  });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Handle streaming connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'prompt-stream') {
    // Handle port disconnection
    port.onDisconnect.addListener(() => {
      const session = sessions.get(port.sender?.tab?.id)
      if (session) {
        sessions.delete(port.sender?.tab?.id)
      }
    })

    port.onMessage.addListener(async (request) => {
      if (request.type === 'CONVERT_PROMPT') {
        try {
          // Create a session with Gemini if it doesn't exist
          let session = sessions.get(port.sender?.tab?.id)
          
          if (!session) {
            if (request.data.includes('코디세이')) {
            session = await chrome.aiOriginTrial.languageModel.create({
              monitor(m) {
                m.addEventListener("downloadprogress", (e) => {
                  console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
                });
              },
              systemPrompt: CODY_PROMPT,
            })
            }
            else {
              session = await chrome.aiOriginTrial.languageModel.create({
                monitor(m) {
                  m.addEventListener("downloadprogress", (e) => {
                    console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
                  });
                },
                systemPrompt: SYSTEM_PROMPT,
              })
            }
            sessions.set(port.sender?.tab?.id, session)
          }

          // Get the response stream
          const stream = await session.promptStreaming(request.data)

          // Stream each chunk back to the content script
          let previousChunk = ''
          for await (const chunk of stream) {
            // Check if port is still connected
            if (port.sender?.tab?.id) {
              // Only send the new part of the chunk
              const newText = chunk.startsWith(previousChunk) 
                ? chunk.slice(previousChunk.length) 
                : chunk
              
              try {
                port.postMessage({
                  type: 'chunk',
                  data: newText
                })
              } catch (error) {
                console.error('Error sending chunk:', error)
                break
              }
              
              previousChunk = chunk
            } else {
              break
            }
          }

          // Signal completion if port is still connected
          if (port.sender?.tab?.id) {
            port.postMessage({
              type: 'end',
              data: { success: true }
            })
          }

        } catch (error) {
          console.error('Error converting prompt:', error)
          if (port.sender?.tab?.id) {
            port.postMessage({
              type: 'error',
              error: error.message || 'Failed to convert prompt'
            })
          }
        }
      }
    })
  }
})

// Legacy message handling for non-streaming requests
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
