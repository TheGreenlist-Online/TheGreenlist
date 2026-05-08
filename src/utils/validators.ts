import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  forumId: z.string().min(1, 'Forum is required'),
  tags: z.array(z.string()).optional(),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  postId: z.string().min(1, 'Post ID required'),
  parentId: z.string().optional(),
})

export const createReviewSchema = z.object({
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  content: z.string().min(10, 'Review must be at least 10 characters'),
  rating: z.number().min(1).max(5),
  businessId: z.string().min(1, 'Business required'),
})

export const createTransparencyReportSchema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(10, 'Description required'),
  type: z.string().min(1, 'Type required'),
  businessId: z.string().optional(),
  evidence: z.array(z.string().url()).optional(),
})

export const userProfileSchema = z.object({
  name: z.string().optional(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(500).optional(),
})

export const businessProfileSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
})

export const adSchema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(10, 'Content required'),
  link: z.string().url('Valid URL required'),
  type: z.enum(['banner', 'sponsored', 'native']),
})

export const affiliateSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().max(500).optional(),
  link: z.string().url('Valid URL required'),
})

export const newsSchema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(10, 'Content required'),
  source: z.string().min(1, 'Source required'),
  url: z.string().url('Valid URL required'),
  publishedAt: z.date(),
  tags: z.array(z.string()).optional(),
})