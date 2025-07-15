import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JWTPayload {
  if (!token) {
    throw new Error('No token provided')
  }
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }
  
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', {
      token: token?.substring(0, 50) + '...',
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
}

export async function createSession(userId: string, refreshToken: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  return await prisma.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt,
    },
  })
}

export async function validateSession(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    return null
  }

  return session
}