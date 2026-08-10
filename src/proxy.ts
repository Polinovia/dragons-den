import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

// Uses the edge-safe config (no Credentials provider / Prisma) — see
// auth.config.ts for why. This instance only ever reads the existing session
// cookie here, it never needs to look anything up in the database.
const { auth } = NextAuth(authConfig);

const protectedPrefixes = ["/feed", "/create", "/settings"];

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  if (isProtected(pathname) && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/feed/:path*", "/create/:path*", "/settings/:path*"],
};
