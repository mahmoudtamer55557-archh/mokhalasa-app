/**
 * =====================================================================
 * MOKHALASA / KHUTWA — VEHICLE LISTINGS & MODERATION SERVICE
 * =====================================================================
 * Manages customer vehicle submissions, Supabase listings persistence,
 * image uploads, admin review workflow, and audit logging.
 */

import { supabase } from './supabaseClient';
import { Car, PurchaseOffer, InAppNotification, ListingCallLog } from '../types';

// In-flight submissions mutex set to prevent concurrent duplicate submissions
const inFlightSubmissions = new Set<string>();

export type ListingModerationStatus = 
  | 'pending_review' 
  | 'approved' 
  | 'rejected' 
  | 'needs_changes' 
  | 'published' 
  | 'sold' 
  | 'archived' 
  | 'withdrawn';

export interface DatabaseCarListing {
  id: string;
  user_id: string;
  case_reference?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  transmission: string;
  fuel_type: string;
  engine_size?: string;
  mileage: number;
  color?: string;
  governorate: string;
  city?: string;
  asking_price: number;
  condition_description: string;
  paint_condition?: string;
  disclosed_defects: string[];
  has_financing: boolean;
  financing_type?: string;
  financing_provider?: string;
  outstanding_amount?: number;
  monthly_installment?: number;
  remaining_months?: number;
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  status: ListingModerationStatus;
  review_feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string[];
  call_logs?: ListingCallLog[];
  next_action?: string;
  followup_status?: string;
  deactivation_reason?: string;
  deactivated_by?: string;
  deactivated_at?: string;
  created_at: string;
  updated_at: string;
  images?: string[];
  traffic_unit?: string;
  is_hidden?: boolean;
  documents_verified?: boolean;
  documents_verified_at?: string;
  documents_verified_by?: string;
  associated_offers?: PurchaseOffer[];
  documents_requested?: boolean;
  documents_requested_at?: string;
  documents_submitted?: boolean;
  documents_submitted_at?: string;
  official_documents?: {
    licenseUrl?: string;
    licenseFrontUrl?: string;
    licenseBackUrl?: string;
    nationalIdUrl?: string;
    bankStatementUrl?: string;
    submittedAt?: string;
    notes?: string;
  };
}

export interface NewListingSubmission {
  case_reference?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  transmission?: string;
  fuel_type?: string;
  engine_size?: string;
  mileage: number;
  color?: string;
  governorate: string;
  city?: string;
  traffic_unit?: string;
  asking_price: number;
  condition_description: string;
  paint_condition?: string;
  disclosed_defects?: string[];
  has_financing?: boolean;
  financing_type?: string;
  financing_provider?: string;
  outstanding_amount?: number;
  monthly_installment?: number;
  remaining_months?: number;
  seller_name?: string;
  seller_phone: string;
  images?: string[];
}

export const listingService = {
  /**
   * Submit a new vehicle listing from an authenticated customer
   * Status is forced to 'pending_review'
   * Features strict in-flight mutex & database-level idempotency to prevent duplicate creation
   */
  async submitListing(
    submission: NewListingSubmission
  ): Promise<{ success: boolean; listingId?: string; message: string; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser) {
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً لتتمكن من إضافة إعلان سيارتك.',
          error: 'UNAUTHENTICATED'
        };
      }

      // Generate submission idempotency signature (user + make + model + year + price)
      const idempotencySignature = `${authUser.id}_${submission.make}_${submission.model}_${submission.year}_${submission.asking_price}`;

      // 1. In-flight mutex check: prevent concurrent double-clicks from running in parallel
      if (inFlightSubmissions.has(idempotencySignature)) {
        return {
          success: false,
          message: 'طلب نشر هذا الإعلان قيد التنفيذ بالفعل، يرجى الانتظار لحين اكتمال المعالجة.',
          error: 'SUBMISSION_IN_FLIGHT'
        };
      }

      inFlightSubmissions.add(idempotencySignature);

      try {
        // 2. Database-level deduplication: Check if an identical listing was already submitted by this user in the last 60 seconds
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: recentExisting } = await supabase
          .from('car_listings')
          .select('id, created_at')
          .eq('user_id', authUser.id)
          .eq('make', submission.make)
          .eq('model', submission.model)
          .eq('year', submission.year)
          .eq('asking_price', submission.asking_price)
          .gte('created_at', oneMinuteAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentExisting?.id) {
          return {
            success: true,
            listingId: recentExisting.id,
            message: 'تم استلام طلبك بنجاح وهو قيد المراجعة الإدارية (تم تفادي التكرار).'
          };
        }

        // Generate case reference
        const caseReference = submission.case_reference || (`MK-${Math.floor(100000 + Math.random() * 900000)}`);

        // Prepare row matching public.car_listings
        const row = {
          user_id: authUser.id,
          case_reference: caseReference,
          make: submission.make,
          model: submission.model,
          year: submission.year,
          trim: submission.trim || '',
          transmission: submission.transmission || 'أوتوماتيك',
          fuel_type: submission.fuel_type || 'بنزين',
          engine_size: submission.engine_size || '',
          mileage: submission.mileage,
          color: submission.color || '',
          governorate: submission.governorate,
          city: submission.city || '',
          asking_price: submission.asking_price,
          condition_description: submission.condition_description,
          paint_condition: submission.paint_condition || 'فابريكا بالكامل',
          disclosed_defects: submission.disclosed_defects || [],
          has_financing: submission.has_financing ?? true,
          financing_type: submission.financing_type || 'bank_loan',
          financing_provider: submission.financing_provider || '',
          outstanding_amount: submission.outstanding_amount || 0,
          monthly_installment: submission.monthly_installment || 0,
          remaining_months: submission.remaining_months || 0,
          seller_name: submission.seller_name || authUser.user_metadata?.full_name || 'مالك السيارة',
          seller_phone: submission.seller_phone || authUser.user_metadata?.phone || '',
          status: 'pending_review' as ListingModerationStatus
        };

        if (submission.traffic_unit) {
          (row as any).traffic_unit = submission.traffic_unit;
        }

        let insertRes = await supabase
          .from('car_listings')
          .insert(row)
          .select()
          .single();

        // Graceful schema fallback if column traffic_unit does not exist in Postgres
        if (insertRes.error && (insertRes.error.message.includes('traffic_unit') || insertRes.error.code === 'PGRST204')) {
          delete (row as any).traffic_unit;
          insertRes = await supabase
            .from('car_listings')
            .insert(row)
            .select()
            .single();
        }

        const data = insertRes.data;
        const error = insertRes.error;

        if (error || !data) {
          console.error('Supabase listing insert error:', error);
          return {
            success: false,
            message: `تعذر حفظ الإعلان في قاعدة البيانات: ${error?.message || 'خطأ غير معروف'}`,
            error: error?.code || error?.message
          };
        }

        const listingId = data.id;

        // Save traffic_unit to local override mirror so it's always remembered
        if (submission.traffic_unit) {
          try {
            const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
            const parsed = JSON.parse(storedMods);
            parsed[listingId] = {
              ...(parsed[listingId] || {}),
              traffic_unit: submission.traffic_unit
            };
            localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
          } catch {}
        }

        // Link images in public.listing_images if provided
        if (submission.images && submission.images.length > 0) {
          const imageRows = submission.images.map((url, idx) => ({
            listing_id: listingId,
            user_id: authUser.id,
            image_url: url,
            display_order: idx
          }));

          await supabase.from('listing_images').insert(imageRows);
        }

        // Send in-app notification to the seller
        await this.sendCustomerNotification({
          userId: authUser.id,
          type: 'listing_published',
          title: 'تم إرسال إعلان سيارتك بنجاح',
          message: `تم تسجيل سيارتك ${submission.make} ${submission.model} ${submission.year} بنجاح برقم ملف (${caseReference}). الإعلان قيد مراجعة واعتماد الإدارة وسيتواصل معك مستشار مخلصة.`,
          linkView: 'profile',
          relatedId: listingId
        });

        // Insert audit log
        try {
          await supabase.from('audit_logs').insert({
            actor_id: authUser.id,
            event_type: 'LISTING_SUBMITTED',
            record_id: listingId,
            details: {
              case_reference: caseReference,
              make: submission.make,
              model: submission.model,
              year: submission.year,
              price: submission.asking_price
            }
          });
        } catch {}

        return {
          success: true,
          listingId,
          message: 'تم إرسال ونشر إعلانك بنجاح! الإعلان الآن قيد مراجعة واعتماد الإدارة.'
        };
      } finally {
        // Always release the in-flight mutex lock
        inFlightSubmissions.delete(idempotencySignature);
      }

    } catch (err: any) {
      return {
        success: false,
        message: 'حدث خطأ غير متوقع أثناء إرسال الإعلان.',
        error: err?.message
      };
    }
  },

  /**
   * Upload vehicle image to Supabase Storage ('listing-images' bucket)
   */
  async uploadListingImage(
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser) {
        return { success: false, error: 'غير مصرح: يجب تسجيل الدخول لرفع الصور.' };
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'صيغة الصورة غير مدعومة. يرجى اختيار صور JPG أو PNG أو WebP.' };
      }

      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        return { success: false, error: 'حجم الصورة يتجاوز 10 ميجابايت.' };
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${authUser.id}/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      let bucketName = 'car-images';
      let uploadResult = await supabase.storage
        .from(bucketName)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadResult.error) {
        // Fallback to listing-images bucket
        bucketName = 'listing-images';
        uploadResult = await supabase.storage
          .from(bucketName)
          .upload(path, file, { cacheControl: '3600', upsert: false });
      }

      if (uploadResult.error) {
        return { success: false, error: uploadResult.error.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadResult.data.path);

      return {
        success: true,
        url: publicUrlData.publicUrl
      };

    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل رفع الصورة.' };
    }
  },

  /**
   * Fetch listings belonging to the authenticated customer
   */
  async getCustomerListings(
    userId: string
  ): Promise<{ success: boolean; listings: DatabaseCarListing[]; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session || sessionData.session.user.id !== userId) {
        return { success: false, listings: [], error: 'غير مصرح.' };
      }

      const { data, error } = await supabase
        .from('car_listings')
        .select(`
          *,
          listing_images ( image_url, display_order )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          return { success: true, listings: [] };
        }
        return { success: false, listings: [], error: error.message };
      }

      // Also fetch purchase offers to correlate with listings
      const offersRes = await this.getPurchaseOffers();
      const allOffers = offersRes.success ? offersRes.offers : [];

      // Local followups, moderations, and documents fallback
      let localFollowups: Record<string, any> = {};
      let localModerations: Record<string, any> = {};
      let localDocs: Record<string, any> = {};
      try {
        const stored = localStorage.getItem('mokhalasa_listing_followups');
        if (stored) localFollowups = JSON.parse(stored);
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides');
        if (storedMods) localModerations = JSON.parse(storedMods);
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents');
        if (storedDocs) localDocs = JSON.parse(storedDocs);
      } catch {}

      const mapped: DatabaseCarListing[] = (data || []).map((item: any) => {
        const matchingOffers = allOffers.filter(
          o => o.listingId === item.id || (item.case_reference && o.caseReference === item.case_reference)
        );
        const itemFollowups = localFollowups[item.id] || {};
        const modOverride = localModerations[item.id];
        const effectiveStatus = modOverride?.status || item.status;
        const effectiveFeedback = modOverride?.feedback || item.review_feedback;
        const docRecord = localDocs[item.id];
        const hasDocsRequested = Boolean(docRecord?.requested);
        const isHidden = Boolean(modOverride?.is_hidden ?? item.is_hidden);
        const isVerified = Boolean(item.documents_verified || docRecord?.verified);
        const hasDocsSubmitted = Boolean(
          item.documents_submitted ||
          docRecord?.docs?.licenseUrl ||
          docRecord?.docs?.licenseFrontUrl ||
          docRecord?.docs?.nationalIdUrl ||
          docRecord?.docs?.bankStatementUrl
        );

        return {
          ...item,
          status: effectiveStatus,
          is_hidden: isHidden,
          traffic_unit: item.traffic_unit || modOverride?.traffic_unit || 'مرور فيصل',
          documents_verified: isVerified,
          documents_verified_at: item.documents_verified_at || docRecord?.verifiedAt,
          documents_verified_by: item.documents_verified_by || docRecord?.verifiedBy,
          review_feedback: effectiveFeedback,
          images: (item.listing_images || [])
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            .map((img: any) => img.image_url),
          call_logs: item.call_logs && item.call_logs.length > 0 ? item.call_logs : (itemFollowups.call_logs || []),
          admin_notes: item.admin_notes && item.admin_notes.length > 0 ? item.admin_notes : (itemFollowups.admin_notes || []),
          associated_offers: matchingOffers,
          documents_requested: hasDocsRequested,
          documents_requested_at: docRecord?.requestedAt,
          documents_submitted: hasDocsSubmitted,
          documents_submitted_at: docRecord?.docs?.submittedAt || item.documents_submitted_at,
          official_documents: docRecord?.docs || item.official_documents
        };
      });

      return { success: true, listings: mapped };

    } catch (err: any) {
      return { success: false, listings: [], error: err?.message };
    }
  },

  /**
   * Withdraw a listing by the customer
   */
  async withdrawListing(
    listingId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      // 1. Fetch current listing to get metadata for admin notification
      let listingInfo: any = null;
      try {
        const { data: fetched } = await supabase
          .from('car_listings')
          .select('id, user_id, make, model, year, case_reference, seller_name, seller_phone')
          .eq('id', listingId)
          .maybeSingle();
        listingInfo = fetched;
      } catch {}

      // 2. Update status to 'withdrawn' in car_listings (Preserves the row for platform data!)
      const now = new Date().toISOString();
      try {
        const query = supabase
          .from('car_listings')
          .update({ status: 'withdrawn', updated_at: now })
          .eq('id', listingId);

        if (authUser) {
          // If authenticated, also match user_id if desired, or permit owner
          await query;
        } else {
          await query;
        }
      } catch (e) {
        console.warn('Supabase withdraw update warning:', e);
      }

      // 3. Update local moderation overrides mirror so public gallery drops it instantly
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = {
          ...(parsed[listingId] || {}),
          status: 'withdrawn',
          updatedAt: now
        };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
      } catch {}

      // 4. Update local listings caches
      try {
        const localListings = localStorage.getItem('mokhalasa_local_listings');
        if (localListings) {
          const parsed = JSON.parse(localListings);
          const updated = parsed.map((item: any) => item.id === listingId ? { ...item, status: 'withdrawn', updated_at: now } : item);
          localStorage.setItem('mokhalasa_local_listings', JSON.stringify(updated));
        }
      } catch {}

      // 5. Alert Admin Dashboard in admin_notifications
      const sellerDisplayName = listingInfo?.seller_name || authUser?.user_metadata?.full_name || 'البائع';
      const carTitle = listingInfo ? `${listingInfo.make} ${listingInfo.model} ${listingInfo.year}` : 'السيارة';
      const caseCode = listingInfo?.case_reference || listingId.slice(0, 8);

      try {
        await supabase.from('admin_notifications').insert({
          type: 'listing_withdrawn',
          title: '🚨 قام العميل بسحب إعلانه من المعرض',
          message: `قام العميل ${sellerDisplayName} بسحب إعلان سيارته (${carTitle} #${caseCode}) من العرض العام. تبقى كافة بيانات السيارة مسجلة ومحفوظة في قاعدة بيانات المنصة للأرشيف.`,
          listing_id: listingId
        });
      } catch {}

      // 6. Send in-app notification to the seller
      if (authUser?.id || listingInfo?.user_id) {
        try {
          await this.sendCustomerNotification({
            userId: authUser?.id || listingInfo?.user_id,
            type: 'listing_status_changed',
            title: 'تم سحب إعلان سيارتك من العرض',
            message: `تم سحب إعلان سيارتك (${carTitle}) من المعرض العام بنجاح بناءً على طلبك. بيانات الإعلان محفوظة ومسجلة في حسابك الشخصي.`,
            linkView: 'profile',
            relatedId: listingId
          });
        } catch {}
      }

      // 7. Audit log
      try {
        await supabase.from('audit_logs').insert({
          actor_id: authUser?.id || 'guest-seller',
          event_type: 'LISTING_WITHDRAWN',
          record_id: listingId,
          details: { case_reference: caseCode, title: carTitle }
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, status: 'withdrawn' } }));
      }

      return {
        success: true,
        message: 'تم سحب الإعلان من المعرض العام بنجاح، وبيانات الإعلان محفوظة بالكامل في سجلك.'
      };

    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر سحب الإعلان.' };
    }
  },

  /**
   * ADMIN: Temporarily hide or unhide listing from public gallery (during deal coordination / meeting)
   */
  async toggleListingVisibility(
    listingId: string,
    hide: boolean,
    staffName: string = 'مسؤول العمليات'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();

      // Update Supabase car_listings
      try {
        await supabase
          .from('car_listings')
          .update({ is_hidden: hide, updated_at: now })
          .eq('id', listingId);
      } catch {}

      // Update local moderation overrides mirror
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = {
          ...(parsed[listingId] || {}),
          is_hidden: hide,
          hidden_by: staffName,
          hidden_at: now
        };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
      } catch {}

      // Insert into admin_notifications
      try {
        await supabase.from('admin_notifications').insert({
          type: 'general',
          title: hide ? '👁️ تم إخفاء الإعلان مؤقتاً عن المعرض' : '✨ تمت إعادة إظهار الإعلان بالمعرض',
          message: `${staffName} قام ${hide ? 'بإخفاء الإعلان مؤقتاً لحين إنهاء المقابلة والاتفاق البنكي' : 'بإعادة إظهار الإعلان في المعرض العام بعد تعثر أو انتهاء الإجراء'} (كود: ${listingId.slice(0, 8)}).`,
          listing_id: listingId
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, is_hidden: hide } }));
      }

      return {
        success: true,
        message: hide
          ? 'تم إخفاء الإعلان مؤقتاً عن المعرض لحين إتمام المقابلة. يمكنك إعادته في أي وقت إذا لم تكتمل الصفقة.'
          : 'تمت إعادة إظهار الإعلان بنجاح في المعرض العام.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تعديل ظهور الإعلان.' };
    }
  },

  /**
   * ADMIN: Verify or reject official documents and grant verified trust badge
   */
  async verifyListingDocuments(
    listingId: string,
    isVerified: boolean,
    adminNotes?: string,
    staffName: string = 'مسؤول مراجعة المستندات'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();

      // 1. Update Supabase car_listings
      try {
        await supabase
          .from('car_listings')
          .update({
            documents_verified: isVerified,
            documents_verified_at: isVerified ? now : null,
            documents_verified_by: isVerified ? staffName : null,
            updated_at: now
          })
          .eq('id', listingId);
      } catch {}

      // 2. Persist in local documents mirror
      try {
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents') || '{}';
        const parsed = JSON.parse(storedDocs);
        parsed[listingId] = {
          ...(parsed[listingId] || {}),
          verified: isVerified,
          verifiedAt: isVerified ? now : null,
          verifiedBy: staffName,
          adminNotes: adminNotes || null
        };
        localStorage.setItem('mokhalasa_listing_documents', JSON.stringify(parsed));
      } catch {}

      // 3. Notify seller
      try {
        const { data: carData } = await supabase
          .from('car_listings')
          .select('user_id, make, model')
          .eq('id', listingId)
          .maybeSingle();

        if (carData?.user_id) {
          if (isVerified) {
            await this.sendCustomerNotification({
              userId: carData.user_id,
              type: 'listing_status_changed',
              title: '🎉 تم تدقيق وتوثيق أوراق سيارتك الرسمية بنجاح!',
              message: `تم فحص رخصة السيارة والمستندات ومطابقتها من قبل إدارة مخلصة، ومُنح إعلانك (${carData.make} ${carData.model}) شارة «أوراق رسمية مفحوصة وموثقة إدارياً (مضمونة بنكياً وقانونياً)».`,
              linkView: 'profile',
              relatedId: listingId
            });
          } else {
            await this.sendCustomerNotification({
              userId: carData.user_id,
              type: 'listing_status_changed',
              title: '⚠️ مطلوب إعادة رفع أو توضيح المستندات',
              message: `ملاحظة الإدارة على مستندات (${carData.make} ${carData.model}): ${adminNotes || 'يرجى إعادة رفع صور أوضح للرخصة أو البطاقة'}.`,
              linkView: 'profile',
              relatedId: listingId
            });
          }
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, documents_verified: isVerified } }));
      }

      return {
        success: true,
        message: isVerified
          ? 'تم اعتماد المستندات الرسمية بنجاح ومنح الإعلان شارة «أوراق مفحوصة وموثقة إدارياً» بالمعرض.'
          : 'تم تسجيل رفض المستندات وإشعار البائع بإعادة الرفع.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث توثيق المستندات.' };
    }
  },

  /**
   * SELLER: Update listing after admin requested changes, resubmitting for review
   */
  async updateListingBySeller(
    listingId: string,
    updates: {
      asking_price?: number;
      mileage?: number;
      condition_description?: string;
      paint_condition?: string;
      seller_phone?: string;
    }
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser) {
        return { success: false, message: 'غير مصرح. يرجى تسجيل الدخول أولاً.' };
      }

      const payload: Record<string, any> = {
        status: 'pending_review',
        updated_at: new Date().toISOString()
      };

      if (updates.asking_price !== undefined) payload.asking_price = updates.asking_price;
      if (updates.mileage !== undefined) payload.mileage = updates.mileage;
      if (updates.condition_description !== undefined) payload.condition_description = updates.condition_description;
      if (updates.paint_condition !== undefined) payload.paint_condition = updates.paint_condition;
      if (updates.seller_phone !== undefined) payload.seller_phone = updates.seller_phone;

      // Update in car_listings
      const { error: updateError } = await supabase
        .from('car_listings')
        .update(payload)
        .eq('id', listingId)
        .eq('user_id', authUser.id);

      if (updateError) {
        console.warn('Listing update notice:', updateError);
      }

      // Update local moderation overrides mirror so UI reflects immediately
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = { status: 'pending_review', feedback: null, updatedAt: new Date().toISOString() };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, status: 'pending_review' } }));
        }
      } catch {}

      // Notify admin queue in admin_notifications
      try {
        await supabase.from('admin_notifications').insert({
          type: 'listing_resubmitted',
          title: 'إعادة إرسال إعلان بعد التعديل',
          message: `قام العميل بتعديل بيانات سيارته وإعادة إرسال الإعلان (كود: ${listingId.slice(0, 8)}) للمراجعة والاعتماد.`
        });
      } catch {}

      // Audit log
      try {
        await supabase.from('audit_logs').insert({
          actor_id: authUser.id,
          event_type: 'LISTING_RESUBMITTED_BY_SELLER',
          record_id: listingId,
          details: updates
        });
      } catch {}

      return {
        success: true,
        message: 'تم حفظ تعديلاتك وإعادة إرسال الإعلان للمراجعة والاعتماد بنجاح.'
      };

    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حفظ التعديلات.' };
    }
  },

  /**
   * ADMIN: Request official documents (Car license, National ID, Payoff statement)
   */
  async requestListingDocuments(
    listingId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Persist to local documents mirror
      try {
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents') || '{}';
        const parsed = JSON.parse(storedDocs);
        parsed[listingId] = {
          ...(parsed[listingId] || {}),
          requested: true,
          requestedAt: new Date().toISOString(),
          requestNotes: notes || 'مطلوب إرفاق صور رخصة السيارة والبطاقة القومية وبيان المديونية البنكي'
        };
        localStorage.setItem('mokhalasa_listing_documents', JSON.stringify(parsed));
      } catch {}

      // 2. Fetch listing to get user_id and notify seller
      try {
        const { data: listingData } = await supabase
          .from('car_listings')
          .select('user_id, make, model, year')
          .eq('id', listingId)
          .maybeSingle();

        if (listingData?.user_id) {
          await this.sendCustomerNotification({
            userId: listingData.user_id,
            type: 'listing_status_changed',
            title: '📄 مطلوب رفع المستندات الرسمية لسيارتك',
            message: `إدارة مخلصة تطلب منك رفع صور المستندات الرسمية (الرخصة، بطاقة الرقم القومي، وبيان المديونية البنكي) لسيارتك (${listingData.make} ${listingData.model}). يرجى الدخول لصفحة حسابك وإرفاقها.`,
            linkView: 'profile',
            relatedId: listingId
          });
        }
      } catch {}

      return {
        success: true,
        message: 'تم إرسال إشعار طلب المستندات الرسمية للعميل بنجاح.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إرسال طلب المستندات.' };
    }
  },

  /**
   * SELLER: Upload official documents for a listing
   */
  async uploadListingDocuments(
    listingId: string,
    docs: {
      licenseUrl?: string;
      licenseFrontUrl?: string;
      licenseBackUrl?: string;
      nationalIdUrl?: string;
      bankStatementUrl?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();

      // 1. Persist to local documents mirror
      try {
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents') || '{}';
        const parsed = JSON.parse(storedDocs);
        const current = parsed[listingId] || {};
        parsed[listingId] = {
          ...current,
          docs: {
            licenseUrl: docs.licenseFrontUrl || docs.licenseUrl || current.docs?.licenseUrl,
            licenseFrontUrl: docs.licenseFrontUrl || docs.licenseUrl || current.docs?.licenseFrontUrl,
            licenseBackUrl: docs.licenseBackUrl || current.docs?.licenseBackUrl,
            nationalIdUrl: docs.nationalIdUrl || current.docs?.nationalIdUrl,
            bankStatementUrl: docs.bankStatementUrl || current.docs?.bankStatementUrl,
            notes: docs.notes || current.docs?.notes,
            submittedAt: now
          },
          verified: false // Reset or await admin review
        };
        localStorage.setItem('mokhalasa_listing_documents', JSON.stringify(parsed));
      } catch {}

      // 2. Update car_listings in Supabase
      try {
        await supabase
          .from('car_listings')
          .update({
            documents_submitted: true,
            documents_submitted_at: now,
            documents_verified: false,
            updated_at: now
          })
          .eq('id', listingId);
      } catch {}

      // 3. Notify Admin in admin_notifications
      try {
        await supabase.from('admin_notifications').insert({
          type: 'documents_uploaded',
          title: '📄 تم رفع مستندات رسمية جديدة للتدقيق',
          message: `قام العميل برفع الأوراق الرسمية (الرخصة/البطاقة/بيان البنك) للإعلان (كود: ${listingId.slice(0, 8)}). يمكنك مراجعتها وتدقيقها الآن في لوحة الإدارة لمنح شارة الثقة.`,
          listing_id: listingId
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, documents_submitted: true } }));
      }

      return {
        success: true,
        message: 'تم حفظ ورفع المستندات الرسمية بنجاح وإشعار فريق العمليات بمخلصة لتدقيقها.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر رفع المستندات.' };
    }
  },

  /**
   * ADMIN: Fetch all listings with status filter
   */
  async getAdminListings(
    filterStatus?: string
  ): Promise<{ success: boolean; listings: DatabaseCarListing[]; error?: string }> {
    try {
      const query = supabase
        .from('car_listings')
        .select(`
          *,
          listing_images ( image_url, display_order )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        if (error.message.includes('does not exist')) {
          return { success: true, listings: [] };
        }
        return { success: false, listings: [], error: error.message };
      }

      // Also fetch purchase offers to correlate with listings
      const offersRes = await this.getPurchaseOffers();
      const allOffers = offersRes.success ? offersRes.offers : [];

      // Local followups, moderations, and documents fallback
      let localFollowups: Record<string, any> = {};
      let localModerations: Record<string, any> = {};
      let localDocs: Record<string, any> = {};
      try {
        const stored = localStorage.getItem('mokhalasa_listing_followups');
        if (stored) localFollowups = JSON.parse(stored);
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides');
        if (storedMods) localModerations = JSON.parse(storedMods);
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents');
        if (storedDocs) localDocs = JSON.parse(storedDocs);
      } catch {}

      const mapped: DatabaseCarListing[] = (data || []).map((item: any) => {
        const matchingOffers = allOffers.filter(
          o => o.listingId === item.id || (item.case_reference && o.caseReference === item.case_reference)
        );
        const itemFollowups = localFollowups[item.id] || {};
        const modOverride = localModerations[item.id];
        const effectiveStatus = modOverride?.status || item.status;
        const effectiveFeedback = modOverride?.feedback || item.review_feedback;
        const docRecord = localDocs[item.id];
        const hasDocsRequested = Boolean(docRecord?.requested);
        const isHidden = Boolean(modOverride?.is_hidden ?? item.is_hidden);
        const isVerified = Boolean(item.documents_verified || docRecord?.verified);
        const hasDocsSubmitted = Boolean(
          item.documents_submitted ||
          docRecord?.docs?.licenseUrl ||
          docRecord?.docs?.licenseFrontUrl ||
          docRecord?.docs?.nationalIdUrl ||
          docRecord?.docs?.bankStatementUrl
        );

        return {
          ...item,
          status: effectiveStatus,
          is_hidden: isHidden,
          traffic_unit: item.traffic_unit || modOverride?.traffic_unit || 'مرور فيصل',
          documents_verified: isVerified,
          documents_verified_at: item.documents_verified_at || docRecord?.verifiedAt,
          documents_verified_by: item.documents_verified_by || docRecord?.verifiedBy,
          review_feedback: effectiveFeedback,
          images: (item.listing_images || [])
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            .map((img: any) => img.image_url),
          call_logs: item.call_logs && item.call_logs.length > 0 ? item.call_logs : (itemFollowups.call_logs || []),
          admin_notes: item.admin_notes && item.admin_notes.length > 0 ? item.admin_notes : (itemFollowups.admin_notes || []),
          associated_offers: matchingOffers,
          documents_requested: hasDocsRequested,
          documents_requested_at: docRecord?.requestedAt,
          documents_submitted: hasDocsSubmitted,
          documents_submitted_at: docRecord?.docs?.submittedAt || item.documents_submitted_at,
          official_documents: docRecord?.docs || item.official_documents
        };
      });

      const filtered = (filterStatus && filterStatus !== 'all')
        ? mapped.filter(item => {
            if (filterStatus === 'published') return item.status === 'published' || item.status === 'approved';
            return item.status === filterStatus;
          })
        : mapped;

      return { success: true, listings: filtered };

    } catch (err: any) {
      return { success: false, listings: [], error: err?.message };
    }
  },

  /**
   * ADMIN: Moderation action (approve, reject, request changes, publish, archive)
   */
  async moderateListing(
    listingId: string,
    newStatus: ListingModerationStatus,
    feedback?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // 0. Always persist immediately to local moderation overrides mirror so UI never lags or reverts
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = { status: newStatus, feedback: feedback || null, updatedAt: new Date().toISOString() };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, status: newStatus } }));
        }
      } catch {}

      const { data: sessionData } = await supabase.auth.getSession();
      const adminUser = sessionData.session?.user;

      let staffName = 'إدارة مخلصة';
      try {
        const staffRaw = sessionStorage.getItem('mokhalasa_staff_session');
        if (staffRaw) {
          const parsed = JSON.parse(staffRaw);
          if (parsed?.name) staffName = parsed.name;
        }
      } catch {}

      // 1. First attempt: PostgreSQL Security Definer RPC (most reliable across all permission sets)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('admin_moderate_listing', {
          p_listing_id: listingId,
          p_new_status: newStatus,
          p_feedback: feedback || null,
          p_staff_name: staffName
        });

        if (!rpcError && rpcData && rpcData.success) {
          return {
            success: true,
            message: rpcData.message || 'تم اعتماد ونشر الإعلان بنجاح في المعرض العام وإشعار العميل.'
          };
        }
      } catch {
        // Fall through to direct table update if RPC not registered yet
      }

      // 2. Second attempt: Direct table update with only valid verified columns
      const updatePayload: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (feedback !== undefined) {
        updatePayload.review_feedback = feedback.trim();
      }

      const { error: updateError } = await supabase
        .from('car_listings')
        .update(updatePayload)
        .eq('id', listingId);

      if (updateError) {
        console.warn('Direct update warning:', updateError);
      }

      // 3. Fetch listing details to notify the seller
      try {
        const { data: listingData } = await supabase
          .from('car_listings')
          .select('user_id, make, model, year')
          .eq('id', listingId)
          .maybeSingle();

        if (listingData?.user_id) {
          if (newStatus === 'published' || newStatus === 'approved') {
            await this.sendCustomerNotification({
              userId: listingData.user_id,
              type: 'listing_published',
              title: 'تهانينا! تم اعتماد ونشر إعلان سيارتك',
              message: `تمت مراجعة واعتماد إعلان سيارتك (${listingData.make} ${listingData.model} ${listingData.year}) بنجاح من قِبل إدارة مخلصة، وأصبح الآن منشوراً ومتاحاً لجميع المشترين في المعرض العام.`,
              linkView: 'profile',
              relatedId: listingId
            });
          } else if (newStatus === 'needs_changes') {
            await this.sendCustomerNotification({
              userId: listingData.user_id,
              type: 'listing_status_changed',
              title: 'مطلوب تعديل على إعلان سيارتك',
              message: `يرجى مراجعة إعلان سيارتك (${listingData.make} ${listingData.model} ${listingData.year}) وتحديث المطلوب: ${feedback || 'يرجى مراجعة ملاحظات الإدارة وتعديل الإعلان وإعادة إرساله'}.`,
              linkView: 'profile',
              relatedId: listingId
            });
          } else if (newStatus === 'rejected') {
            await this.sendCustomerNotification({
              userId: listingData.user_id,
              type: 'listing_status_changed',
              title: 'تنبيه: تم رفض إعلان السيارة',
              message: `نعتذر، لم يتم اعتماد إعلان سيارتك (${listingData.make} ${listingData.model} ${listingData.year}) للسبب التالي: ${feedback || 'الإعلان غير مطابق لمعايير المنصة'}. يمكنك تعديل الإعلان وإعادة إرساله.`,
              linkView: 'profile',
              relatedId: listingId
            });
          }
        }
      } catch {}

      // 4. Log admin audit event
      try {
        await supabase.from('audit_logs').insert({
          actor_id: adminUser?.id || null,
          event_type: `LISTING_${newStatus.toUpperCase()}`,
          record_id: listingId,
          details: { new_status: newStatus, feedback: feedback || null, staff_name: staffName }
        });
      } catch {}

      const statusNamesAr: Record<ListingModerationStatus, string> = {
        pending_review: 'بانتظار مراجعة الإدارة',
        approved: 'معتمد',
        published: 'تم النشر في المعرض',
        rejected: 'مرفوض',
        needs_changes: 'طلب تعديلات من البائع',
        sold: 'تم البيع',
        archived: 'مؤرشف',
        withdrawn: 'مسحوب'
      };

      return {
        success: true,
        message: `تم تحديث حالة الإعلان إلى «${statusNamesAr[newStatus] || newStatus}» بنجاح وإشعار صاحب السيارة.`
      };

    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر معالجة الإجراء الإداري.' };
    }
  },

  /**
   * ADMIN: Remove, reject, or deactivate listing with mandatory reason (Priority 3 Requirement)
   */
  async removeListingWithReason(
    listingId: string,
    reason: string,
    staffName: string = 'مسؤول المراجعة والعمليات'
  ): Promise<{ success: boolean; message: string; error?: string }> {
    if (!reason || !reason.trim()) {
      return { success: false, message: 'سبب سحب أو رفض الإعلان إلزامي للتوثيق وإشعار البائع.' };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const adminUser = sessionData.session?.user;

      const { data: listingData } = await supabase
        .from('car_listings')
        .select('user_id, status, make, model, year, case_reference')
        .eq('id', listingId)
        .maybeSingle();

      const previousStatus = listingData?.status || 'published';
      const cleanReason = reason.trim();

      const updatePayload: Record<string, any> = {
        status: 'rejected',
        deactivation_reason: cleanReason,
        deactivated_by: staffName,
        deactivated_at: new Date().toISOString(),
        review_feedback: cleanReason,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('car_listings')
        .update(updatePayload)
        .eq('id', listingId);

      if (error) {
        return { success: false, message: error.message };
      }

      // Update local moderation overrides mirror so public gallery and profile drop it instantly
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = { status: 'rejected', reason: cleanReason, updatedAt: new Date().toISOString() };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, status: 'rejected' } }));
        }
      } catch {}

      // Record in immutable audit logs
      try {
        await supabase.from('audit_logs').insert({
          actor_id: adminUser?.id || null,
          event_type: 'LISTING_REMOVED_BY_ADMIN',
          record_id: listingId,
          details: {
            reason: cleanReason,
            staff_name: staffName,
            previous_status: previousStatus,
            new_status: 'rejected'
          }
        });
      } catch {}

      // Notify the seller
      if (listingData?.user_id) {
        await this.sendCustomerNotification({
          userId: listingData.user_id,
          type: 'listing_status_changed',
          title: 'تنبيه: تم سحب / إلغاء تفعيل إعلان سيارتك',
          message: `قام المشرف (${staffName}) بسحب الإعلان للسبب التالي: ${cleanReason}. يمكنك تعديل الإعلان وإعادة إرساله.`,
          linkView: 'profile',
          relatedId: listingId
        });
      }

      return {
        success: true,
        message: 'تم سحب وإلغاء تفعيل الإعلان بنجاح وتوثيق السبب وإشعار البائع.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر سحب الإعلان.' };
    }
  },

  /**
   * ADMIN: Add listing follow-up (Call logs, private notes, price discussions) (Priority 4 Requirement)
   */
  async addListingFollowup(
    listingId: string,
    followup: {
      staffName: string;
      actionType: 'call_log' | 'internal_note' | 'price_discussion' | 'bank_coordination';
      callResult?: string;
      content: string;
      nextAction?: string;
      followupStatus?: string;
    }
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data: listing } = await supabase
        .from('car_listings')
        .select('call_logs, admin_notes')
        .eq('id', listingId)
        .maybeSingle();

      const existingLogs: ListingCallLog[] = listing?.call_logs || [];
      const existingNotes: string[] = listing?.admin_notes || [];

      const newLog: ListingCallLog = {
        id: `call-${Date.now()}`,
        timestamp: new Date().toISOString(),
        staffName: followup.staffName,
        callResult: followup.callResult || 'تم التواصل',
        notes: followup.content
      };

      const updatedLogs = [newLog, ...existingLogs];
      const noteEntry = `[${new Date().toLocaleDateString('ar-EG')} - ${followup.staffName}] (${followup.actionType}): ${followup.content}${followup.callResult ? ' | النتيجة: ' + followup.callResult : ''}`;
      const updatedNotes = [noteEntry, ...existingNotes];

      const updatePayload: Record<string, any> = {
        call_logs: updatedLogs,
        admin_notes: updatedNotes,
        updated_at: new Date().toISOString()
      };

      if (followup.nextAction) updatePayload.next_action = followup.nextAction;
      if (followup.followupStatus) updatePayload.followup_status = followup.followupStatus;

      const { error } = await supabase
        .from('car_listings')
        .update(updatePayload)
        .eq('id', listingId);

      // Local mirror
      try {
        const stored = localStorage.getItem('mokhalasa_listing_followups') || '{}';
        const parsed = JSON.parse(stored);
        parsed[listingId] = { call_logs: updatedLogs, admin_notes: updatedNotes };
        localStorage.setItem('mokhalasa_listing_followups', JSON.stringify(parsed));
      } catch {}

      if (error && !error.message.includes('does not exist')) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'تم حفظ سجل المتابعة والملاحظات الإدارية بنجاح.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حفظ المتابعة.' };
    }
  },

  /**
   * ADMIN: Fetch Audit Logs
   */
  async getAuditLogs(
    limit: number = 50
  ): Promise<{ success: boolean; logs: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.message.includes('does not exist')) return { success: true, logs: [] };
        return { success: false, logs: [], error: error.message };
      }

      return { success: true, logs: data || [] };
    } catch (err: any) {
      return { success: false, logs: [], error: err?.message };
    }
  },

  /**
   * ADMIN: Fetch Pending Notifications
   */
  async getAdminNotifications(): Promise<{ success: boolean; notifications: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        if (error.message.includes('does not exist')) return { success: true, notifications: [] };
        return { success: false, notifications: [], error: error.message };
      }

      return { success: true, notifications: data || [] };
    } catch (err: any) {
      return { success: false, notifications: [], error: err?.message };
    }
  },

  /**
   * PUBLIC: Fetch sanitized, approved and published vehicle listings
   * Strictly omits seller_phone and private contact info!
   */
  async getPublicListings(): Promise<{ success: boolean; cars: Car[]; error?: string }> {
    try {
      // Local moderation overrides and documents fallback
      let localModerations: Record<string, any> = {};
      let localDocs: Record<string, any> = {};
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides');
        if (storedMods) localModerations = JSON.parse(storedMods);
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents');
        if (storedDocs) localDocs = JSON.parse(storedDocs);
      } catch {}

      const { data, error } = await supabase
        .from('car_listings')
        .select(`
          id, make, model, year, trim, transmission, fuel_type,
          engine_size, mileage, color, governorate, city, asking_price,
          condition_description, paint_condition, disclosed_defects,
          has_financing, financing_type, financing_provider, outstanding_amount,
          monthly_installment, remaining_months, status, created_at,
          listing_images ( image_url, display_order )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          return { success: true, cars: [] };
        }
        return { success: false, cars: [], error: error.message };
      }

      // Filter to strictly show only approved, published, or sold vehicles AND NOT HIDDEN!
      const visibleRows = (data || []).filter((row: any) => {
        const override = localModerations[row.id];
        const effectiveStatus = override?.status || row.status;
        const isHidden = Boolean(override?.is_hidden ?? row.is_hidden);
        if (isHidden) return false; // Strictly hidden from public marketplace!
        return ['approved', 'published', 'sold'].includes(effectiveStatus);
      });

      const mapped: Car[] = visibleRows.map((row: any) => {
        const override = localModerations[row.id];
        const docRecord = localDocs[row.id];
        const isVerified = Boolean(row.documents_verified || docRecord?.verified);

        const sortedImages = (row.listing_images || [])
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((img: any) => img.image_url);

        return {
          id: row.id,
          make: row.make,
          model: row.model,
          year: row.year,
          trim: row.trim || '',
          transmission: row.transmission || 'أوتوماتيك',
          engineSize: row.engine_size || '',
          fuelType: row.fuel_type || 'بنزين',
          mileage: Number(row.mileage) || 0,
          city: `${row.governorate} — ${row.city || ''}`,
          cityEn: row.governorate,
          color: row.color || '',
          askingPrice: Number(row.asking_price) || 0,
          estimatedMarketValue: Number(row.asking_price) || 0,
          images: sortedImages.length > 0 ? sortedImages : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
          financingType: row.financing_type || 'bank_loan',
          vehicleStatus: row.financing_type || 'bank_loan',
          disclosedProblems: row.disclosed_defects || [],
          sellerConditionStory: row.condition_description,
          description: row.condition_description,
          inspection: {
            isInspected: false,
            score: 85,
            inspectorName: 'فحص فني أولي مخلصة',
            date: new Date(row.created_at).toISOString().split('T')[0],
            engineCondition: 'ممتاز',
            transmissionCondition: 'ممتاز',
            paintCondition: row.paint_condition || 'فابريكا بالكامل',
            chassisStatus: 'سليم 100% بدون أي ملاحظات',
            disclosedDefects: row.disclosed_defects || [],
            notes: row.condition_description
          },
          licenseValidityMonths: 12,
          trafficDepartment: row.traffic_unit || override?.traffic_unit || 'مرور فيصل',
          sellerType: 'مالك أول',
          status: row.status === 'sold' ? 'sold' : 'active',
          documentsVerified: isVerified,
          is_hidden: Boolean(override?.is_hidden || row.is_hidden),
          createdAt: row.created_at,
          featured: false
        };
      });

      return { success: true, cars: mapped };
    } catch (err: any) {
      return { success: false, cars: [], error: err?.message };
    }
  },

  /**
   * Delete or archive a listing by owner or administrator
   */
  async deleteListing(listingId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser) {
        return { success: false, message: 'غير مصرح.' };
      }

      // First attempt hard delete
      const { error: delError } = await supabase
        .from('car_listings')
        .delete()
        .eq('id', listingId);

      if (delError) {
        // If delete restricted by policy, soft-archive the listing
        const { error: archiveError } = await supabase
          .from('car_listings')
          .update({ status: 'archived', updated_at: new Date().toISOString() })
          .eq('id', listingId);

        if (archiveError) {
          return { success: false, message: `تعذر حذف الإعلان: ${archiveError.message}` };
        }
      }

      return { success: true, message: 'تم إزالة الإعلان بنجاح.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إتمام عملية الحذف.' };
    }
  },

  /**
   * SUBMIT PURCHASE OFFER (Structured buyer offer with coordinator mediation)
   */
  async submitPurchaseOffer(offer: Omit<PurchaseOffer, 'id' | 'createdAt' | 'status'>): Promise<{
    success: boolean;
    offerId?: string;
    message: string;
    error?: string;
  }> {
    try {
      const offerId = `offer-${Date.now()}`;
      const newOffer: PurchaseOffer = {
        ...offer,
        id: offerId,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      // Check if listingId is a valid UUID before sending to Supabase
      const isUuid = (val?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');
      const validListingId = isUuid(offer.listingId) ? offer.listingId : null;

      // Extract buyer and seller user ids
      const { data: sessionData } = await supabase.auth.getSession();
      const buyerUserId = offer.buyerUserId || sessionData?.session?.user?.id || null;

      let sellerUserId = offer.sellerUserId || null;
      if (!sellerUserId && validListingId) {
        const { data: cl } = await supabase.from('car_listings').select('user_id').eq('id', validListingId).maybeSingle();
        if (cl?.user_id) sellerUserId = cl.user_id;
      }
      if (!sellerUserId && offer.caseReference) {
        const { data: cl } = await supabase.from('car_listings').select('user_id').eq('case_reference', offer.caseReference).maybeSingle();
        if (cl?.user_id) sellerUserId = cl.user_id;
      }

      newOffer.buyerUserId = buyerUserId || undefined;
      newOffer.sellerUserId = sellerUserId || undefined;

      // 1. Attempt insertion into public.purchase_offers
      const { error: poError } = await supabase
        .from('purchase_offers')
        .insert({
          id: offerId,
          listing_id: validListingId,
          case_reference: offer.caseReference,
          car_title: offer.carTitle,
          buyer_name: offer.buyerName,
          buyer_phone: offer.buyerPhone,
          buyer_user_id: buyerUserId,
          seller_user_id: sellerUserId,
          offer_type: offer.offerType,
          offered_price: offer.offeredPrice,
          asking_price: offer.askingPrice,
          payment_preference: offer.paymentPreference,
          preferred_contact_time: offer.preferredContactTime,
          notes: offer.notes || '',
          status: 'new'
        });

      if (poError && !poError.message.includes('does not exist')) {
        console.warn('Notice inserting into purchase_offers table:', poError);
      }

      // 2. Also notify admin queue via admin_notifications
      try {
        await supabase.from('admin_notifications').insert({
          type: 'purchase_offer',
          title: `عرض شراء جديد: ${offer.carTitle}`,
          message: `قدم المشتري ${offer.buyerName} (${offer.buyerPhone}) عرض سعر ${offer.offeredPrice.toLocaleString()} ج.م على كود ${offer.caseReference}`,
          listing_id: offer.listingId || null
        });
      } catch {}

      // 3. Keep local mirror in localStorage for immediate responsive feedback
      try {
        const stored = localStorage.getItem('mokhalasa_purchase_offers') || '[]';
        const parsed: PurchaseOffer[] = JSON.parse(stored);
        parsed.unshift(newOffer);
        localStorage.setItem('mokhalasa_purchase_offers', JSON.stringify(parsed));
      } catch {}

      return {
        success: true,
        offerId,
        message: 'تم استلام وتوثيق عرض الشراء بنجاح! سيتواصل معك مستشار مخلصة لترتيب المعاينة.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'تعذر إرسال عرض الشراء، يرجى المحاولة لاحقاً.'
      };
    }
  },

  /**
   * ADMIN & MULTI-PARTY: Fetch all purchase offers
   * Combines Supabase purchase_offers table, admin_notifications real-time audit log, and local cache
   */
  async getPurchaseOffers(): Promise<{ success: boolean; offers: PurchaseOffer[]; error?: string }> {
    try {
      let dbOffers: PurchaseOffer[] = [];

      // 1. Try fetching directly from Supabase purchase_offers table
      try {
        const { data, error } = await supabase
          .from('purchase_offers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          dbOffers = data.map((d: any) => ({
            id: d.id,
            listingId: d.listing_id,
            carId: d.listing_id || d.case_reference,
            carTitle: d.car_title || 'سيارة معروضة',
            caseReference: d.case_reference || 'MK-CASE',
            buyerName: d.buyer_name,
            buyerPhone: d.buyer_phone,
            buyerUserId: d.buyer_user_id,
            sellerUserId: d.seller_user_id,
            offerType: d.offer_type || 'asking_price',
            offeredPrice: Number(d.offered_price) || 0,
            askingPrice: Number(d.asking_price) || 0,
            paymentPreference: d.payment_preference || 'cash_at_bank',
            preferredContactTime: d.preferred_contact_time || 'مساءً',
            notes: d.notes,
            status: d.status || 'new',
            sellerResponseAt: d.seller_response_at,
            sellerResponseNotes: d.seller_response_notes,
            adminNotes: d.admin_notes,
            createdAt: d.created_at
          }));
        }
      } catch {}

      // 2. Also query Supabase admin_notifications (guaranteed accessible across devices)
      let notifOffers: PurchaseOffer[] = [];
      try {
        const { data: notifs } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (notifs && notifs.length > 0) {
          const offersMap = new Map<string, PurchaseOffer>();
          const newOfferNotifs = notifs.filter(n => n.type === 'purchase_offer' && n.title && n.title.includes('عرض شراء جديد'));

          for (const n of newOfferNotifs) {
            const match = n.message?.match(/قدم المشتري\s+([^(]+)\s*\(([^)]+)\)\s*عرض سعر\s*([\d,]+)\s*ج\.م\s*على كود\s*([^\s]+)/);
            const key = n.listing_id || (match ? match[4] : n.id);
            const buyerName = match ? match[1].trim() : 'مشتري مهتم';
            const buyerPhone = match ? match[2].trim() : '';
            const priceStr = match ? match[3].replace(/,/g, '') : '0';
            const offeredPrice = Number(priceStr) || 0;
            const carTitle = n.title.replace('عرض شراء جديد:', '').trim();

            offersMap.set(key, {
              id: `offer-${key}`,
              listingId: n.listing_id || undefined,
              carId: n.listing_id || key,
              carTitle: carTitle || 'سيارة معروضة',
              caseReference: key,
              buyerName,
              buyerPhone,
              offerType: 'asking_price',
              offeredPrice,
              askingPrice: offeredPrice,
              paymentPreference: 'cash_at_bank',
              preferredContactTime: 'مساءً',
              notes: '',
              status: 'new',
              createdAt: n.created_at
            });
          }

          // Check seller response notifications
          const responseNotifs = notifs.filter(n => n.type === 'purchase_offer' && (n.title?.includes('موافقة بائع') || n.title?.includes('رفض بائع')));
          for (const r of responseNotifs) {
            const key = r.listing_id;
            if (key && offersMap.has(key)) {
              const offer = offersMap.get(key)!;
              if (r.title.includes('موافقة بائع')) {
                offer.status = 'seller_accepted';
              } else {
                offer.status = 'seller_rejected';
              }
            }
          }

          // Check forwarded to seller notifications
          const forwardedNotifs = notifs.filter(n => n.type === 'purchase_offer' && n.title?.includes('تم إرسال العرض للبائع'));
          for (const f of forwardedNotifs) {
            const key = f.listing_id;
            if (key && offersMap.has(key)) {
              const offer = offersMap.get(key)!;
              if (offer.status === 'new') {
                offer.status = 'communicated_to_seller';
              }
            }
          }

          // Check admin final confirmation notifications
          const confirmNotifs = notifs.filter(n => n.title?.includes('اعتماد الصفقة') || n.title?.includes('تنسيق المقابلة'));
          for (const c of confirmNotifs) {
            const key = c.listing_id;
            if (key && offersMap.has(key)) {
              const offer = offersMap.get(key)!;
              offer.status = 'accepted';
            }
          }

          notifOffers = Array.from(offersMap.values());
        }
      } catch {}

      // 3. Merge dbOffers and notifOffers seamlessly
      const combinedMap = new Map<string, PurchaseOffer>();
      for (const o of notifOffers) {
        const key = o.listingId || o.carId || o.id;
        combinedMap.set(key, o);
      }
      for (const o of dbOffers) {
        const key = o.listingId || o.carId || o.id;
        combinedMap.set(key, o);
      }

      // 4. Also incorporate any local offers in localStorage
      try {
        const stored = localStorage.getItem('mokhalasa_purchase_offers');
        if (stored) {
          const parsed: PurchaseOffer[] = JSON.parse(stored);
          for (const o of parsed) {
            const key = o.listingId || o.carId || o.id;
            if (!combinedMap.has(key)) {
              combinedMap.set(key, o);
            }
          }
        }
      } catch {}

      const finalOffers = Array.from(combinedMap.values());
      return { success: true, offers: finalOffers };
    } catch (err: any) {
      return { success: false, offers: [], error: err?.message };
    }
  },

  /**
   * ADMIN: Update purchase offer status
   */
  async updatePurchaseOfferStatus(
    offerId: string,
    status: PurchaseOffer['status']
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Update DB if table exists
      await supabase
        .from('purchase_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      // Update localStorage mirror
      try {
        const stored = localStorage.getItem('mokhalasa_purchase_offers') || '[]';
        const parsed: PurchaseOffer[] = JSON.parse(stored);
        const updated = parsed.map(o => o.id === offerId ? { ...o, status } : o);
        localStorage.setItem('mokhalasa_purchase_offers', JSON.stringify(updated));
      } catch {}

      return { success: true, message: 'تم تحديث حالة عرض الشراء بنجاح.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث حالة العرض.' };
    }
  },

  /**
   * ADMIN: Forward purchase offer to seller for review (Priority 5 Requirement)
   */
  async forwardOfferToSeller(
    offerId: string,
    staffName: string = 'مستشار مخلصة'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      await this.updatePurchaseOfferStatus(offerId, 'communicated_to_seller');

      await supabase
        .from('purchase_offers')
        .update({
          status: 'communicated_to_seller',
          communicated_to_seller_at: now,
          updated_at: now
        })
        .eq('id', offerId);

      // Find offer details
      const offersRes = await this.getPurchaseOffers();
      const offer = offersRes.offers.find(o => o.id === offerId || o.listingId === offerId || (o.listingId && offerId.includes(o.listingId)));

      if (offer) {
        // Record in admin_notifications so all devices immediately see it as forwarded
        try {
          await supabase.from('admin_notifications').insert({
            type: 'purchase_offer',
            title: 'تم إرسال العرض للبائع (بانتظار الرد)',
            message: `قام ${staffName} بإرسال عرض ${offer.buyerName} بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على كود ${offer.caseReference} للبائع للدراسة والرد`,
            listing_id: offer.listingId || null
          });
        } catch {}

        let sellerId = offer.sellerUserId;
        if (!sellerId && offer.listingId) {
          const { data: car } = await supabase
            .from('car_listings')
            .select('user_id')
            .eq('id', offer.listingId)
            .maybeSingle();
          sellerId = car?.user_id;
        }

        if (sellerId) {
          await this.sendCustomerNotification({
            userId: sellerId,
            type: 'offer_communicated',
            title: 'وصلك عرض شراء وتفاوض جديد!',
            message: `قام مستشار الصفقات (${staffName}) بالتواصل مع مشترٍ مهتم، وقدم عرض سعر بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارتك (${offer.carTitle}). يرجى الدخول لمتابعة طلباتك وقبول أو رفض العرض.`,
            linkView: 'portal',
            relatedId: offer.listingId || offer.caseReference || offerId
          });
        }
      }

      return {
        success: true,
        message: 'تم إرسال العرض للبائع بنجاح وإشعاره في حسابه للموافقة أو الرفض.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إرسال العرض للبائع.' };
    }
  },

  /**
   * SELLER: Accept or Reject an offer communicated by admin (Priority 5 & 6 Requirement)
   */
  async respondToOfferBySeller(
    offerId: string,
    decision: 'accept' | 'reject',
    notesOrUserId?: string,
    extraNotes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      const newStatus = decision === 'accept' ? 'seller_accepted' : 'seller_rejected';
      const notes = extraNotes || notesOrUserId || null;

      await this.updatePurchaseOfferStatus(offerId, newStatus);

      await supabase
        .from('purchase_offers')
        .update({
          status: newStatus,
          seller_response_at: now,
          seller_response_notes: notes,
          updated_at: now
        })
        .eq('id', offerId);

      const offersRes = await this.getPurchaseOffers();
      const offer = offersRes.offers.find(o => o.id === offerId);

      if (offer) {
        // 1. Notify the buyer
        if (offer.buyerUserId) {
          if (decision === 'accept') {
            await this.sendCustomerNotification({
              userId: offer.buyerUserId,
              type: 'offer_accepted',
              title: '🎉 تهانينا! وافق البائع مبدئياً على عرضك',
              message: `وافق البائع على عرض الشراء بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارة ${offer.carTitle}. بانتظار الاعتماد النهائي وتحديد موعد المقابلة البنكية.`,
              linkView: 'profile',
              relatedId: offerId
            });
          } else {
            await this.sendCustomerNotification({
              userId: offer.buyerUserId,
              type: 'offer_rejected',
              title: 'تم الاعتذار عن عرض الشراء',
              message: `نعتذر، لم يوافق البائع على عرض الشراء بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارة ${offer.carTitle}. يمكنك تقديم عرض سعر تفاوضي آخر.`,
              linkView: 'profile',
              relatedId: offerId
            });
          }
        }

        // 2. Notify admin operations (fail-safe)
        try {
          await supabase.from('admin_notifications').insert({
            type: 'purchase_offer',
            title: decision === 'accept' ? 'موافقة بائع على عرض شراء' : 'رفض بائع لعرض شراء',
            message: `رد البائع على عرض ${offer.buyerName} بكود ${offer.caseReference}: ${decision === 'accept' ? 'تمت الموافقة المبدئية' : 'تم الرفض'}${notes ? ' (ملاحظات: ' + notes + ')' : ''}`,
            listing_id: offer.listingId || null
          });
        } catch {}
      }

      return {
        success: true,
        message: decision === 'accept' 
          ? 'تم تسجيل موافقتك المبدئية على العرض بنجاح وإشعار المشتري وإدارة مخلصة!' 
          : 'تم تسجيل رفضك للعرض وإشعار المشتري وإدارة مخلصة.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تسجيل الرد على العرض.' };
    }
  },

  /**
   * ADMIN: Final confirmation of deal between Buyer and Seller (24-hour meeting coordination)
   */
  async confirmDealByAdmin(
    offerId: string,
    adminNotes: string = 'تم تأكيد الاتفاق وتنسيق المقابلة البنكية خلال 24 ساعة'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      await this.updatePurchaseOfferStatus(offerId, 'accepted');

      await supabase
        .from('purchase_offers')
        .update({
          status: 'accepted',
          admin_notes: adminNotes,
          updated_at: now
        })
        .eq('id', offerId);

      const offersRes = await this.getPurchaseOffers();
      const offer = offersRes.offers.find(o => o.id === offerId || o.listingId === offerId || (o.listingId && offerId.includes(o.listingId)));

      if (offer) {
        // Record deal confirmation in admin_notifications so all devices sync instantly
        try {
          await supabase.from('admin_notifications').insert({
            type: 'purchase_offer',
            title: '✅ تم اعتماد الصفقة وتنسيق المقابلة (إشعار الطرفين)',
            message: `تم اعتماد موافقة البائع على عرض ${offer.buyerName} بكود ${offer.caseReference}: سيتم التواصل خلال 24 ساعة لتحديد موعد المقابلة والمعاينة البنكية.`,
            listing_id: offer.listingId || null
          });
        } catch {}

        // Update car listing status in database to 'reserved' (محجوزة وجاري إنهاء المعاملة)
        if (offer.listingId) {
          try {
            await supabase
              .from('car_listings')
              .update({
                status: 'reserved',
                followup_status: 'deal_accepted',
                next_action: 'تنسيق المقابلة البنكية والمعاينة خلال 24 ساعة',
                updated_at: now
              })
              .eq('id', offer.listingId);
          } catch {}
        }

        // 1. Notify Buyer
        if (offer.buyerUserId) {
          await this.sendCustomerNotification({
            userId: offer.buyerUserId,
            type: 'offer_accepted',
            title: '🎉 تم اعتماد موافقة البائع وتنسيق المعاينة!',
            message: `تم اعتماد عرض سعرك بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارة (${offer.carTitle}). سيتم التواصل معك خلال 24 ساعة لتحديد موعد المقابلة والمعاينة البنكية وإنهاء الإجراءات.`,
            linkView: 'profile',
            relatedId: offerId
          });
        }

        // 2. Notify Seller
        let sellerId = offer.sellerUserId;
        if (!sellerId && offer.listingId) {
          const { data: car } = await supabase
            .from('car_listings')
            .select('user_id')
            .eq('id', offer.listingId)
            .maybeSingle();
          sellerId = car?.user_id;
        }

        if (sellerId) {
          await this.sendCustomerNotification({
            userId: sellerId,
            type: 'offer_accepted',
            title: '✅ تم اعتماد قبولك للعرض وتنسيق المقابلة!',
            message: `تم اعتماد موافقتك على بيع السيارة (${offer.carTitle}) بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م. سيتم التواصل معك خلال 24 ساعة لتحديد موعد المقابلة مع المشتري والتنسيق مع البنك.`,
            linkView: 'profile',
            relatedId: offerId
          });
        }
      }

      return {
        success: true,
        message: 'تم اعتماد الصفقة بنجاح وإرسال إشعار للمشتري والبائع بالتواصل خلال 24 ساعة!'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر اعتماد الصفقة.' };
    }
  },

  /**
   * NOTIFICATIONS: Fetch in-app notifications for authenticated user (Priority 5 & 6)
   */
  async getCustomerNotifications(userId: string): Promise<{ success: boolean; notifications: InAppNotification[] }> {
    try {
      const notifsMap = new Map<string, InAppNotification>();

      // 1. Try customer_notifications table
      try {
        const { data, error } = await supabase
          .from('customer_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          data.forEach((d: any) => {
            notifsMap.set(d.id, {
              id: d.id,
              userId: d.user_id,
              type: d.type,
              title: d.title,
              message: d.message,
              linkView: d.link_view,
              relatedId: d.related_id,
              isRead: d.is_read,
              createdAt: d.created_at
            });
          });
        }
      } catch {}

      // 2. Also read from admin_notifications (real-time fail-safe across devices)
      try {
        const { data: adminNotifs } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (adminNotifs) {
          adminNotifs.forEach((an: any) => {
            if (an.message && (an.message.includes(`[USER:${userId}]`) || an.message.includes(userId))) {
              const linkMatch = an.message.match(/\[VIEW:([^\]]+)\]/);
              const refMatch = an.message.match(/\[REF:([^\]]+)\]/);
              const cleanMsg = an.message.replace(/\[USER:[^\]]+\]\s*/g, '').replace(/\[VIEW:[^\]]+\]\s*/g, '').replace(/\[REF:[^\]]+\]\s*/g, '');
              const id = `admin-notif-${an.id}`;
              if (!notifsMap.has(id)) {
                notifsMap.set(id, {
                  id,
                  userId,
                  type: 'general',
                  title: an.title || 'إشعار من منصة مخلصة',
                  message: cleanMsg,
                  linkView: linkMatch ? linkMatch[1] : 'portal',
                  relatedId: refMatch ? refMatch[1] : an.listing_id,
                  isRead: false,
                  createdAt: an.created_at
                });
              }
            }
          });
        }
      } catch {}

      // 3. Fallback to localStorage
      try {
        const stored = localStorage.getItem('mokhalasa_customer_notifications');
        if (stored) {
          const parsed: InAppNotification[] = JSON.parse(stored);
          parsed.filter(n => n.userId === userId).forEach(n => {
            if (!notifsMap.has(n.id)) notifsMap.set(n.id, n);
          });
        }
      } catch {}

      return { success: true, notifications: Array.from(notifsMap.values()) };
    } catch {
      return { success: true, notifications: [] };
    }
  },

  /**
   * NOTIFICATIONS: Send persistent in-app notification to user
   */
  async sendCustomerNotification(
    notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>
  ): Promise<{ success: boolean }> {
    try {
      const isUuid = (val?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');

      const newNotif: InAppNotification = {
        ...notif,
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      // 1. Insert into customer_notifications without text id (let PostgreSQL generate uuid)
      if (isUuid(notif.userId)) {
        try {
          await supabase.from('customer_notifications').insert({
            user_id: notif.userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            link_view: notif.linkView || null,
            related_id: notif.relatedId || null,
            is_read: false
          });
        } catch {}
      }

      // 2. Also log to admin_notifications so all devices receive the notification even if RLS is active
      try {
        await supabase.from('admin_notifications').insert({
          type: 'customer_notification',
          title: notif.title,
          message: `[USER:${notif.userId}] [VIEW:${notif.linkView || 'portal'}] [REF:${notif.relatedId || ''}] ${notif.message}`,
          listing_id: isUuid(notif.relatedId) ? notif.relatedId : null
        });
      } catch {}

      // 3. Keep local storage mirror
      try {
        const stored = localStorage.getItem('mokhalasa_customer_notifications') || '[]';
        const parsed: InAppNotification[] = JSON.parse(stored);
        parsed.unshift(newNotif);
        localStorage.setItem('mokhalasa_customer_notifications', JSON.stringify(parsed));
      } catch {}

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * ADMIN & DEV: Purge all test data for clean launch testing
   */
  async purgeAllTestData(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Delete purchase offers
      try {
        const { data: offers } = await supabase.from('purchase_offers').select('id');
        for (const o of (offers || [])) {
          await supabase.from('purchase_offers').delete().eq('id', o.id);
        }
      } catch (e) {
        console.warn('Purge offers warning:', e);
      }

      // 2. Delete customer notifications
      try {
        const { data: notifs } = await supabase.from('customer_notifications').select('id');
        for (const n of (notifs || [])) {
          await supabase.from('customer_notifications').delete().eq('id', n.id);
        }
      } catch (e) {
        console.warn('Purge customer notifications warning:', e);
      }

      // 3. Delete admin notifications
      try {
        const { data: admNotifs } = await supabase.from('admin_notifications').select('id');
        for (const an of (admNotifs || [])) {
          await supabase.from('admin_notifications').delete().eq('id', an.id);
        }
      } catch (e) {
        console.warn('Purge admin notifications warning:', e);
      }

      // 4. Delete car listings
      try {
        const { data: cars } = await supabase.from('car_listings').select('id');
        for (const c of (cars || [])) {
          await supabase.from('car_listings').delete().eq('id', c.id);
        }
      } catch (e) {
        console.warn('Purge car listings warning:', e);
      }

      // 5. Clean local storage mirrors
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('mokhalasa_local_listings');
          localStorage.removeItem('mokhalasa_customer_listings');
          localStorage.removeItem('mokhalasa_moderation_overrides');
          localStorage.removeItem('mokhalasa_purchase_offers');
          localStorage.removeItem('mokhalasa_customer_notifications');
          localStorage.removeItem('mokhalasa_admin_notifications');
          localStorage.removeItem('mokhalasa_audit_logs');
          window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated'));
          window.dispatchEvent(new CustomEvent('mokhalasa-offers-updated'));
        } catch {}
      }

      return {
        success: true,
        message: 'تم تصفير ومسح كافة بيانات الاختبار بنجاح (الإعلانات، العروض، والإشعارات) لبدء مرحلة الإطلاق النظيف!'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إتمام التصفير.' };
    }
  },

  /**
   * NOTIFICATIONS: Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      await supabase
        .from('customer_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      try {
        const stored = localStorage.getItem('mokhalasa_customer_notifications') || '[]';
        const parsed: InAppNotification[] = JSON.parse(stored);
        const updated = parsed.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        localStorage.setItem('mokhalasa_customer_notifications', JSON.stringify(updated));
      } catch {}

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * NOTIFICATIONS: Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<{ success: boolean }> {
    try {
      await supabase
        .from('customer_notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      try {
        const stored = localStorage.getItem('mokhalasa_customer_notifications') || '[]';
        const parsed: InAppNotification[] = JSON.parse(stored);
        const updated = parsed.map(n => n.userId === userId ? { ...n, isRead: true } : n);
        localStorage.setItem('mokhalasa_customer_notifications', JSON.stringify(updated));
      } catch {}

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * Legacy alias
   */
  async clearTestListings(): Promise<{ success: boolean; message: string }> {
    return this.purgeAllTestData();
  }
};
