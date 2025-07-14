'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Star, MessageSquare, Heart, TrendingUp, Users, Award } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalLikes: 0,
    totalComments: 0,
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUser(response.data.user)
      
      // Set stats from user data
      if (response.data.user._count) {
        setStats({
          totalReviews: response.data.user._count.reviews || 0,
          totalLikes: response.data.user._count.likes || 0,
          totalComments: response.data.user._count.comments || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your food journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Reviews
            </CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-gray-500">
              Share your dining experiences
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Likes
            </CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes}</div>
            <p className="text-xs text-gray-500">
              Reviews you've appreciated
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Comments
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-gray-500">
              Conversations started
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/restaurants">
              <Button className="w-full" variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Find Restaurants
              </Button>
            </Link>
            <Link href="/reviews/new">
              <Button className="w-full" variant="outline">
                <Star className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            </Link>
            <Link href="/timeline">
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Timeline
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific content */}
      {user?.role === 'INFLUENCER' && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-primary" />
              Influencer Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              As a verified influencer, you have access to special features and analytics.
            </p>
            <Button variant="secondary">
              View Influencer Stats
            </Button>
          </CardContent>
        </Card>
      )}

      {user?.role === 'OWNER' && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-600" />
              Restaurant Owner Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Manage your restaurants and respond to customer reviews.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              Manage Restaurants
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}