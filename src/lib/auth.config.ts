import type { NextAuthConfig } from "next-auth";
import type { JWT } from "@auth/core/jwt";
import type { Session, User } from "next-auth";

/**
 * Edge-safe subset of the auth config — no Credentials provider, so no Prisma
 * or bcrypt in this file's import graph. proxy.ts (Next 16's renamed
 * middleware) needs this specifically: Netlify compiles it into an Edge
 * Function (a V8 isolate), which can't load Prisma's native query-engine
 * binary. Everything else (route handler, server actions, pages) imports the
 * full config from auth.ts instead, which runs as a real Node function.
 */
export default {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
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
} satisfies NextAuthConfig;
