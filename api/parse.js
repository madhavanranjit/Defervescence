export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  const now = new Date()
  const prompt = `Today is ${now.toDateString()}, time is ${now.toLocaleTimeString()}. User said: "${text}". Extract temperature and date/time. Return ONLY valid JSON, no markdown: {"temperature":<number>,"unit":"F" or "C","date":"YYYY-MM-DD","time":"HH:MM","time_display":"e.g. 2:30 PM","date_display":"e.g. March 13, 2025"}. If no date/time, use today/now. If no unit, assume Fahrenheit.`

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

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return res.status(200).json(result)

  } catch (e) {
    return res.status(500).json({ error: 'Parsing failed' })
  }
}