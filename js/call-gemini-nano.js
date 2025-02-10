import { SYSTEM_PROMPT } from "./system-prompt.js";


const session = await chrome.aiOriginTrial.languageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
    });
  },
  systemPrompt: SYSTEM_PROMPT,
});

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
    
    const newElement = document.createElement("pre");
    newElement.classList.add("result--child");
    resultArea.appendChild(newElement);
    
    const stream = session.promptStreaming(inputPrompt);
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
    console.error("Error during AI response generation:", error.message);
  }
}

document.getElementById("prompt_button").addEventListener("click", callGemini);
