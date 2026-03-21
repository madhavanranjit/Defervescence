export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  
  // Handle case where body might be a string
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch(e) { 
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }

  const { text, localDate, localTime, preferredUnit } = body || {}
  
  if (!text) return res.status(400).json({ error: 'No text provided' })
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'API key not configured' })

  const now = new Date()
  const dateStr = localDate || now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = localTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  const prompt = `Today is ${dateStr}, current time is ${timeStr}.
User said: "${text}"
Extract temperature and date/time. Return ONLY valid JSON, no markdown:
{"temperature":<number>,"unit":"F" or "C","date":"YYYY-MM-DD","time":"HH:MM","time_display":"e.g. 2:30 PM","date_display":"e.g. March 13, 2025"}
If no date/time mentioned, use today and current time. If no unit, use "${preferredUnit || 'F'}".`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ error: 'OpenAI error: ' + errText })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return res.status(200).json(result)

  } catch (e) {
    return res.status(500).json({ error: 'Parsing failed: ' + e.message })
  }
}