import { prisma } from "@/lib/utils/db";
import { PrismaAdapter } from "@auth/prisma-adapter"; // <-- ADAPTER
import { compare } from "bcryptjs";
import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // mantém JWT; o adapter persiste User/Account/Session/VerificationToken
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma), // <-- LIGA O ADAPTER

  pages: { signIn: "/signin" },

  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      // se você já tem usuário criado por credentials com o mesmo e-mail,
      // isso permite vincular a conta Google ao mesmo user:
      allowDangerousEmailAccountLinking: true,
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
        } as any;
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub; // id disponível na sessão
      }
      return session;
    },
  },
};

// helper p/ server components
export const getSession = () => getServerSession(authOptions);

// rota app/api/auth/[...nextauth]/route.ts
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
