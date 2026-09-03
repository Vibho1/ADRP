import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions ={
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // MUST explicitly include secret here for Vercel production builds:
  secret: process.env.NEXTAUTH_SECRET,
  // Fix: Trust host header so NextAuth accepts Vercel preview URLs dynamically
  useSecureCookies: process.env.NODE_ENV === "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };