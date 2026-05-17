export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Body inválido' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 8000,
        messages: body.messages,
        system: body.system,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ 
        error: 'Error de Anthropic', 
        detail: errText.slice(0, 300) 
      });
    }

    // Leer la respuesta completa como buffer
    const chunks = [];
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const fullBuffer = Buffer.concat(chunks.map(c => Buffer.from(c)));
    const text = fullBuffer.toString('utf-8');

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ 
        error: 'Respuesta inválida de Anthropic', 
        raw: text.slice(0, 500) 
      });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
