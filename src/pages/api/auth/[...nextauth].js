import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default NextAuth({
  providers: [
    // Google Sign-In
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // Website login using email/password
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.users.findUnique({
          where: { userEmail: credentials.email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // In production: check password hash here
        if (credentials.password !== user.userPassword) {
          throw new Error("Invalid password");
        }

        return user;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { userEmail: user.email },
        });

        if (!existingUser) {
          // Create user in DB
          await prisma.users.create({
            data: {
              userName: user.name,
              userEmail: user.email,
              userPassword: "", // No password for Google accounts
              userAddress: "",
              userPhone: null,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) token.id = user.userId || user.id;
      return token;
    },

    async session({ session, token }) {
      if (token) session.user.id = token.id;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});
