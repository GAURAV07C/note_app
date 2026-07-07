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
          <main className="flex-1 container mx-auto p-4">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
