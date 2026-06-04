import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { verifyDashboardToken } from "@/lib/merchant-session";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    // Merchant dashboard sign-in: exchanges a one-time hand-off token
    // (minted inside the embedded app) for a NextAuth session. This realm
    // is distinct from the admin Credentials realm — `kind: "merchant"`.
    Credentials({
      id: "merchant-token",
      name: "Merchant Token",
      credentials: { token: { label: "Token", type: "text" } },
      authorize: async (credentials) => {
        const token =
          typeof credentials?.token === "string" ? credentials.token : "";
        if (!token) return null;

        const session = await verifyDashboardToken(token);
        if (!session) return null;

        const shop = await prisma.shop.findUnique({
          where: { id: session.shopId, isActive: true },
        });
        if (!shop) return null;

        return {
          id: shop.id,
          name: shop.shopDomain,
          shopId: shop.id,
          shopDomain: shop.shopDomain,
          kind: "merchant" as const,
        };
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          throw new Error("Invalid email or password.");
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.kind = user.kind;
        token.shopId = user.shopId;
        token.shopDomain = user.shopDomain;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        session.user.kind = typeof token.kind === "string" ? token.kind : undefined;
        session.user.shopId = typeof token.shopId === "string" ? token.shopId : undefined;
        session.user.shopDomain =
          typeof token.shopDomain === "string" ? token.shopDomain : undefined;
      }

      return session;
    },
  },
});
