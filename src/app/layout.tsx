import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PostHogProvider } from '@/components/PostHogProvider';
import { MotionProvider } from '@/components/motion';
import { site } from '@/lib/site';
import { Analytics } from '@vercel/analytics/next';

// Crisp, technical type: Inter for UI, JetBrains Mono for code/commands.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jb',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  // Inherited by every route. Canonicals are set per page, since a site-wide
  // one here would canonicalize every route to the home page.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: site.name,
    description: site.description,
    siteName: site.name,
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: `${site.name}: ${site.tagline}` }],
  },
  twitter: {
    card: 'summary',
    title: site.name,
    description: site.description,
    images: ['/icon.png'],
  },
  alternates: {
    types: { 'text/plain': [{ url: '/llms.txt', title: `${site.name} for LLMs` }] },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        {/* Decorative signal backdrop: dot-grid + drifting glow behind everything */}
        <div data-signal-bg aria-hidden="true">
          <span className="glow-1" />
          <span className="glow-2" />
        </div>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          Skip to content
        </a>
        <PostHogProvider>
          <SiteHeader />
          <main id="main">
            <MotionProvider>{children}</MotionProvider>
          </main>
          <SiteFooter />
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
