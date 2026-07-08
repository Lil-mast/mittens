// AWS bedrock models integration

import {
  BedrockRuntimeClient,
  ConverseCommand
} from '@aws-sdk/client-bedrock-runtime'
import dotenv from 'dotenv'

dotenv.config()

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

// Model per plan
export const MODELS = {
  trial: 'amazon.nova-micro-v1:0',
  pro: 'amazon.nova-pro-v1:0'
}

export const invokeModel = async (prompt, plan = 'trial') => {
  const modelId = MODELS[plan]

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.3
    }
  })

  const response = await client.send(command)
  return response.output.message.content[0].text
}

export const categorizeEmails = async (emails, plan = 'trial') => {
  const emailList = emails.map((e, i) =>
    `${i + 1}. From: ${e.from} | Subject: ${e.subject}`
  ).join('\n')

  const prompt = `You are Mittens, an AI email management agent.
Categorize each email below into exactly one category:
- MEETING: invite, zoom, meet, call, calendar, standup
- EVENT: conference, webinar, ticket, workshop, summit
- SECURITY: alert, security, password, login, verify, 2FA, suspicious
- WORK: project, task, client, deadline, report, update
- PERSONAL: friends, family, personal
- SPAM: unsubscribe, promo, newsletter, marketing

Also tag sender familiarity:
- KNOWN: recognized sender
- UNKNOWN: first-time sender

Emails:
${emailList}

Respond ONLY as JSON array:
[{"index": 1, "category": "WORK", "familiarity": "KNOWN", "priority": "normal"}]`

  const result = await invokeModel(prompt, plan)

  try {
    const clean = result.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return emails.map((_, i) => ({
      index: i + 1,
      category: 'WORK',
      familiarity: 'UNKNOWN',
      priority: 'normal'
    }))
  }
}