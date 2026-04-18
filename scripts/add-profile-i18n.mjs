#!/usr/bin/env node
// One-shot script to add the `profile` namespace + add `viewProfile`, `editProfile`
// keys to existing namespaces. Safe to re-run.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const PROFILE_EN = {
  header: {
    noHandleYet: 'No handle yet — pick one from Edit profile.',
    editProfile: 'Edit profile',
  },
  public: {
    defaultDescription: '{name} on Dealo Hub — {count, plural, =0{no listings yet} one{# active listing} other{# active listings}}.',
  },
  notFound: {
    metaTitle: 'Profile not found',
    title: 'This seller doesn’t exist here.',
    subtitle: 'The handle you followed may have been changed or removed.',
    home: 'Back to home',
  },
  completion: {
    title: 'Complete your profile',
    subtitle: 'Add {missing} so buyers trust you faster.',
    cta: 'Finish profile',
    fields: {
      avatar: 'avatar',
      bio: 'bio',
      handle: 'handle',
    },
  },
  trust: {
    foundingPartner: 'Founding partner',
    idVerified: 'ID verified',
    phoneVerified: 'Phone verified',
    ratingBadge: '{avg} ({count})',
    memberSince: '6+ months',
  },
  stats: {
    activeListings: 'active',
    sold: 'sold',
  },
  listings: {
    title: 'Listings',
    placeholderTitle: 'No listings yet.',
    placeholderSubtitle: 'The listing creation flow ships soon — check back shortly.',
  },
  avatar: {
    help: 'PNG, JPG or WebP. Up to 2 MB. Square images look best.',
    upload: 'Upload avatar',
    change: 'Change avatar',
    takePhoto: 'Take a photo',
  },
  edit: {
    metaTitle: 'Edit profile',
    title: 'Edit profile',
    subtitle: 'How buyers see you on Dealo Hub.',
    avatarHeading: 'Avatar',
    detailsHeading: 'Details',
    displayNameLabel: 'Display name',
    handleLabel: 'Handle',
    handleHint: '3–20 characters. Lowercase letters, numbers, underscores.',
    handleChecking: 'Checking availability…',
    handleAvailable: 'Available.',
    bioLabel: 'Bio',
    bioPlaceholder: 'A sentence or two about what you sell.',
    bioHint: 'Up to 300 characters.',
    localeLabel: 'Preferred language',
    localeOptions: {
      ar: 'العربية',
      en: 'English',
    },
    save: 'Save changes',
    saving: 'Saving…',
    cancel: 'Cancel',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    not_authenticated: 'Please sign in first.',
    update_failed: 'Couldn’t save your profile — please try again.',
    upload_failed: 'Avatar upload failed. Try a smaller or different image.',
    avatar_too_large: 'Avatar must be 2 MB or smaller.',
    avatar_invalid_format: 'Avatar must be PNG, JPG, or WebP.',
    avatar_missing: 'Choose an image first.',
    name_too_short: 'Name must be at least 2 characters.',
    name_too_long: 'Name is too long.',
    bio_too_long: 'Bio is too long (300 characters max).',
    handle_invalid_format: 'Use 3–20 lowercase letters, numbers, or underscores.',
    handle_underscore_edges: 'Handle can’t start or end with an underscore.',
    handle_reserved: 'That handle is reserved — try another.',
    handle_taken: 'That handle is already taken.',
  },
};

const PROFILE_AR = {
  header: {
    noHandleYet: 'ما اخترت اسم مستخدم بعد — افتح "تعديل الملف".',
    editProfile: 'تعديل الملف',
  },
  public: {
    defaultDescription: '{name} على Dealo Hub — {count, plural, =0{لا إعلانات بعد} one{إعلان نشط واحد} two{إعلانان نشطان} few{# إعلانات نشطة} many{# إعلاناً نشطاً} other{# إعلان نشط}}.',
  },
  notFound: {
    metaTitle: 'الملف غير موجود',
    title: 'هذا البائع غير موجود هنا.',
    subtitle: 'اسم المستخدم ربما تغيّر أو انحذف.',
    home: 'الرجوع للرئيسية',
  },
  completion: {
    title: 'أكمل ملفك الشخصي',
    subtitle: 'أضف {missing} عشان المشترين يثقون فيك أسرع.',
    cta: 'أكمل الملف',
    fields: {
      avatar: 'صورة',
      bio: 'نبذة',
      handle: 'اسم مستخدم',
    },
  },
  trust: {
    foundingPartner: 'شريك مؤسس',
    idVerified: 'هوية موثّقة',
    phoneVerified: 'هاتف موثّق',
    ratingBadge: '{avg} ({count})',
    memberSince: '+6 شهور',
  },
  stats: {
    activeListings: 'نشط',
    sold: 'مُباع',
  },
  listings: {
    title: 'الإعلانات',
    placeholderTitle: 'لا إعلانات بعد.',
    placeholderSubtitle: 'تدفق إنشاء الإعلانات يصل قريباً — راجع لاحقاً.',
  },
  avatar: {
    help: 'PNG أو JPG أو WebP. حتى 2 ميجابايت. الصور المربعة تظهر أحسن.',
    upload: 'ارفع صورة',
    change: 'غيّر الصورة',
    takePhoto: 'التقط صورة',
  },
  edit: {
    metaTitle: 'تعديل الملف',
    title: 'تعديل الملف',
    subtitle: 'كيف يشوفك المشترون على Dealo Hub.',
    avatarHeading: 'الصورة',
    detailsHeading: 'التفاصيل',
    displayNameLabel: 'الاسم المعروض',
    handleLabel: 'اسم المستخدم',
    handleHint: '3 إلى 20 حرف. أحرف إنجليزية صغيرة وأرقام وشرطة سفلية.',
    handleChecking: 'نتحقق من التوفّر…',
    handleAvailable: 'متوفّر.',
    bioLabel: 'نبذة',
    bioPlaceholder: 'جملة أو اثنتين عن اللي تبيعه.',
    bioHint: 'حتى 300 حرف.',
    localeLabel: 'اللغة المفضّلة',
    localeOptions: {
      ar: 'العربية',
      en: 'English',
    },
    save: 'حفظ التعديلات',
    saving: 'جاري الحفظ…',
    cancel: 'إلغاء',
  },
  errors: {
    generic: 'صار خطأ. حاول مرة ثانية.',
    not_authenticated: 'سجّل الدخول أولاً.',
    update_failed: 'تعذّر حفظ الملف — حاول مرة ثانية.',
    upload_failed: 'تعذّر رفع الصورة. جرّب صورة أصغر أو ملف آخر.',
    avatar_too_large: 'الصورة يجب أن تكون 2 ميجابايت أو أصغر.',
    avatar_invalid_format: 'الصورة يجب أن تكون PNG أو JPG أو WebP.',
    avatar_missing: 'اختر صورة أولاً.',
    name_too_short: 'الاسم قصير جداً — حرفان على الأقل.',
    name_too_long: 'الاسم طويل جداً.',
    bio_too_long: 'النبذة طويلة جداً (300 حرف كحد أقصى).',
    handle_invalid_format: 'استخدم 3 إلى 20 حرف إنجليزي صغير أو رقم أو شرطة سفلية.',
    handle_underscore_edges: 'اسم المستخدم ما يقدر يبدأ أو ينتهي بشرطة سفلية.',
    handle_reserved: 'اسم المستخدم هذا محجوز — جرّب اسماً آخر.',
    handle_taken: 'اسم المستخدم مأخوذ.',
  },
};

const NAV_EXTRA_EN = {
  profile: 'My profile',
};
const NAV_EXTRA_AR = {
  profile: 'ملفي',
};

const AUTH_EXTRA_EN = {
  editProfile: 'Edit profile',
};
const AUTH_EXTRA_AR = {
  editProfile: 'تعديل الملف',
};

const MY_LISTINGS_EXTRA_EN = {
  viewProfile: 'View my profile',
};
const MY_LISTINGS_EXTRA_AR = {
  viewProfile: 'عرض ملفي',
};

for (const [locale, profile, navExtra, authExtra, mylExtra] of [
  ['en', PROFILE_EN, NAV_EXTRA_EN, AUTH_EXTRA_EN, MY_LISTINGS_EXTRA_EN],
  ['ar', PROFILE_AR, NAV_EXTRA_AR, AUTH_EXTRA_AR, MY_LISTINGS_EXTRA_AR],
]) {
  const path = resolve(root, `messages/${locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf-8'));
  data.profile = profile;
  data.nav = { ...data.nav, ...navExtra };
  data.auth = { ...data.auth, ...authExtra };
  data.auth.myListings = { ...(data.auth.myListings ?? {}), ...mylExtra };
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`wrote ${path}`);
}
