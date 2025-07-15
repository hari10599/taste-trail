import { z } from 'zod'

export const createReviewSchema = z.object({
  rating: z.number().min(1, 'Please add a rating').max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(20, 'Review must be at least 20 characters'),
  visitDate: z.string(),
  pricePerPerson: z.number().positive().optional().nullable(),
  dishes: z.array(z.string()).optional(),
  images: z.array(z.string()).max(10).optional(),
})

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  content: z.string().min(20).optional(),
  visitDate: z.string().or(z.date()).optional(),
  pricePerPerson: z.number().positive().optional(),
  images: z.array(z.string()).max(10).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>

// For the API request
export interface CreateReviewRequest extends CreateReviewInput {
  restaurantId: string
}