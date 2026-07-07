// Auth redirect hook
// Agar user login nahi hai to login page pe redirect kar deta hai
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function useAuthRedirect() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace('/login');
    }
  }, [router, session, status]);
}
