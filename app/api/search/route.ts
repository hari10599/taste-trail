import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        restaurants: [],
        reviews: [],
        users: [],
      })
    }

    const searchQuery = query.trim().toLowerCase()

    // Search results object
    const results: any = {
      restaurants: [],
      reviews: [],
      users: [],
    }

    // Search restaurants
    if (type === 'all' || type === 'restaurants') {
      const restaurants = await prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { address: { contains: searchQuery, mode: 'insensitive' } },
            { categories: { hasSome: [searchQuery] } },
          ],
        },
        include: {
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        take: limit,
      })

      // Calculate average ratings
      const restaurantIds = restaurants.map(r => r.id)
      const ratings = await prisma.review.groupBy({
        by: ['restaurantId'],
        where: {
          restaurantId: { in: restaurantIds },
        },
        _avg: {
          rating: true,
        },
      })

      const ratingsMap = new Map(
        ratings.map(r => [r.restaurantId, r._avg.rating || 0])
      )

      results.restaurants = restaurants.map(restaurant => ({
        ...restaurant,
        avgRating: Math.round((ratingsMap.get(restaurant.id) || 0) * 10) / 10,
      }))
    }

    // Search reviews
    if (type === 'all' || type === 'reviews') {
      const reviews = await prisma.review.findMany({
        where: {
          AND: [
            { isHidden: false },
            {
              OR: [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { content: { contains: searchQuery, mode: 'insensitive' } },
                { dishes: { hasSome: [searchQuery] } },
              ],
            },
          ],
        },
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
              address: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })

      results.reviews = reviews
    }

    // Search users (only verified influencers and public profiles)
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { bio: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
            {
              OR: [
                { role: 'INFLUENCER' },
                { verified: true },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          role: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        take: limit,
      })

      results.users = users
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}

// Autocomplete endpoint
export async function POST(request: NextRequest) {
  try {
    const { query, type = 'all' } = await request.json()

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const searchQuery = query.trim().toLowerCase()
    const suggestions: any[] = []

    // Get restaurant name suggestions
    if (type === 'all' || type === 'restaurants') {
      const restaurants = await prisma.restaurant.findMany({
        where: {
          name: { startsWith: searchQuery, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
        },
        take: 5,
      })

      suggestions.push(
        ...restaurants.map(r => ({
          type: 'restaurant',
          id: r.id,
          value: r.name,
          label: r.name,
        }))
      )
    }

    // Get category suggestions
    if (type === 'all' || type === 'categories') {
      const categoriesResult = await prisma.restaurant.findMany({
        where: {
          categories: { hasSome: [searchQuery] },
        },
        select: {
          categories: true,
        },
        take: 10,
      })

      const uniqueCategories = new Set<string>()
      categoriesResult.forEach(r => {
        r.categories.forEach(cat => {
          if (cat.toLowerCase().includes(searchQuery)) {
            uniqueCategories.add(cat)
          }
        })
      })

      suggestions.push(
        ...Array.from(uniqueCategories).slice(0, 5).map(cat => ({
          type: 'category',
          value: cat,
          label: `Category: ${cat}`,
        }))
      )
    }

    // Get location suggestions
    if (type === 'all' || type === 'locations') {
      const locations = await prisma.restaurant.findMany({
        where: {
          address: { contains: searchQuery, mode: 'insensitive' },
        },
        select: {
          address: true,
        },
        distinct: ['address'],
        take: 5,
      })

      // Extract city/area from addresses
      const uniqueLocations = new Set<string>()
      locations.forEach(l => {
        const parts = l.address.split(',')
        if (parts.length > 1) {
          const city = parts[parts.length - 2]?.trim()
          if (city && city.toLowerCase().includes(searchQuery)) {
            uniqueLocations.add(city)
          }
        }
      })

      suggestions.push(
        ...Array.from(uniqueLocations).slice(0, 3).map(loc => ({
          type: 'location',
          value: loc,
          label: `Location: ${loc}`,
        }))
      )
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}