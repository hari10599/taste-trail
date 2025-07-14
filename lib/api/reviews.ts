import axios from 'axios'
import { getAuthHeader } from './auth'

export interface ReviewWithDetails {
  id: string
  rating: number
  title?: string
  content: string
  images: string[]
  dishes: string[]
  visitDate: string
  pricePerPerson?: number
  helpful: number
  notHelpful: number
  isPromoted: boolean
  isHidden: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  restaurant: {
    id: string
    name: string
    address: string
  }
  _count: {
    likes: number
    comments: number
  }
  ownerResponse?: {
    id: string
    content: string
    createdAt: string
    updatedAt: string
  }
  isLiked?: boolean
}

export async function getReviewsForRestaurant(
  restaurantId: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const response = await axios.get(
      `/api/restaurants/${restaurantId}/reviews?page=${page}&limit=${limit}`,
      {
        headers: await getAuthHeader(),
      }
    )
    return response.data
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    throw error
  }
}

export async function createReview(data: {
  restaurantId: string
  rating: number
  title?: string
  content: string
  images?: string[]
  dishes?: string[]
  visitDate: string
  pricePerPerson?: number
}) {
  try {
    const response = await axios.post('/api/reviews', data, {
      headers: await getAuthHeader(),
    })
    return response.data
  } catch (error) {
    console.error('Failed to create review:', error)
    throw error
  }
}

export async function likeReview(reviewId: string) {
  try {
    const response = await axios.post(
      `/api/reviews/${reviewId}/like`,
      {},
      {
        headers: await getAuthHeader(),
      }
    )
    return response.data
  } catch (error) {
    console.error('Failed to like review:', error)
    throw error
  }
}

export async function getOwnerResponse(reviewId: string) {
  try {
    const response = await axios.get(`/api/owner/reviews/${reviewId}/respond`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { response: null }
    }
    console.error('Failed to fetch owner response:', error)
    throw error
  }
}