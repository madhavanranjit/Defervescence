export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const now = new Date()
  const dateStr = localDate || now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = localTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const prompt = `Today is ${dateStr}, time is ${timeStr}. User said: "${text}". Extract medicine name, dose, and date/time. Return ONLY valid JSON, no markdown: {"name":"medicine name","dose":"e.g. 250mg or null","date":"YYYY-MM-DD","time":"HH:MM","time_display":"e.g. 3:00 PM","date_display":"e.g. March 20, 2026"}. If no date/time, use today/now.`
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 200, temperature: 0, messages: [{ role: 'user', content: prompt }] })
    })
    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ error: 'Parsing failed' })
  }
}