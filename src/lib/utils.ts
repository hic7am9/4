import type { ApartmentStatus, BookingSource, PaymentMethod } from '@/types';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA-u-nu-latn', { month: 'short', day: 'numeric' });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function sanitizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }

  const countryPrefixes: Record<string, string> = {
    '966': '+966',
    '971': '+971',
    '20': '+20',
    '965': '+965',
    '973': '+973',
    '974': '+974',
    '968': '+968',
    '962': '+962',
    '963': '+963',
    '964': '+964',
    '961': '+961',
    '967': '+967',
    '212': '+212',
    '213': '+213',
    '216': '+216',
    '218': '+218',
    '221': '+221',
    '222': '+222',
    '233': '+233',
    '234': '+234',
    '250': '+250',
    '254': '+254',
    '256': '+256',
    '258': '+258',
    '260': '+260',
    '263': '+263',
    '265': '+265',
    '267': '+267',
    '27': '+27',
    '23': '+23',
    '31': '+31',
    '32': '+32',
    '33': '+33',
    '34': '+34',
    '39': '+39',
    '44': '+44',
    '49': '+49',
    '61': '+61',
    '62': '+62',
    '63': '+63',
    '81': '+81',
    '82': '+82',
    '86': '+86',
    '90': '+90',
    '91': '+91',
    '92': '+92',
    '93': '+93',
    '94': '+94',
    '95': '+95',
    '98': '+98',
    '1': '+1',
    '7': '+7',
  };

  for (const prefix of Object.keys(countryPrefixes)) {
    if (cleaned.startsWith(prefix)) {
      return countryPrefixes[prefix] + cleaned.slice(prefix.length);
    }
  }

  if (cleaned.startsWith('0')) {
    return '+966' + cleaned.slice(1);
  }

  return '+966' + cleaned;
}

export function whatsappLink(phone: string, text?: string): string {
  const sanitized = sanitizePhone(phone);
  const base = `https://wa.me/${sanitized.replace('+', '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const STATUS_LABELS: Record<ApartmentStatus, string> = {
  occupied: 'مشغولة',
  ready: 'جاهز',
  not_ready: 'غير جاهز',
  maintenance: 'صيانة',
};

export const STATUS_COLORS: Record<ApartmentStatus, { bg: string; text: string; badge: string; row: string }> = {
  occupied: { bg: 'bg-emerald-500', text: 'text-white', badge: 'bg-emerald-100 text-emerald-700', row: '' },
  ready: { bg: 'bg-sky-500', text: 'text-white', badge: 'bg-sky-100 text-sky-700', row: '' },
  not_ready: { bg: 'bg-amber-500', text: 'text-white', badge: 'bg-amber-500 text-white', row: 'bg-amber-50' },
  maintenance: { bg: 'bg-orange-500', text: 'text-white', badge: 'bg-orange-100 text-orange-700', row: 'bg-orange-50' },
};

export const SOURCE_LABELS: Record<BookingSource, string> = {
  airbnb: 'Airbnb',
  gathern: 'جَذرِن',
  whatsapp: 'واتساب',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'كاش',
  bank_transfer: 'تحويل بنكي',
  visa: 'فيزا',
  mada: 'مدى',
};

export function isDepartureActive(checkOutDate: string): boolean {
  const now = new Date();
  const checkout = new Date(checkOutDate);
  const nightBefore = new Date(checkout);
  nightBefore.setHours(19, 0, 0, 0);
  nightBefore.setDate(nightBefore.getDate() - 1);
  const checkoutEnd = new Date(checkout);
  checkoutEnd.setHours(16, 0, 0, 0);
  return now >= nightBefore && now <= checkoutEnd;
}

export function isDepartureTomorrow(checkOutDate: string): boolean {
  const now = new Date();
  const checkout = new Date(checkOutDate);
  const nightBefore = new Date(checkout);
  nightBefore.setHours(19, 0, 0, 0);
  nightBefore.setDate(nightBefore.getDate() - 1);
  return now >= nightBefore && now < checkout;
}

export function isDepartureToday(checkOutDate: string): boolean {
  const today = new Date();
  const checkout = new Date(checkOutDate);
  return (
    today.getFullYear() === checkout.getFullYear() &&
    today.getMonth() === checkout.getMonth() &&
    today.getDate() === checkout.getDate()
  );
}

export function getHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString('ar-SA');
  }
}

export function getGregorianDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
