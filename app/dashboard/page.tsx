// Dashboard page component
// User ki saare notes aur unke share links yahan manage kar sakta hai
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  MoreVertical,
  Plus,
  ExternalLink,
  Trash2,
  Copy,
  Eye,
  Clock,
  Shield,
} from "lucide-react";
import AuthGuard from "@/components/shared/AuthGuard";

// Note ka type definition
type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  shares: Share[];
};

// Share link ka type definition
type Share = {
  id: string;
  token: string;
  shareType: string;
  accessType: string;
  isRevoked: boolean;
  isUsed: boolean;
  viewCount: number;
  expiresAt: string | null;
  passwordHash: string | null;
};

// Dashboard page ka main component
export default function DashboardPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareLinkToRevoke, setShareLinkToRevoke] = useState<string | null>(
    null,
  );
  const [revoking, setRevoking] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notes ko API se fetch karne wala function
  const reloadNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load notes");
        return;
      }

      setNotes(data.notes || []);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Component mount hone par notes fetch kar rahe hai
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setTimeout(async () => {
        if (!isMounted) return;
        await reloadNotes();
      }, 0);
    };

    run();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Share link copy karne wala function
  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
  };

  // Date format karne wala function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  // Share status batane wala function
  const getShareStatus = (share: Share) => {
    if (share.isRevoked)
      return { label: "Revoked", variant: "destructive" as const };
    if (share.isUsed && share.shareType === "ONE_TIME")
      return { label: "Used", variant: "secondary" as const };
    if (share.expiresAt && new Date(share.expiresAt) < new Date())
      return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  // Share link revoke karne wala function
  const revokeShare = async (shareId: string) => {
    setRevoking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/notes/${shareId}/revoke`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRevoked: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke share link");
        return;
      }

      setShareLinkToRevoke(null);
      reloadNotes();
    } catch {
      alert("Something went wrong");
    } finally {
      setRevoking(false);
    }
  };

  // Note delete karne wala function
  const deleteNote = async (noteId: string) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete note");
        return;
      }

      setNoteToDelete(null);
      reloadNotes();
    } catch {
      alert("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  // Loading state ka UI
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
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
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Dashboard ka main UI
  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-muted/40 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your notes and share links
              </p>
            </div>
            <Button asChild>
              <Link href="/notes/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Note
              </Link>
            </Button>
          </div>

          {notes.length === 0 ? (
            // Agar koi note nahi hai to yeh UI dikhega
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first note to get started
                </p>
                <Button asChild>
                  <Link href="/notes/new">Create Note</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Notes list ka UI
            <div className="grid gap-4">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {note.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Created {new Date(note.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/notes/${note.id}/edit`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                Edit Note
                              </Link>
                            </DropdownMenuItem>
                            {!note.shares?.some(
                              (s) =>
                                !s.isRevoked &&
                                (!s.expiresAt ||
                                  new Date(s.expiresAt) > new Date()),
                            ) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/notes/${note.id}`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    Share Note
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setNoteToDelete(note.id)}
                              className="text-sm text-destructive focus:text-destructive cursor-pointer"
                            >
                              Delete Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {note.content}
                    </p>

                    {note.shares && note.shares.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Share Links</p>
                        {note.shares.map((share) => {
                          const status = getShareStatus(share);
                          return (
                            <div
                              key={share.id}
                              className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={status.variant}
                                    className="text-xs"
                                  >
                                    {status.label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs capitalize"
                                  >
                                    {share.shareType
                                      ?.toLowerCase()
                                      .replace("_", " ")}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs capitalize"
                                  >
                                    {share.accessType?.toLowerCase()}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {share.viewCount} views
                                  </span>
                                  {share.expiresAt && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Expires {formatDate(share.expiresAt)}
                                    </span>
                                  )}
                                  {share.accessType === "PASSWORD" && (
                                    <span className="flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      Password protected
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyShareLink(share.token)}
                                  title="Copy share link"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  title="View share"
                                >
                                  <Link href={`/share/${share.token}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                                {!share.isRevoked && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setShareLinkToRevoke(share.id)
                                    }
                                    title="Revoke share link"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Revoke confirmation dialog */}
        <Dialog
          open={!!shareLinkToRevoke}
          onOpenChange={(open) => !open && setShareLinkToRevoke(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Share Link</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke this share link? Anyone with
                this link will no longer be able to access the note.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShareLinkToRevoke(null)}
                disabled={revoking}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  shareLinkToRevoke && revokeShare(shareLinkToRevoke)
                }
                disabled={revoking}
              >
                {revoking ? "Revoking..." : "Revoke"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog
          open={!!noteToDelete}
          onOpenChange={(open) => !open && setNoteToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this note? All associated share
                links will also be removed. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNoteToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => noteToDelete && deleteNote(noteToDelete)}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
