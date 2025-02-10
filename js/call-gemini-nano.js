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

async function callGemini() {
  try {
    const promptTextArea = document.getElementById("prompt_input");
    const resultArea = document.getElementById("prompt_result");
    const inputPrompt = promptTextArea.value;
    promptTextArea.value = "";

    console.log(inputPrompt);

    if (inputPrompt === "") return;

    const btn = document.getElementById("prompt_button");
    btn.textContent = "로딩...";
    btn.disabled = true;
    
    currentController = new AbortController();
    
    const newElement = document.createElement("pre");
    newElement.classList.add("result--child");
    resultArea.appendChild(newElement);
    
    const stream = session.promptStreaming(inputPrompt, { signal: currentController.signal });
    let previousChunk = "";
    
    for await (const chunk of stream) {
      const newChunk = chunk.startsWith(previousChunk)
        ? chunk.slice(previousChunk.length) 
        : chunk;
      
      newElement.textContent += newChunk;
      newElement.scrollIntoView({ behavior: "smooth", block: "end" });      
      previousChunk = chunk;
    }

    btn.disabled = false;
    btn.textContent = "변환";

  } catch (error) {
    const btn = document.getElementById("prompt_button");
    btn.disabled = false;
    btn.textContent = "변환";

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
