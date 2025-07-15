import axios from 'axios'

// Create an axios instance that automatically includes Clerk auth
// Clerk middleware handles authentication, so we don't need to manually add tokens
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// You can add interceptors here if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to sign-in if unauthorized
      window.location.href = '/sign-in'
    }
    return Promise.reject(error)
  }
)

export default api