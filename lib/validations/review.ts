import { z } from 'zod'

export const createReviewSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant is required'),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(50, 'Review must be at least 50 characters').max(2000),
  visitDate: z.string().or(z.date()),
  pricePerPerson: z.number().positive().optional(),
  images: z.array(z.string()).max(10).optional(),
})

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  content: z.string().min(50).max(2000).optional(),
  visitDate: z.string().or(z.date()).optional(),
  pricePerPerson: z.number().positive().optional(),
  images: z.array(z.string()).max(10).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>