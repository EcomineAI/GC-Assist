const GROQ_MODELS = (import.meta.env.VITE_GROQ_MODELS ?? 'llama-3.3-70b-versatile,meta-llama/llama-4-scout-17b-16e-instruct,qwen/qwen3-32b,llama-3.1-8b-instant').split(',');

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

export const fetchGroqChatCompletion = async (systemPrompt, conversationHistory, signal, temperature = 0.7, maxTokens = 1500) => {
  let lastError = null;

  for (const model of GROQ_MODELS) {
    let retries = 0;
    const maxRetries = 2; // Try each model up to 3 times total

    while (retries <= maxRetries) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
          },
          signal: signal,
          body: JSON.stringify({
            model: model.trim(),
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
            ],
            temperature: temperature,
            max_tokens: maxTokens,
            stream: true,
          }),
        });

        if (response.ok) {
          return { response, modelUsed: model.trim() };
        }

        // If rate limited (429) or server error (503), wait and retry the SAME model
        if (response.status === 429 || response.status >= 500) {
          const waitTime = (retries + 1) * 1000 + Math.random() * 500;
          console.warn(`Groq model ${model} busy (${response.status}). Retrying in ${Math.round(waitTime)}ms...`);
          await sleep(waitTime);
          retries++;
          continue;
        }

        const errorData = await response.json().catch(() => ({}));
        console.warn(`Groq model ${model} failed with status ${response.status}:`, errorData);
        lastError = new Error(`Groq HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        break; // Stop retrying this model, move to next model in the list
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        console.warn(`Groq model ${model} fetch failed:`, err);
        lastError = err;
        break; 
      }
    }
  }

  throw lastError || new Error('All Groq models failed after retries');
};
