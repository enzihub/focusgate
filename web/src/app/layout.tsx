'use client';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { dark } from '@clerk/themes';
import './globals.css';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const geistSans = localFont({
  src: '../../public/fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: '../../public/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider
    // appearance={{
    //   baseTheme: dark,
    // }}
    >
      <html lang='en'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}
        >
          <div className='flex min-h-screen flex-col bg-[#E8FAFF] font-inter'>
            <Navbar />
            <main className='flex-1 p-8'>{children}</main>
            <Footer />
          </div>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          {process.env.NEXT_PUBLIC_GTM_ID && (
            <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
