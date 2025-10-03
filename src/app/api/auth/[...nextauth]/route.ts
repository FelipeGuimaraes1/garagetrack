import { authOptions } from "@/lib/auth/auth";
import NextAuth from "next-auth/next";

// v4 no App Router: cria um único handler e reexporta para GET e POST
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
