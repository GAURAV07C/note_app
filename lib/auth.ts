// NextAuth configuration file
// Yeh file NextAuth ko setup karti hai authentication ke liye
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { userRepo } from "@/lib/repositories/user";

// NextAuth configuration export kar rahe hai
// handlers - API routes handle karte hai
// auth - Session check karne ke liye helper function
// signIn / signOut - Login logout helpers
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Step 1: Credentials provider configure kar rahe hai
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Step 2: Email aur password verify karne wala function
      authorize: async (credentials) => {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = (credentials?.password as string) || "";

        if (!email || !password) return null;

        const user = await userRepo.findByEmail(email);
        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  // Step 3: JWT token aur session callbacks configure kar rahe hai
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  // Step 4: JWT strategy use kar rahe hai session ke liye
  session: { strategy: "jwt" },
  // Step 5: Custom login page set kar rahe hai
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
