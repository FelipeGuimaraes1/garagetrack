import { withAuth } from "next-auth/middleware";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;

  const publicExact = new Set([
    "/signin",
    "/signup",
    "/api/register",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/site.webmanifest",
  ]);
  if (publicExact.has(pathname)) return true;

  const publicPrefixes = [
    "/api/auth",
    "/opengraph-image",
    "/apple-touch-icon",
  ];
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;

  return /\.(ico|png|svg|jpg|jpeg|webp|txt|xml|webmanifest)$/i.test(pathname);
}

export default withAuth({
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      if (isPublicPath(req.nextUrl.pathname)) return true;
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
