import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const folder = searchParams.get('folder')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      userId: payload.userId,
      isActive: true
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    if (folder && folder !== 'all') {
      where.folder = folder
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'date') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'name') {
      orderBy.originalName = sortOrder
    } else if (sortBy === 'size') {
      orderBy.size = sortOrder
    }

    const skip = (page - 1) * limit

    // Get images and total count
    const [images, totalCount] = await Promise.all([
      prisma.mediaUpload.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          fileId: true,
          fileName: true,
          originalName: true,
          url: true,
          thumbnailUrl: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          folder: true,
          tags: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.mediaUpload.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      images,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Gallery fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}