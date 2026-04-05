export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { messages, budget } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Parametri non validi' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key mancante' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Sei l'assistente finanziario di pensacierisparmia.it. Aiuta l'utente ad analizzare spese mensili e suggerisci ottimizzazioni concrete. Budget mensile: €${budget||2000}. Rispondi in italiano, tono diretto, max 250 parole.`,
        messages,
      }),
    });
    const data = await response.json();
    if (data?.content?.[0]?.text) return res.status(200).json({ reply: data.content[0].text });
    return res.status(502).json({ error: 'Risposta non valida' });
  } catch(err) {
    return res.status(502).json({ error: 'Errore di connessione' });
  }
}
