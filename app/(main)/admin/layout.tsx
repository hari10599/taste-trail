'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  LayoutDashboard, Users, Flag, FileText, Shield, 
  BarChart3, Settings, ChevronLeft, AlertTriangle, Bell, UserCheck, Building
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const userData = response.data.user
      if (userData.role !== 'ADMIN' && userData.role !== 'MODERATOR') {
        toast.error('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      setUser(userData)
      setIsAdmin(true)
    } catch (error) {
      console.error('Admin access check failed:', error)
      toast.error('Failed to verify admin access')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need administrator privileges to access this area.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin',
      description: 'Platform overview & analytics'
    },
    {
      label: 'Users',
      icon: Users,
      href: '/admin/users',
      description: 'User management & roles'
    },
    {
      label: 'Reports',
      icon: Flag,
      href: '/admin/reports',
      description: 'User reports & complaints'
    },
    {
      label: 'Influencer Applications',
      icon: UserCheck,
      href: '/admin/influencer-applications',
      description: 'Review influencer applications'
    },
    {
      label: 'Restaurant Claims',
      icon: Building,
      href: '/admin/restaurant-claims',
      description: 'Review restaurant ownership claims'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-primary mr-6">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to App
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-500">Taste Trail Administration</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">
                  {user?.role === 'ADMIN' ? 'A' : 'M'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block p-3 rounded-lg transition ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Role Badge */}
            <div className="mt-8 p-4 bg-white rounded-lg border">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Moderator'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'ADMIN' 
                  ? 'Full system access' 
                  : 'Content moderation access'
                }
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}