/**
 * خدمة إرسال رسائل وتنبيهات الواتساب ورموز التحقق (OTP)
 * منصة مخلّصة | Mokhalasa
 * موفر الخدمة: wapilot (API v2)
 */

const WAPILOT_API_URL = 'https://api.wapilot.net/api/v2';
const DEFAULT_INSTANCE_ID = 'instance6023';
const DEFAULT_API_TOKEN = 'OxiCvTAE4NnJAb61AuHV5vBHSSzamrD9pIkCd761od';

export const getWapilotConfig = () => {
  const token = (import.meta.env?.VITE_WAPILOT_API_TOKEN as string) || DEFAULT_API_TOKEN;
  const instanceId = (import.meta.env?.VITE_WAPILOT_INSTANCE_ID as string) || DEFAULT_INSTANCE_ID;
  return { token, instanceId };
};

/**
 * هل خدمة رسائل الواتساب مفعلة حالياً؟
 * يمكن إيقافها أو تشغيلها في أي وقت عبر:
 * 1. متغير البيئة VITE_ENABLE_WHATSAPP_OTP
 * 2. مفتاح التبديل المباشر في المتصفح / الداشبورد (mokhalasa_whatsapp_enabled)
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
  return true; // Enabled by default for the trial period
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
  // حذف أي مسافات أو رموز خاصة
  let cleaned = phone.replace(/\D/g, '');

  // إذا بدأ بـ +20 أو 20
  if (cleaned.startsWith('20')) {
    // رقم دولي سليم بالفعل
  } else if (cleaned.startsWith('01')) {
    // رقم مصري يبدأ بـ 01 -> استبدال 0 بـ 20
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    // رقم بدون الصفر
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
 * إرسال رسالة نصية عامة عبر الواتساب
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendWhatsAppResult> {
  if (!isWhatsAppServiceEnabled()) {
    return { success: false, error: 'خدمة الواتساب معطلة حالياً' };
  }

  const { token, instanceId } = getWapilotConfig();
  const chatId = formatEgyptianWhatsAppNumber(phone);

  if (!chatId) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

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
      console.warn('Wapilot API error:', data);
      return { success: false, error: data?.message || 'فشل إرسال رسالة الواتساب' };
    }
  } catch (err: any) {
    console.error('Wapilot send error:', err);
    return { success: false, error: err?.message || 'خطأ في الاتصال بخدمة الواتساب' };
  }
}

/**
 * إرسال كود تحقق سريع (OTP) بالعامية المصرية الودودة مع شعار المنصة
 */
export async function sendOtpViaWhatsApp(phone: string, otpCode: string): Promise<SendWhatsAppResult> {
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
  listingId: string
): Promise<SendWhatsAppResult> {
  const message = `🔔 *منصة مخلّصة | عرض سعر جديد*\n\nوصلك عرض شراء جديد لسيارتك:\n🚘 *${carTitle}*\n💰 قيمة العرض: *${offerAmount.toLocaleString('ar-EG')} ج.م*\n\nتقدر تفتح حسابك على منصة مخلصة لمراجعة العرض وقبوله مبدئياً أو الرد عليه مباشرة عبر الرابط:\n🌐 https://mokhalasa.com/my-requests`;
  return sendWhatsAppMessage(phone, message);
}

/**
 * إشعار بحالة مراجعة المستندات والأوراق
 */
export async function sendDocumentStatusWhatsApp(
  phone: string,
  carTitle: string,
  isApproved: boolean,
  rejectionReason?: string
): Promise<SendWhatsAppResult> {
  let message = '';
  if (isApproved) {
    message = `✅ *منصة مخلّصة | اعتماد أوراق السيارة*\n\nتم فحص ومطابقة مستندات سيارتك:\n🚘 *${carTitle}*\nبنجاح وتم تفعيل علامة "مفحوصة الأوراق رسمياً" على إعلانك 🛡️.`;
  } else {
    message = `⚠️ *منصة مخلّصة | تنبيه بخصوص أوراق سيارتك*\n\nتمت مراجعة مستندات سيارتك (*${carTitle}*) وهناك ملاحظة تحتاج تعديل:\n📝 *السبب:* ${rejectionReason || 'يرجى إعادة رفع صورة واضحة لرخصة السيارة'}\n\nبرجاء الدخول على حسابك وتحديث المستند لتفعيل الفحص مباشرة:\n🌐 https://mokhalasa.com/my-requests`;
  }
  return sendWhatsAppMessage(phone, message);
}
