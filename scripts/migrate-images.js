// Script to migrate seed data images to ImageKit
const fs = require('fs')
const path = require('path')

// Sample restaurant images that we'll use for seeding
const restaurantImages = [
  // Restaurant cover images
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant interior
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', // Fine dining
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop', // Pizza restaurant
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop', // Sushi restaurant
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&h=600&fit=crop', // Bistro
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', // Café
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=600&fit=crop', // Modern restaurant
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop', // Burger joint
  'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&h=600&fit=crop', // Mexican restaurant
  'https://images.unsplash.com/photo-1552566589-73db2b7b4d7d?w=800&h=600&fit=crop', // Asian fusion
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop', // Steakhouse
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', // Ramen bar
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Breakfast place
  'https://images.unsplash.com/photo-1564758564527-b97d79cb27c1?w=800&h=600&fit=crop', // Bakery
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800&h=600&fit=crop', // Wine bar
  // Additional restaurant images for more variety
  'https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?w=800&h=600&fit=crop', // Outdoor dining
  'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=800&h=600&fit=crop', // Cozy restaurant
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop', // Bar atmosphere
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', // Fast casual
  'https://images.unsplash.com/photo-1586999082263-990bbc18277c?w=800&h=600&fit=crop', // Coffee shop
]

// Food images for reviews
const foodImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop', // Burger
  'https://images.unsplash.com/photo-1555396273-3c3b2b4c61b8?w=800&h=600&fit=crop', // Pizza
  'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800&h=600&fit=crop', // Sushi
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop', // Pasta
  'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&h=600&fit=crop', // Steak
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop', // Tacos
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', // Ramen
  'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&h=600&fit=crop', // Salad
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=600&fit=crop', // Sandwich
  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop', // Dessert
  'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=600&fit=crop', // Soup
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', // Healthy bowl
  'https://images.unsplash.com/photo-1555939594-58e4c4c84abd?w=800&h=600&fit=crop', // Breakfast
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop', // Drink
  'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=800&h=600&fit=crop', // Appetizer
  // Additional food images for more variety
  'https://images.unsplash.com/photo-1565299585323-38174c973ddd?w=800&h=600&fit=crop', // Fried chicken
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', // Seafood
  'https://images.unsplash.com/photo-1573225342350-16731dd9bf3d?w=800&h=600&fit=crop', // Indian curry
  'https://images.unsplash.com/photo-1559054663-e2de03b7b43e?w=800&h=600&fit=crop', // Dim sum
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&h=600&fit=crop', // Bakery items
  'https://images.unsplash.com/photo-1587736500404-7f6e4e31c8c4?w=800&h=600&fit=crop', // BBQ ribs
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop', // Gourmet plating
  'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop', // Wine and cheese
  'https://images.unsplash.com/photo-1587736500404-7f6e4e31c8c4?w=800&h=600&fit=crop', // Street food
  'https://images.unsplash.com/photo-1564758564527-b97d79cb27c1?w=800&h=600&fit=crop', // Fresh pastries
]

// Generate ImageKit URLs for seed data
// Since we don't have actual ImageKit credentials set up, we'll use placeholder URLs
// that follow the ImageKit pattern but point to Unsplash images
function generateImageKitUrls() {
  const imageKitBaseUrl = 'https://ik.imagekit.io/tastetrail'
  
  const restaurantUrls = restaurantImages.map((_, index) => {
    const imageId = `restaurant-${index + 1}`
    return `${imageKitBaseUrl}/restaurants/${imageId}.webp`
  })
  
  const foodUrls = foodImages.map((_, index) => {
    const imageId = `food-${index + 1}`
    return `${imageKitBaseUrl}/reviews/${imageId}.webp`
  })
  
  return { restaurantUrls, foodUrls }
}

// Generate fallback URLs that use a reliable image service
function generateFallbackUrls() {
  const fallbackBaseUrl = 'https://picsum.photos'
  
  const restaurantUrls = Array.from({ length: 15 }, (_, index) => {
    const seed = 1000 + index
    return `${fallbackBaseUrl}/seed/${seed}/800/600`
  })
  
  const foodUrls = Array.from({ length: 15 }, (_, index) => {
    const seed = 2000 + index
    return `${fallbackBaseUrl}/seed/${seed}/800/600`
  })
  
  return { restaurantUrls, foodUrls }
}

// Create the updated image URLs - use Picsum Photos for now
const { restaurantUrls, foodUrls } = generateFallbackUrls()

// Cuisine-specific image mapping
const cuisineImageMap = {
  'Italian': {
    restaurants: [0, 1, 9], // Restaurant interior, Fine dining, Pizza restaurant
    foods: [1, 3] // Pizza, Pasta
  },
  'Chinese': {
    restaurants: [9, 6], // Asian fusion, Modern restaurant
    foods: [2, 10] // Sushi (Asian), Soup
  },
  'Japanese': {
    restaurants: [3, 9], // Sushi restaurant, Asian fusion
    foods: [2, 6] // Sushi, Ramen
  },
  'Indian': {
    restaurants: [6, 1], // Modern restaurant, Fine dining
    foods: [10, 11] // Soup, Healthy bowl
  },
  'Mexican': {
    restaurants: [8, 7], // Mexican restaurant, Burger joint
    foods: [5, 4] // Tacos, Steak
  },
  'Thai': {
    restaurants: [9, 6], // Asian fusion, Modern restaurant
    foods: [10, 7] // Soup, Salad
  },
  'French': {
    restaurants: [1, 14], // Fine dining, Wine bar
    foods: [9, 13] // Dessert, Drink
  },
  'American': {
    restaurants: [7, 10], // Burger joint, Steakhouse
    foods: [0, 4] // Burger, Steak
  },
  'Mediterranean': {
    restaurants: [1, 4], // Fine dining, Bistro
    foods: [7, 11] // Salad, Healthy bowl
  },
  'Korean': {
    restaurants: [9, 6], // Asian fusion, Modern restaurant
    foods: [6, 2] // Ramen, Sushi
  }
}

// Export the URLs for use in seed file
module.exports = {
  restaurantImages: restaurantUrls,
  foodImages: foodUrls,
  cuisineImageMap: cuisineImageMap,
  
  // Helper function to get a random restaurant image
  getRandomRestaurantImage: () => {
    return restaurantUrls[Math.floor(Math.random() * restaurantUrls.length)]
  },
  
  // Helper function to get cuisine-specific restaurant image
  getCuisineRestaurantImage: (cuisine) => {
    // For now, just return random Picsum images
    return restaurantUrls[Math.floor(Math.random() * restaurantUrls.length)]
  },
  
  // Helper function to get a random food image
  getRandomFoodImage: () => {
    return foodUrls[Math.floor(Math.random() * foodUrls.length)]
  },
  
  // Helper function to get cuisine-specific food images
  getCuisineFoodImages: (cuisine, count = 2) => {
    // For now, just return random Picsum images
    const shuffled = [...foodUrls].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  },
  
  // Helper function to get multiple random food images (backward compatibility)
  getRandomFoodImages: (count = 2) => {
    const shuffled = [...foodUrls].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }
}

// If run directly, output the URLs for manual use
if (require.main === module) {
  console.log('Restaurant Images (Picsum):')
  restaurantUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`)
  })
  
  console.log('\nFood Images (Picsum):')
  foodUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`)
  })
}