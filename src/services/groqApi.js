const GROQ_MODELS = (import.meta.env.VITE_GROQ_MODELS ?? 'llama-3.3-70b-versatile,llama-3.1-8b-instant').split(',');

export const fetchGroqChatCompletion = async (systemPrompt, conversationHistory, signal, temperature = 0.7, maxTokens = 1500) => {
  let lastError = null;

  for (const model of GROQ_MODELS) {
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

      const errorData = await response.json().catch(() => ({}));
      console.warn(`Groq model ${model} failed with status ${response.status}:`, errorData);
      lastError = new Error(`Groq HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      
      // If it's a rate limit (429), definitely try next model. 
      // For other errors, we also try next model as requested.
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn(`Groq model ${model} fetch failed:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed');
};
