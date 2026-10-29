/**
 * Vercel Serverless Function: /api/whatsapp
 * Hardened Enterprise Proxy for WhatsApp API (wAIsend / Custom Cloud Provider)
 *
 * Security Hardening:
 * 1. Per-IP Rate Limiting (protects against SMS/WhatsApp flooding & quota exhaustion)
 * 2. Strict Input Sanitization & Payload Length Caps
 * 3. Security Headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`)
 * 4. Internal Error Masking (never leaks internal stack traces or secret API keys to client)
 */

const ipRateLimitMap = new Map();
const IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 25;

function checkIpRateLimit(ip) {
  const now = Date.now();
  const record = ipRateLimitMap.get(ip);
  if (!record || now - record.start > IP_WINDOW_MS) {
    ipRateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

function sanitizeServerText(val, maxLen = 2500) {
  if (!val) return '';
  return String(val)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLen);
}

export default async function handler(req, res) {
  // Security Headers on API responses
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'الطريقة غير مسموح بها (Method Not Allowed)' });
  }

  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkIpRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'تم تجاوز الحد المسموح لإرسال الرسائل من هذا الجهاز. يرجى الانتظار دقائق والمحاولة مجدداً.',
    });
  }

  try {
    const {
      to,
      phone,
      message,
      text,
      sessionName: bodySessionName,
    } = req.body || {};

    const rawRecipient = sanitizeServerText(to || phone || '', 30);
    const finalMessage = sanitizeServerText(message || text || '', 3000);

    if (!rawRecipient || !finalMessage) {
      return res.status(400).json({
        success: false,
        error: 'بيانات الرسالة غير مكتملة.',
      });
    }

    // Secret keys are strictly server-managed (never accepted from client body to prevent SSRF/key spoofing)
    const apiKey =
      process.env.WHATSAPP_API_KEY ||
      process.env.VITE_WHATSAPP_API_KEY ||
      'wazz_sk_X7MpeNiN6lEzf7RvNlpMusnBKHPBn023n6akw6zZ3R4';

    const endpointUrl =
      process.env.WHATSAPP_API_URL ||
      process.env.VITE_WHATSAPP_API_URL ||
      'https://waisend.com/api/external/send-message';

    const sessionName =
      process.env.WHATSAPP_SESSION_NAME ||
      process.env.VITE_WHATSAPP_SESSION_NAME ||
      sanitizeServerText(bodySessionName || 'test', 40) ||
      'test';

    let digits = String(rawRecipient).replace(/\D/g, '');
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }
    if (digits.startsWith('01') && digits.length === 11) {
      digits = '20' + digits.slice(1);
    } else if (digits.length === 10 && /^1[0125]/.test(digits)) {
      digits = '20' + digits;
    }

    if (digits.length < 10 || digits.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف غير صالح.',
      });
    }

    const e164Plus = `+${digits}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    try {
      const upstreamResponse = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          apikey: apiKey,
        },
        body: JSON.stringify({
          sessionName,
          session: sessionName,
          to: digits,
          phone: digits,
          recipient: e164Plus,
          number: digits,
          chatId: `${digits}@c.us`,
          message: finalMessage,
          text: finalMessage,
          body: finalMessage,
          content: finalMessage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await upstreamResponse.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { status: 'processed' };
      }

      if (upstreamResponse.ok && (!data || data.success !== false)) {
        return res.status(200).json({
          success: true,
          recipient: digits,
          sessionName,
          messageId: data?.messageId || data?.data?.id || undefined,
        });
      }
    } catch (primaryErr) {
      clearTimeout(timeoutId);
      console.error('[INTERNAL_SECURITY_LOG] Primary WhatsApp upstream notice:', primaryErr?.message || primaryErr);
    }

    // Server-side Backup Failover (Wapilot Cloud API) — keeps backup token strictly on the server
    const wapilotToken = process.env.WAPILOT_API_TOKEN || 'OxiCvTAE4NnJAb61AuHV5vBHSSzamrD9pIkCd761od';
    const wapilotInstance = process.env.WAPILOT_INSTANCE_ID || 'instance6023';
    try {
      const backupCtrl = new AbortController();
      const backupTimeout = setTimeout(() => backupCtrl.abort(), 5000);
      const backupRes = await fetch(`https://api.wapilot.net/api/v2/${wapilotInstance}/send-message`, {
        method: 'POST',
        headers: {
          token: wapilotToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          chat_id: `${digits}@c.us`,
          text: finalMessage,
        }),
        signal: backupCtrl.signal,
      });
      clearTimeout(backupTimeout);
      if (backupRes.ok) {
        const backupData = await backupRes.json().catch(() => ({}));
        if (backupData?.success) {
          return res.status(200).json({
            success: true,
            recipient: digits,
            messageId: backupData.message_id,
          });
        }
      }
    } catch {
      // ignore backup error
    }

    return res.status(502).json({
      success: false,
      error: 'تعذر تسليم الرسالة عبر مزود خدمة واتساب في الوقت الحالي.',
    });
  } catch (err) {
    console.error('[INTERNAL_SECURITY_LOG] /api/whatsapp Exception:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ داخلي أثناء معالجة طلب الإرسال، تم تسجيل الخطأ للمراجعة الفنية.',
    });
  }
}
