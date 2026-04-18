/**
 * Dealo Hub — Category Taxonomy (V1)
 *
 * 10 main categories across 3 priority tiers.
 * Each main category has 5-7 sub-categories.
 *
 * Usage:
 *   import { CATEGORIES, getCategoryBySlug } from '@/lib/categories';
 *
 * Reference: planning/LAUNCH-STRATEGY.md + planning/DECISIONS.md
 * Source of truth for: Supabase seed, listing creation UI, category pages, search filters.
 *
 * @module categories
 */

// =============================================================================
// Types
// =============================================================================

export type CategoryTier = 'p0' | 'p1' | 'p2';

export type LucideIconName =
  | 'Smartphone'
  | 'Sofa'
  | 'Gem'
  | 'Baby'
  | 'Gamepad2'
  | 'Mountain'
  | 'Dumbbell'
  | 'Utensils'
  | 'Sparkles'
  | 'Package';

export interface SubCategory {
  /** URL-safe unique slug */
  slug: string;
  /** Arabic display name */
  nameAr: string;
  /** English display name */
  nameEn: string;
}

export interface Category {
  /** URL-safe unique slug (kebab-case) */
  slug: string;
  /** Arabic display name */
  nameAr: string;
  /** English display name */
  nameEn: string;
  /** Lucide React icon name */
  icon: LucideIconName;
  /** Seeding priority tier */
  tier: CategoryTier;
  /** Target initial listings for Phase 0 seeding */
  seedTarget: number;
  /** Sub-categories for this main category */
  subCategories: SubCategory[];
  /** Default delivery options for this category */
  defaultDeliveryOptions: Array<'pickup' | 'seller_delivers' | 'buyer_ships'>;
  /** Whether this category requires video upload (luxury) */
  requiresVideo: boolean;
  /** Minimum required photo count */
  minPhotos: number;
  /** Whether this category requires authenticity statement (luxury) */
  requiresAuthenticityStatement: boolean;
}

// =============================================================================
// Category Data — Final April 18, 2026
// =============================================================================

export const CATEGORIES: readonly Category[] = [
  // ---------------------------------------------------------------------------
  // 🔴 P0 — Heavy Seeding (~130 listings target)
  // ---------------------------------------------------------------------------
  {
    slug: 'electronics',
    nameAr: 'إلكترونيات',
    nameEn: 'Electronics',
    icon: 'Smartphone',
    tier: 'p0',
    seedTarget: 40,
    defaultDeliveryOptions: ['pickup', 'seller_delivers', 'buyer_ships'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'phones-tablets', nameAr: 'موبايلات وأجهزة لوحية', nameEn: 'Phones & Tablets' },
      { slug: 'laptops-computers', nameAr: 'لابتوبات وكمبيوترات', nameEn: 'Laptops & Computers' },
      { slug: 'tvs-audio', nameAr: 'تلفزيونات وصوتيات', nameEn: 'TVs & Audio' },
      { slug: 'gaming', nameAr: 'ألعاب فيديو وأجهزة', nameEn: 'Gaming' },
      { slug: 'smart-watches', nameAr: 'ساعات ذكية وإكسسوارات', nameEn: 'Smart Watches & Accessories' },
      { slug: 'cameras', nameAr: 'كاميرات ومعدات تصوير', nameEn: 'Cameras & Photography' },
    ],
  },
  {
    slug: 'furniture',
    nameAr: 'أثاث',
    nameEn: 'Furniture',
    icon: 'Sofa',
    tier: 'p0',
    seedTarget: 35,
    defaultDeliveryOptions: ['pickup'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'living-room', nameAr: 'غرف الجلوس', nameEn: 'Living Room' },
      { slug: 'bedroom', nameAr: 'غرف النوم', nameEn: 'Bedroom' },
      { slug: 'kids-room', nameAr: 'غرف الأطفال', nameEn: 'Kids Room' },
      { slug: 'office', nameAr: 'مكاتب وأثاث أعمال', nameEn: 'Office & Work' },
      { slug: 'decor-lighting', nameAr: 'ديكور وإضاءة', nameEn: 'Decor & Lighting' },
      { slug: 'rugs-curtains', nameAr: 'سجاد وستائر', nameEn: 'Rugs & Curtains' },
    ],
  },
  {
    slug: 'luxury',
    nameAr: 'حقائب وساعات فاخرة',
    nameEn: 'Luxury Bags & Watches',
    icon: 'Gem',
    tier: 'p0',
    seedTarget: 25,
    defaultDeliveryOptions: ['pickup', 'seller_delivers'],
    requiresVideo: true, // ⭐ Mandatory video for luxury — the trust moat
    minPhotos: 8, // ⭐ 8 minimum (vs 5 for other categories)
    requiresAuthenticityStatement: true, // ⭐ Required checkbox
    subCategories: [
      { slug: 'luxury-bags', nameAr: 'حقائب فاخرة', nameEn: 'Luxury Bags' },
      { slug: 'luxury-watches', nameAr: 'ساعات فاخرة', nameEn: 'Luxury Watches' },
      { slug: 'fine-jewelry', nameAr: 'مجوهرات راقية', nameEn: 'Fine Jewelry' },
      { slug: 'luxury-accessories', nameAr: 'إكسسوارات فاخرة', nameEn: 'Luxury Accessories' },
      { slug: 'designer-shoes', nameAr: 'أحذية مصمّمة', nameEn: 'Designer Shoes' },
    ],
  },
  {
    slug: 'baby-kids',
    nameAr: 'مستلزمات الأطفال',
    nameEn: 'Baby & Kids',
    icon: 'Baby',
    tier: 'p0',
    seedTarget: 30,
    defaultDeliveryOptions: ['pickup', 'seller_delivers', 'buyer_ships'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'strollers-car-seats', nameAr: 'عربات وكراسي سيارة', nameEn: 'Strollers & Car Seats' },
      { slug: 'baby-furniture', nameAr: 'أثاث غرف الأطفال', nameEn: 'Baby Furniture' },
      { slug: 'educational-toys', nameAr: 'ألعاب تعليمية', nameEn: 'Educational Toys' },
      { slug: 'baby-clothes', nameAr: 'ملابس رضع', nameEn: 'Baby Clothes' },
      { slug: 'feeding-supplies', nameAr: 'مستلزمات إطعام', nameEn: 'Feeding Supplies' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 🟠 P1 — Medium Seeding (~70 listings target)
  // ---------------------------------------------------------------------------
  {
    slug: 'games-hobbies',
    nameAr: 'ألعاب وهوايات',
    nameEn: 'Games & Hobbies',
    icon: 'Gamepad2',
    tier: 'p1',
    seedTarget: 20,
    defaultDeliveryOptions: ['pickup', 'seller_delivers', 'buyer_ships'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'video-games', nameAr: 'ألعاب فيديو', nameEn: 'Video Games' },
      { slug: 'board-games', nameAr: 'ألعاب لوحية', nameEn: 'Board Games' },
      { slug: 'collectibles', nameAr: 'مجسمات وتحف', nameEn: 'Collectibles' },
      { slug: 'lego-building', nameAr: 'Lego وألعاب البناء', nameEn: 'Lego & Building' },
      { slug: 'outdoor-toys', nameAr: 'ألعاب خارجية', nameEn: 'Outdoor Toys' },
    ],
  },
  {
    slug: 'sports-outdoor',
    nameAr: 'رياضة وخارجي',
    nameEn: 'Sports & Outdoor',
    icon: 'Mountain',
    tier: 'p1',
    seedTarget: 15,
    defaultDeliveryOptions: ['pickup', 'seller_delivers'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'camping', nameAr: 'تخييم', nameEn: 'Camping' },
      { slug: 'bicycles', nameAr: 'دراجات', nameEn: 'Bicycles' },
      { slug: 'hunting-fishing', nameAr: 'صيد (بتراخيص)', nameEn: 'Hunting & Fishing (Licensed)' },
      { slug: 'sportswear', nameAr: 'ملابس رياضية', nameEn: 'Sportswear' },
      { slug: 'water-sports', nameAr: 'رياضات مائية', nameEn: 'Water Sports' },
    ],
  },
  {
    slug: 'home-fitness',
    nameAr: 'أجهزة رياضية منزلية',
    nameEn: 'Home Fitness',
    icon: 'Dumbbell',
    tier: 'p1',
    seedTarget: 15,
    defaultDeliveryOptions: ['pickup'], // Bulky — pickup only
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'treadmills-cardio', nameAr: 'جري وكارديو', nameEn: 'Treadmills & Cardio' },
      { slug: 'weights-strength', nameAr: 'أثقال وقوة', nameEn: 'Weights & Strength' },
      { slug: 'exercise-bikes', nameAr: 'دراجات تمرين', nameEn: 'Exercise Bikes' },
      { slug: 'yoga-recovery', nameAr: 'يوغا وتعافي', nameEn: 'Yoga & Recovery' },
      { slug: 'home-gym-sets', nameAr: 'أطقم جيم منزلي', nameEn: 'Home Gym Sets' },
    ],
  },
  {
    slug: 'home-appliances',
    nameAr: 'أدوات منزلية',
    nameEn: 'Home Appliances',
    icon: 'Utensils',
    tier: 'p1',
    seedTarget: 20,
    defaultDeliveryOptions: ['pickup', 'seller_delivers'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'kitchen', nameAr: 'مطبخ', nameEn: 'Kitchen' },
      { slug: 'laundry', nameAr: 'غسيل', nameEn: 'Laundry' },
      { slug: 'refrigeration', nameAr: 'تبريد', nameEn: 'Refrigeration' },
      { slug: 'cleaning', nameAr: 'تنظيف', nameEn: 'Cleaning' },
      { slug: 'small-appliances', nameAr: 'أدوات صغيرة', nameEn: 'Small Appliances' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 🟡 P2 — Light Seeding (~20 listings target)
  // ---------------------------------------------------------------------------
  {
    slug: 'beauty',
    nameAr: 'جمال وعناية',
    nameEn: 'Beauty & Care',
    icon: 'Sparkles',
    tier: 'p2',
    seedTarget: 10,
    defaultDeliveryOptions: ['pickup', 'seller_delivers', 'buyer_ships'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    // ⚠️ Only SEALED products allowed — hygiene rules
    subCategories: [
      { slug: 'beauty-devices', nameAr: 'أجهزة جمال', nameEn: 'Beauty Devices' },
      { slug: 'sealed-fragrances', nameAr: 'عطور (مختومة)', nameEn: 'Fragrances (Sealed)' },
      { slug: 'sealed-makeup', nameAr: 'ماكياج (مختوم)', nameEn: 'Makeup (Sealed)' },
      { slug: 'hair-care', nameAr: 'عناية بالشعر', nameEn: 'Hair Care' },
    ],
  },
  {
    slug: 'general',
    nameAr: 'متفرقات',
    nameEn: 'General',
    icon: 'Package',
    tier: 'p2',
    seedTarget: 10,
    defaultDeliveryOptions: ['pickup', 'seller_delivers', 'buyer_ships'],
    requiresVideo: false,
    minPhotos: 5,
    requiresAuthenticityStatement: false,
    subCategories: [
      { slug: 'books-media', nameAr: 'كتب ومطبوعات', nameEn: 'Books & Media' },
      { slug: 'pet-supplies', nameAr: 'مستلزمات حيوانات أليفة', nameEn: 'Pet Supplies' },
      { slug: 'miscellaneous', nameAr: 'أخرى', nameEn: 'Miscellaneous' },
    ],
  },
] as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get total seed target across all categories.
 * @returns Total listings target for Phase 0 seeding (should be 220).
 */
export function getTotalSeedTarget(): number {
  return CATEGORIES.reduce((sum, cat) => sum + cat.seedTarget, 0);
}

/**
 * Find a category by its slug.
 * @param slug Category slug (e.g., 'electronics')
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Find a sub-category by its slug within any main category.
 * @param slug Sub-category slug (e.g., 'phones-tablets')
 */
export function getSubCategoryBySlug(
  slug: string
): { parent: Category; sub: SubCategory } | undefined {
  for (const parent of CATEGORIES) {
    const sub = parent.subCategories.find(s => s.slug === slug);
    if (sub) return { parent, sub };
  }
  return undefined;
}

/**
 * Get categories filtered by priority tier.
 * @param tier 'p0' | 'p1' | 'p2'
 */
export function getCategoriesByTier(tier: CategoryTier): Category[] {
  return CATEGORIES.filter(cat => cat.tier === tier);
}

/**
 * Get localized name for a category or sub-category.
 */
export function getLocalizedName(
  item: { nameAr: string; nameEn: string },
  locale: 'ar' | 'en'
): string {
  return locale === 'ar' ? item.nameAr : item.nameEn;
}

/**
 * Categories that allow optional content moderation checks (e.g., sealed-only).
 * Used to display category-specific banners/notices.
 */
export function hasCategoryNotice(slug: string): string | null {
  const notices: Record<string, string> = {
    beauty: 'المنتجات المقبولة في هذه الفئة يجب أن تكون مختومة وغير مستعملة فقط.',
    luxury: 'جميع الإعلانات الفاخرة تتطلب فيديو تفقّدي + إقرار الأصالة من البائع.',
  };
  return notices[slug] ?? null;
}

// =============================================================================
// Compile-time validation (throws at startup if invariants violated)
// =============================================================================

if (process.env.NODE_ENV !== 'production') {
  // Invariant: total seed target = 220
  const total = getTotalSeedTarget();
  if (total !== 220) {
    throw new Error(
      `CATEGORIES seed target mismatch: expected 220, got ${total}. ` +
        'Check categories.ts seedTarget values against LAUNCH-STRATEGY.md.'
    );
  }

  // Invariant: exactly 10 main categories
  if (CATEGORIES.length !== 10) {
    throw new Error(`CATEGORIES count mismatch: expected 10, got ${CATEGORIES.length}.`);
  }

  // Invariant: unique slugs
  const slugs = new Set<string>();
  for (const cat of CATEGORIES) {
    if (slugs.has(cat.slug)) {
      throw new Error(`Duplicate category slug: ${cat.slug}`);
    }
    slugs.add(cat.slug);
    for (const sub of cat.subCategories) {
      if (slugs.has(sub.slug)) {
        throw new Error(`Duplicate sub-category slug: ${sub.slug}`);
      }
      slugs.add(sub.slug);
    }
  }

  // Invariant: luxury category must have video + authenticity statement
  const luxury = getCategoryBySlug('luxury');
  if (!luxury?.requiresVideo || !luxury?.requiresAuthenticityStatement) {
    throw new Error(
      'Luxury category must have requiresVideo=true and requiresAuthenticityStatement=true.'
    );
  }
}
