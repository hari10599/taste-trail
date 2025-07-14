import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cache } from '@/lib/redis'

// GET /api/timeline - Get timeline with caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') || 'all'
    
    // Create cache key
    const cacheKey = `timeline:${filter}:${page}:${limit}`
    
    // Try to get from cache
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    const where: any = {
      isHidden: false,
    }
    
    // Apply filters
    switch (filter) {
      case 'trending':
        // For trending, we'll fetch more and sort by algorithm
        break
      case 'verified':
        where.user = {
          role: {
            in: ['INFLUENCER', 'OWNER', 'ADMIN', 'MODERATOR'],
          },
        }
        break
      case 'high-rated':
        where.rating = {
          gte: 4,
        }
        break
    }
    
    let reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            coverImage: true,
            categories: true,
            priceRange: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: filter === 'trending' ? { createdAt: 'desc' } : { createdAt: 'desc' },
      skip: filter === 'trending' ? 0 : (page - 1) * limit,
      take: filter === 'trending' ? limit * 5 : limit,
    })
    
    // Apply trending algorithm
    if (filter === 'trending') {
      const now = Date.now()
      reviews = reviews.map(review => {
        const ageInHours = (now - new Date(review.createdAt).getTime()) / (1000 * 60 * 60)
        const shareCount = 0 // We'll track this later
        
        // Algorithm: score = (likes*0.4 + comments*0.3 + shares*0.2 + rating*0.1) / age^1.5
        const trendingScore = (
          (review._count.likes * 0.4) +
          (review._count.comments * 0.3) +
          (shareCount * 0.2) +
          (review.rating * 0.1)
        ) / Math.pow(ageInHours + 1, 1.5)
        
        return {
          ...review,
          trendingScore,
        }
      })
      
      // Sort by trending score
      reviews.sort((a: any, b: any) => b.trendingScore - a.trendingScore)
      
      // Paginate
      reviews = reviews.slice((page - 1) * limit, page * limit)
    }
    
    const total = await prisma.review.count({ where })
    
    const response = {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
    
    // Cache the response for 5 minutes
    await cache.set(cacheKey, response, 300)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to get timeline' },
      { status: 500 }
    )
  }
}