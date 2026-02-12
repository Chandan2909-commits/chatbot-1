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
          { role: "system", content: "You are a prop firm assistant. ONLY answer questions about: prop firms, trading rules, challenges, profit targets, drawdowns, payouts, risk management, scaling plans, account policies, and legitimacy/trust questions. For ANY other topic (celebrities, general knowledge, coding, etc.), politely say: 'I can only help with prop firm related questions.' Keep ALL responses 50-100 words maximum. Be concise, helpful, and polite. Use bullet points for lists. When asked about scams or legitimacy, reassure users that we are a legitimate, transparent prop firm with verified payouts and clear rules." },
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 150
      })
    });

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}