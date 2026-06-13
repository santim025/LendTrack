import type { Metadata } from 'next'
import { SessionProvider } from '@/components/providers/session-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'LendTrack',
  description: 'Gestión profesional de préstamos, capital y pagos',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
