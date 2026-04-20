'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { SEED_LISTINGS, HERO_LISTING_INDICES } from './listings-data';

interface Feature283Props {
  className?: string;
}

const Feature283 = ({ className = '' }: Feature283Props) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState('All');
  const categories = ['All', 'Motors', 'Jobs', 'Classifieds', 'Property', 'New Projects', 'Community'];

  const DealoSearchInline = () => (
    <div className="relative z-10 mt-10 w-full max-w-lg">
      {/* Row 1 — category pills */}
      <div className="flex flex-nowrap items-center gap-x-3 overflow-x-auto whitespace-nowrap text-[11px] font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="font-semibold text-foreground">Searching in</span>
        {categories.map((cat) => {
          const isActive = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={
                'whitespace-nowrap rounded-full transition ' +
                (isActive
                  ? 'bg-[#e30613] px-2.5 py-0.5 text-white shadow'
                  : 'px-1 py-0.5 text-foreground/80 hover:text-foreground')
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Row 2 — input + Search CTA */}
      <div className="mt-2.5 flex items-stretch gap-2">
        <div className="relative flex h-9 flex-1 items-center rounded-md bg-white px-3 shadow">
          <input
            type="text"
            placeholder="Search for anything"
            className="h-full w-full border-0 bg-transparent pr-7 text-xs text-neutral-900 placeholder:text-neutral-500 outline-none focus:outline-none"
          />
          <Search size={14} className="absolute right-3 text-neutral-500" />
        </div>
        <button className="inline-flex h-9 items-center justify-center rounded-md bg-[#e30613] px-4 text-xs font-semibold text-white shadow transition hover:bg-[#c80510]">
          Search
        </button>
      </div>
    </div>
  );

  // Hero scatters — the 6 slots are fixed positions; the images come
  // from the shared SEED_LISTINGS so the hero stays in sync with the
  // live feed below. Swap listings ⇒ swap hero imagery automatically.
  const wraps = [
    'w-40 h-52 absolute -left-10 top-1/2 -translate-x-full -translate-y-1/2',
    'size-28 absolute -top-3 left-10 -translate-x-full -translate-y-full',
    'size-32 absolute -bottom-3 left-10 -translate-x-full translate-y-full',
    'w-44 h-52 absolute -right-10 top-1/2 -translate-y-1/2 translate-x-full',
    'size-28 absolute -top-3 right-10 -translate-y-full translate-x-full',
    'size-32 absolute -bottom-3 right-10 translate-x-full translate-y-full',
  ];

  const images = HERO_LISTING_INDICES.map((idx, i) => ({
    src: SEED_LISTINGS[idx].image,
    alt: SEED_LISTINGS[idx].title,
    wrap: wraps[i],
  }));

  return (
    <section className={'flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-16 ' + className}>
      <div className="container mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center px-4">
        <div className="relative flex w-full max-w-lg flex-col items-center justify-center">
          <h2 className="relative py-2 text-center font-sans text-4xl font-semibold tracking-tighter md:text-5xl">
            Built by and for Developers
          </h2>
          <p className="mx-auto mt-2 max-w-xl px-5 text-center text-sm text-muted-foreground/50 md:text-base">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorem
            suscipit dolor blanditiis voluptatum minus est labore amet
            necessitatibus quod distinctio! ipsum dolor sit
          </p>
          <DealoSearchInline />

          {images.map((image, index) => (
            <div key={index} className={image.wrap}>
              <motion.div
                drag
                initial={{ y: '50%', opacity: 0, scale: 0.8 }}
                whileInView={{ y: 0, opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut',
                  delay: index * 0.1 + 0.5,
                }}
                animate={{
                  filter:
                    hoveredIndex !== null && hoveredIndex !== index
                      ? 'blur(10px)'
                      : 'blur(0px)',
                  scale: hoveredIndex === index ? 1.05 : 1,
                  transition: { duration: 0.3, ease: 'easeOut', delay: 0 },
                }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                className="size-full overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="pointer-events-none size-full object-cover"
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Feature283;
