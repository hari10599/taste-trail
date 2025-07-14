import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { addSSEConnection, removeSSEConnection } from '@/lib/notifications'

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
      start(controller) {
        // Send initial connection confirmation
        const data = encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`)
        controller.enqueue(data)

        // Store connection with controller
        const response = { controller } as any
        addSSEConnection(userId, response)

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