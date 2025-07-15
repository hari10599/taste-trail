import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/restaurants/search - Search restaurants with autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({ restaurants: [] })
    }
    
    const restaurants = await prisma.restaurant.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { categories: { hasSome: [query] } },
          { address: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        categories: true,
        coverImage: true,
        priceRange: true,
        description: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: 10,
    })
    
    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error('Search restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    )
  }
}