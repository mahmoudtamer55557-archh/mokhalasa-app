/**
 * =====================================================================
 * MOKHALASA AUTHENTICATION SERVICE & ADAPTER (ACTIVE SUPABASE INTEGRATION)
 * =====================================================================
 * 
 * Centralized, production-grade authentication adapter for Mokhalasa platform.
 * Directly integrates with Supabase Auth for secure email/password and OAuth flows.
 * 
 * SECURITY PRINCIPLES:
 * 1. Zero passwords stored in custom database tables, browser storage, or logs.
 * 2. Passwords encrypted natively by Supabase Auth (Argon2 / Bcrypt).
 * 3. Customer phone numbers stored securely in auth user metadata and profiles table.
 * 4. Zero fake accounts or mock authentication states.
 */

import { supabase } from './supabaseClient';
import { CustomerUser } from '../types';
import { 
  isValidEgyptianPhone, 
  normalizeEgyptianPhone, 
  getPhoneValidationError 
} from '../utils/phoneValidator';

export interface RegisterCredentials {
  email: string;
  phone: string;
  password: string;
  fullName?: string;
  governorate?: string;
  city?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  message: string;
  errorCode?: string;
  requiresEmailConfirmation?: boolean;
  data?: T;
  user?: CustomerUser;
}

/**
 * Maps a Supabase Auth User object to the application's CustomerUser model
 */
export function mapSupabaseUserToCustomerUser(supabaseUser: any): CustomerUser {
  const metadata = supabaseUser.user_metadata || {};
  const appMetadata = supabaseUser.app_metadata || {};

  const name = 
    metadata.full_name || 
    metadata.name || 
    (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'عميل مخلصة');

  const provider = appMetadata.provider === 'google' ? 'google' : 'email';
  const rawPhone = metadata.phone || '';
  const normalizedPhone = rawPhone ? normalizeEgyptianPhone(rawPhone) : '';

  // Separate "phone entered" state from "phone verified via OTP"
  const isVerified = Boolean(
    metadata.phone_verified || 
    supabaseUser.phone_confirmed_at
  );

  return {
    id: supabaseUser.id,
    name,
    email: supabaseUser.email || '',
    phone: normalizedPhone,
    avatarUrl: metadata.avatar_url,
    provider,
    isVerified,
    governorate: metadata.governorate,
    city: metadata.city,
    createdAt: supabaseUser.created_at || new Date().toISOString()
  };
}

export const authService = {
  /**
   * Real Email & Password Registration via Supabase Auth
   */
  async registerWithEmail(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { email, phone, password, fullName, governorate, city } = credentials;

    if (!email || !phone || !password) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'يرجى استكمال جميع الحقول المطلوبة للتسجيل.'
      };
    }

    // Validate phone number format strictly
    const phoneErr = getPhoneValidationError(phone);
    if (phoneErr) {
      return {
        success: false,
        errorCode: 'INVALID_PHONE',
        message: phoneErr
      };
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);
    const resolvedName = (fullName && fullName.trim()) || email.trim().split('@')[0];

    try {
      // 1. Sign up user via Supabase Auth with normalized phone in user_metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            phone: normalizedPhone,
            full_name: resolvedName,
            governorate: governorate || '',
            city: city || ''
          }
        }
      });

      if (error) {
        // Map Supabase error messages to clear, actionable Arabic messages
        let arabicMessage = error.message;

        if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          arabicMessage = 'هذا البريد الإلكتروني مسجل بالفعل لدينا. يرجى تسجيل الدخول أو استخدام بريد آخر.';
        } else if (error.message.includes('Password should be at least')) {
          arabicMessage = 'يجب ألا تقل كلمة المرور عن 8 أحرف وأرقام.';
        } else if (error.message.includes('invalid format') || error.message.includes('Unable to validate email')) {
          arabicMessage = 'صيغة البريد الإلكتروني غير صالحة. يرجى كتابة بريد إلكتروني صحيح.';
        } else if (error.message.includes('rate limit') || error.status === 429) {
          arabicMessage = 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. يرجى الانتظار دقيقة والمحاولة مجدداً.';
        }

        return {
          success: false,
          errorCode: error.code || 'SIGNUP_ERROR',
          message: arabicMessage
        };
      }

      if (!data.user) {
        return {
          success: false,
          errorCode: 'NO_USER_RETURNED',
          message: 'تعذر إنشاء الحساب في الوقت الحالي. يرجى المحاولة لاحقاً.'
        };
      }

      // 2. Check if Email Confirmation is required (data.session is null when email confirmation is active)
      const requiresConfirmation = !data.session;

      // 3. If session is immediately established, attempt to sync profile into public.profiles
      if (data.session && data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            phone: phone.trim(),
            full_name: resolvedName,
            governorate: governorate || null,
            city: city || null,
            updated_at: new Date().toISOString()
          });
        } catch (profileErr) {
          // If public.profiles table is not yet created, user metadata already holds the phone number securely
          console.warn('Profile sync notice:', profileErr);
        }
      }

      const customer = mapSupabaseUserToCustomerUser(data.user);

      if (requiresConfirmation) {
        return {
          success: true,
          requiresEmailConfirmation: true,
          message: `تم إنشاء حسابك بنجاح! تم إرسال رسالة تأكيد إلى بريدك الإلكتروني (${email}). يرجى مراجعة صندوق الوارد والضغط على رابط التأكيد لتفعيل حسابك.`,
          user: customer
        };
      }

      return {
        success: true,
        requiresEmailConfirmation: false,
        message: 'تم إنشاء حسابك بنجاح وتسجيل دخولك إلى مخلصة!',
        user: customer
      };

    } catch (err: any) {
      return {
        success: false,
        errorCode: 'UNEXPECTED_ERROR',
        message: err?.message || 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.'
      };
    }
  },

  /**
   * Real Email & Password Login via Supabase Auth
   */
  async loginWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        let arabicMessage = error.message;

        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_grant')) {
          arabicMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مجدداً.';
        } else if (error.message.includes('Email not confirmed')) {
          arabicMessage = 'لم يتم تأكيد بريدك الإلكتروني بعد. يرجى فتح الرسالة المرسلة إليك والضغط على رابط التأكيد.';
        } else if (error.message.includes('rate limit') || error.status === 429) {
          arabicMessage = 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. يرجى الانتظار قليلاً.';
        }

        return {
          success: false,
          errorCode: error.code || 'LOGIN_ERROR',
          message: arabicMessage
        };
      }

      if (!data.user) {
        return {
          success: false,
          errorCode: 'NO_USER',
          message: 'تعذر العثور على الحساب المطلوب.'
        };
      }

      const customer = mapSupabaseUserToCustomerUser(data.user);

      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح.',
        user: customer
      };

    } catch (err: any) {
      return {
        success: false,
        errorCode: 'UNEXPECTED_ERROR',
        message: err?.message || 'تعذر الاتصال بخادم المصادقة.'
      };
    }
  },

  /**
   * Google OAuth Trigger via Supabase Auth
   */
  async registerWithGoogle(): Promise<AuthResponse> {
    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        let arabicMessage = error.message;

        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          arabicMessage = 'خدمة تسجيل الدخول بـ Google غير مفعلة حالياً في لوحة تحكم Supabase. يتطلب ذلك تفعيل Google Provider وإدخال Client ID و Client Secret من Google Cloud Console.';
        }

        return {
          success: false,
          errorCode: 'GOOGLE_OAUTH_ERROR',
          message: arabicMessage
        };
      }

      // When OAuth initiates, browser redirects to Google
      return {
        success: true,
        message: 'جاري تحويلك إلى Google للمصادقة الآمنة...'
      };

    } catch {
      return {
        success: false,
        errorCode: 'UNEXPECTED_ERROR',
        message: 'خدمة تسجيل الدخول بـ Google غير مفعلة حالياً في مشروع Supabase. يتطلب ذلك إضافة Google Client ID و Client Secret في لوحة تحكم Supabase.'
      };
    }
  },

  /**
   * Get Current Active Session & User
   */
  async getCurrentSession(): Promise<{ user: CustomerUser | null; session: any }> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session && data.session.user) {
        return {
          user: mapSupabaseUserToCustomerUser(data.session.user),
          session: data.session
        };
      }
      return { user: null, session: null };
    } catch {
      return { user: null, session: null };
    }
  },

  /**
   * Update Phone for existing customer (e.g., following Google Sign-In)
   * Safely modifies current user record without duplicate account creation
   */
  async updateCustomerPhone(userId: string, rawPhone: string, fullName?: string, governorate?: string): Promise<AuthResponse> {
    const error = getPhoneValidationError(rawPhone);
    if (error) {
      return { success: false, message: error };
    }
    const normalized = normalizeEgyptianPhone(rawPhone);

    try {
      await supabase.auth.updateUser({
        data: {
          phone: normalized,
          ...(fullName ? { full_name: fullName.trim() } : {}),
          ...(governorate ? { governorate } : {})
        }
      });

      await supabase.from('profiles').upsert({
        id: userId,
        phone: normalized,
        ...(fullName ? { full_name: fullName.trim() } : {}),
        ...(governorate ? { governorate } : {}),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      return {
        success: true,
        message: 'تم حفظ وتحديث رقم الهاتف بنجاح!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'تعذر تحديث رقم الهاتف.'
      };
    }
  },

  /**
   * Sign Out Customer from Supabase Auth
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }
};

export default authService;
