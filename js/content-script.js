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
 * @returns {Promise<any>} The response from the background script
 */
async function sendRequest(type, data) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({
        type,
        data,
      }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        resolve(response)
      })
    } catch (error) {
      reject(error)
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

  button.addEventListener('click', async (e) => {
    e.stopPropagation()
    e.preventDefault()
    
    const userInput = getLastUserInput()
    if (!userInput) return

    try {
      // Send request and wait for response
      const response = await sendRequest('CONVERT_PROMPT', userInput)
      console.log('response ::', response)
      
      if (response.success) {
        // Update textarea with converted text
        setPromptTextarea(response.data.convertedText)
      } else {
        console.warn('Failed to convert prompt:', response.error)
        alert('프롬프트 변환에 실패했습니다.')
      }
    } catch (error) {
      console.warn('Error handling button click:', error)
      alert('Extension communication failed. Please refresh the page.')
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