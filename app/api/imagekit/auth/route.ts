import { NextRequest, NextResponse } from 'next/server'
import ImageKit from 'imagekit'

// Check if ImageKit is configured
const isImageKitConfigured = !!(
  process.env.IMAGEKIT_PUBLIC_KEY && 
  process.env.IMAGEKIT_PRIVATE_KEY && 
  process.env.IMAGEKIT_URL_ENDPOINT
)

let imagekit: ImageKit | null = null

if (isImageKitConfigured) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  })
}

export async function GET(request: NextRequest) {
  // If ImageKit is not configured, return an error
  if (!imagekit) {
    return NextResponse.json(
      { 
        error: 'ImageKit not configured',
        message: 'Image uploads are disabled. Please configure ImageKit environment variables.'
      },
      { status: 501 }
    )
  }

  try {
    const authenticationParameters = imagekit.getAuthenticationParameters()
    
    return NextResponse.json(authenticationParameters)
  } catch (error) {
    console.error('ImageKit auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication parameters' },
      { status: 500 }
    )
  }
}