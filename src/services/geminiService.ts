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

      if (response.ok) {
        const data = await response.json();
        return data;
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

    // 3. Graceful offline/local development response when API key is not yet configured
    return {
      success: false,
      error: 'GEMINI_NOT_CONFIGURED',
      message: 'مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مهيأ حالياً في الخادم. يرجى إضافته في إعدادات البيئة بالاستضافة (Vercel Environment Variables).'
    };
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
