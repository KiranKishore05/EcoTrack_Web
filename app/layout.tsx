import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EcoTrack | AI Sustainability Platform',
  description:
    'AI-powered sustainability platform for tracking carbon footprint, sustainability goals, and environmental impact.',
  keywords: [
    'EcoTrack',
    'Carbon Footprint',
    'Sustainability',
    'Next.js',
    'AI',
    'Supabase',
  ],
  authors: [
    {
      name: 'Kiran Kishore',
    },
  ],
  openGraph: {
    title: 'EcoTrack',
    description: 'AI-powered sustainability management platform.',
    url: 'https://ecotrack-system.netlify.app',
    siteName: 'EcoTrack',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
