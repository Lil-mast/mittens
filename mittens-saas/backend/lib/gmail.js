import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config()

export const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export const getAuthUrl = () => {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  })
}

export const getTokens = async (code) => {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export const getGmailClient = (tokens) => {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials(tokens)
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export const fetchEmails = async (tokens, query = 'newer_than:1d is:unread', maxResults = 20) => {
  const gmail = getGmailClient(tokens)

  const list = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults
  })

  if (!list.data.messages) return []

  const emails = await Promise.all(
    list.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      })

      const headers = detail.data.payload.headers
      const get = (name) => headers.find(h => h.name === name)?.value || ''

      return {
        id: msg.id,
        from: get('From'),
        subject: get('Subject'),
        date: get('Date'),
        snippet: detail.data.snippet
      }
    })
  )

  return emails
}