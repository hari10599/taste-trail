import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Auto-seed function that runs on server start
export async function autoSeedDatabase() {
  // Only run in production when AUTO_SEED is true
  if (process.env.NODE_ENV !== 'production' || process.env.AUTO_SEED !== 'true') {
    return
  }

  try {
    console.log('🌱 Checking if database needs seeding...')
    
    // Check if database is already seeded
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      console.log('✅ Database already seeded, skipping...')
      return
    }

    console.log('🚀 Starting automatic database seed...')

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
    const restaurantData = [
      {
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
      },
      {
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
      },
      {
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
    ]

    const restaurants = await Promise.all(
      restaurantData.map(data => prisma.restaurant.create({ data }))
    )

    console.log('✅ Auto-seed completed successfully!')
    console.log('📧 Admin: admin@tastetrail.com / TasteTrail2025!')
    console.log('📧 Demo: demo@tastetrail.com / demo123')
    console.log(`🍽️  Created ${restaurants.length} sample restaurants`)

    // Disable auto-seed after first run
    console.log('💡 Tip: Set AUTO_SEED=false to prevent re-seeding')

  } catch (error) {
    console.error('❌ Auto-seed failed:', error)
    // Don't throw - let the app continue starting
  }
}