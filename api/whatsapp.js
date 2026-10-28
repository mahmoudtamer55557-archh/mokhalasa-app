/**
 * Vercel Serverless Function: Server-side proxy for wAIsend WhatsApp API (https://waisend.com/api/external)
 * Prevents browser CORS blocks and executes WhatsApp API calls server-side.
 */
const DEFAULT_WAISEND_API_KEY = 'wazz_sk_X7MpeNiN6lEzf7RvNlpMusnBKHPBn023n6akw6zZ3R4';
const REVOKED_KEYS = new Set(['wazz_sk_QaG6JA2B84ZfqhSAddXHoo6d7iW6Mq7QahXPYG7IXN0']);

function normalizeInternationalEgyptianPhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health & Sessions check via GET /api/whatsapp
  if (req.method === 'GET') {
    try {
      const apiKey = process.env.VITE_WAZZAPI_API_KEY || DEFAULT_WAISEND_API_KEY;
      const sessRes = await fetch('https://waisend.com/api/external/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      const sessData = await sessRes.json().catch(() => ({}));
      return res.status(sessRes.status || 200).json({
        success: sessRes.ok,
        provider: 'waisend',
        ...sessData
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to check wAIsend sessions'
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { phone, text, message, apiKey: bodyKey } = req.body || {};
    const msgText = text || message;

    let apiKey = (bodyKey && !REVOKED_KEYS.has(bodyKey.trim()))
      ? bodyKey.trim()
      : (process.env.VITE_WAZZAPI_API_KEY || DEFAULT_WAISEND_API_KEY);

    if (REVOKED_KEYS.has(apiKey)) {
      apiKey = DEFAULT_WAISEND_API_KEY;
    }

    const intlPhone = normalizeInternationalEgyptianPhone(phone);
    if (!intlPhone || !msgText) {
      return res.status(400).json({ success: false, error: 'Missing valid phone or message text' });
    }

    const payload = {
      phone: intlPhone,
      message: msgText,
      typing: false
    };

    let sendRes = await fetch('https://waisend.com/api/external/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Fallback to default active key if custom key returned 401
    if (sendRes.status === 401 && apiKey !== DEFAULT_WAISEND_API_KEY) {
      apiKey = DEFAULT_WAISEND_API_KEY;
      sendRes = await fetch('https://waisend.com/api/external/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    const data = await sendRes.json().catch(() => ({}));

    if (sendRes.ok && (data?.success || data?.messageId || data?.data?.id)) {
      return res.status(200).json({
        success: true,
        messageId: data.messageId || data?.data?.id || String(Date.now()),
        timestamp: data.timestamp || data?.data?.timestamp,
        provider: 'waisend'
      });
    }

    return res.status(sendRes.status || 400).json({
      success: false,
      error: data?.error || data?.message || 'wAIsend API request failed',
      details: data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal proxy error'
    });
  }
}
