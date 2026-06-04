import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    // Exposed here (not just in auth.ts) so the EDGE middleware — which runs
    // `NextAuth(authConfig)` without the providers — can read the merchant
    // realm + shop off the session. The token already carries these (written
    // by auth.ts's jwt callback at sign-in); we just surface them.
    session({ session, token }) {
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
} satisfies NextAuthConfig;
