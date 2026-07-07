import Navbar from "@/components/shared/Navbar"
import Providers from "./providers"
import "./globals.css"

export const metadata = {
  title: 'Note App',
  description: 'A simple note-taking app with sharing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-background text-foreground">
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
