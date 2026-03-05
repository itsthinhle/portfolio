import Header from '@/components/header'
import ChatBotWidget from '@/components/chat-bot/chat-bot-widget'
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
          'bg-light dark:bg-dark text-dark dark:text-light text-base lg:text-lg leading-7 relative'
        ])}>
      <Header />
      <main>
        {children}
      </main>
      <ChatBotWidget />
      <a>footer</a>
    </body>
  </html>
}
