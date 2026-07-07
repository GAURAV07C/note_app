// Auth guard component
// User ko protect karne ke liye component - agar login nahi hai to redirect kar deta hai
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// AuthGuard props ka type
type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

// AuthGuard component - children ko wrap karke protect karta hai
export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // localStorage se token nikal rahe hai
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Agar authentication required hai aur token nahi hai to login pe redirect
    if (requireAuth && !token) {
      router.replace("/login");
    } 
    // Agar authentication not required hai aur token hai to dashboard pe redirect
    else if (!requireAuth && token) {
      router.replace("/dashboard");
    }
  }, [router, requireAuth]);

  // Children ko render kar rahe hai
  return <>{children}</>;
}
