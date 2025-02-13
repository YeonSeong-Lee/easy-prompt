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

/**
 * Creates a copy button for the result container
 * @returns {HTMLButtonElement} The copy button element
 */
function createCopyButton(preElement) {
  const copyButton = document.createElement("button");
  copyButton.textContent = "⧉";
  copyButton.classList.add("copy-button");
  
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(preElement.textContent);
      copyButton.textContent = "✔";
      setTimeout(() => {
        copyButton.textContent = "⧉";
      }, 3000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  });

  return copyButton;
}

/**
 * Creates a container for the result with a pre element and button bar
 * @returns {Object} Object containing the container, pre element, and button bar
 */
function createResultContainer() {
  const resultContainer = document.createElement("div");
  resultContainer.classList.add("result--container");

  const buttonBar = document.createElement("div");
  buttonBar.classList.add("result--buttons");

  const preElement = document.createElement("pre");
  preElement.classList.add("result--child");

  resultContainer.appendChild(preElement);

  return { resultContainer, preElement, buttonBar };
}

/**
 * Updates UI elements before starting the conversion
 * @returns {Object} Object containing references to UI elements
 */
function prepareUIForConversion() {
  const promptTextArea = document.getElementById("prompt_input");
  const resultArea = document.getElementById("prompt_result");
  const btn = document.getElementById("prompt_button");
  
  const inputPrompt = promptTextArea.value;
  promptTextArea.value = "";

  btn.textContent = "로딩...";
  btn.disabled = true;

  return { promptTextArea, resultArea, btn, inputPrompt };
}

/**
 * Resets UI elements after conversion is complete
 * @param {HTMLButtonElement} btn - The button element to reset
 */
function resetUI(btn) {
  btn.disabled = false;
  btn.textContent = "변환";
}

/**
 * Streams the AI response and updates the UI
 * @param {string} inputPrompt - The prompt to send to the AI
 * @param {HTMLPreElement} preElement - The element to display the response
 * @param {HTMLElement} resultArea - The container for the result
 */
async function streamResponse(inputPrompt, preElement, resultArea) {
  const stream = session.promptStreaming(inputPrompt, {
    signal: currentController.signal,
  });
  
  let previousChunk = "";
  for await (const chunk of stream) {
    const newChunk = chunk.startsWith(previousChunk)
      ? chunk.slice(previousChunk.length)
      : chunk;

    preElement.textContent += newChunk;
    resultArea.scrollTop = resultArea.scrollHeight;
    previousChunk = chunk;
  }
}

/**
 * Main function to handle the Gemini conversion process
 */
async function callGemini() {
  try {
    const { promptTextArea, resultArea, btn, inputPrompt } = prepareUIForConversion();
    if (inputPrompt === "") return;

    currentController = new AbortController();

    const { resultContainer, preElement, buttonBar } = createResultContainer();
    const copyButton = createCopyButton(preElement);
    buttonBar.appendChild(copyButton);

    resultArea.appendChild(resultContainer);

    await streamResponse(inputPrompt, preElement, resultArea);

    resultContainer.appendChild(buttonBar);
    resultArea.scrollTop = resultArea.scrollHeight;

    resetUI(btn);
  } catch (error) {
    const btn = document.getElementById("prompt_button");
    resetUI(btn);

    if (error.name === "AbortError") {
      console.log("Request was aborted");
    } else {
      console.error("Error during AI response generation:", error.message);
    }
  } finally {
    currentController = null;
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
