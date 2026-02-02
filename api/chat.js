export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are Chandan's bot beta, a helpful AI assistant for prop firm questions." },
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 400
      })
    });

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}