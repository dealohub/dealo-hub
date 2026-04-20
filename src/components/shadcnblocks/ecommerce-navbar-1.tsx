'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  CircleUserRound,
  Plus,
  Phone,
  Send,
  type LucideIcon,
} from 'lucide-react';

/* ---------- Types ---------- */

interface SubItem {
  label: string;
  href: string;
}

interface MenuSection {
  label: string;
  href: string;
  id: string;
  badge?: string;
  imageSrc: string;
  items: SubItem[];
}

interface FeaturedItem {
  imageSrc: string;
  href: string;
  label: string;
}

interface MegaMenu {
  sections?: MenuSection[];
  featuredItems?: FeaturedItem[];
}

interface MenuItem {
  id?: string;
  label: string;
  href: string;
  accentColor?: string;
  badge?: string;
  megaMenu?: MegaMenu;
}

interface HomeInfo {
  href: string;
  logo: { src: string; alt: string };
  name: string;
}

interface SocialIcon {
  title: string;
  light: string;
  dark: string;
}

interface SocialLink {
  icon: SocialIcon;
  href: string;
}

interface HelpfulLink {
  label: string;
  href: string;
}

interface ContactLink {
  label: string;
  href: string;
  iconKey: 'Phone' | 'Send';
}

/* ---------- Default data ---------- */

const HELPFULL_LINKS: HelpfulLink[] = [
  { label: 'Help & Support', href: '#' },
  { label: 'Safety Tips', href: '#' },
  { label: 'Terms & conditions', href: '#' },
];

const CONTACT_INFO: ContactLink[] = [
  { label: '+971 800-DEALO', href: 'tel:+971800332567', iconKey: 'Phone' },
  { label: 'support@dealohub.com', href: 'mailto:support@dealohub.com', iconKey: 'Send' },
];

const SOCIAL_ICONS = {
  facebook:  { title: 'Facebook',  light: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/facebook-icon.svg',  dark: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/facebook-icon.svg' },
  x:         { title: 'X',         light: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/x.svg',              dark: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/x.svg' },
  instagram: { title: 'Instagram', light: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/instagram-icon.svg', dark: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/instagram-icon.svg' },
};

const SOCIAL_MEDIA_LINKS: SocialLink[] = [
  { icon: SOCIAL_ICONS.facebook,  href: '#' },
  { icon: SOCIAL_ICONS.x,         href: '#' },
  { icon: SOCIAL_ICONS.instagram, href: '#' },
];

const MENU: MenuItem[] = [
  {
    id: 'motors', label: 'Rides', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'Used Cars', href: '#', id: 'used-cars',
          imageSrc: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop',
          items: [
            { label: 'Toyota', href: '#' },
            { label: 'Mercedes-Benz', href: '#' },
            { label: 'BMW', href: '#' },
            { label: 'Nissan', href: '#' },
            { label: 'Lexus', href: '#' },
            { label: 'Hyundai', href: '#' },
            { label: 'Porsche', href: '#' },
            { label: 'Ford', href: '#' },
            { label: 'Audi', href: '#' },
            { label: 'Kia', href: '#' },
            { label: 'Land Rover', href: '#' },
            { label: 'Jeep', href: '#' },
            { label: 'Chevrolet', href: '#' },
            { label: 'Jetour', href: '#' },
            { label: 'Dodge', href: '#' },
            { label: 'Rolls-Royce', href: '#' },
            { label: 'Bentley', href: '#' },
          ],
        },
        {
          label: 'New Cars', href: '#', id: 'new-cars',
          imageSrc: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop',
          items: [
            { label: 'Toyota', href: '#' },
            { label: 'Hyundai', href: '#' },
            { label: 'Kia', href: '#' },
            { label: 'Nissan', href: '#' },
            { label: 'MG', href: '#' },
            { label: 'Chery', href: '#' },
          ],
        },
        {
          label: 'Rental Cars', href: '#', id: 'rental-cars', badge: 'NEW',
          imageSrc: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop',
          items: [
            { label: 'Daily Rental', href: '#' },
            { label: 'Monthly Rental', href: '#' },
            { label: 'Luxury Fleet', href: '#' },
            { label: 'Economy', href: '#' },
          ],
        },
        {
          label: 'Motorcycles', href: '#', id: 'motorcycles',
          imageSrc: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop',
          items: [
            { label: 'Sport Bikes', href: '#' },
            { label: 'Cruisers', href: '#' },
            { label: 'Scooters', href: '#' },
            { label: 'Dirt Bikes', href: '#' },
          ],
        },
      ],
      featuredItems: [
        { imageSrc: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop', href: '#', label: 'Sell My Car' },
        { imageSrc: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&auto=format&fit=crop', href: '#', label: 'Car Inspection' },
      ],
    },
  },
  {
    id: 'property', label: 'Spaces', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'For Rent', href: '#', id: 'for-rent',
          imageSrc: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
          items: [
            { label: 'Residential', href: '#' },
            { label: 'Commercial', href: '#' },
            { label: 'Rooms For Rent', href: '#' },
            { label: 'Monthly Short Term', href: '#' },
            { label: 'Daily Short Term', href: '#' },
          ],
        },
        {
          label: 'For Sale', href: '#', id: 'for-sale',
          imageSrc: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
          items: [
            { label: 'New Projects', href: '#' },
            { label: 'Residential', href: '#' },
            { label: 'Commercial', href: '#' },
            { label: 'Off-Plan', href: '#' },
            { label: 'Land', href: '#' },
            { label: 'Multiple Units', href: '#' },
          ],
        },
        {
          label: 'Agent & Agency Search', href: '#', id: 'agents',
          imageSrc: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=800&auto=format&fit=crop',
          items: [
            { label: 'Find an Agent', href: '#' },
            { label: 'Find an Agency', href: '#' },
            { label: 'Top-rated Agencies', href: '#' },
          ],
        },
      ],
    },
  },
  {
    id: 'jobs', label: 'Careers', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'Browse Jobs', href: '#', id: 'browse-jobs',
          imageSrc: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
          items: [
            { label: 'Accounting & Finance', href: '#' },
            { label: 'Engineering', href: '#' },
            { label: 'Healthcare', href: '#' },
            { label: 'Hospitality', href: '#' },
            { label: 'IT & Telecoms', href: '#' },
            { label: 'Marketing & PR', href: '#' },
            { label: 'Sales', href: '#' },
            { label: 'Teaching', href: '#' },
          ],
        },
      ],
      featuredItems: [
        { imageSrc: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop', href: '#', label: 'Post a Job' },
        { imageSrc: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop', href: '#', label: 'Upload your CV' },
      ],
    },
  },
  {
    id: 'classifieds', label: 'Market', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'Electronics', href: '#', id: 'electronics',
          imageSrc: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop',
          items: [
            { label: 'Home Audio & Turntables', href: '#' },
            { label: 'Televisions', href: '#' },
            { label: 'DVD & Home Theater', href: '#' },
            { label: 'Electronic Accessories', href: '#' },
            { label: 'Gadgets', href: '#' },
            { label: 'Car Electronics', href: '#' },
            { label: 'Projectors', href: '#' },
            { label: 'Mp3 Players and Portable Audio', href: '#' },
            { label: 'Satellite & Cable TV', href: '#' },
            { label: 'Health Electronics', href: '#' },
            { label: 'Smart Home', href: '#' },
            { label: 'Wearable Technology', href: '#' },
            { label: 'Other', href: '#' },
          ],
        },
        {
          label: 'Computers & Networking', href: '#', id: 'computers',
          imageSrc: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop',
          items: [
            { label: 'Laptops', href: '#' },
            { label: 'Desktops', href: '#' },
            { label: 'Networking', href: '#' },
            { label: 'Accessories', href: '#' },
          ],
        },
        {
          label: 'Home Appliances', href: '#', id: 'home-appliances',
          imageSrc: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop',
          items: [
            { label: 'Refrigerators', href: '#' },
            { label: 'Washing Machines', href: '#' },
            { label: 'Air Conditioners', href: '#' },
            { label: 'Kitchen Appliances', href: '#' },
          ],
        },
      ],
    },
  },
  {
    id: 'furniture', label: 'Living', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'Furniture', href: '#', id: 'furniture-cat',
          imageSrc: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
          items: [
            { label: 'Sofas & Armchairs', href: '#' },
            { label: 'Beds & Mattresses', href: '#' },
            { label: 'Dining & Kitchen', href: '#' },
            { label: 'Tables', href: '#' },
            { label: 'Storage', href: '#' },
            { label: 'Office Furniture', href: '#' },
          ],
        },
        {
          label: 'Garden & Outdoor', href: '#', id: 'garden',
          imageSrc: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop',
          items: [
            { label: 'Outdoor Furniture', href: '#' },
            { label: 'BBQ & Grills', href: '#' },
            { label: 'Plants & Seeds', href: '#' },
            { label: 'Garden Tools', href: '#' },
          ],
        },
      ],
    },
  },
  {
    id: 'mobiles', label: 'Devices', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'Mobile Phones', href: '#', id: 'phones',
          imageSrc: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop',
          items: [
            { label: 'Apple', href: '#' },
            { label: 'Samsung', href: '#' },
            { label: 'Huawei', href: '#' },
            { label: 'Xiaomi', href: '#' },
            { label: 'Google', href: '#' },
            { label: 'OnePlus', href: '#' },
          ],
        },
        {
          label: 'Tablets', href: '#', id: 'tablets',
          imageSrc: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop',
          items: [
            { label: 'iPad', href: '#' },
            { label: 'Samsung Galaxy Tab', href: '#' },
            { label: 'Huawei MatePad', href: '#' },
          ],
        },
        {
          label: 'Accessories', href: '#', id: 'phone-accessories',
          imageSrc: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop',
          items: [
            { label: 'Cases & Covers', href: '#' },
            { label: 'Chargers & Cables', href: '#' },
            { label: 'Headphones', href: '#' },
            { label: 'Power Banks', href: '#' },
          ],
        },
      ],
    },
  },
  {
    id: 'community', label: 'Community', href: '#',
    megaMenu: {
      sections: [
        {
          label: 'Discussions', href: '#', id: 'discussions',
          imageSrc: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop',
          items: [
            { label: 'General', href: '#' },
            { label: 'Tips & Tricks', href: '#' },
            { label: 'Success Stories', href: '#' },
            { label: 'Feedback', href: '#' },
          ],
        },
        {
          label: 'Guides', href: '#', id: 'guides',
          imageSrc: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop',
          items: [
            { label: 'Buying guide', href: '#' },
            { label: 'Selling guide', href: '#' },
            { label: 'Price index', href: '#' },
            { label: 'Safety & scams', href: '#' },
          ],
        },
        {
          label: 'Support', href: '#', id: 'support',
          imageSrc: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop',
          items: [
            { label: 'Ask the community', href: '#' },
            { label: 'Report a listing', href: '#' },
            { label: 'Help Center', href: '#' },
          ],
        },
      ],
    },
  },
];

const HOME: HomeInfo = {
  href: '#',
  logo: { src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg', alt: 'Dealo Hub' },
  name: 'Dealo Hub',
};

/* ---------- Root component ---------- */

interface EcommerceNavbar1Props {
  menu?: MenuItem[];
  home?: HomeInfo;
  helpfulLinks?: HelpfulLink[];
  socialLinks?: SocialLink[];
  contactInfo?: ContactLink[];
  className?: string;
}

const EcommerceNavbar1 = ({
  menu = MENU,
  home = HOME,
  helpfulLinks = HELPFULL_LINKS,
  socialLinks = SOCIAL_MEDIA_LINKS,
  contactInfo = CONTACT_INFO,
  className = '',
}: EcommerceNavbar1Props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const h = () => setIsMobile(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {isMobile ? (
        <MobileNav menu={menu} home={home} helpfulLinks={helpfulLinks} socialLinks={socialLinks} contactInfo={contactInfo} />
      ) : (
        <DesktopNav menu={menu} home={home} />
      )}
    </div>
  );
};

/* ---------- Desktop ---------- */

const DesktopNav = ({ menu, home }: { menu: MenuItem[]; home: HomeInfo }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const onLeave = () => {
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };

  return (
    <nav className="relative w-full max-w-full bg-background" onMouseLeave={onLeave}>
      <div className="flex min-h-[3.5rem] items-center gap-4 px-6">
        {/* Logo */}
        <a href={home.href} className="flex shrink-0 items-center gap-2">
          <img src={home.logo.src} alt={home.logo.alt} className="size-7 dark:invert" />
          <span className="hidden text-[14px] font-medium text-foreground lg:inline">{home.name ?? 'Dealo Hub'}</span>
        </a>

        {/* Menu items */}
        <div className="flex flex-1 items-center justify-center gap-0.5">
          {menu.map((item, i) => (
            <DesktopMenuItem
              key={i}
              item={item}
              isOpen={openId === (item.id ?? item.label)}
              onEnter={() => onEnter(item.id ?? item.label)}
            />
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-3">
          <CountrySelector />
          <SecondaryNav />
        </div>
      </div>

      {/* Mega menu panel */}
      {openId &&
        (() => {
          const item = menu.find((m) => (m.id ?? m.label) === openId);
          if (!item?.megaMenu) return null;
          return (
            <div
              onMouseEnter={() => onEnter(openId)}
              className="absolute inset-x-0 top-full z-50 max-h-[25rem] overflow-hidden border-b bg-popover text-popover-foreground shadow-lg"
            >
              <div className="mx-auto w-full max-w-7xl px-[1.875rem] py-[2.625rem]">
                <div className="flex justify-center gap-6">
                  {item.megaMenu.sections && (
                    <div className={item.megaMenu.featuredItems ? 'basis-[60%]' : 'flex-1'}>
                      <MenuLinksList lists={item.megaMenu.sections} />
                    </div>
                  )}
                  {item.megaMenu.featuredItems && (
                    <div className={item.megaMenu.sections ? 'basis-[40%]' : 'flex-1'}>
                      <MenuFeaturedLinks lists={item.megaMenu.featuredItems} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </nav>
  );
};

const DesktopMenuItem = ({ item, isOpen, onEnter }: { item: MenuItem; isOpen: boolean; onEnter: () => void }) => {
  const style = { color: item.accentColor };
  const base =
    'inline-flex h-9 items-center whitespace-nowrap rounded-md px-3 text-xs font-semibold uppercase tracking-wide transition hover:bg-muted focus:outline-none';

  const badge = item.badge ? (
    <span className="ml-1.5 inline-flex h-4 items-center rounded-full bg-[oklch(58.6%_0.253_17.585)] px-1.5 text-[9px] font-bold text-white">
      {item.badge}
    </span>
  ) : null;

  if (!item.megaMenu) {
    return (
      <a href={item.href} style={style} className={base} onMouseEnter={onEnter}>
        {item.label}
        {badge}
      </a>
    );
  }
  return (
    <button
      type="button"
      style={style}
      onMouseEnter={onEnter}
      className={`${base} gap-1 ${isOpen ? 'bg-muted' : ''}`}
    >
      {item.label}
      {badge}
      <ChevronDown size={12} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

const MenuLinksList = ({ lists }: { lists: MenuSection[] }) => (
  <ul className="flex gap-[1.875rem]">
    {lists.map((list, i) => (
      <li key={i} className="basis-1/3">
        <MenuLinks list={list} />
      </li>
    ))}
  </ul>
);

const MenuLinks = ({ list }: { list: MenuSection }) => (
  <div className="space-y-1.5">
    <h2 className="px-1 text-xs font-semibold uppercase leading-relaxed tracking-wider">
      <a href={list.href}>{list.label}</a>
    </h2>
    <ul>
      {list.items.map((item, i) => (
        <li key={i}>
          <a
            href={item.href}
            className="block w-full rounded-sm px-1 py-0.5 text-xs leading-normal text-muted-foreground hover:bg-muted"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const MenuFeaturedLinks = ({ lists }: { lists: FeaturedItem[] }) => (
  <div className="flex gap-[1.875rem]">
    {lists.map((it, i) => (
      <div className="flex-1" key={i}>
        <MenuFeaturedLink {...it} />
      </div>
    ))}
  </div>
);

const MenuFeaturedLink = ({ href, imageSrc, label }: FeaturedItem) => (
  <a href={href} className="group/feat block space-y-3">
    <div className="relative aspect-square overflow-hidden">
      <img
        src={imageSrc}
        alt={label}
        className="absolute inset-0 size-full object-cover object-center transition-all duration-500 group-hover/feat:scale-105 group-hover/feat:opacity-80"
      />
    </div>
    <div className="text-center text-xs font-semibold uppercase leading-relaxed tracking-wider">{label}</div>
  </a>
);

/* ---------- Secondary nav (shared desktop + mobile) ---------- */

const SecondaryNav = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Primary action for a C2C marketplace: post a listing. Replaces
          the shopping-bag + cart badge that shipped with the handoff
          (which makes no sense without a checkout). */}
      <a
        href="#"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e30613] px-3.5 text-[12px] font-semibold text-white shadow transition hover:bg-[#c80510]"
      >
        <Plus size={14} strokeWidth={2.5} />
        Sell now
      </a>
      <IconButton title="Account">
        <CircleUserRound size={18} />
      </IconButton>
      <IconButton title="Search">
        <Search size={18} />
      </IconButton>
    </div>
  );
};

const IconButton = ({ children, title, onClick }: { children: ReactNode; title: string; onClick?: () => void }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="grid h-9 w-9 place-items-center rounded-md text-foreground/80 transition hover:bg-muted hover:text-foreground"
  >
    {children}
  </button>
);

/* ---------- Country selector ---------- */

const CountrySelector = ({ className = '' }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  // Kuwait is the launch country; the rest of the GCC follows in order
  // of market size. No non-Gulf placeholders — this marketplace is regional.
  const [value, setValue] = useState('KW');
  const ref = useRef<HTMLDivElement | null>(null);

  const opts = [
    { value: 'KW', label: 'Kuwait (KWD)' },
    { value: 'AE', label: 'UAE (AED)' },
    { value: 'SA', label: 'Saudi Arabia (SAR)' },
    { value: 'QA', label: 'Qatar (QAR)' },
    { value: 'BH', label: 'Bahrain (BHD)' },
    { value: 'OM', label: 'Oman (OMR)' },
  ];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);

  const current = opts.find((o) => o.value === value)!;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex h-9 w-full min-w-[10.5rem] items-center justify-between gap-2 rounded-md border-none bg-transparent px-3 text-xs font-semibold uppercase leading-relaxed text-muted-foreground shadow-none outline-none hover:text-foreground"
      >
        <span>{current.label}</span>
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md">
          {opts.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                setValue(o.value);
                setOpen(false);
              }}
              className={`block w-full rounded-sm px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide transition ${
                value === o.value
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Mobile ---------- */

const MobileNav = ({
  menu,
  home,
  socialLinks,
  helpfulLinks,
  contactInfo,
}: {
  menu: MenuItem[];
  home: HomeInfo;
  socialLinks: SocialLink[];
  helpfulLinks: HelpfulLink[];
  contactInfo: ContactLink[];
}) => {
  const [open, setOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [subMenu, setSubMenu] = useState<MenuSection | null>(null);

  const closeAll = () => {
    setOpen(false);
    setMenuItem(null);
    setSubMenu(null);
  };

  return (
    <>
      <nav className="h-[3.75rem] border-b bg-background">
        <div className="flex h-full items-center gap-4 px-4">
          <a href={home.href}>
            <img src={home.logo.src} alt={home.logo.alt} className="size-8 dark:invert" />
          </a>
          <div className="ml-auto flex items-center gap-2">
            <SecondaryNav />
            <IconButton title="Menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </IconButton>
          </div>
        </div>
      </nav>

      <MobileSheet open={open} onClose={closeAll}>
        <RootMobilePanel
          visible={!menuItem}
          menu={menu}
          onClose={closeAll}
          onPick={(item) => setMenuItem(item)}
          helpfulLinks={helpfulLinks}
          socialLinks={socialLinks}
          contactInfo={contactInfo}
        />
        <MegaMenuMobile
          visible={!!menuItem && !subMenu}
          menuItem={menuItem}
          onBack={() => setMenuItem(null)}
          onClose={closeAll}
          onPickSub={(s) => setSubMenu(s)}
        />
        <SubMenuMobile
          visible={!!subMenu}
          subMenu={subMenu}
          onBack={() => setSubMenu(null)}
          onClose={closeAll}
        />
      </MobileSheet>
    </>
  );
};

const MobileSheet = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) => (
  <>
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    />
    <aside
      className={`fixed inset-y-0 left-0 z-[70] w-full overflow-hidden bg-background shadow-xl transition-transform sm:max-w-[27.75rem] ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {children}
    </aside>
  </>
);

const RootMobilePanel = ({
  visible,
  menu,
  onClose,
  onPick,
  helpfulLinks,
  socialLinks,
  contactInfo,
}: {
  visible: boolean;
  menu: MenuItem[];
  onClose: () => void;
  onPick: (item: MenuItem) => void;
  helpfulLinks: HelpfulLink[];
  socialLinks: SocialLink[];
  contactInfo: ContactLink[];
}) => {
  const linkStyle =
    'flex w-full items-center justify-between gap-2 border-b px-2 py-4 text-sm font-semibold leading-relaxed text-foreground hover:bg-transparent';

  return (
    <div className={`absolute inset-0 flex flex-col transition-transform ${visible ? 'translate-x-0' : '-translate-x-full'}`}>
      <header className="flex h-9 items-center justify-between gap-5 px-6 pt-5">
        <IconButton title="Close" onClick={onClose}>
          <X size={18} />
        </IconButton>
        <button className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          <CircleUserRound size={16} /> Login
        </button>
      </header>
      <div className="flex-1 overflow-auto px-6 py-5">
        <div>
          {menu.map((item, i) =>
            item.megaMenu ? (
              <button key={i} onClick={() => onPick(item)} className={linkStyle} style={{ color: item.accentColor }}>
                <span>{item.label}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <a key={i} href={item.href} style={{ color: item.accentColor }} className={linkStyle}>
                <span>{item.label}</span>
              </a>
            )
          )}
        </div>
        <div className="mt-6 space-y-5">
          <HelpfullLinks links={helpfulLinks} />
          <div>
            <ContactInfoList links={contactInfo} />
            <SocialMediaSection links={socialLinks} />
          </div>
        </div>
      </div>
      <footer className="border-t bg-background px-6 py-4">
        <CountrySelector className="w-full" />
      </footer>
    </div>
  );
};

const MegaMenuMobile = ({
  visible,
  menuItem,
  onBack,
  onClose,
  onPickSub,
}: {
  visible: boolean;
  menuItem: MenuItem | null;
  onBack: () => void;
  onClose: () => void;
  onPickSub: (s: MenuSection) => void;
}) => {
  if (!menuItem) return null;
  const linkStyle =
    'flex w-full items-center justify-between gap-2 border-b px-2 py-4 text-sm font-semibold leading-relaxed text-foreground';

  return (
    <div
      className={`absolute inset-0 overflow-auto bg-background px-6 pb-10 pt-5 transition-transform ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-5">
        <IconButton title="Close" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      <div className="flex items-center py-4">
        <IconButton title="Back" onClick={onBack}>
          <ChevronLeft size={18} />
        </IconButton>
        <h2 className="flex-1 text-center text-sm font-medium">{menuItem.label}</h2>
        <div className="w-9" />
      </div>
      <div className="space-y-6">
        {menuItem.megaMenu?.sections && (
          <div>
            {menuItem.megaMenu.sections.map((s, i) => (
              <button key={i} onClick={() => onPickSub(s)} className={linkStyle}>
                <span>{s.label}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
        {menuItem.megaMenu?.featuredItems && (
          <div className="grid grid-cols-2 gap-[1.125rem]">
            {menuItem.megaMenu.featuredItems.map((it, i) => (
              <MenuFeaturedLink key={i} {...it} />
            ))}
          </div>
        )}
        <a
          href={menuItem.href}
          className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted"
        >
          View {menuItem.label}
        </a>
      </div>
    </div>
  );
};

const SubMenuMobile = ({
  visible,
  subMenu,
  onBack,
  onClose,
}: {
  visible: boolean;
  subMenu: MenuSection | null;
  onBack: () => void;
  onClose: () => void;
}) => {
  if (!subMenu) return null;
  const linkStyle =
    'flex w-full items-center justify-between gap-2 border-b px-2 py-4 text-sm font-semibold leading-relaxed text-foreground';

  return (
    <div
      className={`absolute inset-0 overflow-auto bg-background transition-transform ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="relative aspect-[1.77/1] overflow-hidden">
        <img src={subMenu.imageSrc} alt={subMenu.label} className="absolute inset-0 size-full object-cover object-center" />
      </div>
      <div className="px-6 pb-10 pt-5">
        <div className="flex items-center justify-between gap-5">
          <IconButton title="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="flex items-center py-4">
          <IconButton title="Back" onClick={onBack}>
            <ChevronLeft size={18} />
          </IconButton>
          <h2 className="flex-1 text-center text-sm font-medium">{subMenu.label}</h2>
          <div className="w-9" />
        </div>
        <div className="space-y-6">
          <div>
            {subMenu.items.map((it, i) => (
              <a key={i} href={it.href} className={linkStyle}>
                <span>{it.label}</span>
                <ChevronRight size={16} />
              </a>
            ))}
          </div>
          <a
            href={subMenu.href}
            className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted"
          >
            View {subMenu.label}
          </a>
        </div>
      </div>
    </div>
  );
};

/* ---------- Mobile extras ---------- */

const SocialMediaSection = ({ links }: { links: SocialLink[] }) => {
  if (!links) return null;
  return (
    <ul className="flex flex-wrap">
      {links.map((l, i) => (
        <li key={i}>
          <a href={l.href} className="grid size-9 place-items-center rounded-full hover:bg-muted">
            <img src={l.icon.light} alt={l.icon.title} className="size-4 dark:hidden" />
            <img src={l.icon.dark} alt={l.icon.title} className="hidden size-4 dark:block" />
          </a>
        </li>
      ))}
    </ul>
  );
};

const HelpfullLinks = ({ links }: { links: HelpfulLink[] }) => {
  if (!links) return null;
  return (
    <ul className="flex flex-col">
      {links.map((l, i) => (
        <li key={i}>
          <a
            href={l.href}
            className="inline-flex h-9 w-full items-center justify-start rounded-md px-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
};

const ContactInfoList = ({ links }: { links: ContactLink[] }) => {
  if (!links) return null;
  const iconMap: Record<'Phone' | 'Send', LucideIcon> = { Phone, Send };
  return (
    <ul className="flex flex-col">
      {links.map((l, i) => {
        const Icon = iconMap[l.iconKey];
        return (
          <li key={i}>
            <a
              href={l.href}
              className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-md px-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {Icon && <Icon size={14} />}
              {l.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default EcommerceNavbar1;
