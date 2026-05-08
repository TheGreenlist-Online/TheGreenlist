export interface User {
  id: string
  clerkId: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: Role
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
}

export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  JOURNALIST = 'JOURNALIST'
}

export interface Post {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  authorId: string
  author: {
    username?: string
    avatar?: string
    isAnonymous: boolean
  }
  isAnonymous: boolean
  upvotes: number
  downvotes: number
  status: PostStatus
  createdAt: Date
  updatedAt: Date
  _count?: {
    comments: number
  }
}

export enum PostStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED'
}

export interface Comment {
  id: string
  content: string
  postId: string
  authorId: string
  author: {
    username?: string
    avatar?: string
    isAnonymous: boolean
  }
  parentId?: string
  replies?: Comment[]
  isAnonymous: boolean
  upvotes: number
  downvotes: number
  status: CommentStatus
  createdAt: Date
  updatedAt: Date
}

export enum CommentStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED'
}

export interface Report {
  id: string
  title: string
  description: string
  category: string
  evidence: string[]
  status: ReportStatus
  reporterId?: string
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED'
}

export interface Business {
  id: string
  name: string
  type: BusinessType
  description?: string
  website?: string
  address?: string
  phone?: string
  email?: string
  ownerId: string
  transparencyScore?: number
  reviews: number
  rating?: number
  badges: string[]
  status: BusinessStatus
  createdAt: Date
  updatedAt: Date
}

export enum BusinessType {
  DISPENSARY = 'DISPENSARY',
  GROWER = 'GROWER',
  LAB = 'LAB',
  CONSULTANT = 'CONSULTANT',
  EQUIPMENT_SUPPLIER = 'EQUIPMENT_SUPPLIER',
  ADVOCACY_GROUP = 'ADVOCACY_GROUP',
  MEDIA = 'MEDIA',
  LEGAL_COMPLIANCE = 'LEGAL_COMPLIANCE'
}

export enum BusinessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED'
}

export interface NewsArticle {
  id: string
  title: string
  summary?: string
  content: string
  source: string
  url: string
  publishedAt: Date
  tags: string[]
  sentiment?: number
  aiSummary?: string
  createdAt: Date
  updatedAt: Date
}