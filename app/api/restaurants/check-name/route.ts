import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// GET /api/restaurants/check-name - Check if restaurant name is available
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
    
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      )
    }
    
    if (name.length < 2) {
      return NextResponse.json({
        available: false,
        message: 'Name must be at least 2 characters long'
      })
    }
    
    // Check if restaurant name already exists (case-insensitive)
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })
    
    const available = !existingRestaurant
    
    return NextResponse.json({
      available,
      message: available 
        ? 'Name is available' 
        : 'A restaurant with this name already exists'
    })
  } catch (error) {
    console.error('Check restaurant name error:', error)
    return NextResponse.json(
      { error: 'Failed to check name availability' },
      { status: 500 }
    )
  }
}