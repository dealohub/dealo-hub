# Dealo Hub — Categories Reference (V1)

**Quick lookup for non-engineers.** For code, see `src/lib/categories.ts`. For DB seed, see `supabase/seed/categories.sql`.

**Total:** 10 main categories · 54 sub-categories · 220 target seed listings
**Locked:** April 18, 2026 · Source: `planning/LAUNCH-STRATEGY.md` + `planning/DECISIONS.md`

---

## 🔴 P0 — Heavy Seeding (130 listings target)

### 1. إلكترونيات (Electronics) — 40 listings
Icon: `Smartphone` · Slug: `electronics`

| Sub-category (AR) | Slug | English |
|---|---|---|
| موبايلات وأجهزة لوحية | `phones-tablets` | Phones & Tablets |
| لابتوبات وكمبيوترات | `laptops-computers` | Laptops & Computers |
| تلفزيونات وصوتيات | `tvs-audio` | TVs & Audio |
| ألعاب فيديو وأجهزة | `gaming` | Gaming |
| ساعات ذكية وإكسسوارات | `smart-watches` | Smart Watches & Accessories |
| كاميرات ومعدات تصوير | `cameras` | Cameras & Photography |

### 2. أثاث (Furniture) — 35 listings
Icon: `Sofa` · Slug: `furniture` · Default delivery: **Pickup only** (bulky)

| Sub-category (AR) | Slug | English |
|---|---|---|
| غرف الجلوس | `living-room` | Living Room |
| غرف النوم | `bedroom` | Bedroom |
| غرف الأطفال | `kids-room` | Kids Room |
| مكاتب وأثاث أعمال | `office` | Office & Work |
| ديكور وإضاءة | `decor-lighting` | Decor & Lighting |
| سجاد وستائر | `rugs-curtains` | Rugs & Curtains |

### 3. حقائب وساعات فاخرة (Luxury) — 25 listings ⭐ PREMIUM
Icon: `Gem` · Slug: `luxury` · **Video MANDATORY · 8 photos min · Authenticity statement required**

| Sub-category (AR) | Slug | English |
|---|---|---|
| حقائب فاخرة | `luxury-bags` | Luxury Bags |
| ساعات فاخرة | `luxury-watches` | Luxury Watches |
| مجوهرات راقية | `fine-jewelry` | Fine Jewelry |
| إكسسوارات فاخرة | `luxury-accessories` | Luxury Accessories |
| أحذية مصمّمة | `designer-shoes` | Designer Shoes |

### 4. مستلزمات الأطفال (Baby & Kids) — 30 listings
Icon: `Baby` · Slug: `baby-kids`

| Sub-category (AR) | Slug | English |
|---|---|---|
| عربات وكراسي سيارة | `strollers-car-seats` | Strollers & Car Seats |
| أثاث غرف الأطفال | `baby-furniture` | Baby Furniture |
| ألعاب تعليمية | `educational-toys` | Educational Toys |
| ملابس رضع | `baby-clothes` | Baby Clothes |
| مستلزمات إطعام | `feeding-supplies` | Feeding Supplies |

---

## 🟠 P1 — Medium Seeding (70 listings target)

### 5. ألعاب وهوايات (Games & Hobbies) — 20 listings
Icon: `Gamepad2` · Slug: `games-hobbies`

| Sub-category (AR) | Slug | English |
|---|---|---|
| ألعاب فيديو | `video-games` | Video Games |
| ألعاب لوحية | `board-games` | Board Games |
| مجسمات وتحف | `collectibles` | Collectibles |
| Lego وألعاب البناء | `lego-building` | Lego & Building |
| ألعاب خارجية | `outdoor-toys` | Outdoor Toys |

### 6. رياضة وخارجي (Sports & Outdoor) — 15 listings
Icon: `Mountain` · Slug: `sports-outdoor`

| Sub-category (AR) | Slug | English |
|---|---|---|
| تخييم | `camping` | Camping |
| دراجات | `bicycles` | Bicycles |
| صيد (بتراخيص) | `hunting-fishing` | Hunting & Fishing (Licensed) |
| ملابس رياضية | `sportswear` | Sportswear |
| رياضات مائية | `water-sports` | Water Sports |

### 7. أجهزة رياضية منزلية (Home Fitness) — 15 listings
Icon: `Dumbbell` · Slug: `home-fitness` · Default delivery: **Pickup only** (bulky)

| Sub-category (AR) | Slug | English |
|---|---|---|
| جري وكارديو | `treadmills-cardio` | Treadmills & Cardio |
| أثقال وقوة | `weights-strength` | Weights & Strength |
| دراجات تمرين | `exercise-bikes` | Exercise Bikes |
| يوغا وتعافي | `yoga-recovery` | Yoga & Recovery |
| أطقم جيم منزلي | `home-gym-sets` | Home Gym Sets |

### 8. أدوات منزلية (Home Appliances) — 20 listings
Icon: `Utensils` · Slug: `home-appliances`

| Sub-category (AR) | Slug | English |
|---|---|---|
| مطبخ | `kitchen` | Kitchen |
| غسيل | `laundry` | Laundry |
| تبريد | `refrigeration` | Refrigeration |
| تنظيف | `cleaning` | Cleaning |
| أدوات صغيرة | `small-appliances` | Small Appliances |

---

## 🟡 P2 — Light Seeding (20 listings target)

### 9. جمال وعناية (Beauty & Care) — 10 listings ⚠️ SEALED ONLY
Icon: `Sparkles` · Slug: `beauty` · Content notice: "المنتجات المقبولة مختومة فقط"

| Sub-category (AR) | Slug | English |
|---|---|---|
| أجهزة جمال | `beauty-devices` | Beauty Devices |
| عطور (مختومة) | `sealed-fragrances` | Fragrances (Sealed) |
| ماكياج (مختوم) | `sealed-makeup` | Makeup (Sealed) |
| عناية بالشعر | `hair-care` | Hair Care |

### 10. متفرقات (General) — 10 listings
Icon: `Package` · Slug: `general`

| Sub-category (AR) | Slug | English |
|---|---|---|
| كتب ومطبوعات | `books-media` | Books & Media |
| مستلزمات حيوانات أليفة | `pet-supplies` | Pet Supplies |
| أخرى | `miscellaneous` | Miscellaneous |

---

## Summary

| Tier | Categories | Listings Target |
|---|---|---|
| 🔴 P0 | 4 | 130 |
| 🟠 P1 | 4 | 70 |
| 🟡 P2 | 2 | 20 |
| **Total** | **10** | **220** |

---

## Explicitly Excluded Categories

Per LAUNCH-STRATEGY.md — these are NOT in V1:

| Category | Reason for Exclusion |
|---|---|
| Cars / Motors | Q84sale dominates Kuwait; Dubizzle Motors is world-class. Never compete. |
| Real Estate / Property | Licensing required (MOCI); Dubizzle Property dominant. Phase 3+ possibly. |
| Jobs / Recruitment | Different product category (not marketplace). Out of scope. |
| Services | Scam-prone; requires strong KYC. Phase 2+ with trust layer. |
| Food / Beverages | Kuwait Municipality food licensing. Safety risk. Never. |
| Live Animals | Ethical + regulatory. Never. |

---

*When editing categories, update in this order: `src/lib/categories.ts` → `supabase/seed/categories.sql` → this file. The TS file is source of truth.*
