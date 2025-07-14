import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { getOptimizedImageUrl } from '@/lib/imagekit'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)

    const body = await request.json()
    const { imageId, transformations } = body

    if (!imageId || !transformations) {
      return NextResponse.json(
        { error: 'Image ID and transformations are required' },
        { status: 400 }
      )
    }

    // Find the image upload record
    const uploadRecord = await prisma.mediaUpload.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        userId: true,
        filePath: true,
        fileName: true
      }
    })

    if (!uploadRecord) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check if user owns this image
    if (uploadRecord.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Not authorized to transform this image' },
        { status: 403 }
      )
    }

    // Generate transformed URLs
    const transformedUrls: { [key: string]: string } = {}

    // Common transformation presets
    const presets = {
      thumbnail: { width: 200, height: 150, crop: 'maintain_ratio' as const, format: 'webp' as const },
      small: { width: 400, height: 300, crop: 'maintain_ratio' as const, format: 'webp' as const },
      medium: { width: 800, height: 600, crop: 'maintain_ratio' as const, format: 'webp' as const },
      large: { width: 1200, height: 900, crop: 'maintain_ratio' as const, format: 'webp' as const },
      square_small: { width: 200, height: 200, crop: 'force' as const, format: 'webp' as const },
      square_medium: { width: 400, height: 400, crop: 'force' as const, format: 'webp' as const },
      banner: { width: 1200, height: 400, crop: 'force' as const, format: 'webp' as const },
      // Quality variants
      high_quality: { quality: 95, format: 'webp' as const },
      medium_quality: { quality: 80, format: 'webp' as const },
      low_quality: { quality: 60, format: 'webp' as const },
      // Format variants
      jpeg: { format: 'jpg' as const },
      png: { format: 'png' as const },
      webp: { format: 'webp' as const },
      avif: { format: 'avif' as const }
    }

    // Apply requested transformations
    for (const transformationKey of transformations) {
      if (presets[transformationKey as keyof typeof presets]) {
        transformedUrls[transformationKey] = getOptimizedImageUrl(
          uploadRecord.filePath,
          presets[transformationKey as keyof typeof presets]
        )
      } else if (typeof transformations === 'object' && !Array.isArray(transformations)) {
        // Custom transformation
        transformedUrls.custom = getOptimizedImageUrl(
          uploadRecord.filePath,
          transformations
        )
      }
    }

    // If no valid transformations found, return original
    if (Object.keys(transformedUrls).length === 0) {
      transformedUrls.original = getOptimizedImageUrl(uploadRecord.filePath)
    }

    return NextResponse.json({
      imageId: uploadRecord.id,
      originalPath: uploadRecord.filePath,
      transformedUrls,
      availablePresets: Object.keys(presets)
    })
  } catch (error) {
    console.error('Image transformation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transform image' },
      { status: 500 }
    )
  }
}