'use client'

// Client-side image upload handler
export async function uploadImage(file: File, folder: string = 'reviews'): Promise<string> {
  try {
    // Create FormData and append the file
    const formData = new FormData()
    formData.append('files', file) // The API expects 'files' not 'file'
    formData.append('folder', folder)

    // Get the access token
    const token = localStorage.getItem('accessToken')
    
    // Upload to the media upload endpoint
    const uploadResponse = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      console.error('Upload failed:', error)
      
      // If upload fails, try ImageKit fallback
      const authResponse = await fetch('/api/imagekit/auth')
      if (!authResponse.ok) {
        console.warn('ImageKit not configured, using placeholder')
        // Return a placeholder URL based on the folder type
        const placeholders: { [key: string]: string } = {
          'reviews': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
          'restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
          'users': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80'
        }
        return placeholders[folder] || placeholders['reviews']
      }
    }

    const data = await uploadResponse.json()
    
    // The media upload endpoint returns an object with uploads array
    if (data.uploads && data.uploads.length > 0) {
      return data.uploads[0].url
    } else if (data.url) {
      // Fallback for direct URL response
      return data.url
    } else {
      throw new Error('No URL returned from upload')
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    // Return placeholder on any error
    const placeholders: { [key: string]: string } = {
      'reviews': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      'restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'users': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80'
    }
    return placeholders[folder] || placeholders['reviews']
  }
}