const features = [
  "Single rider order",
  "Team duplicate workflow",
  "Sponsor and staff apparel",
  "Proof-first production flow",
];

export function BuiltForTeams() {
  return (
    <section className="border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-10">
      <p className="mb-4 font-mono text-sm uppercase tracking-[0.34em] text-white/55">
        Built For Teams
      </p>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <h2 className="max-w-3xl text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl">
            One studio, multiple order types.
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-8 text-white/62">
            Use the same polished system for race jerseys, sponsor polos,
            hoodies, and pit apparel while keeping the customer journey focused
            on product selection first.
          </p>
        </div>

        <ul className="border-t border-white/8">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-4 border-b border-white/8 py-4 text-white/88"
            >
              <span className="h-3 w-3 rounded-full border-2 border-white/75" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
