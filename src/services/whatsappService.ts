/**
 * =====================================================================
 * خدمة إرسال رسائل وتنبيهات الواتساب ورموز التحقق (OTP)
 * منصة مخلّصة | Mokhalasa WhatsApp Notification & OTP Engine
 * =====================================================================
 * المزود الأساسي: wAIsend API (https://waisend.com/api/external)
 * (تم إلغاء السيرفر المحلي نهائياً والاعتماد الكامل على الـ API الخارجي)
 */

// 1. إعدادات المزود الأساسي (wAIsend API)
const WAISEND_BASE_URL = 'https://waisend.com/api/external';
const DEFAULT_WAZZAPI_KEY = 'wazz_sk_X7MpeNiN6lEzf7RvNlpMusnBKHPBn023n6akw6zZ3R4';
const REVOKED_WAZZAPI_KEYS = new Set(['wazz_sk_QaG6JA2B84ZfqhSAddXHoo6d7iW6Mq7QahXPYG7IXN0']);

// 2. موفر الخدمة الاحتياطي (Wapilot API v2)
const WAPILOT_API_URL = 'https://api.wapilot.net/api/v2';
const DEFAULT_INSTANCE_ID = 'instance6023';
const DEFAULT_API_TOKEN = 'OxiCvTAE4NnJAb61AuHV5vBHSSzamrD9pIkCd761od';

const PLATFORM_URL = 'https://mokhalasa-app.vercel.app';

export const getWazzapiConfig = () => {
  let storedKey = '';
  if (typeof window !== 'undefined') {
    storedKey = (localStorage.getItem('mokhalasa_wazzapi_key') || '').trim();
    if (storedKey && REVOKED_WAZZAPI_KEYS.has(storedKey)) {
      localStorage.setItem('mokhalasa_wazzapi_key', DEFAULT_WAZZAPI_KEY);
      storedKey = DEFAULT_WAZZAPI_KEY;
    }
  }
  const envKey = ((import.meta.env?.VITE_WAZZAPI_API_KEY as string) || '').trim();
  const validEnvKey = envKey && !REVOKED_WAZZAPI_KEYS.has(envKey) ? envKey : '';
  const apiKey = validEnvKey || storedKey || DEFAULT_WAZZAPI_KEY;
  const deviceId =
    (import.meta.env?.VITE_WAZZAPI_DEVICE_ID as string) ||
    (typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_wazzapi_device_id') : '') ||
    '';
  return { apiKey: apiKey.trim(), deviceId: deviceId.trim() };
};

export const configureWazzapiCredentials = (apiKey: string, deviceId?: string) => {
  if (typeof window !== 'undefined') {
    if (apiKey && !REVOKED_WAZZAPI_KEYS.has(apiKey.trim())) {
      localStorage.setItem('mokhalasa_wazzapi_key', apiKey.trim());
    }
    if (deviceId !== undefined) localStorage.setItem('mokhalasa_wazzapi_device_id', deviceId.trim());
  }
};

export const getWapilotConfig = () => {
  const token = (import.meta.env?.VITE_WAPILOT_API_TOKEN as string) || DEFAULT_API_TOKEN;
  const instanceId = (import.meta.env?.VITE_WAPILOT_INSTANCE_ID as string) || DEFAULT_INSTANCE_ID;
  return { token, instanceId };
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
  provider?: 'waisend' | 'wazzapi' | 'wapilot';
  error?: string;
}

/**
 * إرسال الرسالة عبر wAIsend API (المزود الرئيسي - عبر Serverless Proxy أو مباشر)
 */
async function sendViaWaisend(phone: string, text: string): Promise<SendWhatsAppResult> {
  const { apiKey } = getWazzapiConfig();
  if (!apiKey) {
    return { success: false, error: 'مفتاح wAIsend API غير متوفر' };
  }

  const intlPhone = normalizeInternationalEgyptianPhone(phone);
  if (!intlPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  // 1. المحاولة عبر Vercel Serverless Proxy (/api/whatsapp) لتفادي حظر CORS في المتصفح
  const proxyEndpoints = ['/api/whatsapp', `${PLATFORM_URL}/api/whatsapp`];
  for (const endpoint of proxyEndpoints) {
    try {
      const proxyRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: intlPhone,
          text,
          message: text,
          apiKey
        })
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData?.success) {
          return {
            success: true,
            messageId: proxyData.messageId,
            provider: 'waisend'
          };
        }
      }
    } catch {
      // الانتقال للمحاولة التالية
    }
  }

  // 2. المحاولة المباشرة عبر wAIsend API (https://waisend.com/api/external/send-message)
  try {
    const response = await fetch(`${WAISEND_BASE_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        phone: intlPhone,
        message: text,
        typing: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success || data?.messageId || data?.data?.id) {
        return {
          success: true,
          messageId: data.messageId || data?.data?.id,
          provider: 'waisend'
        };
      }
    }
  } catch (err: any) {
    console.warn('[wAIsend API] Direct send notice:', err?.message || err);
  }

  return { success: false, error: 'تعذر الإرسال عبر wAIsend API' };
}

/**
 * إرسال رسالة نصية عامة عبر الواتساب (عبر الـ API الخارجي فقط بدون السيرفر المحلي)
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const cleanPhone = normalizeInternationalEgyptianPhone(phone);
  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  // 1. المحاولة الأولى عبر wAIsend API (المزود الرئيسي)
  const waisendResult = await sendViaWaisend(cleanPhone, text);
  if (waisendResult.success) {
    return waisendResult;
  }

  // 2. المحاولة الاحتياطية عبر Wapilot API
  const { token, instanceId } = getWapilotConfig();
  const chatId = formatEgyptianWhatsAppNumber(phone);

  try {
    const response = await fetch(`${WAPILOT_API_URL}/${instanceId}/send-message`, {
      method: 'POST',
      headers: {
        'token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });

    const data = await response.json();

    if (response.ok && data?.success) {
      return { success: true, messageId: data.message_id, provider: 'wapilot' };
    } else {
      return { success: false, error: data?.message || 'فشل إرسال رسالة الواتساب عبر الـ API' };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بخدمة الواتساب API' };
  }
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
