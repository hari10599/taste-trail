import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { uploadImage, validateImageFile, deleteImage } from '@/lib/imagekit'

// POST /api/users/avatar - Upload avatar
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
    
    const formData = await request.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file using ImageKit validation
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Delete old avatar if exists and is from ImageKit
    if (user.avatar && user.avatar.includes('ik.imagekit.io')) {
      try {
        // Extract file ID from URL (this is a simplified approach)
        const fileId = user.avatar.split('/').pop()?.split('.')[0]
        if (fileId) {
          await deleteImage(fileId)
        }
      } catch (error) {
        console.warn('Failed to delete old avatar:', error)
        // Continue with upload even if deletion fails
      }
    }
    
    // Upload to ImageKit
    const fileName = `avatar-${payload.userId}-${Date.now()}`
    const uploadResult = await uploadImage({
      file,
      fileName,
      folder: '/avatars',
      tags: ['avatar', 'user', payload.userId],
      transformation: {
        width: 400,
        height: 400,
        crop: 'force',
        format: 'webp',
        quality: 80
      }
    })
    
    // Update user avatar with ImageKit URL
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: { 
        avatar: uploadResult.url,
        // Store additional metadata if needed
        // avatarFileId: uploadResult.fileId 
      },
    })
    
    return NextResponse.json({ 
      avatarUrl: updatedUser.avatar,
      message: 'Avatar updated successfully',
      fileId: uploadResult.fileId
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/avatar - Remove avatar
export async function DELETE(request: NextRequest) {
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
    
    // Get current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Delete from ImageKit if exists
    if (user.avatar && user.avatar.includes('ik.imagekit.io')) {
      try {
        // Extract file ID from URL (this is a simplified approach)
        const fileId = user.avatar.split('/').pop()?.split('.')[0]
        if (fileId) {
          await deleteImage(fileId)
        }
      } catch (error) {
        console.warn('Failed to delete avatar from ImageKit:', error)
        // Continue with database update even if ImageKit deletion fails
      }
    }
    
    // Update user in database
    await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar: null },
    })
    
    return NextResponse.json({ 
      message: 'Avatar removed successfully' 
    })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    )
  }
}