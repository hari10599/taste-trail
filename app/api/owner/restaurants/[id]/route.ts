import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  address: z.string().min(5).max(200),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  categories: z.array(z.string()),
  priceRange: z.number().int().min(1).max(4),
  coverImage: z.string().optional(),
  openingHours: z.object({}).optional()
})

// PUT /api/owner/restaurants/[id] - Update restaurant details
export async function PUT(
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
    
    // Await params before using
    const { id } = await params
    
    // Verify restaurant ownership
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Check if user is owner or admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (restaurant.ownerId !== payload.userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Owner privileges required.' },
        { status: 403 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateRestaurantSchema.parse(body)
    
    // Update restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        address: validatedData.address,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        categories: validatedData.categories,
        priceRange: validatedData.priceRange,
        coverImage: validatedData.coverImage || null,
        openingHours: validatedData.openingHours || {}
      }
    })
    
    return NextResponse.json({
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update restaurant error:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
}