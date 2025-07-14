import ImageKit from 'imagekit'

// Server-side ImageKit instance
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
})

// Client-side configuration
export const imagekitConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
  authenticationEndpoint: '/api/imagekit/auth',
}

export interface UploadOptions {
  file: File | Buffer | string
  fileName: string
  folder?: string
  tags?: string[]
  transformation?: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpg' | 'png' | 'webp' | 'avif'
    crop?: 'maintain_ratio' | 'force' | 'at_max' | 'at_least'
  }
}

export interface UploadResult {
  fileId: string
  name: string
  url: string
  thumbnailUrl: string
  filePath: string
  size: number
  width: number
  height: number
  fileType: string
}

// Upload file to ImageKit
export async function uploadImage(options: UploadOptions): Promise<UploadResult> {
  try {
    const uploadOptions: any = {
      file: options.file,
      fileName: options.fileName,
      folder: options.folder || '/taste-trail',
      tags: options.tags || [],
    }

    // Add transformation if provided
    if (options.transformation) {
      const { width, height, quality, format, crop } = options.transformation
      const transformations = []
      
      if (width || height) {
        transformations.push(`w-${width || 'auto'},h-${height || 'auto'}`)
      }
      if (quality) {
        transformations.push(`q-${quality}`)
      }
      if (format) {
        transformations.push(`f-${format}`)
      }
      if (crop) {
        transformations.push(`c-${crop}`)
      }
      
      if (transformations.length > 0) {
        uploadOptions.transformation = {
          pre: transformations.join(',')
        }
      }
    }

    const result = await imagekit.upload(uploadOptions)
    
    return {
      fileId: result.fileId,
      name: result.name,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      filePath: result.filePath,
      size: result.size,
      width: result.width,
      height: result.height,
      fileType: result.fileType,
    }
  } catch (error) {
    console.error('ImageKit upload error:', error)
    throw new Error('Failed to upload image')
  }
}

// Delete file from ImageKit
export async function deleteImage(fileId: string): Promise<void> {
  try {
    await imagekit.deleteFile(fileId)
  } catch (error) {
    console.error('ImageKit delete error:', error)
    throw new Error('Failed to delete image')
  }
}

// Generate optimized image URL
export function getOptimizedImageUrl(
  filePath: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpg' | 'png' | 'webp' | 'avif'
    crop?: 'maintain_ratio' | 'force' | 'at_max' | 'at_least'
  }
): string {
  const transformations = []
  
  if (options?.width || options?.height) {
    transformations.push(`w-${options.width || 'auto'},h-${options.height || 'auto'}`)
  }
  if (options?.quality) {
    transformations.push(`q-${options.quality}`)
  }
  if (options?.format) {
    transformations.push(`f-${options.format}`)
  }
  if (options?.crop) {
    transformations.push(`c-${options.crop}`)
  }
  
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || ''
  const transformation = transformations.length > 0 ? `tr:${transformations.join(',')}` : ''
  
  return `${urlEndpoint}/${transformation}${filePath}`
}

// Predefined image transformations
export const imageTransformations = {
  avatar: {
    small: { width: 40, height: 40, crop: 'force' as const, format: 'webp' as const },
    medium: { width: 80, height: 80, crop: 'force' as const, format: 'webp' as const },
    large: { width: 160, height: 160, crop: 'force' as const, format: 'webp' as const },
  },
  restaurant: {
    thumbnail: { width: 300, height: 200, crop: 'maintain_ratio' as const, format: 'webp' as const },
    card: { width: 400, height: 300, crop: 'maintain_ratio' as const, format: 'webp' as const },
    hero: { width: 1200, height: 600, crop: 'maintain_ratio' as const, format: 'webp' as const },
  },
  review: {
    thumbnail: { width: 200, height: 150, crop: 'maintain_ratio' as const, format: 'webp' as const },
    medium: { width: 400, height: 300, crop: 'maintain_ratio' as const, format: 'webp' as const },
    large: { width: 800, height: 600, crop: 'maintain_ratio' as const, format: 'webp' as const },
  },
}

// Helper function to get avatar URL
export function getAvatarUrl(filePath: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  return getOptimizedImageUrl(filePath, imageTransformations.avatar[size])
}

// Helper function to get restaurant image URL
export function getRestaurantImageUrl(filePath: string, size: 'thumbnail' | 'card' | 'hero' = 'card'): string {
  return getOptimizedImageUrl(filePath, imageTransformations.restaurant[size])
}

// Helper function to get review image URL
export function getReviewImageUrl(filePath: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
  return getOptimizedImageUrl(filePath, imageTransformations.review[size])
}

// Validate file type and size
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSizeInBytes = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    }
  }

  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: 'File size too large. Please upload an image smaller than 5MB.'
    }
  }

  return { valid: true }
}

export default imagekit