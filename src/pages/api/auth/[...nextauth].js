// pages/api/auth/[...nextauth].js

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma = new PrismaClient();

export const authOptions = {
  // Use Prisma adapter to connect NextAuth with your database
  adapter: PrismaAdapter(prisma),

  // Authentication providers
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID, // from Google Cloud Console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // from Google Cloud Console
    }),
    // Credentials provider for email/password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
 
        if (!credentials.email || !credentials.password) return null;

    
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

    
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // If valid, return user object; NextAuth will issue JWT
        return user;
      },
    }),
  ],

  // Session configuration
  session: {
    strategy: "jwt", // Use JWT for session management
  },

  // Callbacks allow modifying session or JWT
  callbacks: {
    // Attach userId to session object for easy access in API routes
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },


  pages: {
    signIn: "/auth/signin", // Redirect to this page when users need to sign in
  },

  //jwt secret
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
