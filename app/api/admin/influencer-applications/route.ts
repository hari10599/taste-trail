import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'

// GET /api/admin/influencer-applications - Get all applications (Admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid authorization token format' },
        { status: 401 }
      )
    }
    
    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (error) {
      console.error('JWT verification failed in admin endpoint:', error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    const where = status ? { status: status as any } : {}
    
    const [applications, total] = await Promise.all([
      prisma.influencerApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.influencerApplication.count({ where })
    ])
    
    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get influencer applications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/influencer-applications - Review application (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid authorization token format' },
        { status: 401 }
      )
    }
    
    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (error) {
      console.error('JWT verification failed in admin endpoint:', error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const { applicationId, status, reviewerNotes } = await request.json()
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Update application
    const application = await prisma.influencerApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: payload.userId,
        reviewerNotes
      },
      include: {
        user: true
      }
    })
    
    // If approved, update user role and profile
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: application.userId },
        data: {
          role: 'INFLUENCER',
          verified: true
        }
      })
      
      // Update profile with social links
      const socialLinks: any = {}
      if (application.instagramHandle) socialLinks.instagram = application.instagramHandle
      if (application.youtubeChannel) socialLinks.youtube = application.youtubeChannel
      if (application.tiktokHandle) socialLinks.tiktok = application.tiktokHandle
      
      await prisma.profile.upsert({
        where: { userId: application.userId },
        update: {
          socialLinks,
          followerCount: application.followerCount
        },
        create: {
          userId: application.userId,
          socialLinks,
          followerCount: application.followerCount
        }
      })
      
      // Create notification
      await createNotification('influencer_approved', application.userId, {
        userName: application.user.name
      })
    } else if (status === 'REJECTED') {
      // Create notification for rejection
      await createNotification('influencer_rejected', application.userId, {
        notes: reviewerNotes
      })
    }
    
    return NextResponse.json({
      message: 'Application reviewed successfully',
      application
    })
  } catch (error) {
    console.error('Review influencer application error:', error)
    return NextResponse.json(
      { error: 'Failed to review application' },
      { status: 500 }
    )
  }
}