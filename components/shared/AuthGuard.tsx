"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (requireAuth && !token) {
      router.replace("/login");
    } else if (!requireAuth && token) {
      router.replace("/dashboard");
    }
  }, [router, requireAuth]);

  return <>{children}</>;
}
