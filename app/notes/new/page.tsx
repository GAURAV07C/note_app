"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Copy, Check, ArrowLeft } from "lucide-react"

export default function NewNotePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [shareType, setShareType] = useState("")
  const [accessType, setAccessType] = useState("")
  const [password, setPassword] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setShareLink("")

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const body: Record<string, unknown> = {
        title,
        content,
        shareType: shareType && shareType !== "NONE" ? shareType : undefined,
        accessType: accessType && accessType !== "NONE" ? accessType : undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
      }

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create note")
        return
      }

      if (data.shareLink) {
        setShareLink(data.shareLink)
        const plainPasswordFromResponse = data.plainPassword || data.share?.plainPassword
        if (plainPasswordFromResponse) {
          setGeneratedPassword(plainPasswordFromResponse)
        }
      } else {
        router.push("/notes")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Create New Note</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Note details</CardTitle>
            <CardDescription>
              Write your note content and configure sharing options below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {shareLink && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                <p className="mb-2 font-medium">Share link created successfully!</p>
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 rounded bg-background/80 px-2 py-1 text-xs break-all">
                    {shareLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                {generatedPassword && (
                  <div className="flex items-center gap-2 rounded bg-yellow-50 p-2 text-xs dark:bg-yellow-900/30 dark:text-yellow-200">
                    <span className="font-medium">Password:</span>
                    <code className="flex-1 rounded bg-background/80 px-2 py-1">
                      {generatedPassword}
                    </code>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Share Type</Label>
                  <Select value={shareType} onValueChange={setShareType}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                      <SelectItem value="TIME_BASED">Time-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Access Type</Label>
                  <Select value={accessType} onValueChange={setAccessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PASSWORD">Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {accessType === "PASSWORD" && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password{" "}
                    <span className="text-muted-foreground font-normal">
                      (leave blank for auto-generated)
                    </span>
                  </Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional password"
                  />
                </div>
              )}

              {shareType === "TIME_BASED" && (
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Note"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
