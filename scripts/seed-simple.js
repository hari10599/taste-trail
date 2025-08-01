#!/usr/bin/env node

/**
 * Simple seed script for production
 * Run with: node scripts/seed-simple.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simple seed...')

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@tastetrail.com' }
    })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping...')
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('TasteTrail2025!', 10)
      
      const admin = await prisma.user.create({
        data: {
          email: 'admin@tastetrail.com',
          password: hashedPassword,
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
      
      console.log('✅ Admin user created!')
      console.log('📧 Email: admin@tastetrail.com')
      console.log('🔑 Password: TasteTrail2025!')
    }

    // Create sample regular user
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@tastetrail.com' }
    })

    if (existingUser) {
      console.log('⚠️  Demo user already exists, skipping...')
    } else {
      const userPassword = await bcrypt.hash('demo123', 10)
      
      const user = await prisma.user.create({
        data: {
          email: 'demo@tastetrail.com',
          password: userPassword,
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
      
      console.log('✅ Demo user created!')
      console.log('📧 Email: demo@tastetrail.com')
      console.log('🔑 Password: demo123')
    }

    // Create sample owner user
    const existingOwner = await prisma.user.findUnique({
      where: { email: 'owner@tastetrail.com' }
    })

    let ownerId = null
    if (existingOwner) {
      console.log('⚠️  Owner user already exists, skipping...')
      ownerId = existingOwner.id
    } else {
      const ownerPassword = await bcrypt.hash('owner123', 10)
      
      const owner = await prisma.user.create({
        data: {
          email: 'owner@tastetrail.com',
          password: ownerPassword,
          name: 'Restaurant Owner',
          role: 'OWNER',
          verified: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
          profile: {
            create: {
              bio: 'Restaurant owner and culinary enthusiast',
              location: 'San Francisco, CA'
            }
          }
        }
      })
      
      ownerId = owner.id
      console.log('✅ Owner user created!')
      console.log('📧 Email: owner@tastetrail.com')
      console.log('🔑 Password: owner123')
    }

    // Create a few sample restaurants
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
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        ownerId: ownerId, // Assign owner to first restaurant
        verified: true
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

    console.log('\n🍽️  Creating sample restaurants...')
    
    for (const data of restaurantData) {
      const existing = await prisma.restaurant.findFirst({
        where: { name: data.name }
      })

      if (existing) {
        console.log(`⚠️  Restaurant "${data.name}" already exists, skipping...`)
      } else {
        await prisma.restaurant.create({ data })
        console.log(`✅ Created restaurant: ${data.name}`)
      }
    }

    console.log('\n🎉 Seed completed successfully!')
    console.log('\n📝 Summary:')
    console.log('- Admin account: admin@tastetrail.com / TasteTrail2025!')
    console.log('- Demo account: demo@tastetrail.com / demo123')
    console.log('- Owner account: owner@tastetrail.com / owner123')
    console.log('- Sample restaurants added (Golden Gate Bistro is owned by owner@tastetrail.com)')
    console.log('\n🚀 Your Taste Trail platform is ready!')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })