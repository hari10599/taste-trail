import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

// GET /api/notifications/preferences - Get user notification preferences
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

    // Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: payload.userId }
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: payload.userId,
          emailEnabled: true,
          pushEnabled: true,
          reviewLikes: true,
          reviewComments: true,
          newFollowers: true,
          ownerResponses: true,
          systemUpdates: true
        }
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
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
    const payload = verifyAccessToken(token)

    const body = await request.json()
    const {
      emailEnabled,
      pushEnabled,
      reviewLikes,
      reviewComments,
      newFollowers,
      ownerResponses,
      systemUpdates
    } = body

    // Update preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: payload.userId },
      update: {
        emailEnabled: emailEnabled ?? true,
        pushEnabled: pushEnabled ?? true,
        reviewLikes: reviewLikes ?? true,
        reviewComments: reviewComments ?? true,
        newFollowers: newFollowers ?? true,
        ownerResponses: ownerResponses ?? true,
        systemUpdates: systemUpdates ?? true
      },
      create: {
        userId: payload.userId,
        emailEnabled: emailEnabled ?? true,
        pushEnabled: pushEnabled ?? true,
        reviewLikes: reviewLikes ?? true,
        reviewComments: reviewComments ?? true,
        newFollowers: newFollowers ?? true,
        ownerResponses: ownerResponses ?? true,
        systemUpdates: systemUpdates ?? true
      }
    })

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}