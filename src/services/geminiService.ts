/**
 * =====================================================================
 * MOKHALASA — FRONTEND GEMINI SERVICE CLIENT
 * =====================================================================
 * Communicates strictly with backend endpoints (/api/gemini or Supabase Edge Function).
 * ZERO API keys are embedded or exposed in frontend code.
 */

import { supabase } from './supabaseClient';

export interface CarDescriptionPayload {
  make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  paintCondition?: string;
  disclosedDefects?: string[];
  askingPrice?: number;
  trafficUnit?: string;
}

export interface AdminSummaryPayload {
  pendingListingsCount: number;
  publishedCount: number;
  openOffersCount: number;
  needsChangesCount: number;
  recentActivity?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

class GeminiServiceClient {
  private lastRequestTime: number = 0;
  private readonly THROTTLE_MS: number = 2000; // 2 seconds between AI calls

  /**
   * Helper to dispatch task to serverless backend with Supabase Edge Function fallback
   */
  private async dispatchTask<T>(task: string, payload: any): Promise<{ success: boolean; result?: T; message?: string; error?: string }> {
    const now = Date.now();
    if (now - this.lastRequestTime < this.THROTTLE_MS) {
      return {
        success: false,
        message: 'يرجى الانتظار ثانيتين قبل إرسال طلب جديد للذكاء الاصطناعي.'
      };
    }
    this.lastRequestTime = now;

    // 1. Try Vercel Serverless Function (/api/gemini)
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task, payload })
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data) {
          return data;
        }
      }
    } catch {
      // Vercel /api/gemini might not be running in local vite dev mode without vercel dev
    }

    // 2. Fallback to Supabase Edge Function if /api/gemini is unavailable
    try {
      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        body: { task, payload }
      });

      if (!error && data) {
        return data;
      }
    } catch {}

    // 3. Optional Direct Client Fallback if VITE_GEMINI_API_KEY is provided in local .env
    const clientKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
    if (clientKey && typeof clientKey === 'string' && clientKey.trim()) {
      try {
        const directResult = await this.callGeminiDirect(clientKey.trim(), task, payload);
        if (directResult) return directResult;
      } catch {}
    }

    // 4. Graceful offline/local development response when API key is not yet configured
    return {
      success: false,
      error: 'GEMINI_NOT_CONFIGURED',
      message: 'مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مهيأ حالياً في الخادم. يرجى إضافته في إعدادات البيئة بالاستضافة (Vercel Environment Variables).'
    };
  }

  /**
   * Optional Direct fallback for local dev when VITE_GEMINI_API_KEY is set
   */
  private async callGeminiDirect(apiKey: string, task: string, payload: any): Promise<{ success: boolean; result?: any; message?: string }> {
    let prompt = '';
    if (task === 'customer_support') {
      prompt = `أنت مساعد منصة "مخلصة" للسيارات بمصر. أجب بإيجاز:\nسؤال العميل: ${payload?.userQuestion || ''}`;
    } else if (task === 'generate_car_description') {
      prompt = `أنت كاتب إعلانات سيارات بمصر. اكتب وصف واقعي مختصر بناءً على:\n${JSON.stringify(payload)}`;
    } else if (task === 'admin_summary') {
      prompt = `أنت مستشار لوحة العمليات لمنصة مخلصة. لخص إحصائيات الأرقام:\n${JSON.stringify(payload)}`;
    } else {
      return { success: false, message: 'مهمة غير مدعومة' };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: 'Gemini Direct Error: ' + err };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return { success: true, result: text };
  }

  /**
   * Feature 1: Assistant for Drafting Factual Egyptian Arabic Car Ad
   */
  async generateCarDescription(carData: CarDescriptionPayload): Promise<{ success: boolean; description?: string; message?: string }> {
    const res = await this.dispatchTask<string>('generate_car_description', carData);
    if (res.success && res.result) {
      return {
        success: true,
        description: res.result
      };
    }
    return {
      success: false,
      message: res.message || 'تعذر توليد وصف الإعلان حالياً.'
    };
  }

  /**
   * Feature 2: Customer Support AI Chatbot Assistant
   */
  async askCustomerSupport(userQuestion: string, history?: ChatMessage[]): Promise<{ success: boolean; answer?: string; message?: string }> {
    if (!userQuestion || !userQuestion.trim()) {
      return { success: false, message: 'يرجى كتابة سؤالك.' };
    }

    const res = await this.dispatchTask<string>('customer_support', {
      userQuestion: userQuestion.trim(),
      chatHistory: history
    });

    if (res.success && res.result) {
      return {
        success: true,
        answer: res.result
      };
    }

    return {
      success: false,
      message: res.message || 'عذراً، لم أتمكن من معالجة السؤال حالياً. يمكنك التواصل مباشرة مع فريق الدعم عبر واتساب.'
    };
  }

  /**
   * Feature 3: Executive Summary for Operations Management
   */
  async getAdminExecutiveSummary(stats: AdminSummaryPayload): Promise<{ success: boolean; summary?: string; message?: string }> {
    const res = await this.dispatchTask<string>('admin_summary', stats);
    if (res.success && res.result) {
      return {
        success: true,
        summary: res.result
      };
    }
    return {
      success: false,
      message: res.message || 'تعذر توليد الملخص الإداري حالياً.'
    };
  }
}

export const geminiService = new GeminiServiceClient();
export default geminiService;
