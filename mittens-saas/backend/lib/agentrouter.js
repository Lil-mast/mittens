import axios from 'axios'

const endpoint = (process.env.AGENTROUTER_BASE_URL || 'https://co.agentrouter.org/v1').replace(/\/$/, '')
const model = process.env.AGENTROUTER_MODEL || 'gpt-5.5'

export const invokeModel = async (prompt) => {
  if (!process.env.AGENTROUTER_API_KEY) throw new Error('AGENTROUTER_API_KEY is not configured')
  const { data } = await axios.post(`${endpoint}/chat/completions`, {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.3,
  }, {
    timeout: 60000,
    headers: { Authorization: `Bearer ${process.env.AGENTROUTER_API_KEY}` },
  })
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Agent Router returned an empty model response')
  return content
}

export const categorizeEmails = async (emails) => {
  const emailList = emails.map((email, index) =>
    `${index + 1}. From: ${email.from} | Subject: ${email.subject}`
  ).join('\n')

  const prompt = `You are Mittens, an AI email management agent.
Categorize each email below into exactly one category:
- MEETING: invite, zoom, meet, call, calendar, standup
- EVENT: conference, webinar, ticket, workshop, summit
- SECURITY: alert, security, password, login, verify, 2FA, suspicious
- WORK: project, task, client, deadline, report, update
- PERSONAL: friends, family, personal
- SPAM: unsubscribe, promo, newsletter, marketing

Also tag sender familiarity as KNOWN or UNKNOWN.

Emails:\n${emailList}

Respond ONLY as a JSON array: [{"index":1,"category":"WORK","familiarity":"KNOWN","priority":"normal"}]`

  const result = await invokeModel(prompt)
  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    return emails.map((_, index) => ({
      index: index + 1,
      category: 'WORK',
      familiarity: 'UNKNOWN',
      priority: 'normal',
    }))
  }
}
