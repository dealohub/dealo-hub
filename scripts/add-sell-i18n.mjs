#!/usr/bin/env node
// One-shot script to add the `sell.*` namespace to messages/{ar,en}.json.
// Safe to re-run. Adds nav.sell too.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SELL_EN = {
  ctaShort: 'Sell',
  cta: 'Start selling',
  metaTitle: 'Create a listing',
  nav: {
    back: 'Back',
    continue: 'Continue',
    publish: 'Publish listing',
  },
  steps: {
    category: {
      metaTitle: 'Pick a category',
      title: 'What are you listing?',
      subtitle: 'Pick the category that fits best. You can narrow it with a sub-category.',
    },
    media: {
      metaTitle: 'Add photos',
      title: 'Add your photos',
      subtitle: 'Upload 5 to 10 clear shots (8 minimum for luxury). First photo is the cover.',
    },
    details: {
      metaTitle: 'Listing details',
      title: 'Describe what you’re selling',
      subtitle: 'A good title + an honest description earn trust and sell faster.',
    },
    price: {
      metaTitle: 'Set a price',
      title: 'How much are you asking?',
      subtitle: 'Pick a price mode so buyers know whether to negotiate.',
    },
    location: {
      metaTitle: 'Where are you?',
      title: 'Pickup location',
      subtitle: 'Buyers will see the general area — never your exact address.',
    },
    delivery: {
      metaTitle: 'Delivery options',
      title: 'How will you hand it over?',
      subtitle: 'Pick one or more options that work for you.',
    },
    authenticity: {
      metaTitle: 'Authenticity',
      title: 'Confirm authenticity',
      subtitle: 'Luxury listings require a seller guarantee and an inspection video.',
    },
    preview: {
      metaTitle: 'Review and publish',
      title: 'Looks good?',
      subtitle: 'Take one last look before your listing goes live.',
    },
  },
  step: {
    category: {
      continue: 'Continue',
      saving: 'Saving…',
      subtitleChoose: 'Pick a sub-category in {category}',
      subOptional: 'Optional — you can skip this.',
    },
  },
  stub: {
    title: 'Step coming in the next session',
    subtitle:
      'This step of the wizard isn’t wired up yet. The first step (category) is fully functional — return to it below.',
    backToCategory: 'Back to categories',
  },
};

const SELL_AR = {
  ctaShort: 'بيع',
  cta: 'ابدأ البيع',
  metaTitle: 'أنشئ إعلاناً',
  nav: {
    back: 'السابق',
    continue: 'متابعة',
    publish: 'نشر الإعلان',
  },
  steps: {
    category: {
      metaTitle: 'اختر الفئة',
      title: 'وش تبي تبيع؟',
      subtitle: 'اختر الفئة المناسبة. تقدر تدقّقها بفئة فرعية.',
    },
    media: {
      metaTitle: 'ارفع الصور',
      title: 'ارفع صور المنتج',
      subtitle: 'ارفع من 5 إلى 10 صور واضحة (8 كحد أدنى للفئة الفاخرة). أول صورة تكون الغلاف.',
    },
    details: {
      metaTitle: 'تفاصيل الإعلان',
      title: 'صف المنتج',
      subtitle: 'العنوان الواضح + الوصف الصادق يبنون الثقة ويسرّعون البيع.',
    },
    price: {
      metaTitle: 'حدّد السعر',
      title: 'كم السعر؟',
      subtitle: 'اختر نوع السعر عشان المشتري يعرف إذا الفاصل ممكن.',
    },
    location: {
      metaTitle: 'موقعك',
      title: 'موقع الاستلام',
      subtitle: 'المشتري يشوف المنطقة العامة فقط — ما يطلع عنوانك.',
    },
    delivery: {
      metaTitle: 'خيارات التسليم',
      title: 'كيف راح يوصله المنتج؟',
      subtitle: 'اختر خيار أو أكثر يناسبك.',
    },
    authenticity: {
      metaTitle: 'إثبات الأصالة',
      title: 'أكّد أصالة المنتج',
      subtitle: 'الإعلانات الفاخرة تحتاج ضمان من البائع وفيديو تفقّدي.',
    },
    preview: {
      metaTitle: 'مراجعة ونشر',
      title: 'كل شي تمام؟',
      subtitle: 'ألقِ نظرة أخيرة قبل نشر الإعلان.',
    },
  },
  step: {
    category: {
      continue: 'متابعة',
      saving: 'جاري الحفظ…',
      subtitleChoose: 'اختر فئة فرعية في {category}',
      subOptional: 'اختياري — تقدر تتخطى.',
    },
  },
  stub: {
    title: 'هذه الخطوة تصل في الجلسة القادمة',
    subtitle:
      'هذه الخطوة في المعالج لسه ما تجهّزت. الخطوة الأولى (الفئة) جاهزة بالكامل — ارجع لها تحت.',
    backToCategory: 'رجوع للفئات',
  },
};

const NAV_EXTRA_EN = { sell: 'Create listing' };
const NAV_EXTRA_AR = { sell: 'نشر إعلان' };

for (const [locale, sell, navExtra] of [
  ['en', SELL_EN, NAV_EXTRA_EN],
  ['ar', SELL_AR, NAV_EXTRA_AR],
]) {
  const path = resolve(root, `messages/${locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf-8'));
  data.sell = sell;
  data.nav = { ...data.nav, ...navExtra };
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`wrote ${path}`);
}
