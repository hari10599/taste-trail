import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    })

    return NextResponse.json({
      users,
      counts: userCounts.reduce((acc, curr) => {
        acc[curr.role] = curr._count.role
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Check users error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check users' },
      { status: 500 }
    )
  }
}