'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { 
  Star, MapPin, TrendingUp, Users, MessageSquare, 
  ArrowRight, ChefHat, Heart, Shield
} from 'lucide-react'
import axios from 'axios'

interface FeaturedRestaurant {
  id: string
  name: string
  coverImage?: string
  categories: string[]
  averageRating: number
  reviewCount: number
}

interface RecentReview {
  id: string
  rating: number
  content: string
  createdAt: string
  user: {
    name: string
    avatar?: string
    role: string
  }
  restaurant: {
    id: string
    name: string
  }
  _count: {
    likes: number
    comments: number
  }
}

export default function LandingPage() {
  const [featuredRestaurants, setFeaturedRestaurants] = useState<FeaturedRestaurant[]>([])
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalReviews: 0,
    totalUsers: 0,
  })
  
  useEffect(() => {
    fetchLandingData()
  }, [])
  
  const fetchLandingData = async () => {
    try {
      // Fetch featured restaurants
      const restaurantsRes = await axios.get('/api/restaurants?limit=6&sortBy=rating')
      setFeaturedRestaurants(restaurantsRes.data.restaurants)
      
      // Fetch recent reviews
      const reviewsRes = await axios.get('/api/reviews?limit=3&sortBy=createdAt')
      setRecentReviews(reviewsRes.data.reviews)
      
      // You could add a stats endpoint or calculate from the responses
      setStats({
        totalRestaurants: restaurantsRes.data.pagination.total || 100,
        totalReviews: reviewsRes.data.pagination.total || 500,
        totalUsers: 46, // This would come from a stats endpoint
      })
    } catch (error) {
      console.error('Failed to fetch landing data:', error)
    }
  }
  
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-xl font-bold text-gradient">Taste Trail</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/restaurants">
                <Button variant="ghost">Explore</Button>
              </Link>
              <Link href="/timeline">
                <Button variant="ghost">Timeline</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Discover Your Next
              <span className="text-gradient"> Favorite Restaurant</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of food enthusiasts sharing authentic reviews and discovering amazing dining experiences
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Join Taste Trail
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/restaurants">
                <Button size="lg" variant="outline" className="px-8">
                  Browse Restaurants
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats.totalRestaurants}+</div>
              <div className="text-gray-600">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats.totalReviews}+</div>
              <div className="text-gray-600">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats.totalUsers}+</div>
              <div className="text-gray-600">Food Lovers</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Taste Trail?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Authentic Reviews</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Real reviews from verified food enthusiasts and influencers you can trust
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">Vibrant Community</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Connect with fellow food lovers and discover trending restaurants
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Verified Owners</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Restaurant owners can respond to reviews and engage with customers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Featured Restaurants */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Restaurants</h2>
            <Link href="/restaurants">
              <Button variant="ghost">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-video relative overflow-hidden">
                    {restaurant.coverImage ? (
                      <img
                        src={restaurant.coverImage}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ChefHat className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{restaurant.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {restaurant.categories.slice(0, 2).map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{restaurant.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-600">{restaurant.reviewCount} reviews</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Recent Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent Reviews</h2>
            <Link href="/timeline">
              <Button variant="ghost">
                View Timeline
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {recentReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={review.user.avatar}
                        alt={review.user.name}
                        fallback={review.user.name}
                      />
                      <div>
                        <p className="font-semibold">{review.user.name}</p>
                        <Link 
                          href={`/restaurants/${review.restaurant.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {review.restaurant.name}
                        </Link>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 line-clamp-3 mb-4">{review.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {review._count.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {review._count.comments}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Share Your Food Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join our community of food enthusiasts and start discovering amazing restaurants today
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-xl font-bold">Taste Trail</span>
              </div>
              <p className="text-gray-400">
                Discover and share the best dining experiences
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/restaurants" className="hover:text-white">Restaurants</Link></li>
                <li><Link href="/timeline" className="hover:text-white">Timeline</Link></li>
                <li><Link href="/register" className="hover:text-white">Join Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Taste Trail. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}