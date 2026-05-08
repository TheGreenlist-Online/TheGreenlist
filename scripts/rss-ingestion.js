const Parser = require('rss-parser')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const parser = new Parser()

const RSS_FEEDS = [
  'https://www.cannabisnews.com/feed/',
  'https://www.leafly.com/news/rss',
  'https://www.marijuanamoment.net/feed/',
  // Add more RSS feeds as needed
]

async function ingestRSS() {
  console.log('Starting RSS ingestion...')

  for (const feedUrl of RSS_FEEDS) {
    try {
      console.log(`Processing feed: ${feedUrl}`)
      const feed = await parser.parseURL(feedUrl)

      for (const item of feed.items) {
        // Check if article already exists
        const existingArticle = await prisma.news.findUnique({
          where: { url: item.link }
        })

        if (!existingArticle) {
          await prisma.news.create({
            data: {
              title: item.title,
              content: item.content || item.summary || '',
              summary: item.summary || '',
              source: feed.title || 'Unknown',
              url: item.link,
              publishedAt: new Date(item.pubDate),
              tags: item.categories || []
            }
          })
          console.log(`Added article: ${item.title}`)
        }
      }
    } catch (error) {
      console.error(`Error processing feed ${feedUrl}:`, error.message)
    }
  }

  console.log('RSS ingestion completed')
  await prisma.$disconnect()
}

ingestRSS().catch(console.error)