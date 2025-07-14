'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Navigation, Star, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

// Dynamically import React Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

interface Restaurant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  categories: string[]
  priceRange: number
  coverImage?: string
  phone?: string
  avgRating: number
  reviewCount: number
  distance?: number
  openingHours?: any
}

interface RestaurantMapProps {
  restaurants?: Restaurant[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  showSearch?: boolean
  showFilters?: boolean
  onRestaurantClick?: (restaurant: Restaurant) => void
}

// Custom restaurant marker component
function RestaurantMarker({ restaurant, onRestaurantClick }: { 
  restaurant: Restaurant
  onRestaurantClick?: (restaurant: Restaurant) => void 
}) {
  // Create custom icon with rating
  const createCustomIcon = (rating: number) => {
    // Import Leaflet only on client side
    const L = typeof window !== 'undefined' ? require('leaflet') : null
    if (!L) return null
    const ratingDisplay = rating > 0 ? rating.toFixed(1) : '?'
    const iconHtml = `
      <div style="
        width: 32px;
        height: 32px;
        background: #FF6B6B;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        border: 2px solid white;
        pointer-events: auto;
        transition: transform 0.2s ease;
      " 
      onmouseover="this.style.transform='scale(1.1)'" 
      onmouseout="this.style.transform='scale(1)'">
        ${ratingDisplay}
      </div>
    `
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-restaurant-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    })
  }

  const handleMarkerClick = () => {
    if (onRestaurantClick) {
      onRestaurantClick(restaurant)
    }
  }

  return (
    <Marker
      position={[restaurant.latitude, restaurant.longitude]}
      icon={createCustomIcon(restaurant.avgRating)}
      eventHandlers={{
        click: handleMarkerClick,
        mouseover: (e) => {
          e.target.openPopup()
        }
      }}
    >
      <Popup>
        <div className="min-w-[250px] max-w-[300px]">
          <div className="flex items-start gap-3 mb-3">
            {restaurant.coverImage && (
              <img
                src={restaurant.coverImage}
                alt={restaurant.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">{restaurant.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" />
                {restaurant.address}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">
                {restaurant.avgRating > 0 ? restaurant.avgRating.toFixed(1) : 'No rating'}
              </span>
              <span className="text-xs text-gray-500">
                ({restaurant.reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{'$'.repeat(restaurant.priceRange)}</span>
            </div>
          </div>
          
          {restaurant.distance && (
            <p className="text-sm text-gray-500 mb-3">
              {restaurant.distance.toFixed(1)} km away
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {restaurant.categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
            <Link href={`/restaurants/${restaurant.id}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="ml-2">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}


export function RestaurantMap({
  restaurants = [],
  center = { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom = 12,
  height = '500px',
  showSearch = true,
  showFilters = true,
  onRestaurantClick
}: RestaurantMapProps) {
  const [mapRestaurants, setMapRestaurants] = useState<Restaurant[]>(restaurants)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([center.lat, center.lng])
  const [mapZoom, setMapZoom] = useState(zoom)
  const [filters, setFilters] = useState({
    radius: 10,
    category: '',
    minRating: 0,
    maxPrice: 4
  })

  // Ensure we're on the client side before rendering the map
  useEffect(() => {
    setIsClient(true)
    
    // Initialize Leaflet icon defaults on client side
    if (typeof window !== 'undefined') {
      const L = require('leaflet')
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    }
  }, [])

  // Update restaurants when prop changes
  useEffect(() => {
    setMapRestaurants(restaurants)
  }, [restaurants])

  // Fetch nearby restaurants
  const fetchNearbyRestaurants = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: filters.radius.toString(),
        limit: '50'
      })

      if (filters.category) params.append('category', filters.category)
      if (filters.minRating > 0) params.append('minRating', filters.minRating.toString())
      if (filters.maxPrice < 4) params.append('maxPrice', filters.maxPrice.toString())

      const response = await axios.get(`/api/restaurants/nearby?${params}`)
      setMapRestaurants(response.data.restaurants)
    } catch (error) {
      console.error('Failed to fetch nearby restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setMapCenter([latitude, longitude])
          setMapZoom(14)
          if (showSearch) {
            fetchNearbyRestaurants(latitude, longitude)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Price range display
  const getPriceDisplay = (priceRange: number) => {
    return '$'.repeat(priceRange)
  }

  // Handle restaurant marker click
  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    if (onRestaurantClick) {
      onRestaurantClick(restaurant)
    }
  }

  // Show loading state on server side or before client hydration
  if (!isClient) {
    return (
      <div 
        className="w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        className="w-full rounded-lg overflow-hidden z-0"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          {userLocation && typeof window !== 'undefined' && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={(() => {
                const L = require('leaflet')
                return L.divIcon({
                  html: `
                    <div style="
                      width: 16px;
                      height: 16px;
                      background: #4285f4;
                      border-radius: 50%;
                      border: 3px solid white;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    "></div>
                  `,
                  className: 'user-location-marker',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })
              })()}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}
          
          {/* Restaurant markers */}
          {mapRestaurants.map(restaurant => (
            <RestaurantMarker
              key={restaurant.id}
              restaurant={restaurant}
              onRestaurantClick={handleRestaurantClick}
            />
          ))}
        </MapContainer>
      </div>

      {/* Controls */}
      {showSearch && (
        <div className="absolute top-4 left-4 space-y-2" style={{ zIndex: 1000 }}>
          <Button
            onClick={getUserLocation}
            className="bg-white hover:bg-gray-50 text-gray-900 border shadow-lg"
            size="sm"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Find Me
          </Button>
          {loading && (
            <div className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-lg flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading restaurants...
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs" style={{ zIndex: 1000 }}>
          <h3 className="font-semibold mb-3">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Radius (km)</label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-xs text-gray-500">{filters.radius} km</span>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full mt-1 px-2 py-1 border rounded text-sm"
              >
                <option value="">All Categories</option>
                <option value="Italian">Italian</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Indian">Indian</option>
                <option value="Mexican">Mexican</option>
                <option value="American">American</option>
                <option value="Thai">Thai</option>
                <option value="French">French</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Min Rating</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-xs text-gray-500">{filters.minRating}+ stars</span>
            </div>
            <div>
              <label className="text-sm font-medium">Max Price</label>
              <input
                type="range"
                min="1"
                max="4"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
              <span className="text-xs text-gray-500">{getPriceDisplay(filters.maxPrice)}</span>
            </div>
            <Button
              onClick={() => {
                if (userLocation) {
                  fetchNearbyRestaurants(userLocation.lat, userLocation.lng)
                }
              }}
              className="w-full"
              size="sm"
              disabled={!userLocation}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Restaurant Popup */}
      {selectedRestaurant && (
        <div className="absolute bottom-4 left-4 right-4" style={{ zIndex: 1000 }}>
          <Card className="shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {selectedRestaurant.coverImage && (
                  <img
                    src={selectedRestaurant.coverImage}
                    alt={selectedRestaurant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedRestaurant.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedRestaurant.address}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRestaurant(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">
                        {selectedRestaurant.avgRating > 0 ? selectedRestaurant.avgRating.toFixed(1) : 'No rating'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({selectedRestaurant.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{getPriceDisplay(selectedRestaurant.priceRange)}</span>
                    </div>
                    {selectedRestaurant.distance && (
                      <span className="text-sm text-gray-500">
                        {selectedRestaurant.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedRestaurant.categories.slice(0, 2).map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    <Link href={`/restaurants/${selectedRestaurant.id}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="ml-auto">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}