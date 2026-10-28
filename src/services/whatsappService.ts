/**
 * =====================================================================
 * خدمة إرسال رسائل وتنبيهات الواتساب ورموز التحقق (OTP)
 * منصة مخلّصة | Mokhalasa WhatsApp Notification & OTP Engine
 * =====================================================================
 * المزود الأساسي: WazzAPI (https://api.wazzapi.com/api/v1)
 * المزودات الاحتياطية: بوابة مخلصة الخاصة (Mokhalasa Gateway) + Wapilot API
 */

// 1. إعدادات المزود الأساسي (WazzAPI)
const WAZZAPI_BASE_URL = 'https://api.wazzapi.com/api/v1';
const DEFAULT_WAZZAPI_KEY = 'wazz_sk_QaG6JA2B84ZfqhSAddXHoo6d7iW6Mq7QahXPYG7IXN0';

// 2. إعدادات بوابة مخلصة الخاصة (Dedicated Self-Hosted WhatsApp Gateway)
const DEFAULT_GATEWAY_URL = 'http://localhost:3001';
const DEFAULT_GATEWAY_KEY = 'mokhalasa_secret_otp_key_2026';

// 3. موفر الخدمة الاحتياطي (Wapilot API v2)
const WAPILOT_API_URL = 'https://api.wapilot.net/api/v2';
const DEFAULT_INSTANCE_ID = 'instance6023';
const DEFAULT_API_TOKEN = 'OxiCvTAE4NnJAb61AuHV5vBHSSzamrD9pIkCd761od';

const PLATFORM_URL = 'https://mokhalasa-app.vercel.app';

export const getWazzapiConfig = () => {
  const apiKey =
    (import.meta.env?.VITE_WAZZAPI_API_KEY as string) ||
    (typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_wazzapi_key') : '') ||
    DEFAULT_WAZZAPI_KEY;
  const deviceId =
    (import.meta.env?.VITE_WAZZAPI_DEVICE_ID as string) ||
    (typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_wazzapi_device_id') : '') ||
    '';
  return { apiKey: apiKey.trim(), deviceId: deviceId.trim() };
};

export const configureWazzapiCredentials = (apiKey: string, deviceId?: string) => {
  if (typeof window !== 'undefined') {
    if (apiKey) localStorage.setItem('mokhalasa_wazzapi_key', apiKey.trim());
    if (deviceId !== undefined) localStorage.setItem('mokhalasa_wazzapi_device_id', deviceId.trim());
  }
};

export const getGatewayConfig = () => {
  const gatewayUrl =
    (import.meta.env?.VITE_WHATSAPP_GATEWAY_URL as string) ||
    (typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_wa_gateway_url') : '') ||
    DEFAULT_GATEWAY_URL;
  const apiKey = (import.meta.env?.VITE_WHATSAPP_API_KEY as string) || DEFAULT_GATEWAY_KEY;
  return { gatewayUrl, apiKey };
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
    const override = localStorage.getItem('mokhalasa_whatsapp_enabled');
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
    localStorage.setItem('mokhalasa_whatsapp_enabled', String(enabled));
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
  provider?: 'wazzapi' | 'gateway' | 'wapilot';
  error?: string;
}

// ذاكرة مؤقتة لمعرف جهاز الواتساب المتصل في WazzAPI
let cachedWazzapiDeviceId: string | null = null;

/**
 * جلب معرف الجهاز المتصل (whatsapp_account_id) تلقائياً من حساب WazzAPI
 */
async function resolveWazzapiDeviceId(apiKey: string, configuredDeviceId?: string): Promise<string | null> {
  if (configuredDeviceId) return configuredDeviceId;
  if (cachedWazzapiDeviceId) return cachedWazzapiDeviceId;

  try {
    const res = await fetch(`${WAZZAPI_BASE_URL}/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const devices: any[] = data?.devices || (Array.isArray(data) ? data : []);
      if (devices.length > 0) {
        const primaryOrConnected =
          devices.find(d => d.status === 'connected' && d.is_primary) ||
          devices.find(d => d.status === 'connected') ||
          devices.find(d => d.is_primary) ||
          devices[0];

        if (primaryOrConnected?.id) {
          cachedWazzapiDeviceId = primaryOrConnected.id;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('mokhalasa_wazzapi_device_id', primaryOrConnected.id);
            } catch {}
          }
          return primaryOrConnected.id;
        }
      }
    }
  } catch (err) {
    console.warn('[WazzAPI] Auto-resolve device ID notice:', err);
  }

  return null;
}

/**
 * إرسال الرسالة عبر WazzAPI (المزود الرئيسي)
 */
async function sendViaWazzapi(phone: string, text: string): Promise<SendWhatsAppResult> {
  const { apiKey, deviceId } = getWazzapiConfig();
  if (!apiKey) {
    return { success: false, error: 'مفتاح WazzAPI غير متوفر' };
  }

  const intlPhone = normalizeInternationalEgyptianPhone(phone);
  if (!intlPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  try {
    const resolvedDeviceId = await resolveWazzapiDeviceId(apiKey, deviceId);

    const payload: Record<string, any> = {
      phone_number: `+${intlPhone}`,
      content: text,
      message_type: 'text'
    };

    if (resolvedDeviceId) {
      payload.whatsapp_account_id = resolvedDeviceId;
    }

    const response = await fetch(`${WAZZAPI_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success || data?.message_id || data?.id) {
        return {
          success: true,
          messageId: data.message_id || data.id,
          provider: 'wazzapi'
        };
      }
    } else {
      // محاولة ثانية بصيغة رقم بدون علامة + إذا تطلب الخادم ذلك
      const retryPayload: Record<string, any> = {
        ...payload,
        phone_number: intlPhone
      };
      const retryRes = await fetch(`${WAZZAPI_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(retryPayload)
      });

      if (retryRes.ok) {
        const retryData = await retryRes.json();
        if (retryData?.success || retryData?.message_id || retryData?.id) {
          return {
            success: true,
            messageId: retryData.message_id || retryData.id,
            provider: 'wazzapi'
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[WazzAPI] Send warning:', err?.message || err);
  }

  return { success: false, error: 'تعذر الإرسال عبر WazzAPI' };
}

/**
 * إرسال رسالة نصية عامة عبر الواتساب
 * الترتيب:
 * 1. WazzAPI (`wazz_sk_...`)
 * 2. بوابة مخلصة الخاصة (Mokhalasa Gateway)
 * 3. Wapilot API (الاحتياطي)
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const cleanPhone = normalizeInternationalEgyptianPhone(phone);
  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  // 1. المحاولة الأولى عبر WazzAPI (المزود الرئيسي الجديد)
  const wazzResult = await sendViaWazzapi(cleanPhone, text);
  if (wazzResult.success) {
    return wazzResult;
  }

  // 2. المحاولة الثانية عبر بوابة مخلصة الخاصة (Mokhalasa Gateway)
  const { gatewayUrl, apiKey } = getGatewayConfig();
  try {
    const gatewayRes = await fetch(`${gatewayUrl}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: text
      })
    });

    if (gatewayRes.ok) {
      const data = await gatewayRes.json();
      if (data?.success) {
        return { success: true, messageId: data.messageId, provider: 'gateway' };
      }
    }
  } catch {
    // الانتقال للمزود الاحتياطي
  }

  // 3. المحاولة الثالثة عبر Wapilot كنسخة احتياطية
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
      return { success: false, error: data?.message || 'فشل إرسال رسالة الواتساب' };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بخدمة الواتساب' };
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

  // يرسل عبر WazzAPI أولاً ثم البوابات البديلة
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
 * 3. الرسالة الترحيبية عند إنشاء حساب جديد للعميل
 */
export async function sendWelcomeWhatsApp(phone: string, userName: string): Promise<SendWhatsAppResult> {
  const displayName = userName?.trim() || 'عميلنا العزيز';
  const message =
    `🎉 *أهلاً بك في منصة مخلّصة، يا ${displayName}!*\n\n` +
    `تم تفعيل حسابك وتوثيق رقم هاتفك بنجاح على أول منصة متخصصة لبيع وشراء سيارات الأقساط وحظر البيع والتقسيط المباشر والكاش في مصر. 🚗🇪🇬\n\n` +
    `✨ *ماذا يمكنك أن تفعل الآن؟*\n` +
    `• تصفح السيارات المعتمدة وتقديم عروض شراء مباشرة.\n` +
    `• عرض سيارتك للبيع وحساب صافي مستحقاتك بدقة.\n` +
    `• متابعة حالة طلباتك وعروض الأسعار لحظة بلحظة.\n\n` +
    `🌐 *رابط حسابك الشخصي:*\n` +
    `${PLATFORM_URL}/#/profile\n\n` +
    `فريق مستشاري مخلّصة معك خطوة بخطوة لضمان أمان وسرعة كل معاملة! 🤝`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 4. إشعار البائع فور استلام إعلان سيارته للمراجعة
 */
export async function sendListingSubmittedWhatsApp(
  phone: string,
  sellerName: string,
  carTitle: string,
  askingPrice: number,
  caseRef: string
): Promise<SendWhatsAppResult> {
  const message =
    `📋 *منصة مخلّصة | تم استلام إعلان سيارتك بنجاح*\n\n` +
    `أهلاً أ/ *${sellerName || 'مالك السيارة'}*،\n` +
    `تم تسجيل بيانات سيارتك بنجاح وجاري مراجعتها من قِبل فريق العمليات:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *السعر المطلوب:* ${askingPrice.toLocaleString('ar-EG')} ج.م\n` +
    `🔖 *الرقم المرجعي للإعلان:* #${caseRef}\n\n` +
    `سنقوم بإشعارك هنا فور اعتماد الإعلان ونشره في المعرض العام.\n` +
    `🌐 *لمتابعة حالة إعلانك:*\n` +
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
  buyerName?: string
): Promise<SendWhatsAppResult> {
  const message =
    `🔔 *منصة مخلّصة | وصلك عرض شراء جديد لسيارتك!*\n\n` +
    `قدم المشتري *(${buyerName || 'مشتري جاد'})* عرض شراء رسمي على سيارتك:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *قيمة العرض المقدم:* *${offerAmount.toLocaleString('ar-EG')} ج.م*\n` +
    `🔖 *مرجع الإعلان:* #${listingIdOrRef}\n\n` +
    `⚡ *الخطوة المطلوبة منك:*\n` +
    `يرجى الدخول إلى حسابك الآن للضغط على *(قبول العرض مبدئياً)* أو *(الاعتذار عن العرض)*، ليقوم فريق مخلّصة فوراً بتنسيق موعد المعاينة والمقابلة البنكية.\n\n` +
    `🌐 *اضغط هنا للرد على العرض:*\n` +
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
  caseRef: string
): Promise<SendWhatsAppResult> {
  const message =
    `✅ *منصة مخلّصة | تم إرسال عرض الشراء للبائع*\n\n` +
    `أهلاً أ/ *${buyerName || 'عميلنا العزيز'}*،\n` +
    `تم تسجيل عرض الشراء الخاص بك وتمريره مباشرة إلى مالك السيارة:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *قيمة عرضك:* ${offerAmount.toLocaleString('ar-EG')} ج.م\n` +
    `🔖 *كود الإعلان:* #${caseRef}\n\n` +
    `📲 ستصلك رسالة فورية هنا على الواتساب بمجرد رد البائع (بالموافقة أو الاعتذار) لترتيب موعد المعاينة.\n` +
    `🌐 *متابعة عروضك:* ${PLATFORM_URL}/#/profile`;

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
  caseRef: string
): Promise<SendWhatsAppResult> {
  const message =
    `🎉 *بشرى سارة من منصة مخلّصة | تمت الموافقة على عرضك!*\n\n` +
    `أهلاً أ/ *${buyerName || 'عميلنا العزيز'}*،\n` +
    `وافق مالك السيارة مبدئياً على عرض الشراء المقدم منك:\n\n` +
    `🚘 *السيارة:* ${carTitle}\n` +
    `💰 *السعر المتفق عليه:* *${offerAmount.toLocaleString('ar-EG')} ج.م*\n` +
    `🔖 *رقم الملف:* #${caseRef}\n\n` +
    `🤝 *الخطوة القادمة:*\n` +
    `يتولى الآن مستشار الصفقات في «مخلّصة» التنسيق معك ومع البائع لتحديد موعد المعاينة الفنية والمقابلة البنكية لإنهاء الإجراءات بأمان تام.\n\n` +
    `🌐 *تفاصيل الصفقة في حسابك:*\n` +
    `${PLATFORM_URL}/#/profile`;

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
  notes?: string | null
): Promise<SendWhatsAppResult> {
  const message =
    `ℹ️ *منصة مخلّصة | تحديث بخصوص عرض الشراء*\n\n` +
    `أهلاً أ/ *${buyerName || 'عميلنا العزيز'}*،\n` +
    `نود إبلاغك بأن مالك السيارة اعتذر عن قبول عرض السعر المقدم بقيمة *${offerAmount.toLocaleString('ar-EG')} ج.م* على السيارة:\n` +
    `🚘 *${carTitle}* (كود #${caseRef})\n` +
    (notes ? `📌 *ملاحظة البائع:* ${notes}\n` : '') +
    `\n💡 يمكنك الدخول للمعرض وتقديم عرض سعر تفاوضي أقرب للسعر المطلوب أو تصفح سيارات أخرى مشابهة:\n` +
    `🌐 ${PLATFORM_URL}/#/marketplace`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * 9. رسالة تأكيد للبائع بعد قبوله للعرض
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
    `📞 سيقوم فريق مخلّصة بالتواصل معك لتنسيق موعد المقابلة والمعاينة وإجراءات التسوية.`;

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
    `\n🌐 *لمتابعة ملف الصفقة:*\n` +
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
  caseRef?: string
): Promise<SendWhatsAppResult> {
  let message = '';

  if (status === 'published' || status === 'approved') {
    message =
      `🌟 *تهانينا من منصة مخلّصة | تم اعتماد ونشر إعلان سيارتك!*\n\n` +
      `تمت مراجعة واعتماد إعلان سيارتك (*${carTitle}*${caseRef ? ` - كود #${caseRef}` : ''}) وأصبح الآن ظاهراً ومتاحاً لجميع المشترين في المعرض العام.\n\n` +
      `📲 ستصلك إشعارات فورية هنا على الواتساب فور تقديم أي مشتري لعرض سعر على سيارتك.\n` +
      `🌐 *رابط حسابك:* ${PLATFORM_URL}/#/profile`;
  } else if (status === 'needs_changes') {
    message =
      `📝 *منصة مخلّصة | مطلوب تحديث بسيط على إعلان سيارتك*\n\n` +
      `تمت مراجعة إعلان سيارتك (*${carTitle}*${caseRef ? ` - كود #${caseRef}` : ''})، ولنشره بأفضل صورة يرجى مراجعة الملاحظة التالية:\n\n` +
      `📌 *المطلوب:* ${feedback || 'يرجى استكمال وتوضيح بيانات وصور السيارة.'}\n\n` +
      `🌐 *اضغط هنا لتعديل الإعلان وإعادة إرساله:*\n` +
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
 * 12. إشعار البائع بقرار إدارة مخلصة بشأن مستنداته الرسمية
 */
export async function sendDocumentStatusWhatsApp(
  phone: string,
  carTitle: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<SendWhatsAppResult> {
  const message =
    status === 'approved'
      ? `✅ *منصة مخلّصة | تم اعتماد وتوثيق أوراق سيارتك*\n\n` +
        `يسعدنا إبلاغك بأنه تم فحص وتوثيق الأوراق الرسمية لسيارتك (*${carTitle}*) بنجاح من قِبل الشؤون القانونية بالمنصة، وتم منح إعلانك شارة *«أوراق مفحوصة وموثقة إدارياً»* لزيادة ثقة المشترين وتسريع البيع!\n\n` +
        `🌐 ${PLATFORM_URL}/#/profile`
      : `⚠️ *منصة مخلّصة | ملاحظة بشأن أوراق السيارة*\n\n` +
        `تمت مراجعة مستندات سيارتك (*${carTitle}*) وهناك ملاحظة تتطلب تحديث المستند:\n` +
        `📌 *السبب:* ${rejectionReason || 'يرجى إعادة رفع صورة واضحة لرخصة السيارة والبطاقة الشخصية.'}\n\n` +
        `🌐 *يرجى الدخول لرفع المستند المحدث من هنا:*\n` +
        `${PLATFORM_URL}/#/profile`;

  return sendWhatsAppMessage(phone, message);
}
