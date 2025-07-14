import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// GET /api/restaurants/nearby - Get nearby restaurants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '10') // Default 10km radius
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const maxPrice = parseInt(searchParams.get('maxPrice') || '4')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Build filters
    const filters: any = {
      latitude: {
        gte: lat - (radius / 111), // Rough conversion: 1 degree ≈ 111 km
        lte: lat + (radius / 111)
      },
      longitude: {
        gte: lng - (radius / (111 * Math.cos(lat * Math.PI / 180))),
        lte: lng + (radius / (111 * Math.cos(lat * Math.PI / 180)))
      },
      priceRange: {
        lte: maxPrice
      }
    }

    if (category) {
      filters.categories = {
        has: category
      }
    }

    // Get restaurants within rough bounding box
    const restaurants = await prisma.restaurant.findMany({
      where: filters,
      include: {
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      take: limit * 2 // Get more to filter by exact distance
    })

    // Calculate exact distances and filter by rating
    const nearbyRestaurants = restaurants
      .map(restaurant => {
        const distance = calculateDistance(lat, lng, restaurant.latitude, restaurant.longitude)
        const avgRating = restaurant.reviews.length > 0 
          ? restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) / restaurant.reviews.length
          : 0
        
        return {
          ...restaurant,
          distance,
          avgRating,
          reviewCount: restaurant._count.reviews
        }
      })
      .filter(restaurant => 
        restaurant.distance <= radius && 
        restaurant.avgRating >= minRating
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return NextResponse.json({
      restaurants: nearbyRestaurants,
      center: { lat, lng },
      radius,
      total: nearbyRestaurants.length
    })
  } catch (error) {
    console.error('Nearby restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby restaurants' },
      { status: 500 }
    )
  }
}

// POST /api/restaurants/nearby - Batch get restaurants by IDs (for map clustering)
export async function POST(request: NextRequest) {
  try {
    const { restaurantIds } = await request.json()
    
    if (!restaurantIds || !Array.isArray(restaurantIds)) {
      return NextResponse.json(
        { error: 'Restaurant IDs array is required' },
        { status: 400 }
      )
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        id: { in: restaurantIds }
      },
      include: {
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    const restaurantsWithRatings = restaurants.map(restaurant => {
      const avgRating = restaurant.reviews.length > 0 
        ? restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) / restaurant.reviews.length
        : 0
      
      return {
        ...restaurant,
        avgRating,
        reviewCount: restaurant._count.reviews
      }
    })

    return NextResponse.json({
      restaurants: restaurantsWithRatings
    })
  } catch (error) {
    console.error('Batch restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}