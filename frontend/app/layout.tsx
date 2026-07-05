import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

// Inter handles fallbacks cleanly and is frequently cached locally
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'News Pulse — Topic Clustered News Timeline',
  description: 'A visual, automated, and interactive timeline of clustered news articles.',
  keywords: 'news, timeline, clustering, RSS, machine learning, NLP, articles, timeline dashboard',
  authors: [{ name: 'News Pulse Dev Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100">
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Ambient Background Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-purple-500/10 to-pink-500/10 blur-3xl pointer-events-none" />
          
          <main className="relative z-10">{children}</main>
        </div>

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
            },
            success: {
              icon: '✨',
              style: {
                background: '#064e3b',
                color: '#ecfdf5',
                borderColor: 'rgba(52, 211, 153, 0.2)',
              },
            },
            error: {
              icon: '⚡',
              style: {
                background: '#7f1d1d',
                color: '#fef2f2',
                borderColor: 'rgba(248, 113, 113, 0.2)',
              },
            },
          }}
        />
      </body>
    </html>
  )
}