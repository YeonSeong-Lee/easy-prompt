import { SYSTEM_PROMPT } from "./system-prompt.js";

const session = await chrome.aiOriginTrial.languageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
    });
  },
  systemPrompt: SYSTEM_PROMPT,
});

let currentController = null;

function createResponseElement(number) {
  const template = document.getElementById('response_template')
  const responseElement = template.content.cloneNode(true)
  
  const container = responseElement.querySelector('.response-container')
  const numberSpan = responseElement.querySelector('.response-number')
  const content = responseElement.querySelector('.response-content')
  const copyButton = responseElement.querySelector('.copy-button')
  
  numberSpan.textContent = `응답 ${number}`
  
  content.addEventListener('click', () => {
    // Remove selected class from all responses
    document.querySelectorAll('.response-content').forEach(el => {
      el.classList.remove('selected')
    })
    // Add selected class to clicked response
    content.classList.add('selected')
  })

  copyButton.addEventListener('click', () => {
    navigator.clipboard
      .writeText(content.textContent)
      .then(() => {
        copyButton.textContent = '✔'
        setTimeout(() => {
          copyButton.textContent = '⧉'
        }, 3000)
      })
      .catch((err) => console.error('Failed to copy text', err))
  })

  return { container, content }
}

async function updateButtonState(btn, isLoading = false) {
  btn.disabled = isLoading
  btn.textContent = isLoading ? '로딩...' : '변환'
}

async function callGemini() {
  try {
    const promptTextArea = document.getElementById('prompt_input')
    const resultArea = document.getElementById('responses_container')
    const inputPrompt = promptTextArea.value
    promptTextArea.value = ''

    if (inputPrompt === '') return

    const btn = document.getElementById('prompt_button')
    await updateButtonState(btn, true)

    // Clear previous responses
    resultArea.innerHTML = ''

    currentController = new AbortController()

    // Generate 3 responses
    const responses = []
    for (let i = 1; i <= 3; i++) {
      const { container, content } = createResponseElement(i)
      resultArea.appendChild(container)
      
      try {
        const stream = session.promptStreaming(inputPrompt, {
          signal: currentController.signal,
        })

        let text = ''
        for await (const chunk of stream) {
          text += chunk
          content.textContent = text
        }
        responses.push(text)
      } catch (error) {
        if (error.name !== 'AbortError') {
          content.textContent = '응답 생성 중 오류가 발생했습니다.'
        }
      }
    }

    await updateButtonState(btn, false)
  } catch (error) {
    const btn = document.getElementById('prompt_button')
    await updateButtonState(btn, false)

    if (error.name === 'AbortError') {
      console.log('Request was aborted')
    } else {
      console.error('Error during AI response generation:', error.message)
    }
  } finally {
    currentController = null
  }
}

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "c") {
    if (currentController) {
      currentController.abort();
    }
  }
});

document.getElementById("prompt_input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault(); // Prevent default newline
    callGemini();
  }
});

document.getElementById("prompt_button").addEventListener("click", callGemini);
