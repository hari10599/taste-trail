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
      console.log('SSE connection attempt without token')
      return new Response('Unauthorized', { status: 401 })
    }

    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (error) {
      console.log('SSE connection attempt with invalid token:', error)
      return new Response('Unauthorized', { status: 401 })
    }
    
    const userId = payload.userId
    console.log(`Setting up SSE connection for user ${userId}`)

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
        const response = { controller }
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
          console.log(`🧹 Cleaning up SSE connection for user ${userId}`)
          removeSSEConnection(userId)
          try {
            controller.close()
          } catch (error) {
            console.log(`Error closing controller for user ${userId}:`, error)
          }
          // Clear health check interval
          if (response.healthCheck) {
            clearInterval(response.healthCheck)
            response.healthCheck = null
          }
        }

        // Cleanup on connection close
        request.signal.addEventListener('abort', cleanup)
        
        // Store cleanup function for manual cleanup
        response.cleanup = cleanup
        
        // Add periodic connection health check
        const healthCheck = setInterval(() => {
          try {
            // Send a ping to keep connection alive
            const ping = encoder.encode(': ping\n\n')
            controller.enqueue(ping)
            console.log(`✅ Health check ping sent to user ${userId}`)
          } catch (error) {
            console.log(`❌ Health check failed for user ${userId}, cleaning up:`, error)
            clearInterval(healthCheck)
            cleanup()
          }
        }, 30000) // Every 30 seconds
        
        // Store health check interval for cleanup
        response.healthCheck = healthCheck
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