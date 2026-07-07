// Auth redirect hook
// Agar user login nahi hai to login page pe redirect kar deta hai
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Custom React hook - component me use karne ke liye
// Token check karta hai, agar nahi hai to /login pe bhej deta hai
export default function useAuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    // localStorage se token nikal rahe hai
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      // Agar token nahi hai to login page pe redirect kar rahe hai
      router.replace('/login');
    }
  }, [router]);
}
