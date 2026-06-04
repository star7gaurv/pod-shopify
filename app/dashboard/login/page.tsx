"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError(
        "This page opens from inside Print Studio in your Shopify admin. Open the app, then click “Open full dashboard”.",
      );
      return;
    }

    const next = params.get("next");
    const callbackUrl = next && next.startsWith("/dashboard") ? next : "/dashboard";

    signIn("merchant-token", { token, redirect: false })
      .then((res) => {
        if (res?.error) {
          setError("This sign-in link has expired. Reopen the dashboard from your app.");
          return;
        }
        router.replace(callbackUrl);
      })
      .catch(() => setError("Could not sign you in. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center">
      <div className="max-w-sm">
        <div className="text-pink-400 font-bold tracking-tight mb-3">Print Studio</div>
        {error ? (
          <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
        ) : (
          <p className="text-gray-400 text-sm animate-pulse">Signing you in…</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardLogin() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
