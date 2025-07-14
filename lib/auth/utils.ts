// Utility functions for authentication
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('accessToken', token)
  // Also set as cookie for middleware (httpOnly=false so client can access)
  document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax; secure=${window.location.protocol === 'https:'}`
}

export const clearToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('accessToken')
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}