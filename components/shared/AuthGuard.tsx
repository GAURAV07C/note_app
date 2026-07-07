// Auth guard component
// User ko protect karne ke liye component - agar login nahi hai to redirect kar deta hai
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// AuthGuard props ka type
type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

// AuthGuard component - children ko wrap karke protect karta hai
export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (requireAuth && !session?.user) {
      router.replace("/login");
    } else if (!requireAuth && session?.user) {
      router.replace("/dashboard");
    }
  }, [router, requireAuth, session, status]);

  return <>{children}</>;
}
