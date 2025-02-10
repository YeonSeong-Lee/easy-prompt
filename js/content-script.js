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
 * Sends a message to the browser extension
 * @function sendToExtension
 * @param {string} message - The message to send to the extension
 * @returns {void}
 */
function sendToExtension(message) {
  try {
    chrome.runtime.sendMessage({
      type: 'CHATGPT_DATA',
      data: message
    }, response => {
      if (chrome.runtime.lastError) {
        console.warn('Extension communication error:', chrome.runtime.lastError)
        // Optionally show user feedback that the extension needs to be refreshed
        alert('Extension context invalid. Please refresh the page.')
      }
      console.log('response ::', response)
    })
  } catch (error) {
    console.warn('Failed to send message to extension:', error)
    // Optionally show user feedback
    alert('Extension communication failed. Please refresh the page.')
  }
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

  button.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    const userInput = getLastUserInput()
    console.log('userInput ::', userInput)

    if (userInput) {
      try {
        sendToExtension(userInput)
      } catch (error) {
        console.warn('Error handling button click:', error)
      }
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