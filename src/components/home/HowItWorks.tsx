const steps = [
  {
    number: "1",
    title: "Choose the gear",
    copy: "Select the product first so the customer enters the right workflow before customizing anything.",
  },
  {
    number: "2",
    title: "Open the studio",
    copy: "Adjust colors, template direction, logos, names, and numbers inside one controlled static interface.",
  },
  {
    number: "3",
    title: "Build the order",
    copy: "Save a design, carry it into a team order, and prepare for the proof-first production flow later.",
  },
];

export function HowItWorks() {
  return (
    <section className="border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-10">
      <p className="mb-4 font-mono text-sm uppercase tracking-[0.34em] text-white/55">
        How It Works
      </p>
      <h2 className="max-w-3xl text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl">
        Pick it. Build it. Order it.
      </h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {steps.map((step) => (
          <article
            key={step.number}
            className="min-h-[280px] border border-white/8 bg-linear-to-b from-white/5 to-white/[0.02] p-7"
          >
            <p className="mb-5 text-5xl font-black text-[var(--accent)]">
              {step.number}
            </p>
            <h3 className="text-xl font-extrabold text-white">{step.title}</h3>
            <p className="mt-3 text-[15px] leading-8 text-white/62">
              {step.copy}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
