import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  GraduationCap,
  Handshake,
  Megaphone,
  Store,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";

const audiences: Array<{
  label: string;
  icon: LucideIcon;
}> = [
  { label: "Racing Teams", icon: Trophy },
  { label: "Schools", icon: GraduationCap },
  { label: "Local Clubs", icon: Users },
  { label: "Event Organizers", icon: CalendarCheck2 },
  { label: "Sponsors", icon: Handshake },
  { label: "Pit Crews", icon: Wrench },
  { label: "Small Businesses", icon: Store },
  { label: "Promotional Campaigns", icon: Megaphone },
];

export function HomePerfectFor() {
  return (
    <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.96))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-10">
      <p className="font-mono text-sm uppercase tracking-[0.34em] text-white/55">
        Who We Support
      </p>
      <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl">
        Perfect For Teams, Clubs, Events &amp; Businesses
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((audience) => {
          const Icon = audience.icon;

          return (
          <article
            key={audience.label}
            className="rounded-[22px] border border-white/8 bg-white/[0.04] px-5 py-6 text-center transition hover:border-white/14 hover:bg-white/[0.06]"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,var(--brand-accent-surface-strong),var(--brand-accent-surface-faint))] shadow-[0_12px_24px_var(--brand-accent-icon-shadow)]">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/82">
              {audience.label}
            </p>
          </article>
          );
        })}
      </div>
    </section>
  );
}
