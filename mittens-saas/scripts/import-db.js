import 'dotenv/config'
import fs from 'node:fs/promises'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const inputPath = process.argv[2]
if (!inputPath) {
  throw new Error('Usage: node scripts/import-supabase-export.js <export.json>')
}

const databaseUrl = new URL(process.env.DATABASE_URL)
const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, ''),
  connectionLimit: 2,
})
const prisma = new PrismaClient({ adapter })
const jsonValue = value => typeof value === 'string' ? JSON.parse(value) : value

try {
  const dump = JSON.parse(await fs.readFile(inputPath, 'utf8'))
  const users = dump.User || dump.users || []
  const trials = dump.Trial || dump.trials || []
  const logs = dump.EmailLog || dump.emailLogs || []

  for (const row of users) {
    const userId = String(row.id)
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: String(row.email).toLowerCase(),
        name: row.name ?? null,
        avatar: row.avatar ?? null,
        googleId: row.googleId ?? null,
        gmailToken: row.gmailToken ? jsonValue(row.gmailToken) : undefined,
        ntfyTopic: row.ntfyTopic ?? null,
        preferences: row.preferences ? jsonValue(row.preferences) : undefined,
        onboardingCompleted: Boolean(row.onboardingCompleted),
        createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      },
      update: {},
    })
  }

  for (const row of trials) {
    if (!row.userId) continue
    await prisma.trial.upsert({
      where: { userId: String(row.userId) },
      create: {
        id: String(row.id),
        userId: String(row.userId),
        startedAt: row.startedAt ? new Date(row.startedAt) : new Date(),
        endsAt: new Date(row.endsAt),
        isActive: Boolean(row.isActive),
      },
      update: {},
    })
  }

  if (logs.length) {
    await prisma.emailLog.createMany({
      data: logs.map(row => ({
        id: String(row.id),
        userId: String(row.userId),
        subject: row.subject ?? null,
        sender: row.sender ?? null,
        category: row.category ?? null,
        familiarity: row.familiarity ?? null,
        processedAt: row.processedAt ? new Date(row.processedAt) : new Date(),
      })),
      skipDuplicates: true,
    })
  }
  console.log(`Imported ${users.length} users, ${trials.length} trials, and ${logs.length} email logs.`)
} finally {
  await prisma.$disconnect()
}
