import type { Metadata, Viewport } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-dm-sans',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
    title: 'Forze - Validate Startup Ideas and Build Investor-Ready Ventures',
    description: 'Forze turns a raw startup idea into research, feasibility analysis, a live validation page, and investor-ready materials in minutes.',
    keywords: ['startup validation', 'AI', 'venture', 'feasibility study', 'investor kit', 'market research'],
    authors: [{ name: 'Forze' }],
    icons: {
        icon: '/favicon.png',
    },
    openGraph: {
        title: 'Forze - From Raw Idea to Validated Venture',
        description: 'Research the market, pressure-test feasibility, launch a validation page, and package the story for investors.',
        type: 'website',
        url: process.env.NEXT_PUBLIC_BASE_URL || 'https://forze.in',
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://forze.in'}/api/og`,
                width: 1200,
                height: 630,
                alt: 'Forze - Autonomous Venture Orchestrator',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Forze - From Raw Idea to Validated Venture',
        description: 'Research the market, pressure-test feasibility, launch a validation page, and package the story for investors.',
        images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'https://forze.in'}/api/og`],
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
        { media: '(prefers-color-scheme: dark)', color: '#111110' },
    ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en' suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
            <body className='antialiased'>{children}</body>
        </html>
    )
}
