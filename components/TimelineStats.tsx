'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Users, Star, MessageSquare } from 'lucide-react'
import axios from 'axios'

interface TimelineStats {
  totalReviews: number
  todayReviews: number
  activeUsers: number
  avgRating: number
}

export function TimelineStats() {
  const [stats, setStats] = useState<TimelineStats>({
    totalReviews: 0,
    todayReviews: 0,
    activeUsers: 0,
    avgRating: 0,
  })
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/timeline/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch timeline stats:', error)
    }
  }
  
  const statCards = [
    {
      label: 'Total Reviews',
      value: stats.totalReviews.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Today\'s Reviews',
      value: stats.todayReviews.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Avg Rating',
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}