/**
 * @function getLastUserInput
 * @returns {string}
 */
function getLastUserInput() {
  const textarea = document.querySelector('#prompt-textarea')
  if (!textarea) return null
  const paragraph = textarea.querySelector('p')
  if (!paragraph) return null
  return paragraph.textContent.trim()
}

/**
 * Sends a request to the background script and waits for a response
 * @function sendRequest
 * @param {string} type - The type of request
 * @param {any} data - The data to send
 * @param {function} onChunk - Callback function for handling streaming chunks
 * @returns {Promise<any>} The response from the background script
 */
async function sendRequest(type, data, onChunk) {
  return new Promise((resolve, reject) => {
    try {
      // Check if extension context is valid
      if (!chrome.runtime?.id) {
        reject(new Error('Extension context invalidated. Please refresh the page.'))
        return
      }

      const port = chrome.runtime.connect({ name: 'prompt-stream' })
      
      // Handle port disconnection
      port.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError
        if (error) {
          reject(new Error(error.message || 'Connection lost'))
        }
      })
      
      port.onMessage.addListener((message) => {
        if (message.type === 'chunk') {
          onChunk(message.data)
        } else if (message.type === 'end') {
          resolve(message.data)
          port.disconnect()
        } else if (message.type === 'error') {
          reject(new Error(message.error))
          port.disconnect()
        }
      })

      port.postMessage({ type, data })
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        reject(new Error('Extension context invalidated. Please refresh the page.'))
      } else {
        reject(error)
      }
    }
  })
}

/**
 * Sets the value of the ChatGPT textarea
 * @function setPromptTextarea
 * @param {string} text - The text to set in the textarea
 */
function setPromptTextarea(text) {
  const textarea = document.querySelector('#prompt-textarea')
  if (!textarea) return

  // Create a new paragraph element
  const p = document.createElement('p')
  p.textContent = text

  // Clear existing content and add new paragraph
  textarea.innerHTML = ''
  textarea.appendChild(p)

  // Focus the textarea and trigger input event
  textarea.focus()
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * Creates and adds a button to the ChatGPT interface that captures the conversation
 * when clicked. The button is styled to match ChatGPT's design system and includes
 * hover effects.
 * 
 * @function addCaptureButton
 * @returns {void}
 */
function addCaptureButton() {
  // Find the action buttons container
  const actionsContainer = document.querySelector('.mb-2.mt-1.flex.items-center')
  if (!actionsContainer) return

  const button = document.createElement('button')
  button.textContent = '프롬프트 변환'
  button.className = 'flex h-9 min-w-8 items-center justify-center rounded-full border border-token-border-light p-2 text-[13px] font-medium text-token-text-secondary hover:bg-token-main-surface-secondary'
  button.style.cssText = `
    background-color: #FF9500;
    color: white;
    border: none;
    margin-left: 4px;
    transition: background-color 0.2s;
  `

  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#E68500'
  })

  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#FF9500'
  })

  // Add loading spinner SVG
  const loadingSpinner = `
    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="11" 
        stroke="currentColor" 
        stroke-width="4"
        fill="none"
      />
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  `

  button.innerHTML = '프롬프트 변환'

  button.addEventListener('click', async (e) => {
    e.stopPropagation()
    e.preventDefault()
    
    const userInput = getLastUserInput()
    if (!userInput) return

    try {
      if (!chrome.runtime?.id) {
        throw new Error('Extension context invalidated. Please refresh the page.')
      }

      // Update button state to loading
      button.disabled = true
      button.innerHTML = loadingSpinner // Replace text with spinner
      button.style.backgroundColor = '#E6E6E6'

      let convertedText = ''
      
      await sendRequest('CONVERT_PROMPT', userInput, (chunk) => {
        convertedText += chunk
        setPromptTextarea(convertedText)
      })

    } catch (error) {
      console.warn('Error handling button click:', error)
      
      // Show more specific error message
      if (error.message.includes('Extension context invalidated')) {
        alert('확장 프로그램이 업데이트되었습니다. 페이지를 새로고침해주세요.')
      } else {
        alert('프롬프트 변환 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      // Reset button state
      button.disabled = false
      button.innerHTML = '프롬프트 변환'
      button.style.backgroundColor = '#FF9500'
    }
  })

  // Create a wrapper div for the last child and button
  const wrapperDiv = document.createElement('div')
  wrapperDiv.style.display = 'flex'
  wrapperDiv.id = 'prompt-convert-button-wrapper'
  
  // Get the last child element
  const lastChild = actionsContainer.lastElementChild
  
  // Move the last child into wrapper div
  if (lastChild) {
    actionsContainer.removeChild(lastChild)
    wrapperDiv.appendChild(lastChild)
  }
  
  // Add button to wrapper div
  wrapperDiv.appendChild(button)
  
  // Add wrapper div to actions container
  actionsContainer.appendChild(wrapperDiv)
}

/**
 * Initializes the capture button when the page loads by observing DOM mutations
 * and adding the button once the actions container is available.
 * @function
 */
function initialize() {
  // Wait for the actions container to be available
  const observer = new MutationObserver((mutations, obs) => {
    const actionsContainer = document.querySelector('.flex.gap-x-1\\.5.text-token-text-primary')
    if (actionsContainer && !actionsContainer.querySelector('button[textContent="프롬프트 변환"]')) {
      addCaptureButton()
      obs.disconnect()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

initialize()