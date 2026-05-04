const GROQ_MODELS = (import.meta.env.VITE_GROQ_MODELS ?? 'llama-3.3-70b-versatile').split(',');

// Support both comma-separated multiple keys, or a single key fallback
const rawKeys = import.meta.env.VITE_GROQ_API_KEYS || import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_KEYS = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

export const fetchGroqChatCompletion = async (systemPrompt, conversationHistory, signal, temperature = 0.7, maxTokens = 1500) => {
  if (GROQ_KEYS.length === 0) throw new Error('No Groq API keys configured in .env');

  let lastError = null;
  // Start with a random key for load balancing
  let currentKeyIndex = Math.floor(Math.random() * GROQ_KEYS.length);

  for (const model of GROQ_MODELS) {
    let retries = 0;
    // Allow up to (number of keys + 1) retries so it can cycle through all keys
    const maxRetries = GROQ_KEYS.length + 1; 

    while (retries <= maxRetries) {
      const currentKey = GROQ_KEYS[currentKeyIndex];

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`
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

        // If rate limited (429), IMMEDIATELY switch keys and retry
        if (response.status === 429) {
          console.warn(`Key ${currentKeyIndex + 1} rate limited on ${model}. Switching keys...`);
          currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
          retries++;
          // Optional: Tiny sleep to prevent aggressive hammering if ALL keys are blocked
          if (retries >= GROQ_KEYS.length) await sleep(500); 
          continue;
        }

        // Server error (503, 500, etc) — wait and retry same key
        if (response.status >= 500) {
          const waitTime = (retries + 1) * 1000 + Math.random() * 500;
          console.warn(`Groq server error on ${model} (${response.status}). Retrying in ${Math.round(waitTime)}ms...`);
          await sleep(waitTime);
          retries++;
          continue;
        }

        const errorData = await response.json().catch(() => ({}));
        console.warn(`Groq model ${model} failed with status ${response.status}:`, errorData);
        lastError = new Error(`Groq HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        break; // Stop retrying this model (e.g. 400 Bad Request, context too large), try next model

      } catch (err) {
        if (err.name === 'AbortError') throw err;
        console.warn(`Groq model ${model} fetch failed:`, err);
        lastError = err;
        // Network error? Try another key just in case.
        currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
        retries++;
        await sleep(500);
      }
    }
  }

  throw lastError || new Error('All Groq models and keys failed after retries');
};
