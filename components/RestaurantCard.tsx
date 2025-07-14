import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, DollarSign, MessageSquare } from 'lucide-react'

interface RestaurantCardProps {
  restaurant: {
    id: string
    name: string
    description: string
    address: string
    priceRange: number
    categories: string[]
    coverImage?: string | null
    averageRating: number
    _count: {
      reviews: number
    }
  }
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const priceIndicator = '$'.repeat(restaurant.priceRange)
  
  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          {restaurant.coverImage ? (
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <DollarSign className="h-16 w-16" />
            </div>
          )}
          
          {/* Price indicator overlay */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md font-semibold">
            {priceIndicator}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {restaurant.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurant.description}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {restaurant.categories.slice(0, 3).map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
            {restaurant.categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{restaurant.categories.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
              <span className="font-semibold text-sm">
                {restaurant.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                ({restaurant._count.reviews})
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <MessageSquare className="h-4 w-4 mr-1" />
              {restaurant._count.reviews} reviews
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}