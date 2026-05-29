"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123456");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    const nextUrl = callbackUrl || "/admin/dashboard";

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: nextUrl,
      });

      if (!result || result.error || !result.ok) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      router.push(result.url ?? nextUrl);
      router.refresh();
    } catch (error) {
      console.error("Admin sign-in failed.", error);
      setErrorMessage("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm text-white/78">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
        />
      </label>

      <label className="block">
        <span className="text-sm text-white/78">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
