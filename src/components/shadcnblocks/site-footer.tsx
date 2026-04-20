'use client';

import { Facebook, Instagram, Linkedin, Send, Twitter, ShieldCheck } from 'lucide-react';

/**
 * SiteFooter — landing-page footer with four link columns, social,
 * legal bottom bar, and a trust reminder.
 */

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Browse',
    links: [
      { label: 'Rides', href: '#' },
      { label: 'Spaces', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Market', href: '#' },
      { label: 'Living', href: '#' },
      { label: 'Devices', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Dealo Hub', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Careers at Dealo', href: '#' },
      { label: 'Partnerships', href: '#' },
      { label: 'Contact us', href: '#' },
    ],
  },
  {
    title: 'Trust & Safety',
    links: [
      { label: 'How verification works', href: '#' },
      { label: 'Safety tips', href: '#' },
      { label: 'Report a listing', href: '#' },
      { label: 'Scam prevention', href: '#' },
      { label: 'Community guidelines', href: '#' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Buyer FAQ', href: '#' },
      { label: 'Seller FAQ', href: '#' },
      { label: 'Contact support', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', href: '#', Icon: Instagram },
  { label: 'X / Twitter', href: '#', Icon: Twitter },
  { label: 'Facebook', href: '#', Icon: Facebook },
  { label: 'LinkedIn', href: '#', Icon: Linkedin },
];

export const SiteFooter = () => {
  return (
    <footer className="relative w-full border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        {/* Top block: brand + newsletter + columns */}
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7l9-4 9 4-9 4z" />
                  <path d="M3 12l9 4 9-4" />
                  <path d="M3 17l9 4 9-4" />
                </svg>
              </div>
              <span className="font-calSans text-lg font-semibold tracking-tight text-foreground">
                Dealo Hub
              </span>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-foreground/60">
              Premium C2C marketplace for the Gulf. Every listing verified by AI
              + humans — sell with trust, buy with confidence.
            </p>

            {/* Trust row */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px] font-medium text-emerald-400">
              <ShieldCheck size={13} strokeWidth={2} />
              AI + Human verified marketplace
            </div>

            {/* Newsletter */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full max-w-sm items-center gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="your@email.com"
                className="h-10 flex-1 rounded-full border border-foreground/15 bg-foreground/[0.03] px-4 text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition focus:border-foreground/40"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background transition hover:bg-foreground/90"
              >
                Subscribe
                <Send size={12} className="rtl:-scale-x-100" />
              </button>
            </form>
            <p className="text-[10.5px] text-foreground/40">
              Weekly pulse on pricing, drops, and new verified listings. No spam.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-[13px] text-foreground/70 transition hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px w-full bg-foreground/10" />

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="text-[11.5px] text-foreground/50">
            © {new Date().getFullYear()} Dealo Hub. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-foreground/55">
            <a href="#" className="transition hover:text-foreground">Terms of service</a>
            <a href="#" className="transition hover:text-foreground">Privacy policy</a>
            <a href="#" className="transition hover:text-foreground">Cookie settings</a>
            <a href="#" className="transition hover:text-foreground">Accessibility</a>
          </div>

          <ul className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-foreground/10 text-foreground/55 transition hover:border-foreground/30 hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  <Icon size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
