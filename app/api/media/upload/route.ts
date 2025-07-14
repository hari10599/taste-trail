import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { uploadImage, type UploadOptions } from '@/lib/imagekit'
import { prisma } from '@/lib/db/prisma'

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
    const files = formData.getAll('files') as File[]
    const folder = formData.get('folder') as string || 'general'
    const tags = JSON.parse(formData.get('tags') as string || '[]')
    const transformationOptions = formData.get('transformation') 
      ? JSON.parse(formData.get('transformation') as string) 
      : undefined

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file count (max 10 per request)
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files per upload' },
        { status: 400 }
      )
    }

    const uploadPromises = files.map(async (file) => {
      if (!(file instanceof File)) {
        throw new Error('Invalid file object')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileName = `${timestamp}-${randomId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

      const uploadOptions: UploadOptions = {
        file: Buffer.from(await file.arrayBuffer()),
        fileName,
        folder: `/${folder}`,
        tags: [...tags, `user:${payload.userId}`, `folder:${folder}`],
        transformation: transformationOptions
      }

      const result = await uploadImage(uploadOptions)
      
      // Store upload record in database
      const uploadRecord = await prisma.mediaUpload.create({
        data: {
          userId: payload.userId,
          fileId: result.fileId,
          fileName: result.name,
          originalName: file.name,
          filePath: result.filePath,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          mimeType: file.type,
          size: result.size,
          width: result.width,
          height: result.height,
          folder,
          tags
        }
      })

      return {
        id: uploadRecord.id,
        fileId: result.fileId,
        fileName: result.name,
        originalName: file.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        filePath: result.filePath,
        size: result.size,
        width: result.width,
        height: result.height,
        mimeType: file.type,
        folder,
        tags
      }
    })

    const uploadResults = await Promise.all(uploadPromises)

    return NextResponse.json({
      message: 'Files uploaded successfully',
      uploads: uploadResults
    })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload files' },
      { status: 500 }
    )
  }
}