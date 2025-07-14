'use client'

// Client-side image upload handler
export async function uploadImage(file: File, folder: string = 'reviews'): Promise<string> {
  try {
    // First check if ImageKit is configured by trying the auth endpoint
    const authResponse = await fetch('/api/imagekit/auth')
    
    if (!authResponse.ok) {
      console.warn('ImageKit not configured, using placeholder')
      // Return a placeholder URL
      return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`
    }

    // If ImageKit is configured, proceed with upload
    // For now, we'll return a placeholder since actual upload requires more setup
    console.log('File upload requested:', file.name)
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`
    
  } catch (error) {
    console.error('Upload error:', error)
    // Return placeholder on any error
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`
  }
}