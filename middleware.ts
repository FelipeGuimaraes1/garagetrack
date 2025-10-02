import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;

      // rotas públicas
      const publicPaths = [
        "/",
        "/signin",
        "/signup",
        "/api/auth",
        "/favicon.ico",
      ];
      if (publicPaths.some((p) => pathname.startsWith(p))) return true;

      // demais pedem token (usuário logado)
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
