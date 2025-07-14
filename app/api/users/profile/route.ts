import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { updateProfileSchema } from '@/lib/auth/validation'

// GET /api/users/profile - Get current user profile
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
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        _count: {
          select: {
            reviews: true,
            likes: true,
            comments: true,
            restaurants: true,
          },
        },
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

// PUT /api/users/profile - Update current user profile
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
    const validatedData = updateProfileSchema.parse(body)
    
    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: validatedData.name,
        bio: validatedData.bio,
        profile: {
          update: {
            location: validatedData.location,
            phone: validatedData.phone,
            dietaryPrefs: validatedData.dietaryPrefs || [],
          },
        },
      },
      include: {
        profile: true,
      },
    })
    
    const { password: _, ...userWithoutPassword } = updatedUser
    
    return NextResponse.json({ 
      user: userWithoutPassword,
      message: 'Profile updated successfully' 
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}