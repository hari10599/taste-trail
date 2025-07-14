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

    // Get distinct folders for the user
    const folders = await prisma.mediaUpload.findMany({
      where: {
        userId: payload.userId,
        isActive: true
      },
      select: {
        folder: true
      },
      distinct: ['folder']
    })

    // Extract folder names and sort them
    const folderNames = folders
      .map(f => f.folder)
      .filter(Boolean)
      .sort()

    return NextResponse.json({
      folders: folderNames
    })
  } catch (error) {
    console.error('Folders fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}