import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

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
    
    // Check if user is admin or moderator
    const moderator = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (!moderator || (moderator.role !== 'ADMIN' && moderator.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { reportId, action, notes } = await request.json()

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    if (report.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Report has already been processed' },
        { status: 400 }
      )
    }

    let newStatus: string
    let moderationActionType: string | null = null

    if (action === 'approve') {
      newStatus = 'RESOLVED'
      
      // Determine moderation action based on report reason and type
      switch (report.reason) {
        case 'Harassment':
        case 'Hate Speech':
        case 'Violence':
          moderationActionType = 'CONTENT_REMOVAL'
          break
        case 'Spam':
        case 'Inappropriate Content':
          moderationActionType = 'WARNING'
          break
        case 'Fake Information':
          moderationActionType = 'CONTENT_REMOVAL'
          break
        default:
          moderationActionType = 'WARNING'
      }

      // Create moderation action
      const moderationAction = await prisma.moderationAction.create({
        data: {
          type: moderationActionType,
          targetId: report.targetId,
          targetType: report.type.toLowerCase(),
          moderatorId: payload.userId,
          reason: `Report approved: ${report.reason}`,
          notes: notes || `Resolved report: ${report.description}`,
          reportId: report.id
        }
      })

      // Handle content removal or user warnings based on target type
      if (moderationActionType === 'CONTENT_REMOVAL') {
        switch (report.type) {
          case 'REVIEW':
            await prisma.review.update({
              where: { id: report.targetId },
              data: { isHidden: true }
            })
            break
          case 'COMMENT':
            await prisma.comment.update({
              where: { id: report.targetId },
              data: { isHidden: true }
            })
            break
          // Restaurant content removal would require different logic
        }
      }

      // For user reports, we might want to give the user a strike or warning
      if (report.type === 'USER') {
        // Get the target user
        const targetUser = await prisma.user.findUnique({
          where: { id: report.targetId }
        })

        if (targetUser) {
          // Create a user strike
          await prisma.userStrike.create({
            data: {
              userId: report.targetId,
              reason: `Report violation: ${report.reason}`,
              actionId: moderationAction.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          })

          // Send notification to the user
          await prisma.notification.create({
            data: {
              type: 'moderation_action',
              title: 'Account Warning',
              message: `You have received a warning for: ${report.reason}`,
              userId: report.targetId,
              fromId: payload.userId,
              data: {
                action: moderationActionType,
                reason: report.reason,
                reportId: report.id
              }
            }
          })
        }
      }

    } else if (action === 'reject') {
      newStatus = 'REJECTED'
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Update the report status
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    })

    // Send notification to the reporter
    await prisma.notification.create({
      data: {
        type: 'report_resolved',
        title: `Report ${action}d`,
        message: `Your report for ${report.reason} has been ${action}d by our moderation team.`,
        userId: report.reporterId,
        fromId: payload.userId,
        data: {
          reportId: report.id,
          action,
          targetType: report.type,
          notes: notes || ''
        }
      }
    })

    // Update or remove content flag if it exists
    if (action === 'approve') {
      await prisma.contentFlag.deleteMany({
        where: {
          contentId: report.targetId,
          contentType: report.type.toLowerCase()
        }
      })
    }

    return NextResponse.json({
      message: `Report ${action}d successfully`,
      report: updatedReport
    })
  } catch (error) {
    console.error('Resolve report error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve report' },
      { status: 500 }
    )
  }
}