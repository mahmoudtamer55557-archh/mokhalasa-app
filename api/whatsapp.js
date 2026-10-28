/**
 * Vercel Serverless Function: Server-side proxy for WazzAPI WhatsApp messages
 * Prevents browser CORS blocks and keeps API key execution server-side.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { phone, text, apiKey: bodyKey, deviceId: bodyDeviceId } = req.body || {};
    const apiKey = bodyKey || process.env.VITE_WAZZAPI_API_KEY || 'wazz_sk_X7MpeNiN6lEzf7RvNlpMusnBKHPBn023n6akw6zZ3R4';

    if (!phone || !text) {
      return res.status(400).json({ success: false, error: 'Missing phone or text' });
    }

    let resolvedDeviceId = bodyDeviceId || process.env.VITE_WAZZAPI_DEVICE_ID || '';

    // 1. Auto-resolve connected device ID from WazzAPI if not explicitly provided
    if (!resolvedDeviceId) {
      try {
        const devRes = await fetch('https://api.wazzapi.com/api/v1/devices', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        if (devRes.ok) {
          const devData = await devRes.json();
          const devices = devData?.devices || (Array.isArray(devData) ? devData : []);
          const active =
            devices.find(d => d.status === 'connected' && d.is_primary) ||
            devices.find(d => d.status === 'connected') ||
            devices[0];
          if (active?.id) {
            resolvedDeviceId = active.id;
          }
        }
      } catch {}
    }

    // 2. Send via WazzAPI
    const payload = {
      phone_number: phone.startsWith('+') ? phone : `+${phone}`,
      content: text,
      message_type: 'text',
      ...(resolvedDeviceId ? { whatsapp_account_id: resolvedDeviceId } : {})
    };

    const sendRes = await fetch('https://api.wazzapi.com/api/v1/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (sendRes.ok) {
      const data = await sendRes.json();
      if (data?.success || data?.message_id || data?.id) {
        return res.status(200).json({
          success: true,
          messageId: data.message_id || data.id,
          deviceId: resolvedDeviceId,
          provider: 'wazzapi'
        });
      }
    }

    const errText = await sendRes.text();
    return res.status(sendRes.status || 400).json({
      success: false,
      error: errText || 'WazzAPI request failed'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal proxy error'
    });
  }
}
