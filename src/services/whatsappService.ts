/**
 * =====================================================================
 * خدمة إرسال رسائل وتنبيهات الواتساب ورموز التحقق (OTP)
 * منصة مخلّصة | Mokhalasa WhatsApp Notification & OTP Engine
 * =====================================================================
 * أمان سيبراني مشدد (Zero Client-Side Secret Exposure):
 * - تم إخفاء وعزل كافة مفاتيح الـ API السرية داخل السيرفر الخلفي (/api/whatsapp) فقط.
 * - لا يتم تضمين أو إرسال أي مفتاح API سري من واجهة المتصفح نهائياً لمنع استخراج المفاتيح.
 */

import { logInternalSecurityError } from '../utils/securityGuard';

const PLATFORM_URL = 'https://mokhalasa-app.vercel.app';

/**
 * تنظيف أي مفاتيح قديمة كانت مخزنة في المتصفح وإرجاع حالة مؤمنة تدار من السيرفر
 */
export const getWazzapiConfig = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('mokhalasa_wazzapi_key');
    } catch {}
  }
  const deviceId =
    (typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_wazzapi_device_id') : '') ||
    '';
  return { apiKey: 'SERVER_HIDDEN_PROTECTED', deviceId: deviceId.trim() };
};

export const configureWazzapiCredentials = (_apiKey: string, deviceId?: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('mokhalasa_wazzapi_key');
      if (deviceId !== undefined) localStorage.setItem('mokhalasa_wazzapi_device_id', deviceId.trim());
    } catch {}
  }
};

export const getWapilotConfig = () => {
  return { token: 'SERVER_HIDDEN_PROTECTED', instanceId: 'SERVER_MANAGED' };
};

/**
 * هل خدمة رسائل الواتساب مفعلة حالياً؟
 */
export const isWhatsAppServiceEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('mokhalasa_whatsapp_v2_enabled');
    if (override !== null) {
      return override === 'true';
    }
  }
  const envVal = import.meta.env?.VITE_ENABLE_WHATSAPP_OTP;
  if (envVal !== undefined) {
    return envVal === 'true' || envVal === true;
  }
  return true;
};

export const setWhatsAppServiceEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mokhalasa_whatsapp_v2_enabled', String(enabled));
    window.dispatchEvent(new CustomEvent('mokhalasa-whatsapp-status-changed', { detail: { enabled } }));
  }
};

/**
 * تنسيق رقم الهاتف المصري إلى الصيغة الدولية القياسية بدون رموز (201xxxxxxxxx)
 */
export function normalizeInternationalEgyptianPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('20') && cleaned.length === 12) {
    // 201xxxxxxxxx
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
}

/**
 * تحويل رقم الهاتف المصري إلى صيغة الواتساب القياسية (201xxxxxxxxx@c.us)
 */
export function formatEgyptianWhatsAppNumber(phone: string): string {
  const intl = normalizeInternationalEgyptianPhone(phone);
  if (!intl) return '';
  return intl.includes('@c.us') ? intl : `${intl}@c.us`;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  provider?: 'waisend' | 'wazzapi' | 'wapilot' | 'server-proxy';
  error?: string;
}

/**
 * إرسال الرسالة حصرياً عبر البروكسي الخلفي المؤمن (/api/whatsapp) بدون كشف أي API Key في المتصفح
 */
async function sendViaSecureServerProxy(phone: string, text: string): Promise<SendWhatsAppResult> {
  const intlPhone = normalizeInternationalEgyptianPhone(phone);
  if (!intlPhone || intlPhone.length < 10) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  const proxyEndpoints = ['/api/whatsapp', `${PLATFORM_URL}/api/whatsapp`];
  for (const endpoint of proxyEndpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    try {
      const proxyRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          phone: intlPhone,
          to: intlPhone,
          text,
          message: text,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = proxyRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const proxyData = await proxyRes.json();
        if (proxyRes.ok && proxyData?.success) {
          return {
            success: true,
            messageId: proxyData.messageId,
            provider: 'server-proxy',
          };
        }
        if (proxyData?.error && proxyRes.status === 429) {
          return { success: false, error: proxyData.error };
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      logInternalSecurityError('WHATSAPP_PROXY_SEND', err);
    }
  }

  return { success: false, error: 'تعذر الإرسال عبر خادم رسائل الواتساب الآمن' };
}

/**
 * إرسال رسالة نصية عامة عبر الواتساب (عبر البروكسي الخلفي المؤمن فقط)
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const cleanPhone = normalizeInternationalEgyptianPhone(phone);
  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  return sendViaSecureServerProxy(cleanPhone, text);
}

// ============================================================================
// قوالب رسائل الواتساب التفاعلية والمهنية لجميع مراحل المنصة
// ============================================================================

/**
 * 1. إرسال كود تحقق سريع (OTP) لتأكيد الحساب أو تسجيل الدخول
 */
export async function sendOtpViaWhatsApp(phone: string, otpCode: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const message =
    `🚗 *منصة مخلّصة | Mokhalasa*\n` +
    `مرحباً بك! كود التحقق الخاص بك لتأكيد حسابك هو:\n\n` +
    `🔐 *${otpCode}*\n\n` +
    `⏱️ الكود صالح لمدة 5 دقائق فقط.\n` +
    `⚠️ لسلامة حسابك: لا تشارك هذا الكود مع أي شخص نهائياً.`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 2. إرسال كود استعادة وتعيين كلمة المرور (نسيان الباسورد) عبر الواتساب
 */
export async function sendPasswordResetOtpViaWhatsApp(phone: string, otpCode: string): Promise<SendWhatsAppResult> {
  const message =
    `🔑 *منصة مخلّصة | استعادة كلمة المرور*\n\n` +
    `تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.\n` +
    `كود التحقق الخاص بك هو:\n\n` +
    `👉 *${otpCode}* 👈\n\n` +
    `⏱️ الكود صالح لمدة 5 دقائق فقط.\n` +
    `🛡️ إذا لم تطلب تغيير كلمة المرور، يرجى تجاهل هذه الرسالة وسيبقى حسابك آمناً.`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 3. الرسالة الترحيبية التفصيلية عند إنشاء حساب جديد للعميل
 */
export async function sendWelcomeWhatsApp(
  phone: string,
  userName: string,
  governorate?: string
): Promise<SendWhatsAppResult> {
  const displayName = userName?.trim() || 'عميلنا العزيز';
  const cleanPhone = normalizeInternationalEgyptianPhone(phone);
  const localPhone = cleanPhone.startsWith('20') ? '0' + cleanPhone.slice(2) : phone;
  const message =
    `🎉 *أهلاً بك في منصة مخلّصة، يا ${displayName}!*\n\n` +
    `تم إنشاء وتفعيل حسابك وتوثيق رقم هاتفك بنجاح على منصة «مخلّصة» — المنصة المعتمدة لبيع وشراء سيارات الأقساط وحظر البيع والتقسيط المباشر والكاش في مصر. 🚗🇪🇬\n\n` +
    `📋 *تفاصيل حسابك المسجل:*\n` +
    `• 👤 الاسم: ${displayName}\n` +
    `• 📱 رقم الهاتف الموثق: ${localPhone}\n` +
    (governorate ? `• 📍 المحافظة: ${governorate}\n` : '') +
    `• 🛡️ حالة الحساب: موثق ومفعل بالكامل ✅\n\n` +
    `✨ *خدمات المنصة المتاحة لك الآن:*\n` +
    `1️⃣ *تصفح المعرض وتقديم عروض شراء:*\n` +
    `${PLATFORM_URL}/#/marketplace\n` +
    `2️⃣ *عرض سيارتك للبيع وحساب صافي مستحقاتك:*\n` +
    `${PLATFORM_URL}/#/sell-wizard\n` +
    `3️⃣ *لوحة حسابك الشخصي ومتابعة العروض والإعلانات:*\n` +
    `${PLATFORM_URL}/#/profile\n\n` +
    `فريق مستشاري مخلّصة معك خطوة بخطوة لضمان أمان وسرعة كل معاملة! 🤝`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 3b. إشعار تأكيد تغيير أو استعادة كلمة المرور بنجاح
 */
export async function sendPasswordChangedWhatsApp(
  phone: string,
  userName?: string
): Promise<SendWhatsAppResult> {
  const displayName = userName?.trim() || 'عميلنا العزيز';
  const message =
    `🔐 *منصة مخلّصة | تأكيد تحديث كلمة المرور*\n\n` +
    `أهلاً أ/ *${displayName}*،\n` +
    `تم تحديث وتغيير كلمة المرور الخاصة بحسابك على منصة «مخلّصة» بنجاح. ✅\n\n` +
    `🌐 *للدخول إلى حسابك الشخصي:*\n` +
    `${PLATFORM_URL}/#/profile\n\n` +
    `🛡️ إذا لم تقم بهذا الإجراء، يرجى التواصل فوراً مع فريق دعم مخلّصة.`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 3c. إشعار تأكيد تحديث بيانات الملف الشخصي للعميل
 */
export async function sendProfileUpdatedWhatsApp(
  phone: string,
  userName: string
): Promise<SendWhatsAppResult> {
  const displayName = userName?.trim() || 'عميلنا العزيز';
  const message =
    `✅ *منصة مخلّصة | تم تحديث بيانات حسابك*\n\n` +
    `أهلاً أ/ *${displayName}*،\n` +
    `تم حفظ التعديلات الجديدة على ملفك الشخصي بنجاح.\n\n` +
    `🌐 *رابط حسابك الشخصي:*\n` +
    `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 4. إشعار البائع فور استلام إعلان سيارته للمراجعة (بكافة التفاصيل والروابط)
 */
export async function sendListingSubmittedWhatsApp(
  phone: string,
  sellerName: string,
  carTitle: string,
  askingPrice: number,
  caseRef: string,
  saleTypeLabel?: string,
  listingId?: string
): Promise<SendWhatsAppResult> {
  const trackText = saleTypeLabel || 'تسوية/بيع معتمد عبر مخلّصة';
  const message =
    `📋 *منصة مخلّصة | تم استلام إعلان سيارتك بنجاح*\n\n` +
    `أهلاً أ/ *${sellerName || 'مالك السيارة'}*،\n` +
    `تم تسجيل بيانات إعلان سيارتك بنجاح وجاري مراجعته من قِبل فريق العمليات لاعتماده ونشره في المعرض العام:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `🏷️ *نظام البيع:* ${trackText}\n` +
    `💰 *السعر المطلوب:* ${askingPrice.toLocaleString('ar-EG')} ج.م\n` +
    `🔖 *الرقم المرجعي للإعلان:* #${caseRef}\n` +
    `⏳ *الحالة الحالية:* قيد المراجعة الإدارية\n\n` +
    `📲 ستصلك رسالة فورية هنا على الواتساب فور اعتماد الإعلان ونشره أو عند وصول أي عرض شراء.\n\n` +
    `🌐 *لمتابعة حالة إعلانك من حسابك:*\n` +
    `${PLATFORM_URL}/#/profile\n` +
    (listingId ? `🔗 *بوابة متابعة الطلب:*\n${PLATFORM_URL}/#/seller-portal\n` : '');

  return sendWhatsAppMessage(phone, message);
}

/**
 * 4b. إشعار البائع عند تعديل أو تحديث بيانات إعلانه
 */
export async function sendListingUpdatedWhatsApp(
  phone: string,
  sellerName: string,
  carTitle: string,
  askingPrice: number,
  caseRef: string
): Promise<SendWhatsAppResult> {
  const message =
    `✏️ *منصة مخلّصة | تم حفظ تعديلات إعلان سيارتك*\n\n` +
    `أهلاً أ/ *${sellerName || 'مالك السيارة'}*،\n` +
    `تم استلام وحفظ التعديلات الجديدة على إعلان سيارتك بنجاح:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *السعر المحدث:* ${askingPrice.toLocaleString('ar-EG')} ج.م\n` +
    `🔖 *مرجع الإعلان:* #${caseRef}\n\n` +
    `🌐 *لمتابعة إعلانك عبر المنصة:*\n` +
    `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 4c. إشعار البائع عند سحب الإعلان أو إعادة تفعيله
 */
export async function sendListingWithdrawnOrReactivatedWhatsApp(
  phone: string,
  carTitle: string,
  action: 'withdrawn' | 'reactivated',
  caseRef?: string
): Promise<SendWhatsAppResult> {
  const message =
    action === 'withdrawn'
      ? `⏸️ *منصة مخلّصة | تم إيقاف وسحب إعلان سيارتك مؤقتاً*\n\n` +
        `تم بناءً على طلبك إخفاء وسحب إعلان سيارتك (*${carTitle}*${caseRef ? ` - #${caseRef}` : ''}) من المعرض العام.\n` +
        `يمكنك إعادة تفعيل الإعلان في أي وقت من خلال حسابك الشخصي:\n` +
        `🌐 ${PLATFORM_URL}/#/profile`
      : `▶️ *منصة مخلّصة | تم إعادة تفعيل إعلان سيارتك*\n\n` +
        `تم إعادة تفعيل طلب عرض سيارتك (*${carTitle}*${caseRef ? ` - #${caseRef}` : ''}) وإرساله للمراجعة والنشر بالمعرض.\n` +
        `🌐 *لمتابعة حالة الإعلان:*\n` +
        `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 5. إشعار البائع بوصول عرض شراء جديد لسيارته (عميل جاله Offer)
 */
export async function sendNegotiationOfferWhatsApp(
  phone: string,
  carTitle: string,
  offerAmount: number,
  listingIdOrRef: string,
  buyerName?: string,
  askingPrice?: number,
  paymentPreference?: string
): Promise<SendWhatsAppResult> {
  const paymentLabel =
    paymentPreference === 'cash_at_bank'
      ? 'سداد نقدي مباشر بالبنك / كاش'
      : paymentPreference === 'need_new_financing'
      ? 'تمويل / تقسيط'
      : 'جاهز للتنفيذ الفوري';

  const message =
    `🔔 *منصة مخلّصة | وصلك عرض شراء جديد لسيارتك!*\n\n` +
    `قدم المشتري *(${buyerName || 'مشتري جاد'})* عرض شراء رسمي على سيارتك المعروضة بالمنصة:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *قيمة العرض المقدم:* *${offerAmount.toLocaleString('ar-EG')} ج.م*\n` +
    (askingPrice ? `🏷️ *السعر المطلوب بالإعلان:* ${askingPrice.toLocaleString('ar-EG')} ج.م\n` : '') +
    `💳 *طريقة التنفيذ:* ${paymentLabel}\n` +
    `🔖 *مرجع الإعلان:* #${listingIdOrRef}\n\n` +
    `⚡ *الخطوة المطلوبة منك الآن:*\n` +
    `يرجى الدخول إلى حسابك للضغط على *(قبول العرض مبدئياً)* أو *(الاعتذار عن العرض)*، ليقوم فريق مخلّصة فوراً بتنسيق موعد المعاينة والمقابلة البنكية.\n\n` +
    `🌐 *اضغط هنا للرد على العرض فوراً:*\n` +
    `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 6. تأكيد للمشتري باستلام عرضه وإرساله للبائع مباشرة
 */
export async function sendOfferSubmittedBuyerConfirmationWhatsApp(
  phone: string,
  buyerName: string,
  carTitle: string,
  offerAmount: number,
  caseRef: string,
  listingId?: string
): Promise<SendWhatsAppResult> {
  const carDirectLink = listingId
    ? `${PLATFORM_URL}/?car=${encodeURIComponent(listingId)}#car-detail`
    : `${PLATFORM_URL}/#/marketplace`;

  const message =
    `✅ *منصة مخلّصة | تم إرسال عرض الشراء للبائع بنجاح*\n\n` +
    `أهلاً أ/ *${buyerName || 'عميلنا العزيز'}*،\n` +
    `تم تسجيل عرض الشراء الخاص بك وتمريره مباشرة إلى مالك السيارة:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *قيمة عرضك المالي:* *${offerAmount.toLocaleString('ar-EG')} ج.م*\n` +
    `🔖 *كود الإعلان:* #${caseRef}\n\n` +
    `📲 ستصلك رسالة فورية هنا على الواتساب بمجرد رد البائع (بالموافقة أو الاعتذار) لترتيب موعد المعاينة.\n\n` +
    `🔗 *رابط الإعلان:*\n${carDirectLink}\n` +
    `🌐 *لمتابعة عروضك في حسابك:*\n${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 7. إشعار المشتري عند موافقة البائع على العرض (عميل تمت الموافقة)
 */
export async function sendOfferAcceptedToBuyerWhatsApp(
  phone: string,
  buyerName: string,
  carTitle: string,
  offerAmount: number,
  caseRef: string,
  listingId?: string
): Promise<SendWhatsAppResult> {
  const carDirectLink = listingId
    ? `${PLATFORM_URL}/?car=${encodeURIComponent(listingId)}#car-detail`
    : `${PLATFORM_URL}/#/profile`;

  const message =
    `🎉 *بشرى سارة من منصة مخلّصة | وافق البائع على عرضك!*\n\n` +
    `أهلاً أ/ *${buyerName || 'عميلنا العزيز'}*،\n` +
    `وافق مالك السيارة مبدئياً على عرض الشراء المقدم منك:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *السعر المتفق عليه:* *${offerAmount.toLocaleString('ar-EG')} ج.م*\n` +
    `🔖 *رقم الملف:* #${caseRef}\n\n` +
    `🤝 *الخطوة القادمة:*\n` +
    `يتولى الآن مستشار الصفقات في «مخلّصة» التنسيق معك ومع البائع لتحديد موعد المعاينة الفنية والمقابلة البنكية لإنهاء الإجراءات بأمان تام.\n\n` +
    `🌐 *تفاصيل الصفقة في حسابك:*\n` +
    `${PLATFORM_URL}/#/profile\n` +
    `🔗 *رابط السيارة:*\n${carDirectLink}`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 8. إشعار المشتري عند اعتذار البائع عن العرض
 */
export async function sendOfferRejectedToBuyerWhatsApp(
  phone: string,
  buyerName: string,
  carTitle: string,
  offerAmount: number,
  caseRef: string,
  notes?: string | null,
  listingId?: string
): Promise<SendWhatsAppResult> {
  const carDirectLink = listingId
    ? `${PLATFORM_URL}/?car=${encodeURIComponent(listingId)}#car-detail`
    : `${PLATFORM_URL}/#/marketplace`;

  const message =
    `ℹ️ *منصة مخلّصة | تحديث بخصوص عرض الشراء*\n\n` +
    `أهلاً أ/ *${buyerName || 'عميلنا العزيز'}*،\n` +
    `نود إبلاغك بأن مالك السيارة اعتذر عن قبول عرض السعر المقدم بقيمة *${offerAmount.toLocaleString('ar-EG')} ج.م* على السيارة:\n` +
    `🚘 *${carTitle}* (كود #${caseRef})\n` +
    (notes ? `📌 *ملاحظة البائع:* ${notes}\n` : '') +
    `\n💡 يمكنك تقديم عرض سعر تفاوضي أقرب للسعر المطلوب على نفس السيارة أو تصفح سيارات أخرى مشابهة:\n` +
    `🔗 *صفحة السيارة:* ${carDirectLink}\n` +
    `🌐 *المعرض العام:* ${PLATFORM_URL}/#/marketplace`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 9. رسالة تأكيد للبائع بعد قبوله أو اعتذاره عن العرض
 */
export async function sendOfferAcceptedSellerConfirmationWhatsApp(
  phone: string,
  carTitle: string,
  offerAmount: number,
  buyerName: string,
  caseRef: string
): Promise<SendWhatsAppResult> {
  const message =
    `✅ *منصة مخلّصة | تم تسجيل موافقتك المبدئية بنجاح*\n\n` +
    `تم تأكيد قبولك لعرض الشراء المقدم من أ/ *${buyerName}* بقيمة *${offerAmount.toLocaleString('ar-EG')} ج.م* على سيارتك (*${carTitle}* - كود #${caseRef}).\n\n` +
    `📞 سيقوم فريق مخلّصة بالتواصل معك لتنسيق موعد المقابلة والمعاينة وإجراءات التسوية.\n` +
    `🌐 *رابط حسابك:* ${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendOfferRejectedSellerConfirmationWhatsApp(
  phone: string,
  carTitle: string,
  offerAmount: number,
  buyerName: string,
  caseRef: string
): Promise<SendWhatsAppResult> {
  const message =
    `ℹ️ *منصة مخلّصة | تم تسجيل اعتذارك عن العرض*\n\n` +
    `تم تسجيل اعتذارك عن عرض الشراء المقدم من أ/ *${buyerName}* بقيمة *${offerAmount.toLocaleString('ar-EG')} ج.م* على سيارتك (*${carTitle}* - كود #${caseRef})، ويظل إعلانك متاحاً لاستقبال عروض جديدة في المعرض.\n\n` +
    `🌐 *رابط حسابك:* ${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 10. إشعار الطرفين عند الاعتماد النهائي للصفقة وتنسيق المقابلة من الإدارة
 */
export async function sendDealConfirmedWhatsApp(
  phone: string,
  partyRole: 'buyer' | 'seller',
  carTitle: string,
  offerAmount: number,
  caseRef: string,
  adminNotes?: string
): Promise<SendWhatsAppResult> {
  const roleText =
    partyRole === 'buyer'
      ? 'تم اعتماد صفقة شرائك للسيارة رسمياً وجاري ترتيب موعد المعاينة والمقابلة البنكية خلال 24 ساعة.'
      : 'تم اعتماد صفقة بيع سيارتك رسمياً وجاري ترتيب موعد المقابلة البنكية والمعاينة مع المشتري خلال 24 ساعة.';

  const message =
    `🏛️ *منصة مخلّصة | اعتماد الصفقة وتنسيق المقابلة*\n\n` +
    `${roleText}\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *القيمة المعتمدة:* *${offerAmount.toLocaleString('ar-EG')} ج.م*\n` +
    `🔖 *رقم الملف:* #${caseRef}\n` +
    (adminNotes ? `📝 *تفاصيل التنسيق:* ${adminNotes}\n` : '') +
    `\n🌐 *لمتابعة ملف الصفقة في حسابك:*\n` +
    `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 11. إشعار البائع بقرار مراجعة الإعلان (اعتماد ونشر / طلب تعديل / رفض)
 */
export async function sendListingModerationWhatsApp(
  phone: string,
  carTitle: string,
  status: 'published' | 'approved' | 'needs_changes' | 'rejected',
  feedback?: string,
  caseRef?: string,
  listingId?: string
): Promise<SendWhatsAppResult> {
  let message = '';
  const liveCarLink = listingId
    ? `${PLATFORM_URL}/?car=${encodeURIComponent(listingId)}#car-detail`
    : `${PLATFORM_URL}/#/marketplace`;

  if (status === 'published' || status === 'approved') {
    message =
      `🌟 *تهانينا من منصة مخلّصة | تم اعتماد ونشر إعلان سيارتك!*\n\n` +
      `تمت مراجعة واعتماد إعلان سيارتك (*${carTitle}*${caseRef ? ` - كود #${caseRef}` : ''}) وأصبح الآن منشوراً ومتاحاً لجميع المشترين في المعرض العام! 🚗✨\n\n` +
      `🔗 *رابط إعلان سيارتك المباشر في المعرض:*\n` +
      `${liveCarLink}\n\n` +
      `📲 ستصلك إشعارات فورية هنا على الواتساب فور تقديم أي مشتري لعرض سعر على سيارتك.\n` +
      `🌐 *لوحة حسابك الشخصي:*\n` +
      `${PLATFORM_URL}/#/profile`;
  } else if (status === 'needs_changes') {
    message =
      `📝 *منصة مخلّصة | مطلوب تحديث بسيط على إعلان سيارتك*\n\n` +
      `تمت مراجعة إعلان سيارتك (*${carTitle}*${caseRef ? ` - كود #${caseRef}` : ''})، ولنشره بأفضل صورة يرجى مراجعة الملاحظة التالية من فريق المراجعة:\n\n` +
      `📌 *المطلوب:* ${feedback || 'يرجى استكمال وتوضيح بيانات وصور السيارة.'}\n\n` +
      `🌐 *اضغط هنا لتعديل الإعلان وإعادة إرساله فوراً:*\n` +
      `${PLATFORM_URL}/#/profile`;
  } else {
    message =
      `⚠️ *منصة مخلّصة | تنبيه بخصوص إعلان سيارتك*\n\n` +
      `نعتذر، لم يتم اعتماد نشر إعلان سيارتك (*${carTitle}*${caseRef ? ` - كود #${caseRef}` : ''}) للسبب التالي:\n` +
      `📌 *السبب:* ${feedback || 'البيانات غير مكتملة أو غير مطابقة لمعايير النشر بالمنصة.'}\n\n` +
      `يمكنك الدخول لحسابك وتعديل البيانات وإعادة إرسال الإعلان للمراجعة:\n` +
      `🌐 ${PLATFORM_URL}/#/profile`;
  }

  return sendWhatsAppMessage(phone, message);
}

/**
 * 11b. إشعار البائع عند ترقية إعلانه إلى إعلان مميز VIP (أفضل صفقة)
 */
export async function sendListingFeaturedWhatsApp(
  phone: string,
  carTitle: string,
  rank?: number,
  badgeText?: string,
  listingId?: string
): Promise<SendWhatsAppResult> {
  const liveCarLink = listingId
    ? `${PLATFORM_URL}/?car=${encodeURIComponent(listingId)}#car-detail`
    : `${PLATFORM_URL}/#/marketplace`;

  const message =
    `👑 *منصة مخلّصة | تم ترقية إعلان سيارتك إلى «إعلان مميز - ${badgeText || 'أفضل صفقة'}»!*\n\n` +
    `يسعدنا إبلاغك بأنه تم اختيار وترقية إعلان سيارتك (*${carTitle}*) ليظهر في صدارة المعرض والصفحة الرئيسية${rank ? ` (المركز #${rank})` : ''} بشارة ذهبية مميزة لزيادة المشاهدات وتسريع البيع! ✨🚗\n\n` +
    `🔗 *شاهد إعلانك المميز الآن:*\n` +
    `${liveCarLink}\n\n` +
    `🌐 *متابعة العروض في حسابك:*\n` +
    `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 12. إشعار البائع بطلب رفع المستندات الرسمية أو استلامها أو قرار مراجعتها
 */
export async function sendDocumentRequestedWhatsApp(
  phone: string,
  carTitle: string,
  notes?: string
): Promise<SendWhatsAppResult> {
  const message =
    `📄 *منصة مخلّصة | مطلوب رفع مستندات سيارتك للتوثيق*\n\n` +
    `يرجى رفع صور المستندات الرسمية الخاصة بسيارتك (*${carTitle}*) لمنح إعلانك شارة «أوراق مفحوصة وموثقة» وتسريع إجراءات البيع:\n\n` +
    `📌 *الملاحظات:* ${notes || 'يرجى إرفاق صورة رخصة التسيير وبطاقة الرقم القومي وبيان حالة القرض إن وجد.'}\n\n` +
    `🌐 *اضغط هنا لرفع المستندات بأمان من حسابك:*\n` +
    `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendDocumentUploadedWhatsApp(
  phone: string,
  carTitle: string,
  docsCount?: number
): Promise<SendWhatsAppResult> {
  const message =
    `📥 *منصة مخلّصة | تم استلام مستندات سيارتك بنجاح*\n\n` +
    `تم استلام ${docsCount ? `(${docsCount}) مستندات` : 'المستندات المرفقة'} الخاصة بسيارتك (*${carTitle}*) وجاري فحصها وتوثيقها من قِبل قسم المراجعة القانونية بالمنصة.\n\n` +
    `📲 سنقوم بإشعارك فور اعتماد التوثيق.\n` +
    `🌐 ${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendDocumentStatusWhatsApp(
  phone: string,
  carTitle: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
  docName?: string
): Promise<SendWhatsAppResult> {
  const docLabel = docName ? ` (${docName})` : '';
  const message =
    status === 'approved'
      ? `✅ *منصة مخلّصة | تم اعتماد وتوثيق أوراق سيارتك*\n\n` +
        `يسعدنا إبلاغك بأنه تم فحص وتوثيق الأوراق الرسمية${docLabel} لسيارتك (*${carTitle}*) بنجاح من قِبل الشؤون القانونية بالمنصة، وتم منح إعلانك شارة *«أوراق مفحوصة وموثقة إدارياً»* لزيادة ثقة المشترين وتسريع البيع!\n\n` +
        `🌐 *رابط حسابك:*\n${PLATFORM_URL}/#/profile`
      : `⚠️ *منصة مخلّصة | ملاحظة بشأن أوراق السيارة*\n\n` +
        `تمت مراجعة مستندات سيارتك (*${carTitle}*)${docLabel} وهناك ملاحظة تتطلب تحديث المستند:\n` +
        `📌 *السبب:* ${rejectionReason || 'يرجى إعادة رفع صورة واضحة لرخصة السيارة والبطاقة الشخصية.'}\n\n` +
        `🌐 *يرجى الدخول لرفع المستند المحدث من هنا:*\n` +
        `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 13. إشعار تأكيد استلام طلب استشارة مجانية أو حجز فحص فني أو تواصل معنا
 */
export async function sendConsultationReceivedWhatsApp(
  phone: string,
  clientName: string,
  topicOrBank: string,
  inquiryText?: string
): Promise<SendWhatsAppResult> {
  const message =
    `🤝 *منصة مخلّصة | تم استلام طلبك بنجاح*\n\n` +
    `أهلاً أ/ *${clientName || 'عميلنا العزيز'}*،\n` +
    `تلقينا طلب الاستشارة / المتابعة الخاص بك بنجاح:\n\n` +
    `📌 *الموضوع / الجهة:* ${topicOrBank || 'استشارة عامة وفحص'}\n` +
    (inquiryText ? `💬 *تفاصيل الطلب:* ${inquiryText}\n` : '') +
    `\n📞 سيقوم أحد مستشاري التسويات والسيارات في «مخلّصة» بالتواصل معك في أقرب وقت.\n\n` +
    `🌐 *تصفح المعرض والخدمات:*\n` +
    `${PLATFORM_URL}/#/marketplace`;

  return sendWhatsAppMessage(phone, message);
}
