// Home page component
// Landing page jahan user app ke features dekh sakta hai
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Shield, Clock, Share2, ArrowRight } from "lucide-react"

// Home page ka main component
export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-4xl space-y-12 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <Shield className="mr-2 h-3 w-3" />
              Secure & Private Sharing
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Share notes with <span className="text-primary">confidence</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Create notes with time-based or one-time share links. Password-protect your content.
              Full control over who sees what and for how long.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/register" className="flex items-center gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link href="/notes/new">Create a Note</Link>
            </Button>
          </div>

          {/* Features cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Share2 className="h-5 w-5 text-primary" />
                  Instant Sharing
                </CardTitle>
                <CardDescription>
                  Generate a secure share link in a single click.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Time-Based Access
                </CardTitle>
                <CardDescription>
                  Set expiration times so links automatically stop working.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Password Protection
                </CardTitle>
                <CardDescription>
                  Keep sensitive notes safe with password-protected links.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
