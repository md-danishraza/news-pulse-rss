import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'News Pulse - Topic Clustered News Timeline',
  description: 'Visual timeline of clustered news articles from multiple sources',
  keywords: 'news, timeline, clustering, RSS, articles',
  authors: [{ name: 'News Pulse' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              icon: '✅',
              style: {
                background: '#065f46',
                color: '#ecfdf5',
              },
            },
            error: {
              icon: '❌',
              style: {
                background: '#991b1b',
                color: '#fef2f2',
              },
            },
          }}
        />
      </body>
    </html>
  )
}