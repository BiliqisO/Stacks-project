import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ModeProvider } from "@/contexts/ModeContext"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayout } from "@/components/AppLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EventChain - Decentralized Event Ticketing",
  description: "Secure, transparent, and blockchain-powered event management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ModeProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
