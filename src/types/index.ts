import { User, Badge, Follow, Forum, Post, Comment, Vote, VerifiedFact, Business, Review, TransparencyReport, Ad, Affiliate, News, ModerationLog, Subscription, UserAnalytics, BusinessAnalytics } from '@prisma/client'

export type { User, Badge, Follow, Forum, Post, Comment, Vote, VerifiedFact, Business, Review, TransparencyReport, Ad, Affiliate, News, ModerationLog, Subscription, UserAnalytics, BusinessAnalytics }

// Additional types for API responses and forms

export interface CreatePostInput {
  title: string
  content: string
  forumId: string
  tags?: string[]
}

export interface CreateCommentInput {
  content: string
  postId: string
  parentId?: string
}

export interface CreateReviewInput {
  title: string
  content: string
  rating: number
  businessId: string
}

export interface CreateTransparencyReportInput {
  title: string
  content: string
  type: string
  businessId?: string
  evidence?: string[]
}

export interface ForumWithStats extends Forum {
  postCount: number
  memberCount: number
  lastActivity: Date
}

export interface PostWithAuthor extends Post {
  author: User
  voteCount: number
  commentCount: number
}

export interface CommentWithAuthor extends Comment {
  author: User
  voteCount: number
  replies?: CommentWithAuthor[]
}

export interface BusinessWithReviews extends Business {
  reviews: Review[]
  averageRating: number
  reviewCount: number
}

export interface UserProfile extends User {
  badges: Badge[]
  followerCount: number
  followingCount: number
  postCount: number
  reviewCount: number
}

export interface TransparencyScore {
  businessId: string
  score: number
  factors: {
    verifiedReports: number
    positiveReviews: number
    negativeReports: number
    communityTrust: number
  }
}

export interface ModerationAction {
  type: 'approve' | 'reject' | 'flag' | 'delete'
  reason?: string
  targetType: 'post' | 'comment' | 'user'
  targetId: string
}

export interface SubscriptionTier {
  id: string
  name: string
  price: number
  features: string[]
  limits: {
    postsPerDay?: number
    analyticsAccess?: boolean
    prioritySupport?: boolean
  }
}

export interface AdPlacement {
  zone: string
  ad: Ad
  impressions: number
  clicks: number
}

export interface AffiliateLink {
  id: string
  name: string
  url: string
  business: Business
  clicks: number
}

export interface NewsArticle extends News {
  aiSummary?: string
  relevanceScore?: number
}

export interface AnalyticsData {
  period: string
  metrics: {
    users: number
    posts: number
    engagement: number
    growth: number
  }
}

export interface LegalDisclaimer {
  jurisdiction: string
  content: string
  required: boolean
}