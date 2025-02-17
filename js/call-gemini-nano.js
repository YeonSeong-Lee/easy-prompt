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

async function createResultContainer() {
  const resultContainer = document.createElement('div')
  resultContainer.classList.add('result--container')

  const buttonBar = document.createElement('div')
  buttonBar.classList.add('result--buttons')

  const preElement = document.createElement('pre')
  preElement.classList.add('result--child')

  const copyButton = document.createElement('button')
  copyButton.textContent = '⧉'
  copyButton.classList.add('copy-button')
  copyButton.addEventListener('click', () => {
    navigator.clipboard
      .writeText(preElement.textContent)
      .then(() => console.log('Copied to clipboard'))
      .catch((err) => console.error('Failed to copy text', err))

    copyButton.textContent = '✔'

    setTimeout(() => {
      copyButton.textContent = '⧉'
    }, 3000)
  })

  buttonBar.appendChild(copyButton)
  resultContainer.appendChild(preElement)

  return { resultContainer, buttonBar, preElement }
}

async function handleStreamResponse(stream, preElement, resultArea) {
  let previousChunk = ''

  for await (const chunk of stream) {
    const newChunk = chunk.startsWith(previousChunk)
      ? chunk.slice(previousChunk.length)
      : chunk

    preElement.textContent += newChunk
    resultArea.scrollTop = resultArea.scrollHeight
    previousChunk = chunk
  }
}

async function updateButtonState(btn, isLoading = false) {
  btn.disabled = isLoading
  btn.textContent = isLoading ? '로딩...' : '변환'
}

async function callGemini() {
  try {
    const promptTextArea = document.getElementById('prompt_input')
    const resultArea = document.getElementById('prompt_result')
    const inputPrompt = promptTextArea.value
    promptTextArea.value = ''

    console.log(inputPrompt)

    if (inputPrompt === '') return

    const btn = document.getElementById('prompt_button')
    await updateButtonState(btn, true)

    currentController = new AbortController()

    const { resultContainer, buttonBar, preElement } = await createResultContainer()
    resultArea.appendChild(resultContainer)

    const stream = session.promptStreaming(inputPrompt, {
      signal: currentController.signal,
    })

    await handleStreamResponse(stream, preElement, resultArea)

    resultContainer.appendChild(buttonBar)
    resultArea.scrollTop = resultArea.scrollHeight

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
