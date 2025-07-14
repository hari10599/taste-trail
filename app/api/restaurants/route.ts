import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// GET /api/restaurants - Get restaurants with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const priceRange = searchParams.get('priceRange') || ''
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (category) {
      where.categories = { has: category }
    }
    
    if (priceRange) {
      where.priceRange = parseInt(priceRange)
    }
    
    // Get restaurants with aggregated review data
    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy === 'createdAt' 
          ? { createdAt: sortOrder as 'asc' | 'desc' }
          : undefined,
      }),
      prisma.restaurant.count({ where }),
    ])
    
    // Calculate average ratings
    const restaurantsWithRatings = await Promise.all(
      restaurants.map(async (restaurant) => {
        const avgRating = await prisma.review.aggregate({
          where: { restaurantId: restaurant.id },
          _avg: { rating: true },
        })
        
        return {
          ...restaurant,
          averageRating: avgRating._avg.rating || 0,
        }
      })
    )
    
    // Filter by minimum rating
    const filteredRestaurants = restaurantsWithRatings.filter(
      (r) => r.averageRating >= minRating
    )
    
    // Sort by rating if requested
    if (sortBy === 'rating') {
      filteredRestaurants.sort((a, b) => 
        sortOrder === 'desc' 
          ? b.averageRating - a.averageRating
          : a.averageRating - b.averageRating
      )
    }
    
    return NextResponse.json({
      restaurants: filteredRestaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to get restaurants' },
      { status: 500 }
    )
  }
}

// Schema for creating a restaurant (admin/owner only)
const createRestaurantSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  priceRange: z.number().min(1).max(4),
  categories: z.array(z.string()).min(1),
  amenities: z.array(z.string()),
  coverImage: z.string().optional(),
  images: z.array(z.string()).max(50),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }),
    tuesday: z.object({ open: z.string(), close: z.string() }),
    wednesday: z.object({ open: z.string(), close: z.string() }),
    thursday: z.object({ open: z.string(), close: z.string() }),
    friday: z.object({ open: z.string(), close: z.string() }),
    saturday: z.object({ open: z.string(), close: z.string() }),
    sunday: z.object({ open: z.string(), close: z.string() }),
  }),
})

// POST /api/restaurants - Create a restaurant (admin/owner only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    // For now, we'll skip role checking to allow testing
    // In production, verify the user is ADMIN or OWNER
    
    const body = await request.json()
    const validatedData = createRestaurantSchema.parse(body)
    
    const restaurant = await prisma.restaurant.create({
      data: validatedData,
    })
    
    return NextResponse.json({ restaurant }, { status: 201 })
  } catch (error: any) {
    console.error('Create restaurant error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    )
  }
}