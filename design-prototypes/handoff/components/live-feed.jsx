/* LiveFeed — real-time marketplace activity feed
   ─────────────────────────────────────────────
   Composition:
   - Sticky live status bar (pulse + spark chart + totals)
   - Horizontal filter pills (single-select, colored dots)
   - 2-col layout: feed (centered) + hushed sidebar
   - 3 card types: NewListing / PriceDrop / ActivitySignal (divider-style)
   - Simulation: a new item enters the top every ~8s (staggered)
   - Motion: 400ms ease-out slide-up on enter, nothing else bouncy
   - Color restraint: red only for live + price-drop + active filter
*/

const LiveFeed = () => {
  const { motion, AnimatePresence } = window.Motion;

  // ─── Seed data ─────────────────────────────────────────────
  const SEED_LISTINGS = [
    { id: 101, cat: "cars",     title: "BMW X5 xDrive40i M Sport", meta: "2023 · 12K km · Full option", price: "AED 285,000", loc: "Dubai Marina", dealer: "Al-Futtaim Motors", verified: true, featured: false, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop", ts: 0 },
    { id: 102, cat: "property", title: "2BR Apartment · Marina Pinnacle", meta: "1,240 sqft · Fully furnished", price: "AED 125,000/yr", loc: "Dubai Marina", dealer: "Emaar Residences", verified: true, featured: true, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop", ts: 0 },
    { id: 103, cat: "tech",     title: "iPhone 15 Pro Max · 256GB", meta: "Natural Titanium · Sealed", price: "AED 4,299", loc: "Deira, Dubai", dealer: "Sharaf DG", verified: true, featured: false, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop", ts: 0 },
    { id: 104, cat: "cars",     title: "Mercedes G63 AMG", meta: "2024 · Brand new · GCC", price: "AED 890,000", loc: "Sheikh Zayed Rd", dealer: "Gargash Motors", verified: true, featured: true, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop", ts: 0 },
    { id: 105, cat: "property", title: "Villa · Palm Jumeirah", meta: "5BR · Private beach · Signature", price: "AED 48,000,000", loc: "Palm Jumeirah", dealer: "Damac Properties", verified: true, featured: true, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&auto=format&fit=crop", ts: 0 },
    { id: 106, cat: "tech",     title: "MacBook Pro 16 · M3 Max", meta: "64GB · 2TB · Space Black", price: "AED 12,499", loc: "Mall of the Emirates", dealer: "Virgin Megastore", verified: true, featured: false, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop", ts: 0 },
    { id: 107, cat: "cars",     title: "Range Rover Sport Autobiography", meta: "2024 · 3.0L · Warranty", price: "AED 620,000", loc: "Al Quoz", dealer: "Al Tayer Motors", verified: true, featured: false, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop", ts: 0 },
    { id: 108, cat: "property", title: "Office Space · DIFC", meta: "2,800 sqft · Grade A", price: "AED 380,000/yr", loc: "DIFC, Dubai", dealer: "Deyaar", verified: true, featured: false, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop", ts: 0 },
  ];

  const PRICE_DROPS = [
    { id: 201, cat: "cars",     title: "Audi Q8 55 TFSI Quattro", meta: "2022 · 28K km",                  oldPrice: "AED 320,000", price: "AED 279,000", drop: -13, loc: "JLT",       dealer: "Audi UAE",            verified: true, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop", ts: 0 },
    { id: 202, cat: "property", title: "3BR Townhouse · Arabian Ranches", meta: "2,200 sqft · Maid's room", oldPrice: "AED 3,200,000", price: "AED 2,850,000", drop: -11, loc: "Arabian Ranches", dealer: "Emaar Properties", verified: true, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop", ts: 0 },
    { id: 203, cat: "tech",     title: "iPad Pro 12.9 · M2 · 1TB", meta: "Wi-Fi + Cellular · Silver",     oldPrice: "AED 6,199", price: "AED 5,299", drop: -15, loc: "Ibn Battuta", dealer: "Jumbo Electronics", verified: true, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop", ts: 0 },
  ];

  const ACTIVITY_SIGNALS = [
    "12 new cars listed in the last hour across Dubai",
    "A villa in Emirates Hills just sold for AED 62M",
    "3 people are viewing this BMW X5 right now",
    "Apartments in Marina averaging 4% higher this week",
    "Verified dealer Al-Futtaim added 8 new listings today",
    "Gold-tier listings getting 3× more inquiries on average",
    "New record: 847 properties listed today",
  ];

  // ─── State ─────────────────────────────────────────────────
  const [filter, setFilter] = React.useState("all");
  const [feed, setFeed]     = React.useState(() => {
    // Initial feed: interleave listings with one price-drop and one signal
    const now = Date.now();
    const items = [
      { kind: "listing",  ...SEED_LISTINGS[0], ts: now - 1000 * 60 * 2 },
      { kind: "listing",  ...SEED_LISTINGS[1], ts: now - 1000 * 60 * 4 },
      { kind: "signal",   id: "s1", text: ACTIVITY_SIGNALS[0], ts: now - 1000 * 60 * 5 },
      { kind: "listing",  ...SEED_LISTINGS[2], ts: now - 1000 * 60 * 8 },
      { kind: "pricedrop",...PRICE_DROPS[0], ts: now - 1000 * 60 * 11 },
      { kind: "listing",  ...SEED_LISTINGS[3], ts: now - 1000 * 60 * 14 },
      { kind: "listing",  ...SEED_LISTINGS[4], ts: now - 1000 * 60 * 18 },
      { kind: "listing",  ...SEED_LISTINGS[5], ts: now - 1000 * 60 * 28 },
    ];
    return items;
  });

  // ─── Simulation: add new item every ~8s ────────────────────
  React.useEffect(() => {
    const tick = () => {
      const roll = Math.random();
      const now = Date.now();
      let newItem;

      if (roll < 0.15) {
        newItem = {
          kind: "signal",
          id: `s-${now}`,
          text: ACTIVITY_SIGNALS[Math.floor(Math.random() * ACTIVITY_SIGNALS.length)],
          ts: now,
        };
      } else if (roll < 0.30) {
        const base = PRICE_DROPS[Math.floor(Math.random() * PRICE_DROPS.length)];
        newItem = { ...base, id: `${base.id}-${now}`, kind: "pricedrop", ts: now };
      } else {
        const base = SEED_LISTINGS[Math.floor(Math.random() * SEED_LISTINGS.length)];
        newItem = { ...base, id: `${base.id}-${now}`, kind: "listing", ts: now };
      }

      setFeed((prev) => [newItem, ...prev].slice(0, 8));
    };

    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  // ─── Filtering ─────────────────────────────────────────────
  const visible = feed.filter((it) => {
    if (filter === "all") return true;
    if (filter === "featured")   return it.kind === "listing" && it.featured;
    if (filter === "pricedrop") return it.kind === "pricedrop";
    if (it.kind === "signal") return false;
    return it.cat === filter;
  });

  return (
    <section className="relative w-full bg-background">
      {/* Live status bar (sticky under navbar) */}
      <LiveStatusBar feed={feed} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* ── Feed column ─────────────────────────────────── */}
          <div className="min-w-0">
            <FeedHeader />
            <FilterPills value={filter} onChange={setFilter} />

            <div className="mt-6 space-y-3">
              <AnimatePresence initial={false}>
                {visible.map((item) => {
                  if (item.kind === "signal")   return <SignalRow key={item.id} item={item} />;
                  if (item.kind === "pricedrop") return <ListingCard key={item.id} item={item} priceDrop />;
                  return <ListingCard key={item.id} item={item} />;
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </section>
  );
};

window.LiveFeed = LiveFeed;
