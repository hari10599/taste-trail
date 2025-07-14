/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['randomuser.me', 'images.unsplash.com', 'i.pravatar.cc', 'ik.imagekit.io', 'api.dicebear.com', 'picsum.photos'],
  },
  // Enable instrumentation for auto-seeding
  experimental: {
    instrumentationHook: true,
    optimizePackageImports: ['lucide-react', 'react-leaflet'],
  },
}

module.exports = nextConfig