'use client';

/* FeaturedBrandsStrip — trusted partner logos under hero */

export const FeaturedBrandsStrip = () => {
  const brands = [
    { name: 'Toyota',     url: 'https://cdn.simpleicons.org/toyota/ffffff' },
    { name: 'BMW',        url: 'https://cdn.simpleicons.org/bmw/ffffff' },
    { name: 'Nissan',     url: 'https://cdn.simpleicons.org/nissan/ffffff' },
    { name: 'Audi',       url: 'https://cdn.simpleicons.org/audi/ffffff' },
    { name: 'Ford',       url: 'https://cdn.simpleicons.org/ford/ffffff' },
    { name: 'Honda',      url: 'https://cdn.simpleicons.org/honda/ffffff' },
    { name: 'Hyundai',    url: 'https://cdn.simpleicons.org/hyundai/ffffff' },
    { name: 'Porsche',    url: 'https://cdn.simpleicons.org/porsche/ffffff' },
    { name: 'Volkswagen', url: 'https://cdn.simpleicons.org/volkswagen/ffffff' },
    { name: 'Subaru',     url: 'https://cdn.simpleicons.org/subaru/ffffff' },
    { name: 'Mazda',      url: 'https://cdn.simpleicons.org/mazda/ffffff' },
    { name: 'Jeep',       url: 'https://cdn.simpleicons.org/jeep/ffffff' },
  ];

  const loop = [...brands, ...brands];

  return (
    <section className="relative w-full border-y border-white/5 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Label row */}
        <div className="mb-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-white/20" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Trusted by leading brands
            </span>
          </div>
          <a
            href="#"
            className="hidden text-xs font-medium text-white/50 transition hover:text-white md:inline-flex items-center gap-1"
          >
            Browse all dealers
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Marquee track */}
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-[brandscroll_40s_linear_infinite] items-center gap-14 py-2">
            {loop.map((b, i) => (
              <div
                key={i}
                className="group flex h-10 shrink-0 items-center justify-center opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                title={b.name}
              >
                <img
                  src={b.url}
                  alt={b.name}
                  className="h-8 w-auto max-w-[110px] object-contain"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                    if (el.parentElement) {
                      el.parentElement.innerHTML = `<span class='text-sm font-semibold tracking-wide text-white/70'>${b.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee keyframes */}
      <style>{`
        @keyframes brandscroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        section:hover .animate-\\[brandscroll_40s_linear_infinite\\] {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default FeaturedBrandsStrip;
