import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'

// Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id: targetUserId } = await params
    const currentUserId = payload.userId
    
    // Can't follow yourself
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }
    
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    })
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })
    
    if (existingFollow) {
      return NextResponse.json(
        { error: 'You are already following this user' },
        { status: 400 }
      )
    }
    
    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })
    
    // Get current user info for notification
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true }
    })
    
    // Send notification to the followed user
    await createNotification('follow', targetUserId, {
      follower: currentUser
    }, {
      fromId: currentUserId
    })
    
    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } })
    ])
    
    return NextResponse.json({
      message: 'Successfully followed user',
      follow,
      counts: {
        followers: followersCount,
        following: followingCount
      }
    })
  } catch (error: any) {
    console.error('Follow error:', error)
    
    if (error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

// Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id: targetUserId } = await params
    const currentUserId = payload.userId
    
    // Delete follow relationship
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })
    
    if (deletedFollow.count === 0) {
      return NextResponse.json(
        { error: 'You are not following this user' },
        { status: 400 }
      )
    }
    
    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } })
    ])
    
    return NextResponse.json({
      message: 'Successfully unfollowed user',
      counts: {
        followers: followersCount,
        following: followingCount
      }
    })
  } catch (error: any) {
    console.error('Unfollow error:', error)
    
    if (error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}

// Get follow status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        isFollowing: false,
        counts: { followers: 0, following: 0 }
      })
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    
    const { id: targetUserId } = await params
    const currentUserId = payload.userId
    
    // Check if following
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })
    
    // Get counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } })
    ])
    
    return NextResponse.json({
      isFollowing: !!follow,
      counts: {
        followers: followersCount,
        following: followingCount
      }
    })
  } catch (error) {
    // Return default values if there's an error
    return NextResponse.json({
      isFollowing: false,
      counts: { followers: 0, following: 0 }
    })
  }
}