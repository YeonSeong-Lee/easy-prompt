const session = await chrome.aiOriginTrial.languageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
    });
  },
  systemPrompt: "You are a helpful assistant. Please respond in English only.",
  generationConfig: {
    allowedLanguages: ["en"],
  },
});

const callGemini = async () => {
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
    const result = await session.prompt(inputPrompt);
    btn.disabled = false;
    btn.textContent = "변환";

    console.log(result);

    const newElement = document.createElement("pre");
    newElement.classList.add("result--child");
    newElement.textContent = result;

    resultArea.appendChild(newElement);
    newElement.scrollIntoView({ behavior: "smooth", block: "end" });
  } catch (error) {
    console.error("Error during AI response generation:", error.message);
  }
};

document.getElementById("prompt_button").addEventListener("click", callGemini);
