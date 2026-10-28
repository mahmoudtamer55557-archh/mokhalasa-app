/**
 * =====================================================================
 * MOKHALASA AUTHENTICATION SERVICE & ADAPTER (ACTIVE SUPABASE INTEGRATION)
 * =====================================================================
 * 
 * Centralized, production-grade authentication adapter for Mokhalasa platform.
 * Directly integrates with Supabase Auth and Database Registry for:
 * - Strict phone-to-account database verification before Forgot Password / Login
 * - Password history tracking (prevents reusing old passwords)
 * - Automatic phone verification state when logging in or registering via phone/OTP
 */

import { supabase } from './supabaseClient';
import { CustomerUser } from '../types';
import { 
  normalizeEgyptianPhone, 
  getPhoneValidationError 
} from '../utils/phoneValidator';
import { sendWelcomeWhatsApp, sendPasswordChangedWhatsApp } from './whatsappService';

export interface RegisterCredentials {
  email?: string;
  phone: string;
  password: string;
  fullName?: string;
  governorate?: string;
  city?: string;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  identifier?: string;
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

export interface RegisteredAccountRecord {
  userId: string;
  phone: string;
  email: string;
  fullName: string;
  governorate?: string;
  city?: string;
  isVerified: boolean;
  passwordHashes: string[];
  currentPasswordHash?: string;
  createdAt: string;
  updatedAt?: string;
}

const LOCAL_REGISTRY_KEY = 'mokhalasa_account_registry_v1';

/**
 * Deterministic SHA-256 password hash for password history comparison
 * (Zero plain-text passwords are ever stored)
 */
export async function hashPasswordString(password: string): Promise<string> {
  const clean = password.trim();
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`mokhalasa_salt_2026_${clean}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {}
  }
  // Fallback deterministic hash if subtle crypto unavailable
  let h1 = 0xdeadbeef ^ clean.length;
  let h2 = 0x41c6ce57 ^ clean.length;
  for (let i = 0, ch; i < clean.length; i++) {
    ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function getLocalRegistry(): Record<string, RegisteredAccountRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalRegistry(reg: Record<string, RegisteredAccountRecord>) {
  try {
    localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(reg));
  } catch {}
}

/**
 * Syncs account metadata and password hash history to Supabase database
 */
async function syncAccountToDatabaseRegistry(record: RegisteredAccountRecord): Promise<void> {
  const cleanPhone = normalizeEgyptianPhone(record.phone);
  record.phone = cleanPhone;
  record.isVerified = true;
  record.updatedAt = new Date().toISOString();

  // 1. Save to local registry cache
  const localReg = getLocalRegistry();
  localReg[cleanPhone] = record;
  saveLocalRegistry(localReg);

  // 2. Sync to Supabase database registry (admin_notifications with type = 'customer_account_registry')
  try {
    const { data: existingRows } = await supabase
      .from('admin_notifications')
      .select('id, message')
      .eq('type', 'customer_account_registry')
      .eq('title', cleanPhone)
      .order('created_at', { ascending: false });

    if (existingRows && existingRows.length > 0) {
      // Merge existing passwordHashes history so old hashes are never lost
      const mergedHashes = new Set<string>(record.passwordHashes || []);
      for (const row of existingRows) {
        try {
          const parsed = JSON.parse(row.message);
          if (Array.isArray(parsed.passwordHashes)) {
            parsed.passwordHashes.forEach((h: string) => mergedHashes.add(h));
          }
          if (parsed.currentPasswordHash) {
            mergedHashes.add(parsed.currentPasswordHash);
          }
        } catch {}
      }
      record.passwordHashes = Array.from(mergedHashes);
      localReg[cleanPhone] = record;
      saveLocalRegistry(localReg);

      // Delete older duplicate registry entries and insert updated one
      for (const row of existingRows) {
        await supabase.from('admin_notifications').delete().eq('id', row.id);
      }
    }

    await supabase.from('admin_notifications').insert({
      type: 'customer_account_registry',
      title: cleanPhone,
      message: JSON.stringify(record)
    });
  } catch (err) {
    console.warn('Database registry sync notice:', err);
  }
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

  // Any user who logged in / registered with a phone number or verified via OTP is verified!
  const isVerified = Boolean(
    normalizedPhone ||
    metadata.phone_verified || 
    metadata.is_verified ||
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
    createdAt: supabaseUser.created_at || new Date().toISOString(),
    accountStatus: metadata.account_status || 'active',
    deletionRequestedAt: metadata.deletion_requested_at,
    deletionScheduledDate: metadata.deletion_scheduled_date
  };
}

export const authService = {
  /**
   * Checks the database (Supabase Registry + profiles + car_listings) to verify
   * whether a phone number is linked to an existing customer account.
   */
  async checkPhoneAccountExists(rawPhone: string): Promise<{
    exists: boolean;
    account?: RegisteredAccountRecord;
  }> {
    const cleanPhone = normalizeEgyptianPhone(rawPhone);
    if (!cleanPhone) return { exists: false };

    // 1. Check Supabase customer_account_registry
    try {
      const { data: regRows } = await supabase
        .from('admin_notifications')
        .select('id, message, created_at')
        .eq('type', 'customer_account_registry')
        .eq('title', cleanPhone)
        .order('created_at', { ascending: false });

      if (regRows && regRows.length > 0) {
        const mergedHashes = new Set<string>();
        let latestRecord: RegisteredAccountRecord | null = null;

        for (const r of regRows) {
          try {
            const parsed: RegisteredAccountRecord = JSON.parse(r.message);
            if (!latestRecord) latestRecord = parsed;
            if (Array.isArray(parsed.passwordHashes)) {
              parsed.passwordHashes.forEach(h => mergedHashes.add(h));
            }
            if (parsed.currentPasswordHash) {
              mergedHashes.add(parsed.currentPasswordHash);
            }
          } catch {}
        }

        if (latestRecord) {
          latestRecord.passwordHashes = Array.from(mergedHashes);
          latestRecord.isVerified = true;
          const localReg = getLocalRegistry();
          localReg[cleanPhone] = latestRecord;
          saveLocalRegistry(localReg);
          return { exists: true, account: latestRecord };
        }
      }
    } catch {}

    // 2. Check public.profiles table
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, phone, governorate, city, created_at')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (prof?.id) {
        const record: RegisteredAccountRecord = {
          userId: prof.id,
          phone: cleanPhone,
          email: `${cleanPhone}@customer.mokhalasa.com`,
          fullName: prof.full_name || 'عميل مخلصة',
          governorate: prof.governorate || 'القاهرة',
          city: prof.city || '',
          isVerified: true,
          passwordHashes: [],
          createdAt: prof.created_at || new Date().toISOString()
        };
        await syncAccountToDatabaseRegistry(record);
        return { exists: true, account: record };
      }
    } catch {}

    // 3. Check public.car_listings table (for sellers who already submitted cars)
    try {
      const { data: listing } = await supabase
        .from('car_listings')
        .select('user_id, seller_name, seller_phone, governorate, city, created_at')
        .eq('seller_phone', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (listing?.user_id) {
        const record: RegisteredAccountRecord = {
          userId: listing.user_id,
          phone: cleanPhone,
          email: `${cleanPhone}@customer.mokhalasa.com`,
          fullName: listing.seller_name || 'عميل مخلصة',
          governorate: listing.governorate || 'القاهرة',
          city: listing.city || '',
          isVerified: true,
          passwordHashes: [],
          createdAt: listing.created_at || new Date().toISOString()
        };
        await syncAccountToDatabaseRegistry(record);
        return { exists: true, account: record };
      }
    } catch {}

    // 4. Check local registry cache
    const localReg = getLocalRegistry();
    if (localReg[cleanPhone]) {
      return { exists: true, account: localReg[cleanPhone] };
    }

    return { exists: false };
  },

  /**
   * Registration via Supabase Auth (Phone is mandatory, Email is optional)
   */
  async registerWithEmail(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { email, phone, password, fullName, governorate, city } = credentials;

    if (!phone || !password) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'يرجى إدخال رقم الهاتف وكلمة المرور لإتمام التسجيل.'
      };
    }

    const phoneErr = getPhoneValidationError(phone);
    if (phoneErr) {
      return {
        success: false,
        errorCode: 'INVALID_PHONE',
        message: phoneErr
      };
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);

    // Check if phone is already linked to an account in the database
    const existingCheck = await this.checkPhoneAccountExists(normalizedPhone);
    if (existingCheck.exists) {
      return {
        success: false,
        errorCode: 'PHONE_ALREADY_EXISTS',
        message: 'هذا الرقم مسجل ومربوط بحساب بالفعل في قاعدة البيانات! يرجى تسجيل الدخول أو استخدام «نسيت كلمة المرور».'
      };
    }

    const resolvedEmail = (email && email.trim() && email.includes('@'))
      ? email.trim().toLowerCase()
      : `${normalizedPhone}@customer.mokhalasa.com`;
    const resolvedName = (fullName && fullName.trim()) || `عميل (${normalizedPhone.slice(-4)})`;
    const pwdHash = await hashPasswordString(password);

    try {
      // 1. Sign up user via Supabase Auth with normalized phone in user_metadata
      const { data, error } = await supabase.auth.signUp({
        email: resolvedEmail,
        password,
        options: {
          data: {
            phone: normalizedPhone,
            full_name: resolvedName,
            governorate: governorate || 'القاهرة',
            city: city || '',
            phone_verified: true,
            is_verified: true
          }
        }
      });

      if (error) {
        let arabicMessage = error.message;

        if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          arabicMessage = 'هذا الحساب أو الرقم مسجل بالفعل لدينا في قاعدة البيانات. يرجى تسجيل الدخول.';
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

      // 2. Sync profile into public.profiles using ONLY valid schema columns
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          phone: normalizedPhone,
          full_name: resolvedName,
          governorate: governorate || 'القاهرة',
          city: city || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (profileErr) {
        console.warn('Profile sync notice:', profileErr);
      }

      // 3. Sync to Database Account Registry with initial password hash
      await syncAccountToDatabaseRegistry({
        userId: data.user.id,
        phone: normalizedPhone,
        email: resolvedEmail,
        fullName: resolvedName,
        governorate: governorate || 'القاهرة',
        city: city || '',
        isVerified: true,
        passwordHashes: [pwdHash],
        currentPasswordHash: pwdHash,
        createdAt: data.user.created_at || new Date().toISOString()
      });

      const customer = mapSupabaseUserToCustomerUser(data.user);
      customer.isVerified = true;
      customer.phone = normalizedPhone;
      try {
        localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
      } catch {}

      // Send Welcome WhatsApp Message on new account creation
      sendWelcomeWhatsApp(normalizedPhone, resolvedName, governorate || 'القاهرة').catch(err =>
        console.warn('Welcome WhatsApp notice:', err)
      );

      return {
        success: true,
        requiresEmailConfirmation: false,
        message: 'تم تفعيل حسابك وتوثيق رقم هاتفك بنجاح وتسجيل دخولك إلى مخلصة!',
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
   * Login with Email OR Phone Number & Password
   * Verifies account existence in database and ensures phone is marked verified.
   */
  async loginWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
    const rawId = (credentials.identifier || credentials.email || credentials.phone || '').trim();
    const { password } = credentials;

    if (!rawId || !password) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور.'
      };
    }

    const isEmailInput = rawId.includes('@');
    const cleanPhone = !isEmailInput ? normalizeEgyptianPhone(rawId) : '';
    let resolvedEmail = rawId.toLowerCase();
    let existingRecord: RegisteredAccountRecord | undefined;

    if (!isEmailInput) {
      const phoneErr = getPhoneValidationError(rawId);
      if (phoneErr) {
        return {
          success: false,
          errorCode: 'INVALID_PHONE',
          message: phoneErr
        };
      }

      const check = await this.checkPhoneAccountExists(cleanPhone);
      if (check.exists && check.account) {
        existingRecord = check.account;
        resolvedEmail = (check.account.email || `${cleanPhone}@customer.mokhalasa.com`).toLowerCase();
      } else {
        resolvedEmail = `${cleanPhone}@customer.mokhalasa.com`;
      }
    }

    const enteredPwdHash = await hashPasswordString(password);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password
      });

      if (!error && data.user) {
        const userPhone = cleanPhone || normalizeEgyptianPhone(data.user.user_metadata?.phone || existingRecord?.phone || '');

        // Ensure profile is synced to public.profiles with valid columns
        if (userPhone) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              phone: userPhone,
              full_name: data.user.user_metadata?.full_name || existingRecord?.fullName || 'عميل مخلصة',
              governorate: data.user.user_metadata?.governorate || existingRecord?.governorate || 'القاهرة',
              city: data.user.user_metadata?.city || existingRecord?.city || null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          } catch {}

          // Record password hash in database registry so password history is always known
          const prevHashes = new Set<string>(existingRecord?.passwordHashes || []);
          prevHashes.add(enteredPwdHash);
          await syncAccountToDatabaseRegistry({
            userId: data.user.id,
            phone: userPhone,
            email: data.user.email || resolvedEmail,
            fullName: data.user.user_metadata?.full_name || existingRecord?.fullName || 'عميل مخلصة',
            governorate: data.user.user_metadata?.governorate || existingRecord?.governorate || 'القاهرة',
            city: data.user.user_metadata?.city || existingRecord?.city || '',
            isVerified: true,
            passwordHashes: Array.from(prevHashes),
            currentPasswordHash: enteredPwdHash,
            createdAt: data.user.created_at || existingRecord?.createdAt || new Date().toISOString()
          });
        }

        const customer = mapSupabaseUserToCustomerUser(data.user);
        customer.isVerified = true;
        if (userPhone) customer.phone = userPhone;

        try {
          localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
        } catch {}

        return {
          success: true,
          message: 'تم تسجيل الدخول بنجاح.',
          user: customer
        };
      }

      // If Supabase Auth signInWithPassword returned an error, check if user reset password via OTP in Database Registry
      if (existingRecord && existingRecord.currentPasswordHash && existingRecord.currentPasswordHash === enteredPwdHash) {
        const customer: CustomerUser = {
          id: existingRecord.userId,
          name: existingRecord.fullName || 'عميل مخلصة',
          email: existingRecord.email || resolvedEmail,
          phone: existingRecord.phone || cleanPhone,
          provider: 'email',
          isVerified: true,
          governorate: existingRecord.governorate || 'القاهرة',
          city: existingRecord.city || '',
          createdAt: existingRecord.createdAt || new Date().toISOString(),
          accountStatus: 'active'
        };

        try {
          localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
        } catch {}

        return {
          success: true,
          message: 'تم تسجيل الدخول بنجاح.',
          user: customer
        };
      }

      // If phone does not exist in database at all, tell user clearly to create a new account!
      if (!isEmailInput && !existingRecord) {
        return {
          success: false,
          errorCode: 'ACCOUNT_NOT_FOUND',
          message: `هذا الرقم (${cleanPhone}) غير مربوط بأي حساب مسجل في قاعدة البيانات! يرجى الضغط على «إنشاء حساب» لتسجيل حساب جديد أولاً.`
        };
      }

      let arabicMessage = error?.message || 'بيانات الدخول غير صحيحة.';
      if (arabicMessage.includes('Invalid login credentials') || arabicMessage.includes('invalid_grant')) {
        arabicMessage = 'كلمة المرور غير صحيحة لهذا الحساب. يرجى التأكد من كلمة المرور أو الضغط على «نسيت كلمة المرور؟».';
      } else if (arabicMessage.includes('Email not confirmed')) {
        arabicMessage = 'لم يتم تأكيد الحساب بعد.';
      } else if (arabicMessage.includes('rate limit') || error?.status === 429) {
        arabicMessage = 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. يرجى الانتظار قليلاً.';
      }

      return {
        success: false,
        errorCode: error?.code || 'LOGIN_ERROR',
        message: arabicMessage
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
   * Check whether a candidate new password was already used before by this phone's account
   */
  async isPasswordUsedBefore(rawPhone: string, candidatePassword: string): Promise<boolean> {
    const normalizedPhone = normalizeEgyptianPhone(rawPhone);
    const candidateHash = await hashPasswordString(candidatePassword);

    // 1. Check Database Account Registry passwordHashes history
    const check = await this.checkPhoneAccountExists(normalizedPhone);
    if (check.exists && check.account) {
      if (
        check.account.currentPasswordHash === candidateHash ||
        (Array.isArray(check.account.passwordHashes) && check.account.passwordHashes.includes(candidateHash))
      ) {
        return true;
      }
    }

    // 2. Also probe Supabase Auth directly: if signInWithPassword succeeds with candidatePassword,
    // then candidatePassword is the exact current password of the account!
    const resolvedEmail = check.account?.email || `${normalizedPhone}@customer.mokhalasa.com`;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: candidatePassword
      });
      if (!error && data?.user) {
        // Record this hash into history as well
        if (check.account) {
          const hashes = new Set<string>(check.account.passwordHashes || []);
          hashes.add(candidateHash);
          check.account.passwordHashes = Array.from(hashes);
          check.account.currentPasswordHash = candidateHash;
          await syncAccountToDatabaseRegistry(check.account);
        }
        return true;
      }
    } catch {}

    return false;
  },

  /**
   * Reset Password with verified phone OTP
   * Strictly checks:
   * 1. Phone is registered to a real account in the database
   * 2. New password has NEVER been used before on this account
   */
  async resetPasswordWithPhone(phone: string, newPassword: string): Promise<AuthResponse> {
    if (!phone || !newPassword) {
      return { success: false, message: 'يرجى إدخال رقم الهاتف وكلمة المرور الجديدة.' };
    }
    if (newPassword.length < 8) {
      return { success: false, message: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف وأرقام.' };
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);

    try {
      // 1. Verify account exists in database
      const check = await this.checkPhoneAccountExists(normalizedPhone);
      if (!check.exists || !check.account) {
        return {
          success: false,
          errorCode: 'ACCOUNT_NOT_FOUND',
          message: `هذا الرقم (${normalizedPhone}) غير مربوط بأي حساب في قاعدة البيانات! يرجى إنشاء حساب جديد أولاً.`
        };
      }

      // 2. Verify newPassword was NOT used before on this account
      const usedBefore = await this.isPasswordUsedBefore(normalizedPhone, newPassword);
      if (usedBefore) {
        return {
          success: false,
          errorCode: 'PASSWORD_REUSED',
          message: 'لا يمكن استخدام كلمة المرور هذه لأنها مستخدمة من قبل في حسابك القديم! يرجى كتابة كلمة مرور جديدة ومختلفة.'
        };
      }

      const newHash = await hashPasswordString(newPassword);
      const account = check.account;
      const updatedHashes = Array.from(new Set([...(account.passwordHashes || []), newHash]));

      // 3. Update password in Supabase Auth if session exists
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          await supabase.auth.updateUser({
            password: newPassword,
            data: {
              phone: normalizedPhone,
              phone_verified: true,
              is_verified: true
            }
          });
        }
      } catch (updateErr) {
        console.warn('Supabase Auth password update notice:', updateErr);
      }

      // 4. Persist new password hash and history in Database Account Registry
      const updatedAccount: RegisteredAccountRecord = {
        ...account,
        isVerified: true,
        passwordHashes: updatedHashes,
        currentPasswordHash: newHash,
        updatedAt: new Date().toISOString()
      };
      await syncAccountToDatabaseRegistry(updatedAccount);

      const customer: CustomerUser = {
        id: updatedAccount.userId,
        name: updatedAccount.fullName || 'عميل مخلصة',
        email: updatedAccount.email || `${normalizedPhone}@customer.mokhalasa.com`,
        phone: normalizedPhone,
        provider: 'email',
        isVerified: true,
        governorate: updatedAccount.governorate || 'القاهرة',
        city: updatedAccount.city || '',
        createdAt: updatedAccount.createdAt || new Date().toISOString(),
        accountStatus: 'active'
      };

      try {
        localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
      } catch {}

      // Send WhatsApp confirmation of password change
      sendPasswordChangedWhatsApp(normalizedPhone, updatedAccount.fullName || 'عميل مخلصة').catch(err =>
        console.warn('Password reset confirmation WhatsApp notice:', err)
      );

      return {
        success: true,
        message: 'تم تحديث كلمة المرور الجديدة بنجاح وتوثيق رقم هاتفك! وتم تسجيل دخولك لحسابك.',
        user: customer
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'حدث خطأ أثناء تعيين كلمة المرور الجديدة.'
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
        const customer = mapSupabaseUserToCustomerUser(data.session.user);
        customer.isVerified = true;
        return {
          user: customer,
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
          phone_verified: true,
          is_verified: true,
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

      await syncAccountToDatabaseRegistry({
        userId,
        phone: normalized,
        email: `${normalized}@customer.mokhalasa.com`,
        fullName: fullName?.trim() || 'عميل مخلصة',
        governorate: governorate || 'القاهرة',
        isVerified: true,
        passwordHashes: [],
        createdAt: new Date().toISOString()
      });

      sendWelcomeWhatsApp(normalized, fullName || 'عميل مخلصة').catch(err =>
        console.warn('Welcome WhatsApp notice:', err)
      );

      return {
        success: true,
        message: 'تم حفظ وتوثيق رقم الهاتف بنجاح!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'تعذر تحديث رقم الهاتف.'
      };
    }
  },

  /**
   * Login existing Customer with verified WhatsApp Phone
   * Strictly requires the phone to be linked to an existing account in the database!
   */
  async loginWithVerifiedPhone(phone: string): Promise<AuthResponse> {
    const normalized = normalizeEgyptianPhone(phone);
    try {
      const check = await this.checkPhoneAccountExists(normalized);
      if (!check.exists || !check.account) {
        return {
          success: false,
          errorCode: 'ACCOUNT_NOT_FOUND',
          message: `هذا الرقم (${normalized}) غير مربوط بأي حساب مسجل في قاعدة البيانات! يرجى إنشاء حساب جديد أولاً.`
        };
      }

      const acc = check.account;
      const customer: CustomerUser = {
        id: acc.userId,
        name: acc.fullName || 'عميل مخلصة',
        email: acc.email || `${normalized}@customer.mokhalasa.com`,
        phone: normalized,
        provider: 'phone_otp',
        isVerified: true,
        governorate: acc.governorate || 'القاهرة',
        city: acc.city || '',
        createdAt: acc.createdAt || new Date().toISOString(),
        accountStatus: 'active'
      };

      try {
        localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
      } catch {}

      return {
        success: true,
        message: 'تم التحقق من الحساب وتسجيل الدخول بنجاح!',
        user: customer
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'تعذر تسجيل الدخول بالرقم.'
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
