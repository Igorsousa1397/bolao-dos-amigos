import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Bolão Copa 2026',
  description: 'Faça seus palpites para a Copa do Mundo 2026',
  openGraph: {
    title: 'Bolão Copa 2026',
    description: 'Faça seus palpites para a Copa do Mundo 2026',
    images: ['/copa.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bolão Copa 2026',
    description: 'Faça seus palpites para a Copa do Mundo 2026',
    images: ['/copa.jpg'],
  },
  icons: {
    icon: '/copa.jpg',
    apple: '/copa.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
