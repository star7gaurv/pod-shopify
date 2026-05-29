const testimonials = [
  {
    quote:
      "The studio made it much easier to explain our shirt design. We uploaded logos, added names, and sent a clear order.",
    name: "Joa Skeide",
  },
  {
    quote:
      "We liked being able to preview the design before production. It saved time and avoided confusion.",
    name: "Martin Water",
  },
  {
    quote:
      "My Shirt guy come in clutch for the team. We had a last minute order and they delivered exactly what we needed. We'll be looking the part thanks to them.",
    name: "Ryan ShortStroke Stevens",
  },
];

export function HomeTestimonials() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-28 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.96))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-10"
    >
      <p className="font-mono text-sm uppercase tracking-[0.34em] text-white/55">
        Testimonials
      </p>
      <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl">
        Reviews From Our Customers
      </h2>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="rounded-[24px] border border-white/8 bg-white/[0.04] p-6"
          >
            <p className="text-base leading-8 text-white/72">
              “{testimonial.quote}”
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {testimonial.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
