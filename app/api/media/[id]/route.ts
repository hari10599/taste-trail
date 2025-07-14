import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { deleteImage } from '@/lib/imagekit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const imageId = params.id

    // Find the image upload record
    const uploadRecord = await prisma.mediaUpload.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        userId: true,
        fileId: true,
        fileName: true
      }
    })

    if (!uploadRecord) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check if user owns this image or is admin/moderator
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })

    const isOwner = uploadRecord.userId === payload.userId
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete this image' },
        { status: 403 }
      )
    }

    // Delete from ImageKit (if configured)
    try {
      await deleteImage(uploadRecord.fileId)
    } catch (error) {
      console.warn('Failed to delete from ImageKit:', error)
      // Continue with database deletion even if ImageKit deletion fails
    }

    // Mark as inactive in database (soft delete)
    await prisma.mediaUpload.update({
      where: { id: imageId },
      data: { isActive: false }
    })

    return NextResponse.json({
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Image deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    )
  }
}