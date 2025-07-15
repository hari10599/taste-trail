import { prisma } from '@/lib/db/prisma'

/**
 * Check if a user is currently banned
 * Returns the active ban if found, null otherwise
 */
export async function checkUserBan(userId: string) {
  try {
    // Check for active permanent or temporary bans
    const activeBan = await prisma.moderationAction.findFirst({
      where: {
        targetId: userId,
        targetType: 'user',
        type: {
          in: ['PERMANENT_BAN', 'TEMPORARY_BAN']
        },
        OR: [
          { expiresAt: null }, // Permanent ban
          { expiresAt: { gt: new Date() } } // Temporary ban still active
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        moderator: {
          select: {
            name: true
          }
        }
      }
    })

    return activeBan
  } catch (error) {
    console.error('Error checking user ban:', error)
    return null
  }
}

/**
 * Get user's strike count
 */
export async function getUserStrikeCount(userId: string) {
  try {
    const activeStrikes = await prisma.userStrike.count({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    return activeStrikes
  } catch (error) {
    console.error('Error getting user strikes:', error)
    return 0
  }
}