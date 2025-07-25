'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, MapPin, Clock, User, LogOut, Menu, X, Star, Map, Building, ChevronDown, Shield } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { SearchInput } from '@/components/ui/search-input'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        setIsUserMenuOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isUserMenuOpen])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setUser(response.data.user)
        setIsAuthenticated(true)
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
      localStorage.removeItem('accessToken')
      // Clear the cookie as well
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      toast.success('Logged out successfully')
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white to-light">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-xl font-bold text-gradient">Taste Trail</span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8 ml-10">
                <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2 text-gray-700 hover:text-primary transition">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link href="/restaurants" className="flex items-center space-x-2 text-gray-700 hover:text-primary transition">
                  <MapPin className="h-4 w-4" />
                  <span>Restaurants</span>
                </Link>
                <Link href="/map" className="flex items-center space-x-2 text-gray-700 hover:text-primary transition">
                  <Map className="h-4 w-4" />
                  <span>Map</span>
                </Link>
                <Link href="/timeline" className="flex items-center space-x-2 text-gray-700 hover:text-primary transition">
                  <Clock className="h-4 w-4" />
                  <span>Timeline</span>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchInput className="hidden md:block" />
              {isAuthenticated && user ? (
                <div className="hidden md:flex items-center space-x-4">
                  <NotificationBell />
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUserMenuOpen(!isUserMenuOpen)
                      }}
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary transition px-3 py-2 rounded-md hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden lg:block">{user.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                        <div className="py-1">
                          <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>Profile Settings</span>
                            </div>
                          </Link>
                          <Link href={`/users/${user.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>View My Profile</span>
                            </div>
                          </Link>
                          {user?.role !== 'INFLUENCER' && (
                            <Link href="/influencer/apply" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4" />
                                <span>Become Influencer</span>
                              </div>
                            </Link>
                          )}
                          {user?.role === 'INFLUENCER' && (
                            <Link href="/influencer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4" />
                                <span>Influencer Dashboard</span>
                              </div>
                            </Link>
                          )}
                          {user?.role === 'OWNER' && (
                            <Link href="/owner" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4" />
                                <span>Owner Dashboard</span>
                              </div>
                            </Link>
                          )}
                          {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                            <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4" />
                                <span>Admin Dashboard</span>
                              </div>
                            </Link>
                          )}
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <div className="flex items-center space-x-2">
                              <LogOut className="h-4 w-4" />
                              <span>Sign Out</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-4">
                  <Link href="/login">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
              
              {/* Mobile menu button */}
              <button
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="px-3 py-2">
                <SearchInput isMobile placeholder="Search Taste Trail..." />
              </div>
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Home
              </Link>
              <Link href="/restaurants" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Restaurants
              </Link>
              <Link href="/map" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Map
              </Link>
              <Link href="/timeline" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Timeline
              </Link>
              {isAuthenticated && user ? (
                <>
                  <hr className="my-2" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account
                  </div>
                  <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Profile Settings
                  </Link>
                  <Link href={`/users/${user.id}`} className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    View My Profile
                  </Link>
                  {user?.role !== 'INFLUENCER' && (
                    <Link href="/influencer/apply" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                      Become Influencer
                    </Link>
                  )}
                  {user?.role === 'OWNER' && (
                    <Link href="/owner" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                      Owner Dashboard
                    </Link>
                  )}
                  {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                    <Link href="/admin" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <Link href="/login" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Sign In
                  </Link>
                  <Link href="/register" className="block px-3 py-2 text-primary hover:bg-primary/10 rounded-md font-semibold">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}