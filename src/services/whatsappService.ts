/**
 * خدمة إرسال رسائل وتنبيهات الواتساب ورموز التحقق (OTP)
 * منصة مخلّصة | Mokhalasa
 * موفر الخدمة: بوابة واتساب مخلصة الخاصة المجانية (Mokhalasa WhatsApp Gateway)
 */

// إعدادات بوابة مخلصة الخاصة (Dedicated WhatsApp Gateway)
const DEFAULT_GATEWAY_URL = 'http://localhost:3001';
const DEFAULT_GATEWAY_KEY = 'mokhalasa_secret_otp_key_2026';

// موفر الخدمة البديل (Wapilot API v2)
const WAPILOT_API_URL = 'https://api.wapilot.net/api/v2';
const DEFAULT_INSTANCE_ID = 'instance6023';
const DEFAULT_API_TOKEN = 'OxiCvTAE4NnJAb61AuHV5vBHSSzamrD9pIkCd761od';

export const getGatewayConfig = () => {
  const gatewayUrl = (import.meta.env?.VITE_WHATSAPP_GATEWAY_URL as string) || (typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_wa_gateway_url') : '') || DEFAULT_GATEWAY_URL;
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
 * تحويل رقم الهاتف المصري إلى صيغة الواتساب الدولية القياسية (201xxxxxxxxx@c.us)
 */
export function formatEgyptianWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('20')) {
    // رقم دولي سليم بالفعل
  } else if (cleaned.startsWith('01')) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }

  return cleaned.includes('@c.us') ? cleaned : `${cleaned}@c.us`;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * إرسال رسالة نصية عامة عبر الواتساب (يحاول أولاً عبر بوابتنا الخاصة المجانية)
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const { gatewayUrl, apiKey } = getGatewayConfig();
  const cleanPhone = phone.replace(/\D/g, '');

  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  // المحاولة أولاً عبر بوابتنا الخاصة المجانية (Mokhalasa Gateway)
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
        return { success: true, messageId: data.messageId };
      }
    }
  } catch (gatewayErr) {
    console.warn('[WhatsApp] Gateway unavailable, trying fallback:', gatewayErr);
  }

  // المحاولة الثانية عبر Wapilot كنسخة احتياطية
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
      return { success: true, messageId: data.message_id };
    } else {
      return { success: false, error: data?.message || 'فشل إرسال رسالة الواتساب' };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بخدمة الواتساب' };
  }
}

/**
 * إرسال كود تحقق سريع (OTP) عبر بوابتنا الخاصة المجانية
 */
export async function sendOtpViaWhatsApp(phone: string, otpCode: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const { gatewayUrl, apiKey } = getGatewayConfig();
  const cleanPhone = phone.replace(/\D/g, '');

  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  // 1. المحاولة أولاً عبر بوابتنا الخاصة المجانية
  try {
    const response = await fetch(`${gatewayUrl}/api/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        phone: cleanPhone,
        code: otpCode
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        return { success: true, messageId: data.messageId };
      }
    }
  } catch (err) {
    console.warn('[WhatsApp OTP] Dedicated gateway unavailable, falling back to general sender:', err);
  }

  // 2. المحاولة الاحتياطية
  const message = `🚗 *منصة مخلّصة | Mokhalasa*\nكود التحقق الخاص بك لتسجيل الدخول:\n\n👉 *${otpCode}* 👈\n\n⏱️ الكود صالح لمدة 5 دقائق فقط.\n⚠️ للأمان: أوعى تشارك الكود ده مع أي شخص علشان نحافظ على أمان حسابك.`;
  return sendWhatsAppMessage(phone, message);
}

/**
 * إرسال كود استعادة وتعيين كلمة المرور عبر الواتساب
 */
export async function sendPasswordResetOtpViaWhatsApp(phone: string, otpCode: string): Promise<SendWhatsAppResult> {
  const message = `🚗 *منصة مخلّصة | استعادة كلمة المرور*\nكود التحقق لإعادة تعيين كلمة المرور هو:\n\n👉 *${otpCode}* 👈\n\n⏱️ الكود صالح لمدة 5 دقائق.\n⚠️ للأمان: أوعى تشارك الكود ده مع أي شخص علشان نحافظ على أمان حسابك.`;
  return sendWhatsAppMessage(phone, message);
}

/**
 * إشعار البائع بوصول عرض تفاوض/سعر جديد لسيارته
 */
export async function sendNegotiationOfferWhatsApp(
  phone: string,
  carTitle: string,
  offerAmount: number,
  _listingId: string
): Promise<SendWhatsAppResult> {
  const message = `🔔 *منصة مخلّصة | عرض سعر جديد*\n\nوصلك عرض شراء جديد لسيارتك:\n🚘 *${carTitle}*\n💰 قيمة العرض: *${offerAmount.toLocaleString('ar-EG')} ج.م*\n\nتقدر تفتح حسابك على منصة مخلصة لمراجعة العرض وقبوله مبدئياً أو الرد عليه مباشرة عبر الرابط:\n🌐 https://mokhalasa-app.vercel.app/#/seller-portal`;
  return sendWhatsAppMessage(phone, message);
}

/**
 * إشعار البائع بقرار إدارة مخلصة بشأن مستنداته
 */
export async function sendDocumentStatusWhatsApp(
  phone: string,
  carTitle: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<SendWhatsAppResult> {
  const message = status === 'approved'
    ? `✅ *منصة مخلّصة | تم اعتماد أوراق السيارة*\n\nيسعدنا إبلاغك بأنه تم فحص وتوثيق أوراق سيارتك (*${carTitle}*) بنجاح من قبل الشؤون القانونية بالمنصة وتم تفعيل شارة «أوراق مفحوصة وموثقة» على إعلانك.`
    : `⚠️ *منصة مخلّصة | تنبيه بشأن أوراق السيارة*\n\nتمت مراجعة أوراق سيارتك (*${carTitle}*) وهناك ملاحظة تتطلب تحديث المستندات:\n📌 السبب: ${rejectionReason || 'يرجى إعادة رفع صورة واضحة لرخصة السيارة والبطاقة الشخصية.'}\n\nيرجى الدخول وتحديث المستندات من الرابط:\n🌐 https://mokhalasa-app.vercel.app/#/seller-portal`;
  return sendWhatsAppMessage(phone, message);
}
