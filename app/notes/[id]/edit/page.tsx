"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Save, FileText } from "lucide-react"
import AuthGuard from "@/components/shared/AuthGuard"


export default function EditNotePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { status } = useSession()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [summary, setSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/notes/${id}`)

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Failed to load note")
          return
        }

        setTitle(data.note.title)
        setContent(data.note.content)

        if (data.note?.constentSummary) {
          setSummary(data.note.constentSummary)
        }
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [id, status, router])

  const handleSummarize = async () => {
    if (!content || content.trim().length < 20) {
      setSummaryError("Content is too short to summarize")
      return
    }

    setSummaryError("")
    setSummaryLoading(true)

    try {
      const res = await fetch(`/api/notes/${id}/summarize`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        setSummaryError(data.error || "Failed to generate summary")
        return
      }

      setSummary(data.summary)
    } catch {
      setSummaryError("Something went wrong")
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to update note")
        return
      }

      // Note update hone ke baad summary regenerate kar rahe hai
      if (content.trim().length >= 20) {
        await handleSummarize()
      }

      setSuccess("Note updated successfully")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-muted/40 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Edit Note</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Note details</CardTitle>
              <CardDescription>
                Update your note content below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                  {success}
                </div>
              )}

              {summaryError && (
                <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {summaryError}
                </div>
              )}

              {summary && (
                <div className="mb-4 rounded-lg border bg-primary/5 p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="mb-0 font-medium text-primary">Summary</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSummarize}
                      disabled={summaryLoading}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {summaryLoading ? "Regenerating..." : "Regenerate Summary"}
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {summary}
                  </p>
                </div>
              )}

              {content.trim().length >= 20 && !summary && (
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSummarize}
                    disabled={summaryLoading}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {summaryLoading ? "Summarizing..." : "Summarize"}
                  </Button>
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
                    rows={8}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Update Note"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
