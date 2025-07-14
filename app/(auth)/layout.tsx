import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-light via-white to-light">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-gradient">Taste Trail</span>
            </div>
          </Link>
          {children}
        </div>
      </div>
      
      {/* Right side - Image/Pattern */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary to-secondary">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <h2 className="text-4xl font-bold mb-4 text-center">
            Discover Amazing Restaurants
          </h2>
          <p className="text-xl text-center max-w-md">
            Join our community of food enthusiasts and share your dining experiences with the world.
          </p>
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  )
}