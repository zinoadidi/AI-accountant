import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { users } from "@/lib/db";

// Fixed admin identity from env (see .env.example). The password itself is
// never stored — only its bcrypt hash lives in ADMIN_PASSWORD_HASH.
export const ADMIN_ID = "admin";
export function adminEmail() {
  return (process.env.ADMIN_EMAIL ?? "").toLowerCase();
}
export function isAdminUser(user?: { id?: string; email?: string | null } | null) {
  return !!user && (user.id === ADMIN_ID || (!!user.email && user.email.toLowerCase() === adminEmail() && adminEmail() !== ""));
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await users.findByEmail(credentials.email);
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    CredentialsProvider({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").toLowerCase();
        const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
        if (!email || !credentials?.password || !hash || email !== adminEmail()) return null;
        const valid = await bcrypt.compare(credentials.password, hash);
        if (!valid) return null;
        return { id: ADMIN_ID, email, name: "Administrator" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as unknown as Record<string, unknown>).isAdmin = isAdminUser({ id: user.id, email: user.email });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { isAdmin?: boolean }).isAdmin =
          (token as unknown as Record<string, unknown>).isAdmin === true;
      }
      return session;
    },
  },
};
