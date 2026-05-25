import { DefaultSession } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username?: string | null
      role: UserRole
      businessId?: string | null
    } & DefaultSession['user']
  }

  interface User {
    username?: string | null
    role?: UserRole
    businessId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string | null
    role?: UserRole
    businessId?: string | null
  }
}
