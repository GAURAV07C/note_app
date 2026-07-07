// Single note page component
// User ek specific note ko dekh sakta hai, share kar sakta hai aur summarize kar sakta hai
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, FileText, Calendar, Share2, Copy } from "lucide-react";
import AuthGuard from "@/components/shared/AuthGuard";

// Note ka type definition
type Note = {
  id: string
  title: string
  content: string
  constentSummary: string | null
  createdAt: string
  shares: Array<{
    id: string
    shareType: string
    accessType: string
    isRevoked: boolean
    expiresAt: string | null
  }>
}

// Single note page ka main component
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
  const [copied, setCopied] = useState(false)
  const [summary, setSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")

  // Component mount hone par note fetch kar rahe hai
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

        // Agar note mein pehle se summary hai to use karo
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
  }, [id])

  // Password generate karne wala function
  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    const newPassword = Array.from(array, (n) => chars[n % chars.length]).join(
      "",
    );
    setPassword(newPassword);
    setGeneratedPassword(newPassword);
  };

  // Password copy karne wala function
  const copyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check karta hai ki active share link hai ya nahi
  const hasActiveShare = note?.shares?.some(
    (s) => !s.isRevoked && (!s.expiresAt || new Date(s.expiresAt) > new Date()),
  );

  // Note ko share karne wala function
  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError("");
    setCreatingShare(true);

    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {
        shareType: shareType && shareType !== "NONE" ? shareType : undefined,
        accessType:
          accessType && accessType !== "NONE" ? accessType : undefined,
        password: accessType === "PASSWORD" && password ? password : undefined,
        expiresAt: expiresAt || undefined,
      };

      const res = await fetch(`/api/notes/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setShareError(data.error || "Failed to create share link");
        return;
      }

      setShareLink(data.shareLink);
      const plainPasswordFromResponse =
        data.share?.plainPassword || data.plainPassword;
      if (plainPasswordFromResponse) {
        setGeneratedPassword(plainPasswordFromResponse);
      }
      setShareDialogOpen(false);
      setNote((prev) =>
        prev
          ? {
              ...prev,
              shares: prev.shares ? [...prev.shares, data.share] : [data.share],
            }
          : prev,
      );
    } catch {
      setShareError("Something went wrong");
    } finally {
      setCreatingShare(false);
    }
  };

  // Note ko Groq AI se summarize karne wala function
  const handleSummarize = async () => {
    if (!note?.content || note.content.trim().length < 20) {
      setSummaryError("Content is too short to summarize");
      return;
    }

    setSummaryError("");
    setSummary("");
    setSummaryLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/notes/${id}/summarize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setSummaryError(data.error || "Failed to generate summary");
        return;
      }

      setSummary(data.summary);
    } catch {
      setSummaryError("Something went wrong");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Loading state ka UI
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
    );
  }

  // Error state ka UI
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
    );
  }

  // Note na milne par null return kar rahe hai
  if (!note) {
    return null;
  }

  // Note page ka main UI
  return (
    <AuthGuard requireAuth>
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
                  variant="outline"
                  onClick={handleSummarize}
                  disabled={
                    summaryLoading ||
                    !note?.content ||
                    note.content.trim().length < 20
                  }
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {summaryLoading ? "Summarizing..." : "Summarize"}
                </Button>
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
            <CardContent className="space-y-4">
              {summaryError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {summaryError}
                </div>
              )}
              {summary && (
                <div className="rounded-lg border bg-primary/5 p-4 text-sm">
                  <p className="mb-1 font-medium text-primary">Summary</p>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {summary}
                  </p>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg border bg-background/50 p-4">
                {note.content}
              </div>
            </CardContent>
          </Card>

          {/* Share link create karne ka dialog */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Note</DialogTitle>
                <DialogDescription>
                  Create a share link for this note. Choose share type and
                  access options.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateShare} className="space-y-4">
                {shareError && (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {shareError}
                  </div>
                )}
                {shareLink && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm">
                    <p className="mb-3 font-medium">Share link created!</p>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs break-all">
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
                      <div className="flex items-center gap-2 rounded-md border bg-background p-2 text-xs">
                        <span className="font-medium shrink-0">Password:</span>
                        <code className="flex-1 rounded px-2 py-1">
                          {generatedPassword}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(generatedPassword)
                          }
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
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
                    <div className="flex gap-2">
                      <Input
                        id="share-password"
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
                        {password && copied
                          ? "Copied"
                          : password
                            ? "Copy"
                            : "Generate"}
                      </Button>
                    </div>
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
                      setShareDialogOpen(false);
                      setShareLink("");
                      setGeneratedPassword("");
                      setPassword("");
                      setShareError("");
                      setCopied(false);
                    }}
                    disabled={creatingShare}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      creatingShare ||
                      shareType === "NONE" ||
                      accessType === "NONE"
                    }
                  >
                    {creatingShare ? "Creating..." : "Create Share Link"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
}
