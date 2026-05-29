const steps = [
  {
    number: "1",
    title: "Pick a Product",
    description: "Choose the item you want to customize.",
  },
  {
    number: "2",
    title: "Add Your Design",
    description: "Upload logos, set colors, and add names or numbers.",
  },
  {
    number: "3",
    title: "Preview Before Production",
    description:
      "Review your design inside the studio before submitting.",
  },
  {
    number: "4",
    title: "Submit Your Order",
    description:
      "We review your design and confirm details before production.",
  },
];

export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-28 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.96))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-10"
    >
      <p className="font-mono text-sm uppercase tracking-[0.34em] text-white/55">
        How the Studio Works
      </p>
      <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl">
        A clear design workflow before production starts
      </h2>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <article
            key={step.number}
            className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
          >
            <p className="text-5xl font-black text-[var(--accent)]">
              {step.number}
            </p>
            <h3 className="mt-5 text-xl font-extrabold text-white">
              {step.title}
            </h3>
            <p className="mt-3 text-[15px] leading-7 text-white/62">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
