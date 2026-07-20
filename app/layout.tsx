import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EcoTrack — AI-Powered Sustainability Platform',
  description:
    'Track daily habits, calculate your carbon footprint, receive AI-generated eco suggestions, and monitor your sustainability goals.',
  openGraph: {
    title: 'EcoTrack — AI-Powered Sustainability Platform',
    description:
      'Track daily habits, calculate your carbon footprint, receive AI-generated eco suggestions, and monitor your sustainability goals.',
    images: [{ url: '/ecotrack-logo.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
