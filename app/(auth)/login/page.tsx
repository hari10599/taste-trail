'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/auth/validation'
import { setToken } from '@/lib/auth/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [banError, setBanError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    // Check for ban error from middleware redirect
    const error = searchParams.get('error')
    if (error === 'banned') {
      setBanError('Your account has been banned. Please contact support for more information.')
      // Clear cookies just in case
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  }, [searchParams])

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/auth/login', data, {
        withCredentials: true // Ensure cookies are included
      })
      
      // Store access token in localStorage as backup
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken)
      }
      
      // Store notification data for NotificationBell component
      if (response.data.unreadNotificationCount !== undefined) {
        sessionStorage.setItem('loginNotificationData', JSON.stringify({
          unreadNotificationCount: response.data.unreadNotificationCount,
          timestamp: new Date().toISOString()
        }))
      }
      
      toast.success('Welcome back!')
      
      // Small delay to ensure cookies are set
      setTimeout(() => {
        // Get redirect URL from query params or default to dashboard
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect') || '/dashboard'
        
        // Force a hard navigation to ensure middleware doesn't interfere
        window.location.href = redirect
      }, 100)
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.error || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-xl animate-fade-in">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {banError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{banError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="john@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}