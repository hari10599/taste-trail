import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Taste Trail - Discover Amazing Restaurants',
  description: 'Connect with food enthusiasts, discover restaurants, and share your dining experiences.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-light via-white to-light`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              style: {
                background: '#4ECDC4',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#4ECDC4',
              },
            },
            error: {
              style: {
                background: '#FF6B6B',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#FF6B6B',
              },
            },
          }}
        />
      </body>
    </html>
  )
}