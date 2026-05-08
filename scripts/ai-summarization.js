const OpenAI = require('openai')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function summarizeNews() {
  console.log('Starting AI summarization...')

  // Get recent news articles without summaries
  const articles = await prisma.news.findMany({
    where: {
      summary: null,
      publishedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    take: 10
  })

  for (const article of articles) {
    try {
      console.log(`Summarizing: ${article.title}`)

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing cannabis industry news articles. Provide a concise, objective summary in 2-3 sentences, focusing on key facts and implications for the industry.'
          },
          {
            role: 'user',
            content: `Title: ${article.title}\n\nContent: ${article.content}`
          }
        ],
        max_tokens: 150
      })

      const summary = completion.choices[0].message.content

      await prisma.news.update({
        where: { id: article.id },
        data: { summary }
      })

      console.log(`Summarized article: ${article.title}`)
    } catch (error) {
      console.error(`Error summarizing article ${article.id}:`, error.message)
    }
  }

  console.log('AI summarization completed')
  await prisma.$disconnect()
}

summarizeNews().catch(console.error)