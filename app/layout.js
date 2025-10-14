import Header from '@/components/header'
import {GoogleAnalytics} from '@next/third-parties/google'
import clsx from 'clsx'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({ children }) {
  return <html lang="en">
    <GoogleAnalytics gaId="G-DLJ3T4840G" />
    <body
      className={
        clsx([
          `${geistSans.variable} ${geistMono.variable} antialiased`,
          // grid-rows-[auto_auto_1fr_auto]: 4 rows
          'grid min-h-dvh grid-rows-[auto_auto_1fr_auto]',
          'default-bg-color text-dark dark:text-light text-base sm:text-lg'
        ])}>
      <Header />
      <main>
        {children}
      </main>
      <a>footer</a>
    </body>
  </html>
}
