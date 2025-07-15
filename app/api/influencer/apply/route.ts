import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    
    const body = await request.json()
    const { 
      instagramHandle, 
      youtubeChannel, 
      tiktokHandle, 
      followerCount, 
      contentType, 
      reasonForApplication 
    } = body
    
    // Check if user already has a pending or approved application
    const existingApplication = await prisma.influencerApplication.findFirst({
      where: { userId: payload.userId }
    })
    
    if (existingApplication) {
      return NextResponse.json(
        { error: 'You already have an application submitted' },
        { status: 400 }
      )
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, email: true }
    })
    
    // Create influencer application
    const application = await prisma.influencerApplication.create({
      data: {
        userId: payload.userId,
        instagramHandle,
        youtubeChannel,
        tiktokHandle,
        followerCount: parseInt(followerCount),
        contentType,
        reasonForApplication,
        status: 'PENDING',
        submittedAt: new Date()
      }
    })
    
    // Send notification to all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    
    for (const admin of admins) {
      await createNotification('influencer_application_received', admin.id, {
        applicantName: user?.name || 'Unknown',
        applicantEmail: user?.email || 'Unknown',
        applicationId: application.id,
        followerCount: application.followerCount
      })
    }
    
    return NextResponse.json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        submittedAt: application.submittedAt
      }
    })
  } catch (error) {
    console.error('Influencer application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}

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
    const payload = verifyAccessToken(token)
    
    const application = await prisma.influencerApplication.findFirst({
      where: { userId: payload.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })
    
    return NextResponse.json({ application })
  } catch (error) {
    console.error('Get influencer application error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}