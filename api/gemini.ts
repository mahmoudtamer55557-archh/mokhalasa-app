/**
 * =====================================================================
 * MOKHALASA — SECURE SERVER-SIDE GEMINI API GATEWAY
 * =====================================================================
 * Runs exclusively in serverless Node.js runtime (Vercel / Backend).
 * NEVER exposes GEMINI_API_KEY to browser clients or git repos.
 * 
 * Supports:
 * 1. generate_car_description — strict factual Egyptian Arabic car ad drafter
 * 2. customer_support — grounded platform AI assistant
 * 3. admin_summary — executive anonymized pipeline summarizer
 */

export default async function handler(req: any, res: any) {
  // Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are permitted.'
    });
  }

  // Safe secret retrieval from backend environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return res.status(200).json({
      success: false,
      error: 'GEMINI_API_KEY_NOT_CONFIGURED',
      message: 'مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مضاف في إعدادات البيئة (Environment Variables). يرجى إضافته في لوحة تحكم الاستضافة لتفعيل الميزة.'
    });
  }

  try {
    const { task, payload } = req.body || {};

    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TASK',
        message: 'Task identifier is required.'
      });
    }

    if (task === 'list_models') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const d = await r.json();
      return res.status(200).json({ success: true, models: d });
    }

    let systemInstruction = '';
    let userPrompt = '';

    if (task === 'generate_car_description') {
      const {
        make, model, year, trim, mileage,
        paintCondition, disclosedDefects, askingPrice, trafficUnit
      } = payload || {};

      systemInstruction = `أنت خبير محترف في كتابة إعلانات السيارات لمنصة "مخلصة" (Mokhalasa) المصرية.
مهمتك: كتابة وصف إعلاني جذاب وواقعي بالعامية المصرية الراقية والمهذبة للسيارة بناءً حصرياً على البيانات المقدمة من البائع.
قواعد صارمة جداً:
1. لا تخترع مواصفات غير مذكورة إطلاقاً.
2. لا تدّعِ وجود سجل صيانة بالتوكيل أو فواتير صيانة أو كتالوجات ما لم يذكرها البائع.
3. لا تختلق أرقام مديونيات أو بيانات بنكية أو أسعاراً لم تذكر.
4. اذكر العيوب أو الملاحظات التي ذكرها البائع بأمانة وشفافية لتعزيز الثقة.
5. اجعل النص في فقرتين مركزتين سهلة القراءة وموجهة للمشتري الجاد.
6. اختم بدعوة للمعاينة والفحص الفني المعتمد والتسوية البنكية الآمنة عبر منصة مخلصة.`;

      userPrompt = `بيانات السيارة المدخلة من البائع:
- الماركة والموديل: ${make || 'غير محدد'} ${model || ''}
- سنة الصنع: ${year || 'غير محدد'}
- الفئة / التجهيز: ${trim || 'الفئة القياسية'}
- قراءة العداد: ${mileage ? Number(mileage).toLocaleString('en-US') + ' كم' : 'غير محدد'}
- حالة الدهان والهيكل: ${paintCondition || 'فابريكا'}
- العيوب والملاحظات المعلنة: ${disclosedDefects && disclosedDefects.length > 0 ? disclosedDefects.join('، ') : 'لا توجد ملاحظات أو حوادث معلنة'}
- السعر المطلوب: ${askingPrice ? Number(askingPrice).toLocaleString('en-US') + ' ج.م' : 'غير محدد'}
- وحدة المرور: ${trafficUnit || 'مرور مرخص'}

اكتب وصف الإعلان بناءً على هذه البيانات فقط.`;

    } else if (task === 'customer_support') {
      const { userQuestion, chatHistory } = payload || {};

      systemInstruction = `أنت المساعد الذكي الرسمي لمنصة "مخلصة" (Mokhalasa) المتخصصة في سوق وتداول سيارات التقسيط والقروض البنكية في مصر.
قاعدة المعرفة الأساسية للمنصة:
1. ما هي مخلصة؟ أول منصة مصرية متخصصة ومحمية قانونياً لبيع وشراء السيارات المتعثرة أو الممولة بنكياً، بتسوية بنكية مباشرة وفك حظر قانوني معتمد دون توكيلات مجهولة أو ثغرات نصب.
2. خطوات البائع: التسجيل برقم هاتف مصري معتمد -> إدخال بيانات السيارة والتمويل (البنك، القسط، أصل المديونية) -> رفع صور الرخصة وبيان السداد المعجل -> مراجعة الإدارة خلال 24 ساعة -> النشر في المعرض وتلقي العروض الرسمية.
3. خطوات المشتري: تصفح السيارات المفحوصة -> تقديم عرض سعر أو قبول السعر المعلن -> مخلصة ترتب اتفاقاً ثلاثياً مباشراً داخل البنك لإيداع المتبقي رسمياً واستلام مخالصة فورية ونقل القيد بالمرور.
4. أمان المستندات: رخص السيارات والبطاقات مشفرة ومحجوبة تماماً عن الزوار، وتقتصر على مسؤولي فحص الأوراق بالإدارة.

قواعد الإجابة:
- أجب بأسلوب ودود وموجز ومباشر باللغة العربية.
- لا تخترع أي مصاريف إدارية أو مدد زمنية أو نسب فوائد أو إجراءات بنكية غير محددة لبنك بعينه.
- إذا كان السؤال خارج إطار المنصة أو يتطلب قراراً إدارياً خاصاً، قل بلطف: "يرجى التواصل مباشرة مع مستشاري مخلصة عبر واتساب أو الاتصال الهاتفي لخدمتك بدقة".
- لا تطلع على أي بيانات خاصة أو أرقام مستخدمين ولا تذكر أي أسرار.`;

      userPrompt = `سؤال العميل: "${userQuestion || ''}"`;
      if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
        userPrompt = `سياق المحادثة السابقة:\n${chatHistory.map((m: any) => `${m.role === 'user' ? 'العميل' : 'مساعد مخلصة'}: ${m.text}`).join('\n')}\n\nسؤال العميل الجديد: "${userQuestion}"`;
      }

    } else if (task === 'admin_summary') {
      const {
        pendingListingsCount,
        publishedCount,
        openOffersCount,
        needsChangesCount,
        recentActivity
      } = payload || {};

      systemInstruction = `أنت مستشار التحليل التشغيلي الاستراتيجي لمنصة "مخلصة".
مهمتك: تقديم ملخص إداري تنفيذي سريع ومرتب للأولويات التشغيلية اليومية بناءً على الأرقام المقدمة فقط.
بدون أي بيانات شخصية أو أرقام هواتف.
قدم الإجابة في 3 نقاط محددة:
1. ملخص لحالة التدفق (Funnel Health)
2. الإجراءات الأكثر إلحاحاً اليوم (Top Operational Actions)
3. نصيحة عملية لتحسين سرعة إنهاء الصفقات وتسوية المديونيات.`;

      userPrompt = `الأرقام التشغيلية الحالية:
- إعلانات بانتظار المراجعة والاعتماد: ${pendingListingsCount || 0}
- إعلانات منشورة نشطة بالمعرض: ${publishedCount || 0}
- عروض شراء وتفاوض جارية بانتظار الإجراء: ${openOffersCount || 0}
- إعلانات تتطلب تعديل من البائعين: ${needsChangesCount || 0}
- ملخص الأنشطة الحديثة: ${recentActivity || 'لا توجد أنشطة إضافية'}`;

    } else {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TASK',
        message: `Task ${task} is not supported.`
      });
    }

    // Call Google Gemini API (gemini-1.5-flash with gemini-2.0-flash / gemini-1.5-pro fallback)
    const callGeminiModel = async (modelName: string) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800
          }
        })
      });
      return response;
    };

    // Supported models optimized for low latency and high quality
    const candidateModels = [
      'gemini-2.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    let geminiRes: any = null;
    let lastErrBody = '';
    let lastStatus = 200;

    for (const model of candidateModels) {
      try {
        const res = await callGeminiModel(model);
        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          lastErrBody = await res.text();
          lastStatus = res.status;
        }
      } catch (e: any) {
        lastErrBody = e?.message || 'Network error';
      }
    }

    if (!geminiRes.ok) {
      lastErrBody = await geminiRes.text();
      lastStatus = geminiRes.status;
      console.error('Gemini API Error:', lastStatus, lastErrBody);

      let friendlyMsg = 'حدث خطأ أثناء التواصل مع خادم الذكاء الاصطناعي.';
      try {
        const parsed = JSON.parse(lastErrBody);
        if (parsed?.error?.message) {
          friendlyMsg = parsed.error.message;
        }
      } catch {}

      return res.status(200).json({
        success: false,
        error: 'GEMINI_UPSTREAM_ERROR',
        upstreamStatus: lastStatus,
        upstreamDetails: lastErrBody,
        message: friendlyMsg
      });
    }

    const data = await geminiRes.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(200).json({
        success: false,
        error: 'EMPTY_RESPONSE',
        message: 'لم يتمكن الذكاء الاصطناعي من توليد نص مناسب للمدخلات الحالية.'
      });
    }

    return res.status(200).json({
      success: true,
      result: candidateText.trim()
    });

  } catch (error: any) {
    console.error('Serverless Gemini Handler Exception:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error?.message || 'حدث خطأ غير متوقع بالخادم.'
    });
  }
}
