"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, FileText, Calendar, Share2, Copy } from "lucide-react"
import AuthGuard from "@/components/shared/AuthGuard"

type Note = {
  id: string
  title: string
  content: string
  createdAt: string
  shares: Array<{
    id: string
    shareType: string
    accessType: string
    isRevoked: boolean
    expiresAt: string | null
  }>
}

export default function NotePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [shareType, setShareType] = useState("")
  const [accessType, setAccessType] = useState("")
  const [password, setPassword] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [creatingShare, setCreatingShare] = useState(false)
  const [shareError, setShareError] = useState("")

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`/api/notes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Failed to load note")
          return
        }

        setNote(data.note)
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [id])

  const hasActiveShare = note?.shares?.some(
    (s) => !s.isRevoked && (!s.expiresAt || new Date(s.expiresAt) > new Date())
  )

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setShareError("")
    setCreatingShare(true)

    try {
      const token = localStorage.getItem("token")
      const body: Record<string, unknown> = {
        shareType: shareType && shareType !== "NONE" ? shareType : undefined,
        accessType: accessType && accessType !== "NONE" ? accessType : undefined,
        password: accessType === "PASSWORD" && password ? password : undefined,
        expiresAt: expiresAt || undefined,
      }

      const res = await fetch(`/api/notes/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setShareError(data.error || "Failed to create share link")
        return
      }

      setShareLink(data.shareLink)
      const plainPasswordFromResponse = data.share?.plainPassword || data.plainPassword
      if (plainPasswordFromResponse) {
        setGeneratedPassword(plainPasswordFromResponse)
      }
      setShareDialogOpen(false)
      setNote((prev) =>
        prev
          ? {
              ...prev,
              shares: prev.shares ? [...prev.shares, data.share] : [data.share],
            }
          : prev
      )
    } catch {
      setShareError("Something went wrong")
    } finally {
      setCreatingShare(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!note) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-2xl">{note.title}</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setShareDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {hasActiveShare ? "Share Again" : "Share Note"}
              </Button>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Created: {new Date(note.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg border bg-background/50 p-4">
              {note.content}
            </div>
          </CardContent>
        </Card>

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Note</DialogTitle>
              <DialogDescription>
                Create a share link for this note. Choose share type and access options.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateShare} className="space-y-4">
              {shareError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {shareError}
                </div>
              )}
              {shareLink && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                  <p className="mb-2 font-medium">Share link created!</p>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="flex-1 rounded bg-background/80 px-2 py-1 text-xs break-all">
                      {shareLink}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(shareLink)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
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
              {accessType === "PASSWORD" && (
                <div className="space-y-2">
                  <Label htmlFor="share-password">
                    Password{" "}
                    <span className="text-muted-foreground font-normal">
                      (leave blank for auto-generated)
                    </span>
                  </Label>
                  <Input
                    id="share-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional password"
                  />
                </div>
              )}
              {shareType === "TIME_BASED" && (
                <div className="space-y-2">
                  <Label htmlFor="share-expires">Expires At</Label>
                  <Input
                    id="share-expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShareDialogOpen(false)
                    setShareLink("")
                    setGeneratedPassword("")
                    setShareError("")
                  }}
                  disabled={creatingShare}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingShare || !shareType || !accessType}>
                  {creatingShare ? "Creating..." : "Create Share Link"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
