#!/usr/bin/env node
// Extends the `sell.*` namespace with wizard-step form copy + condition/delivery/priceMode
// vocabularies, and the listing.publishSuccess block. Safe to re-run.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const EN = {
  sell: {
    step: {
      media: {
        headline: 'Add {min} to {max} photos',
        help: 'PNG, JPG, or WebP. Up to 5 MB each. Clear, daylight shots sell fastest.',
        add: 'Add photos',
        camera: 'Camera',
        cover: 'Cover',
        remove: 'Remove',
        addFirst: 'Add first photo',
        saving: 'Saving…',
        readyToContinue: 'Ready to continue',
        moreNeeded: '{more} more to go',
        requirements: 'You need at least {min} photos to continue.',
        requirementsLuxury: 'Luxury listings need at least {min} photos + an inspection video.',
        continue: 'Continue',
      },
      video: {
        headline: 'Luxury inspection video (30–120 s)',
        help: 'Walk around the item. Show any serial numbers, stitching, or engravings close up.',
        upload: 'Upload video',
        replace: 'Replace video',
        remove: 'Remove',
        ready: 'Video ready',
      },
      details: {
        titleLabel: 'Title',
        titlePlaceholder: 'e.g. iPhone 14 Pro Max 256GB space black',
        titleHint: '5–120 characters. Include the brand and model for easy search.',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'What makes this item a great buy? Mention condition, age, what comes with it.',
        descriptionHint: 'Up to 5000 characters. Be honest — it builds trust and repeat buyers.',
        conditionLabel: 'Condition',
        brandLabel: 'Brand',
        brandPlaceholder: 'e.g. Apple',
        brandHint: 'Optional — helps search.',
        modelLabel: 'Model',
        modelPlaceholder: 'e.g. iPhone 14 Pro Max',
        saving: 'Saving…',
        continue: 'Continue',
      },
      price: {
        priceLabel: 'Price',
        priceHint: 'Kuwaiti Dinar. You can change this later.',
        modeLabel: 'Price mode',
        minOfferLabel: 'Minimum acceptable offer',
        minOfferHint: 'Optional — buyers won’t see this number; offers below it are auto-rejected.',
        saving: 'Saving…',
        continue: 'Continue',
      },
      location: {
        countryLabel: 'Country',
        countryFixedKW: 'Kuwait (only country available at launch).',
        cityLabel: 'Governorate',
        areaLabel: 'Area (optional)',
        areaHint: 'Buyers see the area, never your exact address.',
        loadingAreas: 'Loading areas…',
        saving: 'Saving…',
        continue: 'Continue',
      },
      delivery: {
        saving: 'Saving…',
        continue: 'Continue',
      },
      authenticity: {
        headline: 'Authenticity matters for luxury',
        subheadline: 'A short statement + optional proof gives buyers confidence — and protects you from disputes.',
        statementHeadline: 'I guarantee this item is authentic',
        statementBody:
          'I accept a full return within 7 days of delivery if the item is proven non-authentic.',
        receiptLabel: 'I have a receipt / original invoice',
        receiptHint: 'You can share it privately in chat later.',
        serialLabel: 'Serial number',
        serialPlaceholder: 'Optional',
        serialHint: 'Adds a “Serial on file” trust signal.',
        saving: 'Saving…',
        continue: 'Continue',
      },
      preview: {
        videoIncluded: 'Video included',
        minOfferLabel: 'Minimum offer',
        conditionLabel: 'Condition',
        edit: 'Edit',
        section: {
          category: 'Category',
          description: 'Description',
          location: 'Location',
          delivery: 'Delivery',
          authenticity: 'Authenticity',
        },
        authConfirmed: 'Authenticity guaranteed by seller',
        receiptIncluded: 'Receipt on file',
        publish: 'Publish listing',
        publishing: 'Publishing…',
        validationFailed: 'Some fields need attention before publishing',
      },
    },
    condition: {
      new: { label: 'New', description: 'Still sealed or unused.' },
      new_with_tags: { label: 'New with tags', description: 'Never used, original tags attached.' },
      like_new: { label: 'Like new', description: 'Used once or twice — looks new.' },
      excellent_used: { label: 'Excellent used', description: 'Lightly used, no visible flaws.' },
      good_used: { label: 'Good used', description: 'Used, minor wear as expected.' },
      fair_used: { label: 'Fair used', description: 'Used, visible wear, still fully functional.' },
    },
    priceMode: {
      fixed: { label: 'Fixed', description: 'Price is firm. No negotiation.' },
      negotiable: { label: 'Negotiable', description: 'Open to reasonable offers in chat.' },
      best_offer: { label: 'Best offer', description: 'Buyers submit offers; you pick the one that works.' },
    },
    delivery: {
      pickup: { label: 'Pickup', description: 'Buyer meets you at an agreed location.' },
      seller_delivers: { label: 'I deliver', description: 'You’ll deliver to the buyer’s area.' },
      buyer_ships: { label: 'Buyer ships', description: 'Buyer arranges and pays for shipping.' },
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      not_authenticated: 'Please sign in first.',
      save_failed: 'We couldn’t save your draft — please try again.',
      upload_failed: 'Upload failed. Try a smaller or different file.',
      too_many: 'You’ve reached the photo limit.',
      too_large: 'File is too large. Max 12 MB per source image.',
      invalid_format: 'Only PNG, JPG, or WebP files are allowed.',
      video_invalid_format: 'Only MP4, WebM, or MOV videos are allowed.',
      video_too_large: 'Video must be 50 MB or smaller.',
      video_duration_out_of_range: 'Video must be 30–120 seconds.',
      video_metadata_unreadable: 'We couldn’t read this video’s duration — try re-encoding.',
      category_required: 'Pick a category to continue.',
      title_too_short: 'Title must be at least 5 characters.',
      title_too_long: 'Title is too long (120 max).',
      description_too_short: 'Description must be at least 10 characters.',
      description_too_long: 'Description is too long (5000 max).',
      phone_not_allowed_in_text: 'Phone numbers aren’t allowed in the title or description — buyers will chat with you in-app.',
      counterfeit_term_not_allowed: 'Luxury listings can’t mention “1st copy”, “replica”, or similar.',
      price_required: 'Set a price to continue.',
      min_offer_only_for_best_offer: 'Minimum offer is only allowed with “Best offer”.',
      min_offer_must_be_less_than_price: 'Minimum offer must be lower than the price.',
      city_required: 'Pick a governorate.',
      delivery_required: 'Pick at least one delivery option.',
      authenticity_required: 'You must confirm authenticity to publish luxury listings.',
      condition_required: 'Pick a condition.',
      images_too_few: 'You need more photos to continue.',
      images_too_many: 'Too many photos — 10 is the max.',
      video_required: 'Luxury listings need an inspection video.',
      validation_failed: 'Some fields need attention.',
      no_draft: 'We couldn’t find your draft — start a new listing.',
      insert_failed: 'Couldn’t publish the listing — please try again.',
      not_implemented_yet_session2: 'Publish not wired up yet — coming soon.',
    },
  },
  listing: {
    publishSuccess: {
      title: 'Your listing is live — well, almost.',
      subtitle: 'We’ve saved it as a draft. Our AI safety checks will publish it within minutes.',
      myListings: 'Go to my listings',
      sellAnother: 'Sell another',
    },
  },
};

const AR = {
  sell: {
    step: {
      media: {
        headline: 'ارفع من {min} إلى {max} صور',
        help: 'PNG أو JPG أو WebP. حتى 5 ميجابايت للصورة. الإضاءة الطبيعية تبيع أسرع.',
        add: 'إضافة صور',
        camera: 'الكاميرا',
        cover: 'الغلاف',
        remove: 'حذف',
        addFirst: 'ارفع الصورة الأولى',
        saving: 'جاري الحفظ…',
        readyToContinue: 'جاهز للمتابعة',
        moreNeeded: 'باقي {more}',
        requirements: 'محتاج {min} صور على الأقل للمتابعة.',
        requirementsLuxury: 'الفئة الفاخرة تحتاج {min} صور + فيديو تفقّدي.',
        continue: 'متابعة',
      },
      video: {
        headline: 'فيديو تفقّدي للمنتج الفاخر (30–120 ثانية)',
        help: 'صوّر المنتج من كل جوانبه. أظهر الرقم التسلسلي والخياطة والنقوش عن قرب.',
        upload: 'رفع الفيديو',
        replace: 'استبدال الفيديو',
        remove: 'حذف',
        ready: 'الفيديو جاهز',
      },
      details: {
        titleLabel: 'العنوان',
        titlePlaceholder: 'مثال: iPhone 14 Pro Max 256GB أسود',
        titleHint: 'من 5 إلى 120 حرف. اكتب الماركة والموديل عشان البحث يسهل.',
        descriptionLabel: 'الوصف',
        descriptionPlaceholder: 'شنو اللي يميّز هذا المنتج؟ اذكر الحالة، العمر، والمرفقات.',
        descriptionHint: 'حتى 5000 حرف. الصراحة تبني ثقة وزبائن دائمين.',
        conditionLabel: 'الحالة',
        brandLabel: 'الماركة',
        brandPlaceholder: 'مثال: Apple',
        brandHint: 'اختياري — يساعد البحث.',
        modelLabel: 'الموديل',
        modelPlaceholder: 'مثال: iPhone 14 Pro Max',
        saving: 'جاري الحفظ…',
        continue: 'متابعة',
      },
      price: {
        priceLabel: 'السعر',
        priceHint: 'الدينار الكويتي. تقدر تغيّره لاحقاً.',
        modeLabel: 'نوع السعر',
        minOfferLabel: 'الحد الأدنى المقبول للعرض',
        minOfferHint: 'اختياري — المشترون لا يشوفون هذا الرقم؛ العروض تحته تُرفض تلقائياً.',
        saving: 'جاري الحفظ…',
        continue: 'متابعة',
      },
      location: {
        countryLabel: 'الدولة',
        countryFixedKW: 'الكويت (الدولة الوحيدة عند الإطلاق).',
        cityLabel: 'المحافظة',
        areaLabel: 'المنطقة (اختياري)',
        areaHint: 'المشتري يشوف المنطقة، مو عنوانك بالضبط.',
        loadingAreas: 'جاري تحميل المناطق…',
        saving: 'جاري الحفظ…',
        continue: 'متابعة',
      },
      delivery: {
        saving: 'جاري الحفظ…',
        continue: 'متابعة',
      },
      authenticity: {
        headline: 'الأصالة مهمة في الفاخرة',
        subheadline: 'بيان قصير + دليل اختياري يعطي المشتري ثقة — ويحميك من الخلافات.',
        statementHeadline: 'أضمن أصالة هذا المنتج',
        statementBody:
          'أقبل استرجاعه بالكامل خلال 7 أيام من الاستلام إذا ثبت أنه غير أصلي.',
        receiptLabel: 'عندي فاتورة / إيصال أصلي',
        receiptHint: 'تقدر تشاركها بشكل خاص عبر المحادثة لاحقاً.',
        serialLabel: 'الرقم التسلسلي',
        serialPlaceholder: 'اختياري',
        serialHint: 'يضيف علامة "الرقم التسلسلي موثّق".',
        saving: 'جاري الحفظ…',
        continue: 'متابعة',
      },
      preview: {
        videoIncluded: 'مع فيديو',
        minOfferLabel: 'الحد الأدنى للعروض',
        conditionLabel: 'الحالة',
        edit: 'تعديل',
        section: {
          category: 'الفئة',
          description: 'الوصف',
          location: 'الموقع',
          delivery: 'التسليم',
          authenticity: 'الأصالة',
        },
        authConfirmed: 'البائع يضمن الأصالة',
        receiptIncluded: 'الفاتورة موثّقة',
        publish: 'نشر الإعلان',
        publishing: 'جاري النشر…',
        validationFailed: 'فيه حقول تحتاج مراجعة قبل النشر',
      },
    },
    condition: {
      new: { label: 'جديد', description: 'مختوم أو ما استُعمل.' },
      new_with_tags: { label: 'جديد بالتاقات', description: 'ما استُعمل، التاقات موجودة.' },
      like_new: { label: 'شبه جديد', description: 'استُعمل مرة أو مرتين فقط.' },
      excellent_used: { label: 'مستعمل ممتاز', description: 'استعمال خفيف، بدون عيوب ظاهرة.' },
      good_used: { label: 'مستعمل جيّد', description: 'استعمال مع أثر طبيعي.' },
      fair_used: { label: 'مستعمل مقبول', description: 'استعمال واضح، ويعمل بكفاءة.' },
    },
    priceMode: {
      fixed: { label: 'ثابت', description: 'السعر نهائي، ما فيه فاصل.' },
      negotiable: { label: 'قابل للتفاوض', description: 'مفتوح للعروض المعقولة في المحادثة.' },
      best_offer: { label: 'يقبل العروض', description: 'المشترون يقدّمون عروضاً، وأنت تختار.' },
    },
    delivery: {
      pickup: { label: 'استلام', description: 'المشتري يقابلك في مكان متّفق عليه.' },
      seller_delivers: { label: 'أوصّله أنا', description: 'راح توصّله لمنطقة المشتري.' },
      buyer_ships: { label: 'الشحن على المشتري', description: 'المشتري يرتّب الشحن ويتكفّل بتكلفته.' },
    },
    errors: {
      generic: 'صار خطأ. حاول مرة ثانية.',
      not_authenticated: 'سجّل الدخول أولاً.',
      save_failed: 'تعذّر حفظ المسودة — حاول مرة ثانية.',
      upload_failed: 'الرفع فشل. جرّب ملف أصغر أو مختلف.',
      too_many: 'وصلت للحد الأقصى من الصور.',
      too_large: 'الملف كبير جداً. الحد الأقصى 12 ميجابايت لكل صورة مصدر.',
      invalid_format: 'فقط PNG أو JPG أو WebP مسموح.',
      video_invalid_format: 'فقط MP4 أو WebM أو MOV مسموح.',
      video_too_large: 'الفيديو يجب أن يكون 50 ميجابايت أو أقل.',
      video_duration_out_of_range: 'مدة الفيديو يجب بين 30 و120 ثانية.',
      video_metadata_unreadable: 'ما قدرنا نقرا مدة الفيديو — جرّب إعادة ترميزه.',
      category_required: 'اختر فئة للمتابعة.',
      title_too_short: 'العنوان يجب 5 أحرف على الأقل.',
      title_too_long: 'العنوان طويل جداً (120 كحد أقصى).',
      description_too_short: 'الوصف يجب 10 أحرف على الأقل.',
      description_too_long: 'الوصف طويل جداً (5000 كحد أقصى).',
      phone_not_allowed_in_text: 'أرقام الهواتف ممنوعة في العنوان والوصف — المحادثة داخل المنصة.',
      counterfeit_term_not_allowed: 'الفئة الفاخرة ما تسمح بكلمات "نسخة" أو "تقليد" أو ما شابه.',
      price_required: 'حدّد السعر للمتابعة.',
      min_offer_only_for_best_offer: 'الحد الأدنى للعروض مسموح فقط مع "يقبل العروض".',
      min_offer_must_be_less_than_price: 'الحد الأدنى يجب أن يكون أقل من السعر.',
      city_required: 'اختر محافظة.',
      delivery_required: 'اختر خيار تسليم واحد على الأقل.',
      authenticity_required: 'يجب تأكيد الأصالة لنشر الإعلانات الفاخرة.',
      condition_required: 'اختر الحالة.',
      images_too_few: 'محتاج صور أكثر للمتابعة.',
      images_too_many: 'الصور كثيرة — الحد 10.',
      video_required: 'الفئة الفاخرة تحتاج فيديو تفقّدي.',
      validation_failed: 'فيه حقول تحتاج مراجعة.',
      no_draft: 'ما لقينا مسودتك — ابدأ إعلان جديد.',
      insert_failed: 'تعذّر نشر الإعلان — حاول مرة ثانية.',
      not_implemented_yet_session2: 'النشر لسه ما اتربط — قريباً.',
    },
  },
  listing: {
    publishSuccess: {
      title: 'إعلانك راح ينشر بعد قليل.',
      subtitle: 'حفظناه كمسودة. فحوصات الذكاء الاصطناعي راح تفعّله خلال دقائق.',
      myListings: 'إلى إعلاناتي',
      sellAnother: 'بيع منتج ثاني',
    },
  },
};

function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return source;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const v = source[key];
    if (typeof v === 'object' && v !== null && !Array.isArray(v) && typeof target[key] === 'object') {
      out[key] = deepMerge(target[key], v);
    } else {
      out[key] = v;
    }
  }
  return out;
}

for (const [locale, extra] of [['en', EN], ['ar', AR]]) {
  const path = resolve(root, `messages/${locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf-8'));
  const merged = deepMerge(data, extra);
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`wrote ${path}`);
}
