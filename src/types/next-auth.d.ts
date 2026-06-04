import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      /** "merchant" for external-dashboard sessions; undefined for admin. */
      kind?: string;
      shopId?: string;
      shopDomain?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
    kind?: string;
    shopId?: string;
    shopDomain?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    kind?: string;
    shopId?: string;
    shopDomain?: string;
  }
}
