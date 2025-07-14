import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { 
  restaurantImages, 
  foodImages, 
  getCuisineRestaurantImage, 
  getCuisineFoodImages,
  getRandomFoodImages 
} from '../scripts/migrate-images.js'

const prisma = new PrismaClient()

// Sample data
const cuisineTypes = ['Italian', 'Chinese', 'Japanese', 'Indian', 'Mexican', 'Thai', 'French', 'American', 'Mediterranean', 'Korean']
const amenities = ['WiFi', 'Parking', 'Outdoor Seating', 'Pet Friendly', 'Wheelchair Accessible', 'Bar', 'Live Music', 'Private Dining']

const sampleReviews = [
  "Amazing experience! The food was absolutely delicious and the service was impeccable.",
  "Great atmosphere and friendly staff. The pasta was cooked to perfection.",
  "A hidden gem! Every dish we tried was bursting with flavor.",
  "Perfect for date night. Romantic ambiance and excellent wine selection.",
  "The chef's special was outstanding. Will definitely come back!",
  "Fresh ingredients and authentic flavors. Highly recommend!",
  "Fantastic brunch spot. The pancakes were fluffy and delicious.",
  "Impressive menu variety. Something for everyone!",
  "The desserts are to die for! Save room for the chocolate lava cake.",
  "Excellent value for money. Generous portions and great taste."
]

const restaurantNames = [
  "The Golden Fork", "Bella Vista", "Sakura Garden", "Spice Route", "The Rustic Table",
  "Ocean's Bounty", "The Hungry Bear", "Café Lumière", "Nonna's Kitchen", "The Green Leaf",
  "Fire & Ice Grill", "The Cozy Corner", "Sunset Terrace", "The Artisan's Plate", "Bamboo House"
]

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.like.deleteMany()
  await prisma.review.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.session.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const users = []
  
  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tastetrail.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      verified: true,
      emailVerified: new Date(),
      avatar: 'https://i.pravatar.cc/150?img=1',
      bio: 'Platform administrator',
      profile: {
        create: {
          location: 'San Francisco, CA',
          dietaryPrefs: []
        }
      }
    }
  })
  users.push(admin)

  // Create influencers
  for (let i = 1; i <= 10; i++) {
    const password = await bcrypt.hash('password123', 10)
    const influencer = await prisma.user.create({
      data: {
        email: `influencer${i}@example.com`,
        password,
        name: `Food Influencer ${i}`,
        role: UserRole.INFLUENCER,
        verified: true,
        emailVerified: new Date(),
        avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
        bio: `Food blogger with ${10 + i}k followers. Love exploring new cuisines!`,
        profile: {
          create: {
            location: 'Los Angeles, CA',
            dietaryPrefs: ['Vegetarian', 'Gluten-Free'].slice(0, i % 3),
            socialLinks: {
              instagram: `@foodie${i}`,
              youtube: `FoodChannel${i}`,
              tiktok: `@tastehunter${i}`
            },
            followerCount: (10 + i) * 1000
          }
        }
      }
    })
    users.push(influencer)
  }

  // Create restaurant owners
  const owners = []
  for (let i = 1; i <= 5; i++) {
    const password = await bcrypt.hash('password123', 10)
    const owner = await prisma.user.create({
      data: {
        email: `owner${i}@example.com`,
        password,
        name: `Restaurant Owner ${i}`,
        role: UserRole.OWNER,
        verified: true,
        emailVerified: new Date(),
        avatar: `https://i.pravatar.cc/150?img=${i + 20}`,
        bio: 'Passionate restaurant owner dedicated to great food and service.',
        profile: {
          create: {
            location: 'New York, NY',
            phone: `555-010${i}`,
            dietaryPrefs: []
          }
        }
      }
    })
    owners.push(owner)
    users.push(owner)
  }

  // Create regular users
  for (let i = 1; i <= 30; i++) {
    const password = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        password,
        name: `Food Lover ${i}`,
        role: UserRole.USER,
        verified: i % 3 === 0, // Every third user is verified
        emailVerified: i % 3 === 0 ? new Date() : null,
        avatar: `https://i.pravatar.cc/150?img=${i + 30}`,
        bio: i % 2 === 0 ? 'Love trying new restaurants!' : null,
        profile: {
          create: {
            location: ['San Francisco, CA', 'Los Angeles, CA', 'New York, NY', 'Chicago, IL'][i % 4],
            dietaryPrefs: i % 4 === 0 ? ['Vegan'] : i % 3 === 0 ? ['Vegetarian'] : []
          }
        }
      }
    })
    users.push(user)
  }

  // Create restaurants
  const restaurants = []
  for (let i = 0; i < 100; i++) {
    const restaurantOwner = i < 15 ? owners[i % 5] : null
    const cuisine = cuisineTypes[i % cuisineTypes.length]
    const restaurant = await prisma.restaurant.create({
      data: {
        name: `${restaurantNames[i % restaurantNames.length]} ${i > 14 ? i : ''}`,
        description: `A wonderful ${cuisine} restaurant offering authentic dishes and great ambiance.`,
        address: `${100 + i} Main Street, San Francisco, CA 94102`,
        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
        phone: `555-${String(i).padStart(4, '0')}`,
        website: i % 3 === 0 ? `https://restaurant${i}.com` : null,
        priceRange: (i % 4) + 1,
        categories: [cuisine, i % 2 === 0 ? 'Fine Dining' : 'Casual Dining'],
        amenities: amenities.slice(0, 3 + (i % 4)),
        coverImage: getCuisineRestaurantImage(cuisine),
        images: [
          getCuisineRestaurantImage(cuisine),
          restaurantImages[(i + 1) % restaurantImages.length],
          restaurantImages[(i + 2) % restaurantImages.length]
        ],
        openingHours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '23:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '21:00' }
        },
        verified: restaurantOwner !== null,
        ownerId: restaurantOwner?.id
      }
    })
    restaurants.push(restaurant)
  }

  // Create reviews
  const reviews = []
  for (let i = 0; i < 500; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)]
    const rating = Math.floor(Math.random() * 3) + 3 // Bias towards positive reviews (3-5)
    
    // Get cuisine from restaurant categories
    const restaurantCuisine = restaurant.categories.find(cat => cuisineTypes.includes(cat)) || 'American'
    
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        rating,
        title: rating >= 4 ? 'Great experience!' : rating === 3 ? 'Decent meal' : 'Could be better',
        content: sampleReviews[i % sampleReviews.length],
        visitDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
        pricePerPerson: Math.floor(Math.random() * 50) + 20,
        images: i % 3 === 0 ? getCuisineFoodImages(restaurantCuisine, 2) : [],
        helpful: Math.floor(Math.random() * 50),
        notHelpful: Math.floor(Math.random() * 10),
        isPromoted: i % 20 === 0 && user.role === UserRole.OWNER
      }
    })
    reviews.push(review)
  }

  // Create likes
  for (let i = 0; i < 2000; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const review = reviews[Math.floor(Math.random() * reviews.length)]
    
    try {
      await prisma.like.create({
        data: {
          userId: user.id,
          reviewId: review.id
        }
      })
    } catch (error) {
      // Ignore duplicate likes
    }
  }

  // Create comments
  for (let i = 0; i < 1000; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const review = reviews[Math.floor(Math.random() * reviews.length)]
    
    const comments = [
      "Totally agree with your review!",
      "Thanks for the recommendation!",
      "I had a similar experience.",
      "Can't wait to try this place!",
      "The photos look amazing!",
      "What dish would you recommend?",
      "Great review, very helpful!",
      "I've been there too, loved it!",
      "Thanks for sharing your experience.",
      "This is now on my must-visit list!"
    ]
    
    await prisma.comment.create({
      data: {
        userId: user.id,
        reviewId: review.id,
        content: comments[i % comments.length]
      }
    })
  }

  // Create some notifications
  for (const user of users.slice(0, 10)) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'welcome',
        title: 'Welcome to Taste Trail!',
        message: 'Start exploring amazing restaurants and sharing your experiences.',
        data: {}
      }
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`Created:
  - ${users.length} users (1 admin, 10 influencers, 5 owners, 30 regular users)
  - ${restaurants.length} restaurants
  - ${reviews.length} reviews
  - Thousands of likes and comments`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })