import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { readMerchantSession } from "@/lib/merchant-session";
import { OnboardingClient } from "./onboarding-client";

/**
 * Onboarding wizard shown to new merchants right after install.
 *
 * Server-resolved so we can pre-compute step state from the DB and pass
 * down to a small client component for the interactive bits.
 */
export default async function OnboardingPage() {
  const session = await readMerchantSession();
  if (!session) redirect("/");

  const [productMapCount, subscription, designCount] = await Promise.all([
    // Heuristic: at least one product has a `pod.product_slug` metafield
    // — but we don't track that locally; just expose a stub for now.
    Promise.resolve(0),
    prisma.subscription.findUnique({
      where: { shopId: session.shopId },
      select: { status: true, trialEndsAt: true },
    }),
    prisma.design.count({ where: { shopId: session.shopId } }),
  ]);

  // If they've already finished the trial + connected something, skip.
  if (subscription?.status === "active" && (productMapCount > 0 || designCount > 0)) {
    redirect("/merchant/dashboard");
  }

  const steps = [
    {
      key: "welcome",
      label: "Welcome",
      done: true,
    },
    {
      key: "connect",
      label: "Connect a product",
      done: productMapCount > 0,
    },
    {
      key: "theme",
      label: "Add studio block to theme",
      done: false,
    },
    {
      key: "subscribe",
      label: "Start free trial",
      done: subscription !== null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-pink-400 text-sm font-mono uppercase tracking-widest mb-2">
            Setup · {session.shopDomain}
          </p>
          <h1 className="text-3xl font-black">Let&apos;s get your store ready</h1>
          <p className="text-gray-400 text-sm mt-2">
            Four quick steps. You can return to any of them later from the dashboard.
          </p>
        </div>

        {/* Step indicator */}
        <ol className="grid grid-cols-4 gap-3 mb-10">
          {steps.map((step, idx) => (
            <li
              key={step.key}
              className={`rounded-xl px-3 py-3 border text-xs ${
                step.done
                  ? "border-green-500/40 bg-green-500/10 text-green-300"
                  : "border-white/10 bg-gray-900 text-gray-400"
              }`}
            >
              <div className="font-mono opacity-60">Step {idx + 1}</div>
              <div className="font-semibold mt-1 truncate">{step.label}</div>
            </li>
          ))}
        </ol>

        <OnboardingClient
          hasSubscription={subscription !== null}
          shopDomain={session.shopDomain}
        />

        <div className="mt-10 flex items-center justify-between text-sm text-gray-500">
          <Link href="/merchant/dashboard" className="hover:text-pink-300 transition-colors">
            Skip — take me to the dashboard
          </Link>
          <span>Need help? support@pod.star7gaurav.in</span>
        </div>
      </div>
    </div>
  );
}
