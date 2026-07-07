// New note page component
// User yahan nayi note create kar sakta hai
"use client"

import { useState, useEffect } from "react"
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
import { Copy, Check, ArrowLeft, FileText } from "lucide-react"

// New note page ka main component
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
  const [summary, setSummary] = useState("")
  const [summaryError, setSummaryError] = useState("")
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    }
  }, [router])
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const array = new Uint8Array(12)
    crypto.getRandomValues(array)
    const newPassword = Array.from(array, (n) => chars[n % chars.length]).join("")
    setPassword(newPassword)
    setGeneratedPassword(newPassword)
  }

  // Password copy karne wala function
  const copyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Note create hone ke baad summary generate karne wala function
  const handleSummarize = async (noteId: string) => {
    if (!content || content.trim().length < 20) {
      setSummaryError("Content is too short to summarize")
      return
    }

    setSummaryError("")
    setSummary("")

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/notes/${noteId}/summarize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setSummaryError(data.error || "Failed to generate summary")
        return
      }

      setSummary(data.summary)
    } catch {
      setSummaryError("Something went wrong")
    }
  }

  // Naye note ko save karne wala function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setShareLink("")
    setGeneratedPassword("")
    setCopied(false)
    setSummary("")
    setSummaryError("")
    setCreatedNoteId(null)

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

      const createdNoteId = data.note?.id
      setCreatedNoteId(createdNoteId || null)

      if (data.shareLink) {
        setShareLink(data.shareLink)
        const plainPasswordFromResponse = data.plainPassword || data.share?.plainPassword
        if (plainPasswordFromResponse) {
          setGeneratedPassword(plainPasswordFromResponse)
        }
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // Share link copy karne wala function
  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // New note page ka UI
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
              <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="mb-3 font-medium">Share link created successfully!</p>
                <div className="flex items-center gap-2 mb-2">
                  <code className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs break-all">
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
                  <div className="flex items-center gap-2 rounded-md border bg-background p-2 text-xs">
                    <span className="font-medium shrink-0">Password:</span>
                    <code className="flex-1 rounded px-2 py-1">
                      {generatedPassword}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="shrink-0"
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {summaryError && (
              <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {summaryError}
              </div>
            )}

            {createdNoteId && content.trim().length >= 20 && (
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSummarize(createdNoteId)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {summary ? "Regenerate Summary" : "Summarize"}
                </Button>
              </div>
            )}

            {summary && (
              <div className="mb-4 rounded-lg border bg-primary/5 p-4 text-sm">
                <p className="mb-1 font-medium text-primary">Summary</p>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {summary}
                </p>
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
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Optional password"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={password ? copyPassword : generatePassword}
                      className="shrink-0"
                    >
                      {password && copied ? "Copied" : password ? "Copy" : "Generate"}
                    </Button>
                  </div>
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
