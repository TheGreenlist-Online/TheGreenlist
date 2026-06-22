import { DefaultSession } from 'next-auth'
import { ProfileVisibility, UserRole, VerificationStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username?: string | null
      role: UserRole
      businessId?: string | null
      profileVisibility?: ProfileVisibility
      allowAnonymousReports?: boolean
      verificationStatus?: VerificationStatus
    } & DefaultSession['user']
  }

  interface User {
    username?: string | null
    role?: UserRole
    businessId?: string | null
    profileVisibility?: ProfileVisibility
    allowAnonymousReports?: boolean
    verificationStatus?: VerificationStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string | null
    role?: UserRole
    businessId?: string | null
    profileVisibility?: ProfileVisibility
    allowAnonymousReports?: boolean
    verificationStatus?: VerificationStatus
  }
}
