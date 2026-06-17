import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserRole } from '@prisma/client'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const providers: NextAuthOptions['providers'] = []

function normalizeRole(role: unknown): UserRole {
  return Object.values(UserRole).includes(role as UserRole) ? (role as UserRole) : UserRole.USER
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  )
}

providers.push(
  CredentialsProvider({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim()
      const password = credentials?.password

      if (!email || !password) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          image: true,
        },
      })

      if (!user?.password) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: normalizeRole(user.role),
      }
    },
  })
)

function isSafeInternalUrl(url: string, baseUrl: string) {
  if (url.startsWith('/')) {
    return !url.startsWith('//')
  }

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.origin === baseUrl
  } catch {
    return false
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = normalizeRole(user.role)
      }

      token.role = normalizeRole(token.role)
      return token
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub
        session.user.role = normalizeRole(token.role)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (!isSafeInternalUrl(url, baseUrl)) {
        return `${baseUrl}/dashboard`
      }

      if (url === baseUrl || url === `${baseUrl}/` || url === '/') {
        return `${baseUrl}/dashboard`
      }

      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      return url
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/register',
    error: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
