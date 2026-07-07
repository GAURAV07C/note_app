// Share page component
// Share link ke through note view karne ke liye page
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Eye, Calendar, Shield } from "lucide-react";

// Share info ka type definition
type ShareInfo = {
  note: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    constentSummary?: string | null;
  };
  shareType: string;
  accessType: string;
  viewCount?: number;
};

// Share page ka main component
export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ShareInfo | null>(null);
  const [error, setError] = useState("");
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // Share data fetch karne wala function
  const fetchShare = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/share/${token}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Invalid share link");
        return;
      }

      if (json.requiresPassword) {
        setRequiresPassword(true);
        return;
      }

      setData({
        note: json.note,
        shareType: json.shareType,
        accessType: json.accessType,
      });
      setViewCount(json.viewCount ?? null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Component mount hone par share data fetch kar rahe hai
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setTimeout(async () => {
        if (!isMounted) return;
        await fetchShare();
      }, 0);
    };

    run();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Password protected share unlock karne wala function
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/share/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to unlock");
        return;
      }

      setData({
        note: json.note,
        shareType: json.shareType,
        accessType: json.accessType,
      });
      setRequiresPassword(false);
      setViewCount(json.viewCount ?? null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Loading state ka UI
  if (loading && !data && !requiresPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state ka UI
  if (error && !requiresPassword && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Unable to view note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password required state ka UI
  if (requiresPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              This note is protected. Enter the password to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Unlocking..." : "Unlock"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Note na milne par null return kar rahe hai
  if (!data) {
    return null;
  }

  // Note view karne ka UI
  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-2xl">{data.note.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  <Shield className="mr-1 h-3 w-3" />
                  {data.shareType?.toLowerCase().replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {data.accessType?.toLowerCase()}
                </Badge>
              </div>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(data.note.createdAt).toLocaleString()}
              </span>
              {viewCount !== null && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Views: {viewCount}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.note.constentSummary && (
              <div className="mb-4 rounded-lg border bg-primary/5 p-4 text-sm">
                <p className="mb-1 font-medium text-primary">Summary</p>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {data.note.constentSummary}
                </p>
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg border bg-background/50 p-4">
              {data.note.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
