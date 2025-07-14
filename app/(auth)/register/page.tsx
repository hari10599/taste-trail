'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/auth/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const roleOptions = [
  { value: 'USER', label: 'Food Enthusiast' },
  { value: 'INFLUENCER', label: 'Food Influencer' },
  { value: 'OWNER', label: 'Restaurant Owner' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'USER',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/auth/register', data)
      
      // Store access token in localStorage
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken)
        
        // Also set as cookie for middleware
        document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`
      }
      
      toast.success('Account created successfully!')
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.error || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-xl animate-fade-in">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Join Taste Trail and start sharing your food experiences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />
          
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
          
          <Select
            label="I am a..."
            options={roleOptions}
            error={errors.role?.message}
            {...register('role')}
          />
          
          {selectedRole === 'INFLUENCER' && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                You'll need to verify your influencer status after registration by connecting your social media accounts.
              </p>
            </div>
          )}
          
          {selectedRole === 'OWNER' && (
            <div className="p-3 bg-green-50 rounded-lg flex items-start space-x-2">
              <Info className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">
                You'll be able to claim and manage your restaurants after registration.
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
          
          <p className="text-xs text-gray-600 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}