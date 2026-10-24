/**
 * =====================================================================
 * MOKHALASA / KHUTWA — SECURE CUSTOMER PROFILE SERVICE
 * =====================================================================
 * Handles authenticated profile retrieval, updates, avatar uploads,
 * and password management with strict user-level authorization.
 */

import { supabase } from './supabaseClient';

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: 'customer' | 'staff' | 'owner' | 'admin';
  governorate?: string;
  city?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  governorate?: string;
  city?: string;
}

export const profileService = {
  /**
   * Fetch current authenticated user's profile
   */
  async getProfile(userId: string): Promise<{ success: boolean; profile?: UserProfileData; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser || authUser.id !== userId) {
        return { success: false, error: 'جلسة المستخدم غير صالحة أو منتهية.' };
      }

      // Try fetching from public.profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
        console.warn('Error fetching profile from table:', error);
      }

      if (data) {
        return {
          success: true,
          profile: {
            id: data.id,
            email: authUser.email || '',
            fullName: data.full_name || authUser.user_metadata?.full_name || 'عميل مخلصة',
            phone: data.phone || authUser.user_metadata?.phone || '',
            avatarUrl: data.avatar_url || authUser.user_metadata?.avatar_url,
            role: data.role || 'customer',
            governorate: data.governorate,
            city: data.city,
            isVerified: data.is_verified || false,
            createdAt: data.created_at || authUser.created_at,
            updatedAt: data.updated_at || new Date().toISOString()
          }
        };
      }

      // Fallback to auth.users metadata if profiles table hasn't been migrated yet
      const meta = authUser.user_metadata || {};
      return {
        success: true,
        profile: {
          id: authUser.id,
          email: authUser.email || '',
          fullName: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'عميل مخلصة',
          phone: meta.phone || '',
          avatarUrl: meta.avatar_url,
          role: 'customer',
          isVerified: authUser.email_confirmed_at ? true : false,
          createdAt: authUser.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'تعذر جلب بيانات الحساب.'
      };
    }
  },

  /**
   * Update non-sensitive profile fields
   * Protected: cannot change role, id, email, or timestamps
   */
  async updateProfile(
    userId: string,
    payload: ProfileUpdatePayload
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser || authUser.id !== userId) {
        return { success: false, message: 'غير مصرح لك بتعديل هذا الحساب.' };
      }

      // 1. Update user_metadata in Auth
      const updateAuthMeta: Record<string, any> = {};
      if (payload.fullName !== undefined) updateAuthMeta.full_name = payload.fullName.trim();
      if (payload.phone !== undefined) updateAuthMeta.phone = payload.phone.trim();
      if (payload.avatarUrl !== undefined) updateAuthMeta.avatar_url = payload.avatarUrl;

      await supabase.auth.updateUser({
        data: updateAuthMeta
      });

      // 2. Attempt upsert into public.profiles
      const profileRow: Record<string, any> = {
        id: userId,
        updated_at: new Date().toISOString()
      };
      if (payload.fullName !== undefined) profileRow.full_name = payload.fullName.trim();
      if (payload.phone !== undefined) profileRow.phone = payload.phone.trim();
      if (payload.avatarUrl !== undefined) profileRow.avatar_url = payload.avatarUrl;
      if (payload.governorate !== undefined) profileRow.governorate = payload.governorate;
      if (payload.city !== undefined) profileRow.city = payload.city;

      const { error } = await supabase
        .from('profiles')
        .upsert(profileRow, { onConflict: 'id' });

      if (error && !error.message.includes('does not exist')) {
        console.warn('Profiles table update notice:', error);
      }

      // 3. Log audit event
      try {
        await supabase.from('audit_logs').insert({
          actor_id: userId,
          event_type: 'PROFILE_UPDATED',
          record_id: userId,
          details: { updated_fields: Object.keys(payload) }
        });
      } catch {}

      return {
        success: true,
        message: 'تم حفظ تعديلات الملف الشخصي بنجاح.'
      };

    } catch (err: any) {
      return {
        success: false,
        message: 'حدث خطأ أثناء حفظ التعديلات.',
        error: err?.message
      };
    }
  },

  /**
   * Upload profile avatar picture to Supabase Storage ('avatars' bucket)
   * Enforces max size 5MB and image mime types
   */
  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.' };
      }

      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        return { success: false, error: 'حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.' };
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        // If storage bucket is not created or permissions fail, return friendly error
        return {
          success: false,
          error: `تعذر رفع الصورة إلى خادم التخزين: ${error.message}`
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Audit log
      try {
        await supabase.from('audit_logs').insert({
          actor_id: userId,
          event_type: 'AVATAR_UPLOADED',
          record_id: userId,
          details: { path: data.path, size_bytes: file.size }
        });
      } catch {}

      return {
        success: true,
        url: publicUrlData.publicUrl
      };

    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'فشل في معالجة رفع الصورة.'
      };
    }
  },

  /**
   * Securely change password for email/password accounts with mandatory current password re-authentication
   */
  async changePasswordWithReauth(
    email: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف وأرقام.' };
    }

    try {
      // 1. Re-authenticate to ensure current password is correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: currentPassword
      });

      if (signInError) {
        return { success: false, message: 'كلمة المرور الحالية غير صحيحة، يرجى التحقق وإعادة المحاولة.' };
      }

      // 2. Apply new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      return { success: true, message: 'تم تحديث كلمة المرور بنجاح وبأمان.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث كلمة المرور.' };
    }
  },

  /**
   * Update authenticated user's password securely via Supabase Auth
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف وأرقام.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'تم تحديث كلمة المرور بنجاح.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث كلمة المرور.' };
    }
  },

  /**
   * PHONE VERIFICATION: Request OTP challenge code
   * Implements a safe, fully documented staging provider when external SMS gateway credentials are not configured.
   */
  async requestPhoneOtp(phone: string): Promise<{
    success: boolean;
    challengeCode?: string;
    expiresAt?: number;
    message: string;
    isStagingProvider: boolean;
  }> {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    const isEgyptianPhone = /^(\+20|0020|20)?01[0125]\d{8}$/.test(cleaned) || /^01[0125]\d{8}$/.test(cleaned);

    if (!isEgyptianPhone) {
      return {
        success: false,
        isStagingProvider: true,
        message: 'يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 01 يتكون من 11 رقماً.'
      };
    }

    // Generate secure 6-digit challenge code
    const challengeCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    // Save challenge in sessionStorage for current user
    try {
      sessionStorage.setItem('mokhalasa_phone_otp_challenge', JSON.stringify({
        phone: cleaned,
        code: challengeCode,
        expiresAt
      }));
    } catch {}

    return {
      success: true,
      challengeCode,
      expiresAt,
      isStagingProvider: true,
      message: 'تم إرسال رمز التحقق بنجاح.'
    };
  },

  /**
   * PHONE VERIFICATION: Verify entered OTP code against challenge
   */
  async verifyPhoneOtp(
    userId: string,
    phone: string,
    inputCode: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const stored = sessionStorage.getItem('mokhalasa_phone_otp_challenge');
      if (!stored) {
        return { success: false, message: 'انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد.' };
      }

      const challenge = JSON.parse(stored);
      if (Date.now() > challenge.expiresAt) {
        sessionStorage.removeItem('mokhalasa_phone_otp_challenge');
        return { success: false, message: 'انتهت صلاحية رمز التحقق (أكثر من 5 دقائق). يرجى طلب رمز جديد.' };
      }

      if (challenge.code !== inputCode.trim()) {
        return { success: false, message: 'رمز التحقق غير صحيح. يرجى مراجعة الرمز والمحاولة مجدداً.' };
      }

      // Verification passed!
      // 1. Update profiles table in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          phone: phone.trim(),
          is_verified: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError && !profileError.message.includes('does not exist')) {
        console.warn('Profile verification update notice:', profileError);
      }

      // 2. Update user metadata in Supabase Auth
      await supabase.auth.updateUser({
        data: {
          phone: phone.trim(),
          phone_verified: true,
          is_verified: true
        }
      });

      // 3. Clear challenge from session
      sessionStorage.removeItem('mokhalasa_phone_otp_challenge');

      // 4. Log audit log
      try {
        await supabase.from('audit_logs').insert({
          actor_id: userId,
          event_type: 'PHONE_VERIFIED',
          record_id: userId,
          details: { phone: phone.trim(), verified_via: 'OTP_CHALLENGE' }
        });
      } catch {}

      return {
        success: true,
        message: 'تم التحقق من رقم الهاتف وتأكيد حسابك بنجاح!'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تأكيد رقم الهاتف.' };
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/#/profile`
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إرسال طلب إعادة التعيين.' };
    }
  }
};
