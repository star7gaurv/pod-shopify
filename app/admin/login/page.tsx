import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const callbackUrl =
    resolvedSearchParams?.callbackUrl || "/admin/dashboard";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(2,6,23,0.96)_48%)] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.38)] lg:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-white/55">
          Admin Access
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
          Sign in to manage the studio
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Use your admin email and password to access the dashboard.
        </p>
        <div className="mt-6">
          <AdminLoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </main>
  );
}
