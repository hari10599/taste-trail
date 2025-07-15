import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { addSSEConnection, removeSSEConnection } from '@/lib/notifications'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = verifyAccessToken(token)
    const userId = payload.userId

    // Create SSE response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection confirmation
        const data = encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`)
        controller.enqueue(data)

        // Store connection with controller
        const response = { controller } as any
        addSSEConnection(userId, response)

        // Send unread notifications immediately upon connection
        try {
          const unreadNotifications = await prisma.notification.findMany({
            where: { 
              userId, 
              read: false 
            },
            include: {
              from: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  role: true
                }
              },
              review: {
                select: {
                  id: true,
                  title: true,
                  restaurant: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              comment: {
                select: {
                  id: true,
                  content: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Send only the 10 most recent unread notifications
          })

          // Send each unread notification
          for (const notification of unreadNotifications) {
            const notificationData = encoder.encode(`data: ${JSON.stringify({
              type: 'notification',
              payload: notification
            })}\n\n`)
            controller.enqueue(notificationData)
          }

          // Send unread count update
          const unreadCount = await prisma.notification.count({
            where: { userId, read: false }
          })
          
          const countData = encoder.encode(`data: ${JSON.stringify({
            type: 'unread_count_update',
            unreadCount
          })}\n\n`)
          controller.enqueue(countData)

        } catch (error) {
          console.error('Failed to send initial notifications:', error)
        }

        // Handle connection cleanup
        const cleanup = () => {
          removeSSEConnection(userId)
          try {
            controller.close()
          } catch (error) {
            // Controller might already be closed
          }
        }

        // Cleanup on connection close
        request.signal.addEventListener('abort', cleanup)
        
        // Store cleanup function for manual cleanup
        response.cleanup = cleanup
      },
      
      cancel() {
        removeSSEConnection(userId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    console.error('SSE connection error:', error)
    return new Response('Unauthorized', { status: 401 })
  }
}