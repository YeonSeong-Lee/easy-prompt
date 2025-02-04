const inputPrompt = "커피에 대해 알려줘";


const session = await chrome.aiOriginTrial.languageModel.create({
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
      });
    },
    systemPrompt: "You are a helpful assistant. Please respond in English only.",
    generationConfig: {
      allowedLanguages: ['en']
    }
  });

try {
  console.log('starting...');
  const result = await session.prompt(inputPrompt);
  console.log(result);
} catch (error) {
  console.error('Error during AI response generation:', error.message);
}
