import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

// IMPORTANT: This is a one-time seed endpoint
// DELETE this file after seeding your database!

export async function POST(request: NextRequest) {
  try {
    // Check for seed secret in header
    const seedSecret = request.headers.get('x-seed-secret')
    
    // You must set SEED_SECRET in Render environment variables
    if (!process.env.SEED_SECRET || seedSecret !== process.env.SEED_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid seed secret' },
        { status: 401 }
      )
    }

    console.log('Starting database seed...')

    // Check if already seeded
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@tastetrail.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Database already seeded',
        warning: 'Admin user already exists'
      })
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('TasteTrail2025!', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@tastetrail.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        verified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        profile: {
          create: {
            bio: 'Platform Administrator',
            location: 'San Francisco, CA'
          }
        }
      }
    })

    // Create demo user
    const demoPassword = await bcrypt.hash('demo123', 10)
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@tastetrail.com',
        password: demoPassword,
        name: 'Demo User',
        role: 'USER',
        verified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        profile: {
          create: {
            bio: 'Food enthusiast and reviewer',
            location: 'San Francisco, CA',
            cuisinePreferences: ['Italian', 'Japanese', 'Mexican']
          }
        }
      }
    })

    // Create sample restaurants
    const restaurants = await Promise.all([
      prisma.restaurant.create({
        data: {
          name: 'The Golden Gate Bistro',
          description: 'A cozy bistro offering contemporary American cuisine with a California twist.',
          address: '123 Market St, San Francisco, CA 94103',
          latitude: 37.7749,
          longitude: -122.4194,
          phone: '(415) 555-0123',
          website: 'https://goldengatebistr.com',
          email: 'info@goldengatebistro.com',
          priceRange: 3,
          categories: ['American', 'Contemporary'],
          amenities: ['WiFi', 'Parking', 'Outdoor Seating'],
          openingHours: {
            monday: { open: '11:00', close: '22:00' },
            tuesday: { open: '11:00', close: '22:00' },
            wednesday: { open: '11:00', close: '22:00' },
            thursday: { open: '11:00', close: '22:00' },
            friday: { open: '11:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '21:00' }
          },
          images: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800'
          ],
          coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'
        }
      }),
      prisma.restaurant.create({
        data: {
          name: 'Sakura Sushi House',
          description: 'Authentic Japanese cuisine featuring fresh sushi and traditional dishes.',
          address: '456 California St, San Francisco, CA 94104',
          latitude: 37.7935,
          longitude: -122.4039,
          phone: '(415) 555-0456',
          website: 'https://sakurasushi.com',
          email: 'hello@sakurasushi.com',
          priceRange: 4,
          categories: ['Japanese', 'Sushi'],
          amenities: ['WiFi', 'Bar', 'Private Dining'],
          openingHours: {
            monday: { open: '11:30', close: '22:00' },
            tuesday: { open: '11:30', close: '22:00' },
            wednesday: { open: '11:30', close: '22:00' },
            thursday: { open: '11:30', close: '22:00' },
            friday: { open: '11:30', close: '23:00' },
            saturday: { open: '12:00', close: '23:00' },
            sunday: { open: '12:00', close: '21:00' }
          },
          images: [
            'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
            'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800'
          ],
          coverImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200'
        }
      }),
      prisma.restaurant.create({
        data: {
          name: 'Mama\'s Italian Kitchen',
          description: 'Family-owned restaurant serving traditional Italian recipes passed down through generations.',
          address: '789 North Beach, San Francisco, CA 94133',
          latitude: 37.8060,
          longitude: -122.4103,
          phone: '(415) 555-0789',
          website: 'https://mamasitalian.com',
          email: 'contact@mamasitalian.com',
          priceRange: 2,
          categories: ['Italian', 'Pizza', 'Pasta'],
          amenities: ['WiFi', 'Pet Friendly', 'Outdoor Seating'],
          openingHours: {
            monday: { closed: true },
            tuesday: { open: '12:00', close: '22:00' },
            wednesday: { open: '12:00', close: '22:00' },
            thursday: { open: '12:00', close: '22:00' },
            friday: { open: '12:00', close: '23:00' },
            saturday: { open: '11:00', close: '23:00' },
            sunday: { open: '11:00', close: '21:00' }
          },
          images: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'
          ],
          coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        admin: {
          email: 'admin@tastetrail.com',
          password: 'TasteTrail2025!',
          role: 'ADMIN'
        },
        demoUser: {
          email: 'demo@tastetrail.com',
          password: 'demo123',
          role: 'USER'
        },
        restaurantsCreated: restaurants.length
      },
      warning: '⚠️ DELETE THE /api/admin/seed ENDPOINT AFTER SEEDING!'
    })

  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { 
        error: 'Seed failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET method to check if seeding is needed
export async function GET(request: NextRequest) {
  try {
    const userCount = await prisma.user.count()
    const restaurantCount = await prisma.restaurant.count()
    
    return NextResponse.json({
      status: 'ready',
      database: {
        users: userCount,
        restaurants: restaurantCount,
        seeded: userCount > 0
      },
      message: userCount > 0 
        ? 'Database already has data' 
        : 'Database is empty - ready for seeding'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
}