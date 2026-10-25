/**
 * =====================================================================
 * SUPABASE EDGE FUNCTION — GEMINI ASSISTANT GATEWAY
 * =====================================================================
 * Deploy with: supabase functions deploy gemini-assistant
 * Set secret with: supabase secrets set GEMINI_API_KEY=your_key_here
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GEMINI_API_KEY_NOT_CONFIGURED',
        message: 'مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مضاف في إعدادات Supabase Secrets.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const { task, payload } = await req.json();

    let systemInstruction = '';
    let userPrompt = '';

    if (task === 'generate_car_description') {
      const { make, model, year, trim, mileage, paintCondition, disclosedDefects, askingPrice, trafficUnit } = payload || {};
      systemInstruction = `أنت خبير محترف في إعلانات السيارات لمنصة مخلصة المصرية. اكتب وصفاً واقعياً بالعامية المصرية الراقية بناءً على البيانات المقدمة فقط. لا تخترع مواصفات أو سجلات صيانة لم تذكر.`;
      userPrompt = `السيارة: ${make} ${model} ${year} ${trim || ''} - عداد: ${mileage} كم - دهان: ${paintCondition} - عيوب: ${disclosedDefects?.join('، ') || 'لا يوجد'} - سعر: ${askingPrice} - مرور: ${trafficUnit}`;
    } else if (task === 'customer_support') {
      const { userQuestion } = payload || {};
      systemInstruction = `أنت المساعد الذكي لمنصة مخلصة المصرية المتخصصة في سيارات التقسيط والتسوية البنكية المباشرة. أجب بمعلومات المنصة المؤكدة فقط ولا تخترع أرقام فوائد أو رسوم.`;
      userPrompt = userQuestion || '';
    } else if (task === 'admin_summary') {
      const { pendingListingsCount, openOffersCount } = payload || {};
      systemInstruction = `أنت مستشار تشغيلي لمنصة مخلصة. لخص الأولويات التشغيلية في 3 نقاط محددة.`;
      userPrompt = `إعلانات معلقة: ${pendingListingsCount} - عروض جارية: ${openOffersCount}`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
      })
    });

    if (!response.ok) {
      throw new Error(`Upstream Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
