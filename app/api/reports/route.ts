import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// POST - Submit a new report
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

    const { type, targetId, reason, description } = await request.json()

    if (!type || !targetId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate report type
    const validTypes = ['REVIEW', 'RESTAURANT', 'USER', 'COMMENT']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      )
    }

    // Check if target exists based on type
    let targetExists = false
    switch (type) {
      case 'REVIEW':
        targetExists = !!(await prisma.review.findUnique({ where: { id: targetId } }))
        break
      case 'RESTAURANT':
        targetExists = !!(await prisma.restaurant.findUnique({ where: { id: targetId } }))
        break
      case 'USER':
        targetExists = !!(await prisma.user.findUnique({ where: { id: targetId } }))
        break
      case 'COMMENT':
        targetExists = !!(await prisma.comment.findUnique({ where: { id: targetId } }))
        break
    }

    if (!targetExists) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      )
    }

    // Check if user has already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: payload.userId,
        type,
        targetId
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      )
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        type,
        targetId,
        reporterId: payload.userId,
        reason,
        description
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Create notification for admins/moderators
    const moderators = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MODERATOR'] }
      },
      select: { id: true }
    })

    // Create notifications for all moderators
    const notifications = moderators.map(mod => ({
      type: 'report_submitted',
      title: 'New Report Submitted',
      message: `A ${type.toLowerCase()} has been reported for: ${reason}`,
      userId: mod.id,
      fromId: payload.userId,
      data: {
        reportId: report.id,
        reportType: type,
        targetId
      }
    }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

    // Auto-flag content if it meets certain criteria
    const severityMap: { [key: string]: number } = {
      'Spam': 2,
      'Harassment': 4,
      'Inappropriate Content': 3,
      'Fake Information': 4,
      'Copyright Violation': 3,
      'Violence': 5,
      'Hate Speech': 5,
      'Nudity': 4,
      'Other': 1
    }

    const severity = severityMap[reason] || 1

    if (severity >= 3) {
      await prisma.contentFlag.upsert({
        where: {
          contentId_contentType: {
            contentId: targetId,
            contentType: type.toLowerCase()
          }
        },
        update: {
          severity: Math.max(severity, 0) // Keep highest severity
        },
        create: {
          contentId: targetId,
          contentType: type.toLowerCase(),
          reason,
          automated: false,
          severity
        }
      })
    }

    return NextResponse.json({
      message: 'Report submitted successfully',
      report: {
        id: report.id,
        type: report.type,
        reason: report.reason,
        status: report.status
      }
    })
  } catch (error) {
    console.error('Submit report error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

// GET - Get user's reports (for users to see their submitted reports)
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
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { reporterId: payload.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          targetId: true,
          reason: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.report.count({
        where: { reporterId: payload.userId }
      })
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}