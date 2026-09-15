import { prisma } from "@/lib/utils/db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (process.env.NODE_ENV === "production" && !authSecret) {
  throw new Error("NEXTAUTH_SECRET (ou AUTH_SECRET) é obrigatório em produção.");
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),

  pages: { signIn: "/signin" },

  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const allowed = consumeRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        });

        if (!user || !user.passwordHash) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          image: user.image ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);
