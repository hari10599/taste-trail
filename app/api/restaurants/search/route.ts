import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/restaurants/search - Search restaurants with autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }
    
    const restaurants = await prisma.restaurant.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { categories: { hasSome: [query] } },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        categories: true,
        coverImage: true,
      },
      take: 10,
    })
    
    return NextResponse.json({ results: restaurants })
  } catch (error) {
    console.error('Search restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    )
  }
}