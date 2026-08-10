import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "@auth/core/jwt";
import type { Session, User } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Self-hosted app behind a developer-controlled deployment (not multi-tenant SaaS on
  // arbitrary hosts) — trustHost is the standard Auth.js fix for "UntrustedHost" outside
  // dev mode. If this is later deployed behind a reverse proxy, that proxy is responsible
  // for setting X-Forwarded-Host correctly.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: { select: { displayName: true, avatarUrl: true } } },
        });
        if (!user) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.username,
          displayName: user.profile?.displayName ?? user.username,
          avatarUrl: user.profile?.avatarUrl ?? "/avatars/default.svg",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username;
        token.displayName = user.displayName;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.displayName = token.displayName;
      session.user.avatarUrl = token.avatarUrl;
      return session;
    },
  },
});
