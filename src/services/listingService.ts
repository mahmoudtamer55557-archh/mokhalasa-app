/**
 * =====================================================================
 * MOKHALASA / KHUTWA — VEHICLE LISTINGS & MODERATION SERVICE
 * =====================================================================
 * Manages customer vehicle submissions, Supabase listings persistence,
 * image uploads, admin review workflow, and audit logging.
 */

import { supabase } from './supabaseClient';
import { Car, PurchaseOffer, InAppNotification, ListingCallLog } from '../types';
import {
  sendWhatsAppMessage,
  sendListingSubmittedWhatsApp,
  sendListingUpdatedWhatsApp,
  sendListingWithdrawnOrReactivatedWhatsApp,
  sendListingModerationWhatsApp,
  sendListingFeaturedWhatsApp,
  sendDocumentRequestedWhatsApp,
  sendDocumentUploadedWhatsApp,
  sendDocumentStatusWhatsApp,
  sendNegotiationOfferWhatsApp,
  sendOfferSubmittedBuyerConfirmationWhatsApp,
  sendOfferAcceptedToBuyerWhatsApp,
  sendOfferRejectedToBuyerWhatsApp,
  sendOfferAcceptedSellerConfirmationWhatsApp,
  sendOfferRejectedSellerConfirmationWhatsApp,
  sendDealConfirmedWhatsApp
} from './whatsappService';

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
  sale_type?: 'cash' | 'direct_installment' | 'bank_settlement';
  down_payment?: number;
  installment_period_months?: number;
  required_guarantees?: string[];
  is_direct_installment?: boolean;
  direct_installment_seller_type?: 'showroom' | 'individual';
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
  plate_number?: string;
  chassis_number?: string;
  contact_phone?: string;
  is_hidden?: boolean;
  is_featured?: boolean;
  featured_rank?: number;
  featured_tier?: 'top_3' | 'top_10' | 'standard';
  featured_scope?: 'all' | 'category_only' | 'both';
  featured_badge_text?: string;
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
    licenseFrontStatus?: 'pending' | 'verified' | 'rejected';
    licenseFrontRejectReason?: string;
    licenseBackUrl?: string;
    licenseBackStatus?: 'pending' | 'verified' | 'rejected';
    licenseBackRejectReason?: string;
    nationalIdUrl?: string;
    nationalIdStatus?: 'pending' | 'verified' | 'rejected';
    nationalIdRejectReason?: string;
    bankStatementUrl?: string;
    bankStatementStatus?: 'pending' | 'verified' | 'rejected';
    bankStatementRejectReason?: string;
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
  sale_type?: 'cash' | 'direct_installment' | 'bank_settlement';
  down_payment?: number;
  installment_period_months?: number;
  required_guarantees?: string[];
  is_direct_installment?: boolean;
  direct_installment_seller_type?: 'showroom' | 'individual';
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
          financing_type: submission.financing_type || (submission.sale_type === 'direct_installment' ? 'direct_installment' : (submission.sale_type === 'cash' ? 'fully_owned' : 'bank_loan')),
          financing_provider: submission.financing_provider || '',
          outstanding_amount: submission.outstanding_amount || 0,
          monthly_installment: submission.monthly_installment || 0,
          remaining_months: submission.remaining_months || 0,
          seller_name: submission.seller_name || authUser.user_metadata?.full_name || 'مالك السيارة',
          seller_phone: submission.seller_phone || authUser.user_metadata?.phone || '',
          status: 'pending_review' as ListingModerationStatus
        };

        const directInstallmentFields = {
          sale_type: submission.sale_type || (submission.is_direct_installment ? 'direct_installment' : (submission.has_financing ? 'bank_settlement' : 'cash')),
          down_payment: submission.down_payment || 0,
          installment_period_months: submission.installment_period_months || 0,
          required_guarantees: submission.required_guarantees || [],
          is_direct_installment: Boolean(submission.is_direct_installment || submission.sale_type === 'direct_installment'),
          direct_installment_seller_type: submission.direct_installment_seller_type || 'individual'
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

        // Save traffic_unit and sale type/installment details to local override mirror so it's always remembered
        try {
          const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
          const parsed = JSON.parse(storedMods);
          parsed[listingId] = {
            ...(parsed[listingId] || {}),
            traffic_unit: submission.traffic_unit || 'مرور فيصل',
            ...directInstallmentFields
          };
          localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
        } catch {}

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
        }, true);

        // Send dedicated WhatsApp confirmation to seller phone with full details & links
        const saleTrackAr =
          submission.sale_type === 'direct_installment'
            ? 'تقسيط مباشر (بدون بنوك)'
            : submission.sale_type === 'cash'
            ? 'بيع كاش (ملكية خالصة)'
            : 'تسوية مديونية بنكية وفك حظر';

        if (row.seller_phone) {
          sendListingSubmittedWhatsApp(
            row.seller_phone,
            row.seller_name,
            `${submission.make} ${submission.model} ${submission.year}`,
            submission.asking_price,
            caseReference,
            saleTrackAr,
            listingId
          ).catch(err => console.warn('Listing submitted WhatsApp notice:', err));
        }

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
      let localFeatured: Record<string, any> = {};
      try {
        const stored = localStorage.getItem('mokhalasa_listing_followups');
        if (stored) localFollowups = JSON.parse(stored);
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides');
        if (storedMods) localModerations = JSON.parse(storedMods);
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents');
        if (storedDocs) localDocs = JSON.parse(storedDocs);
        const storedFeatured = localStorage.getItem('mokhalasa_featured_listings');
        if (storedFeatured) localFeatured = JSON.parse(storedFeatured);
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

        // Featured Settings Hydration
        const featRecord = localFeatured[item.id] || modOverride?.featuredConfig || {};
        const isFeatured = Boolean(featRecord.is_featured ?? item.is_featured ?? modOverride?.is_featured ?? item.featured);
        const featRank = isFeatured ? Number(featRecord.featured_rank ?? item.featured_rank ?? modOverride?.featured_rank ?? 1) : undefined;
        const featTier = isFeatured ? (featRecord.featured_tier ?? item.featured_tier ?? (featRank && featRank <= 3 ? 'top_3' : 'top_10')) : undefined;
        const featScope = isFeatured ? (featRecord.featured_scope ?? item.featured_scope ?? 'both') : undefined;
        const featBadge = isFeatured ? (featRecord.featured_badge_text ?? item.featured_badge_text) : undefined;

        return {
          ...item,
          status: effectiveStatus,
          is_hidden: isHidden,
          is_featured: isFeatured,
          featured_rank: featRank,
          featured_tier: featTier,
          featured_scope: featScope,
          featured_badge_text: featBadge,
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
          official_documents: docRecord?.docs || item.official_documents,
          sale_type: modOverride?.sale_type || item.sale_type || (modOverride?.is_direct_installment || item.is_direct_installment || item.financing_type === 'direct_installment' ? 'direct_installment' : (item.financing_type === 'fully_owned' || item.financing_type === 'cash' ? 'cash' : 'bank_settlement')),
          down_payment: modOverride?.down_payment ?? item.down_payment,
          installment_period_months: modOverride?.installment_period_months ?? item.installment_period_months,
          required_guarantees: modOverride?.required_guarantees || item.required_guarantees || [],
          is_direct_installment: Boolean(modOverride?.is_direct_installment ?? item.is_direct_installment ?? (item.financing_type === 'direct_installment')),
          direct_installment_seller_type: modOverride?.direct_installment_seller_type || item.direct_installment_seller_type
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
          }, true);
        } catch {}
      }

      const sellerPhone = listingInfo?.seller_phone || authUser?.user_metadata?.phone;
      if (sellerPhone) {
        sendListingWithdrawnOrReactivatedWhatsApp(sellerPhone, carTitle, 'withdrawn', caseCode).catch(() => {});
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
   * SELLER: Reactivate a previously withdrawn listing, resubmitting for review
   */
  async reactivateListing(
    listingId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      const now = new Date().toISOString();

      let listingInfo: any = null;
      try {
        const { data: fetched } = await supabase
          .from('car_listings')
          .select('*')
          .eq('id', listingId)
          .maybeSingle();
        listingInfo = fetched;
      } catch {}

      // 1. Update Supabase car_listings to pending_review and unhide
      try {
        await supabase
          .from('car_listings')
          .update({
            status: 'pending_review',
            is_hidden: false,
            updated_at: now
          })
          .eq('id', listingId);
      } catch (e) {
        console.warn('Supabase reactivate update warning:', e);
      }

      // 2. Update local moderation overrides mirror
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = {
          ...(parsed[listingId] || {}),
          status: 'pending_review',
          is_hidden: false,
          updatedAt: now
        };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
      } catch {}

      // 3. Update local listings cache
      try {
        const localListings = localStorage.getItem('mokhalasa_local_listings');
        if (localListings) {
          const parsed = JSON.parse(localListings);
          const updated = parsed.map((item: any) => 
            item.id === listingId ? { ...item, status: 'pending_review', is_hidden: false, updated_at: now } : item
          );
          localStorage.setItem('mokhalasa_local_listings', JSON.stringify(updated));
        }
      } catch {}

      // 4. Alert Admin Dashboard in admin_notifications
      const sellerDisplayName = listingInfo?.seller_name || authUser?.user_metadata?.full_name || 'البائع';
      const carTitle = listingInfo ? `${listingInfo.make} ${listingInfo.model} ${listingInfo.year}` : 'السيارة';
      const caseCode = listingInfo?.case_reference || listingId.slice(0, 8);

      try {
        await supabase.from('admin_notifications').insert({
          type: 'general',
          title: '🔄 طلب إعادة تنشيط إعلان مسحوب',
          message: `طلب العميل ${sellerDisplayName} إعادة تنشيط ونشر إعلان سيارته المسحوب سابقاً (${carTitle} #${caseCode}). الإعلان الآن قيد المراجعة في لوحة الإدارة.`,
          listing_id: listingId
        });
      } catch {}

      const sellerPhone = listingInfo?.seller_phone || authUser?.user_metadata?.phone;
      if (sellerPhone) {
        sendListingWithdrawnOrReactivatedWhatsApp(sellerPhone, carTitle, 'reactivated', caseCode).catch(() => {});
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, status: 'pending_review' } }));
      }

      return {
        success: true,
        message: 'تمت إعادة تنشيط الإعلان بنجاح وإرساله للمراجعة السريعة من فريق العمليات.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إعادة تنشيط الإعلان.' };
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
          .select('user_id, make, model, year, seller_phone')
          .eq('id', listingId)
          .maybeSingle();

        const carTitle = carData ? `${carData.make} ${carData.model} ${carData.year || ''}`.trim() : 'سيارتك';

        if (carData?.seller_phone) {
          sendDocumentStatusWhatsApp(
            carData.seller_phone,
            carTitle,
            isVerified ? 'approved' : 'rejected',
            adminNotes
          ).catch(err => console.warn('Document status WhatsApp notice:', err));
        }

        if (carData?.user_id) {
          if (isVerified) {
            await this.sendCustomerNotification({
              userId: carData.user_id,
              type: 'listing_status_changed',
              title: '🎉 تم تدقيق وتوثيق أوراق سيارتك الرسمية بنجاح!',
              message: `تم فحص رخصة السيارة والمستندات ومطابقتها من قبل إدارة مخلصة، ومُنح إعلانك (${carData.make} ${carData.model}) شارة «أوراق رسمية مفحوصة وموثقة إدارياً (مضمونة بنكياً وقانونياً)».`,
              linkView: 'profile',
              relatedId: listingId
            }, true);
          } else {
            await this.sendCustomerNotification({
              userId: carData.user_id,
              type: 'listing_status_changed',
              title: '⚠️ مطلوب إعادة رفع أو توضيح المستندات',
              message: `ملاحظة الإدارة على مستندات (${carData.make} ${carData.model}): ${adminNotes || 'يرجى إعادة رفع صور أوضح للرخصة أو البطاقة'}.`,
              linkView: 'profile',
              relatedId: listingId
            }, true);
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

      // Send WhatsApp confirmation to seller
      try {
        const { data: carRow } = await supabase
          .from('car_listings')
          .select('make, model, year, asking_price, seller_name, seller_phone, case_reference')
          .eq('id', listingId)
          .maybeSingle();
        const sellerPhone = updates.seller_phone || carRow?.seller_phone || authUser.user_metadata?.phone;
        if (sellerPhone) {
          sendListingUpdatedWhatsApp(
            sellerPhone,
            carRow?.seller_name || authUser.user_metadata?.full_name || 'مالك السيارة',
            carRow ? `${carRow.make} ${carRow.model} ${carRow.year}` : 'سيارتك',
            updates.asking_price ?? carRow?.asking_price ?? 0,
            carRow?.case_reference || listingId.slice(0, 8)
          ).catch(() => {});
        }
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
          .select('user_id, make, model, year, seller_phone')
          .eq('id', listingId)
          .maybeSingle();

        const carTitle = listingData ? `${listingData.make} ${listingData.model} ${listingData.year || ''}`.trim() : 'سيارتك';

        if (listingData?.seller_phone) {
          sendDocumentRequestedWhatsApp(listingData.seller_phone, carTitle, notes).catch(() => {});
        }

        if (listingData?.user_id) {
          await this.sendCustomerNotification({
            userId: listingData.user_id,
            type: 'listing_status_changed',
            title: '📄 مطلوب رفع المستندات الرسمية لسيارتك',
            message: `إدارة مخلصة تطلب منك رفع صور المستندات الرسمية (الرخصة، بطاقة الرقم القومي، وبيان المديونية البنكي) لسيارتك (${listingData.make} ${listingData.model}). يرجى الدخول لصفحة حسابك وإرفاقها.`,
            linkView: 'profile',
            relatedId: listingId
          }, true);
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
        const prevDocs = current.docs || {};

        // If replacing a previously rejected document, clear its rejection status
        const updatedDocs: any = {
          ...prevDocs,
          notes: docs.notes || prevDocs.notes,
          submittedAt: now
        };

        if (docs.licenseFrontUrl || docs.licenseUrl) {
          updatedDocs.licenseFrontUrl = docs.licenseFrontUrl || docs.licenseUrl;
          updatedDocs.licenseUrl = docs.licenseFrontUrl || docs.licenseUrl;
          if (updatedDocs.licenseFrontStatus === 'rejected') {
            updatedDocs.licenseFrontStatus = 'pending';
            delete updatedDocs.licenseFrontRejectReason;
          }
        }
        if (docs.licenseBackUrl) {
          updatedDocs.licenseBackUrl = docs.licenseBackUrl;
          if (updatedDocs.licenseBackStatus === 'rejected') {
            updatedDocs.licenseBackStatus = 'pending';
            delete updatedDocs.licenseBackRejectReason;
          }
        }
        if (docs.nationalIdUrl) {
          updatedDocs.nationalIdUrl = docs.nationalIdUrl;
          if (updatedDocs.nationalIdStatus === 'rejected') {
            updatedDocs.nationalIdStatus = 'pending';
            delete updatedDocs.nationalIdRejectReason;
          }
        }
        if (docs.bankStatementUrl) {
          updatedDocs.bankStatementUrl = docs.bankStatementUrl;
          if (updatedDocs.bankStatementStatus === 'rejected') {
            updatedDocs.bankStatementStatus = 'pending';
            delete updatedDocs.bankStatementRejectReason;
          }
        }

        parsed[listingId] = {
          ...current,
          docs: updatedDocs,
          verified: false // Await admin review
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

      // 3. Notify Admin in admin_notifications & send WhatsApp receipt to Seller
      try {
        await supabase.from('admin_notifications').insert({
          type: 'documents_uploaded',
          title: '📄 تم رفع مستندات رسمية جديدة للتدقيق',
          message: `قام العميل برفع الأوراق الرسمية (الرخصة/البطاقة/بيان البنك) للإعلان (كود: ${listingId.slice(0, 8)}). يمكنك مراجعتها وتدقيقها الآن في لوحة الإدارة لمنح شارة الثقة.`,
          listing_id: listingId
        });

        const { data: carRow } = await supabase
          .from('car_listings')
          .select('make, model, year, seller_phone')
          .eq('id', listingId)
          .maybeSingle();
        if (carRow?.seller_phone) {
          const uploadedCount = [docs.licenseFrontUrl || docs.licenseUrl, docs.licenseBackUrl, docs.nationalIdUrl, docs.bankStatementUrl].filter(Boolean).length;
          sendDocumentUploadedWhatsApp(
            carRow.seller_phone,
            `${carRow.make} ${carRow.model} ${carRow.year || ''}`.trim(),
            uploadedCount || undefined
          ).catch(() => {});
        }
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
   * ADMIN: Review a specific document (Approve or Reject with reason)
   */
  async reviewSpecificDocument(
    listingId: string,
    docField: 'licenseFront' | 'licenseBack' | 'nationalId' | 'bankStatement',
    decision: 'approve' | 'verify' | 'reject',
    rejectReason?: string,
    staffName: string = 'مسؤول تدقيق المستندات'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      const statusKey = `${docField}Status`;
      const reasonKey = `${docField}RejectReason`;

      const docNameMap: Record<string, string> = {
        licenseFront: 'رخصة السيارة (الوجه الأمامي)',
        licenseBack: 'رخصة السيارة (الوجه الخلفي)',
        nationalId: 'بطاقة الرقم القومي للمالك',
        bankStatement: 'بيان المديونية / مخالصة البنك'
      };
      const docNameAr = docNameMap[docField] || 'المستند الرسمي';

      // 1. Update localStorage mirror
      let isAllVerified = false;
      try {
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents') || '{}';
        const parsed = JSON.parse(storedDocs);
        const current = parsed[listingId] || {};
        const currentDocObj = { ...(current.docs || {}) };

        if (decision === 'approve' || decision === 'verify') {
          currentDocObj[statusKey] = 'verified';
          delete currentDocObj[reasonKey];
        } else {
          currentDocObj[statusKey] = 'rejected';
          currentDocObj[reasonKey] = rejectReason || 'يرجى إعادة رفع صورة واضحة ومطابقة للمواصفات.';
        }

        // Check if all available documents are verified
        isAllVerified = 
          (currentDocObj.licenseFrontStatus === 'verified' || !currentDocObj.licenseFrontUrl) &&
          (currentDocObj.licenseBackStatus === 'verified' || !currentDocObj.licenseBackUrl) &&
          (currentDocObj.nationalIdStatus === 'verified' || !currentDocObj.nationalIdUrl) &&
          (currentDocObj.bankStatementStatus === 'verified' || !currentDocObj.bankStatementUrl) &&
          (currentDocObj.licenseFrontStatus === 'verified' || currentDocObj.nationalIdStatus === 'verified');

        parsed[listingId] = {
          ...current,
          docs: currentDocObj,
          verified: isAllVerified,
          verifiedAt: isAllVerified ? now : null,
          verifiedBy: staffName
        };
        localStorage.setItem('mokhalasa_listing_documents', JSON.stringify(parsed));
      } catch {}

      // 2. Fetch car details to notify customer
      try {
        const { data: carData } = await supabase
          .from('car_listings')
          .select('user_id, make, model, year, seller_phone')
          .eq('id', listingId)
          .maybeSingle();

        const userId = carData?.user_id;
        const carTitle = carData ? `${carData.make} ${carData.model} ${carData.year || ''}`.trim() : 'سيارتك';

        if (carData?.seller_phone) {
          sendDocumentStatusWhatsApp(
            carData.seller_phone,
            carTitle,
            decision === 'reject' ? 'rejected' : 'approved',
            rejectReason,
            docNameAr
          ).catch(() => {});
        }

        if (userId) {
          if (decision === 'reject') {
            await this.sendCustomerNotification({
              userId,
              type: 'document_rejected',
              title: `⚠️ تم رفض مستند: ${docNameAr}`,
              message: `تم فحص أوراق (${carTitle}) ورفض ${docNameAr}. السبب: ${rejectReason || 'المستند غير واضح'}. يرجى الضغط هنا لرفع بديل صحيح.`,
              linkView: 'seller-portal',
              relatedId: listingId,
              targetDocField: docField
            }, true);
          } else {
            await this.sendCustomerNotification({
              userId,
              type: 'listing_status_changed',
              title: `✓ تم اعتماد وتوثيق ${docNameAr}`,
              message: `تم فحص ${docNameAr} لسيارتك (${carTitle}) من قبل الإدارة واعتماده رسمياً.`,
              linkView: 'seller-portal',
              relatedId: listingId
            }, true);
          }
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, documents_verified: isAllVerified } }));
      }

      return {
        success: true,
        message: decision === 'approve'
          ? `تم اعتماد ${docNameAr} بنجاح.`
          : `تم تسجيل رفض ${docNameAr} وإشعار العميل بالسبب لاستبداله.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تدقيق المستند.' };
    }
  },

  /**
   * SELLER: Update complete listing from Wizard Edit Mode
   */
  async updateFullListingFromWizard(
    listingId: string,
    data: {
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
      images?: string[];
    }
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        make: data.make,
        model: data.model,
        year: data.year,
        trim: data.trim || '',
        transmission: data.transmission || 'أوتوماتيك',
        fuel_type: data.fuel_type || 'بنزين',
        engine_size: data.engine_size || '',
        mileage: data.mileage,
        color: data.color || '',
        governorate: data.governorate,
        city: data.city || '',
        traffic_unit: data.traffic_unit || '',
        asking_price: data.asking_price,
        condition_description: data.condition_description,
        paint_condition: data.paint_condition || 'فابريكا بالكامل',
        disclosed_defects: data.disclosed_defects || [],
        has_financing: data.has_financing ?? true,
        financing_type: data.financing_type || 'bank_loan',
        financing_provider: data.financing_provider || '',
        outstanding_amount: data.outstanding_amount || 0,
        monthly_installment: data.monthly_installment || 0,
        status: 'pending_review',
        updated_at: now
      };

      // 1. Update in Supabase
      try {
        await supabase
          .from('car_listings')
          .update(payload)
          .eq('id', listingId);
      } catch {}

      // 2. Update local mirrors
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsed = JSON.parse(storedMods);
        parsed[listingId] = {
          ...parsed[listingId],
          status: 'pending_review',
          traffic_unit: data.traffic_unit,
          feedback: null,
          updatedAt: now
        };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsed));
      } catch {}

      // 3. Notify Admin & Send WhatsApp confirmation to Seller
      try {
        await supabase.from('admin_notifications').insert({
          type: 'listing_resubmitted',
          title: '📝 تم تحديث بيانات الإعلان بالكامل وإعادة إرساله',
          message: `قام العميل بتعديل كامل بيانات الإعلان (${data.make} ${data.model} ${data.year} - كود: ${listingId.slice(0, 8)}) عبر معالج البيع وإعادة إرساله للاعتماد.`,
          listing_id: listingId
        });

        const { data: carRow } = await supabase
          .from('car_listings')
          .select('seller_name, seller_phone, case_reference')
          .eq('id', listingId)
          .maybeSingle();
        if (carRow?.seller_phone) {
          sendListingUpdatedWhatsApp(
            carRow.seller_phone,
            carRow.seller_name || 'مالك السيارة',
            `${data.make} ${data.model} ${data.year}`,
            data.asking_price,
            carRow.case_reference || listingId.slice(0, 8)
          ).catch(() => {});
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId, status: 'pending_review' } }));
      }

      return {
        success: true,
        message: 'تم حفظ كافة التعديلات بنجاح وإعادة تقديم الإعلان لفريق العمليات للاعتماد.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حفظ التعديلات.' };
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
      let localFeatured: Record<string, any> = {};
      try {
        const stored = localStorage.getItem('mokhalasa_listing_followups');
        if (stored) localFollowups = JSON.parse(stored);
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides');
        if (storedMods) localModerations = JSON.parse(storedMods);
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents');
        if (storedDocs) localDocs = JSON.parse(storedDocs);
        const storedFeatured = localStorage.getItem('mokhalasa_featured_listings');
        if (storedFeatured) localFeatured = JSON.parse(storedFeatured);
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

        // Featured Settings Hydration
        const featRecord = localFeatured[item.id] || modOverride?.featuredConfig || {};
        const isFeatured = Boolean(featRecord.is_featured ?? item.is_featured ?? modOverride?.is_featured ?? item.featured);
        const featRank = isFeatured ? Number(featRecord.featured_rank ?? item.featured_rank ?? modOverride?.featured_rank ?? 1) : undefined;
        const featTier = isFeatured ? (featRecord.featured_tier ?? item.featured_tier ?? (featRank && featRank <= 3 ? 'top_3' : 'top_10')) : undefined;
        const featScope = isFeatured ? (featRecord.featured_scope ?? item.featured_scope ?? 'both') : undefined;
        const featBadge = isFeatured ? (featRecord.featured_badge_text ?? item.featured_badge_text) : undefined;

        return {
          ...item,
          status: effectiveStatus,
          is_hidden: isHidden,
          is_featured: isFeatured,
          featured_rank: featRank,
          featured_tier: featTier,
          featured_scope: featScope,
          featured_badge_text: featBadge,
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
          official_documents: docRecord?.docs || item.official_documents,
          sale_type: modOverride?.sale_type || item.sale_type || (modOverride?.is_direct_installment || item.is_direct_installment || item.financing_type === 'direct_installment' ? 'direct_installment' : (item.financing_type === 'fully_owned' || item.financing_type === 'cash' ? 'cash' : 'bank_settlement')),
          down_payment: modOverride?.down_payment ?? item.down_payment,
          installment_period_months: modOverride?.installment_period_months ?? item.installment_period_months,
          required_guarantees: modOverride?.required_guarantees || item.required_guarantees || [],
          is_direct_installment: Boolean(modOverride?.is_direct_installment ?? item.is_direct_installment ?? (item.financing_type === 'direct_installment')),
          direct_installment_seller_type: modOverride?.direct_installment_seller_type || item.direct_installment_seller_type
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
      let rpcSucceeded = false;
      let rpcMessage = '';
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('admin_moderate_listing', {
          p_listing_id: listingId,
          p_new_status: newStatus,
          p_feedback: feedback || null,
          p_staff_name: staffName
        });

        if (!rpcError && rpcData && rpcData.success) {
          rpcSucceeded = true;
          rpcMessage = rpcData.message || 'تم اعتماد ونشر الإعلان بنجاح في المعرض العام وإشعار العميل.';
        }
      } catch {
        // Fall through to direct table update if RPC not registered yet
      }

      // 2. Second attempt: Direct table update if RPC did not succeed
      if (!rpcSucceeded) {
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
      }

      // 3. Always fetch listing details to notify the seller via WhatsApp & In-App Notification
      try {
        const { data: listingData } = await supabase
          .from('car_listings')
          .select('user_id, make, model, year, seller_phone, case_reference')
          .eq('id', listingId)
          .maybeSingle();

        const carTitle = listingData ? `${listingData.make} ${listingData.model} ${listingData.year}` : 'سيارتك';
        if (listingData?.seller_phone && ['published', 'approved', 'needs_changes', 'rejected'].includes(newStatus)) {
          sendListingModerationWhatsApp(
            listingData.seller_phone,
            carTitle,
            newStatus as 'published' | 'approved' | 'needs_changes' | 'rejected',
            feedback,
            listingData.case_reference || listingId.slice(0, 8),
            listingId
          ).catch(err => console.warn('Moderation WhatsApp notice:', err));
        }

        if (listingData?.user_id) {
          if (newStatus === 'published' || newStatus === 'approved') {
            await this.sendCustomerNotification({
              userId: listingData.user_id,
              type: 'listing_published',
              title: 'تهانينا! تم اعتماد ونشر إعلان سيارتك',
              message: `تمت مراجعة واعتماد إعلان سيارتك (${listingData.make} ${listingData.model} ${listingData.year}) بنجاح من قِبل إدارة مخلصة، وأصبح الآن منشوراً ومتاحاً لجميع المشترين في المعرض العام.`,
              linkView: 'profile',
              relatedId: listingId
            }, true);
          } else if (newStatus === 'needs_changes') {
            await this.sendCustomerNotification({
              userId: listingData.user_id,
              type: 'listing_status_changed',
              title: 'مطلوب تعديل على إعلان سيارتك',
              message: `يرجى مراجعة إعلان سيارتك (${listingData.make} ${listingData.model} ${listingData.year}) وتحديث المطلوب: ${feedback || 'يرجى مراجعة ملاحظات الإدارة وتعديل الإعلان وإعادة إرساله'}.`,
              linkView: 'profile',
              relatedId: listingId
            }, true);
          } else if (newStatus === 'rejected') {
            await this.sendCustomerNotification({
              userId: listingData.user_id,
              type: 'listing_status_changed',
              title: 'تنبيه: تم رفض إعلان السيارة',
              message: `نعتذر، لم يتم اعتماد إعلان سيارتك (${listingData.make} ${listingData.model} ${listingData.year}) للسبب التالي: ${feedback || 'الإعلان غير مطابق لمعايير المنصة'}. يمكنك تعديل الإعلان وإعادة إرساله.`,
              linkView: 'profile',
              relatedId: listingId
            }, true);
          }
        }
      } catch {}

      if (rpcSucceeded) {
        return {
          success: true,
          message: rpcMessage
        };
      }

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
        .select('user_id, status, make, model, year, case_reference, seller_phone')
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

      // Send WhatsApp & In-App notification to the seller
      if (listingData?.seller_phone) {
        const carTitle = `${listingData.make} ${listingData.model} ${listingData.year || ''}`.trim();
        sendListingModerationWhatsApp(
          listingData.seller_phone,
          carTitle,
          'rejected',
          cleanReason,
          listingData.case_reference || listingId.slice(0, 8),
          listingId
        ).catch(() => {});
      }

      if (listingData?.user_id) {
        await this.sendCustomerNotification({
          userId: listingData.user_id,
          type: 'listing_status_changed',
          title: 'تنبيه: تم سحب / إلغاء تفعيل إعلان سيارتك',
          message: `قام المشرف (${staffName}) بسحب الإعلان للسبب التالي: ${cleanReason}. يمكنك تعديل الإعلان وإعادة إرساله.`,
          linkView: 'profile',
          relatedId: listingId
        }, true);
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
      // Local moderation overrides, documents, and featured listings fallback
      let localModerations: Record<string, any> = {};
      let localDocs: Record<string, any> = {};
      let localFeatured: Record<string, any> = {};
      try {
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides');
        if (storedMods) localModerations = JSON.parse(storedMods);
        const storedDocs = localStorage.getItem('mokhalasa_listing_documents');
        if (storedDocs) localDocs = JSON.parse(storedDocs);
        const storedFeatured = localStorage.getItem('mokhalasa_featured_listings');
        if (storedFeatured) localFeatured = JSON.parse(storedFeatured);
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

        const effectiveSaleType = (override?.sale_type || row.sale_type || (
          override?.is_direct_installment || row.is_direct_installment || row.financing_type === 'direct_installment'
            ? 'direct_installment'
            : (row.financing_type === 'fully_owned' || row.financing_type === 'cash' ? 'cash' : 'bank_settlement')
        )) as 'cash' | 'direct_installment' | 'bank_settlement';

        const isDirect = effectiveSaleType === 'direct_installment';
        const directDetails = isDirect ? {
          downPayment: Number(override?.down_payment ?? row.down_payment) || Math.round((Number(row.asking_price) || 0) * 0.3),
          monthlyInstallment: Number(override?.monthly_installment ?? row.monthly_installment) || 0,
          installmentMonths: Number(override?.installment_period_months ?? row.installment_period_months ?? row.remaining_months) || 36,
          totalInstallmentPrice: Number(row.asking_price) || 0,
          requiredGuarantees: override?.required_guarantees || row.required_guarantees || ['شيكات بنكية', 'إيصالات أمانة', 'حظر بيع بالرخصة'],
          sellerType: (override?.direct_installment_seller_type || row.direct_installment_seller_type || 'showroom') as 'showroom' | 'individual'
        } : undefined;

        // Featured Settings Hydration
        const featRecord = localFeatured[row.id] || override?.featuredConfig || {};
        const isFeatured = Boolean(featRecord.is_featured ?? row.is_featured ?? override?.is_featured ?? row.featured);
        const featRank = isFeatured ? Number(featRecord.featured_rank ?? row.featured_rank ?? override?.featured_rank ?? 1) : undefined;
        const featTier = isFeatured ? (featRecord.featured_tier ?? row.featured_tier ?? (featRank && featRank <= 3 ? 'top_3' : 'top_10')) : undefined;
        const featScope = isFeatured ? (featRecord.featured_scope ?? row.featured_scope ?? 'both') : undefined;
        const featBadge = isFeatured ? (featRecord.featured_badge_text ?? row.featured_badge_text) : undefined;

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
          saleType: effectiveSaleType,
          directInstallment: directDetails,
          financingType: (effectiveSaleType === 'direct_installment' ? 'direct_installment' : (effectiveSaleType === 'cash' ? 'fully_owned' : (row.financing_type || 'bank_loan'))) as any,
          vehicleStatus: (effectiveSaleType === 'direct_installment' ? 'direct_installment' : (effectiveSaleType === 'cash' ? 'cash_only' : (row.financing_type || 'bank_loan'))) as any,
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
          featured: isFeatured,
          featuredRank: featRank,
          featuredTier: featTier,
          featuredScope: featScope,
          featuredBadgeText: featBadge
        };
      });

      return { success: true, cars: mapped };
    } catch (err: any) {
      return { success: false, cars: [], error: err?.message };
    }
  },

  /**
   * ADMIN: Update featured ranking and priority settings
   */
  async updateListingFeatured(
    listingId: string,
    featuredConfig: {
      is_featured: boolean;
      featured_rank?: number;
      featured_tier?: 'top_3' | 'top_10' | 'standard';
      featured_scope?: 'all' | 'category_only' | 'both';
      featured_badge_text?: string;
    }
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // 1. Immediately persist to localStorage overrides so it works 100% on local without any DB schema migration
      try {
        const stored = localStorage.getItem('mokhalasa_featured_listings') || '{}';
        const parsed = JSON.parse(stored);
        if (featuredConfig.is_featured) {
          parsed[listingId] = {
            ...featuredConfig,
            updatedAt: new Date().toISOString()
          };
        } else {
          delete parsed[listingId];
        }
        localStorage.setItem('mokhalasa_featured_listings', JSON.stringify(parsed));

        // Also update moderation overrides mirror
        const storedMods = localStorage.getItem('mokhalasa_moderation_overrides') || '{}';
        const parsedMods = JSON.parse(storedMods);
        parsedMods[listingId] = {
          ...(parsedMods[listingId] || {}),
          ...featuredConfig,
          is_featured: featuredConfig.is_featured
        };
        localStorage.setItem('mokhalasa_moderation_overrides', JSON.stringify(parsedMods));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mokhalasa-listings-updated', { detail: { listingId } }));
        }
      } catch (e) {
        console.error('Error saving local featured listing:', e);
      }

      // 2. Best-effort Supabase update & WhatsApp notification to Seller when featured
      try {
        await supabase
          .from('car_listings')
          .update({
            is_featured: featuredConfig.is_featured,
            updated_at: new Date().toISOString()
          })
          .eq('id', listingId);

        if (featuredConfig.is_featured) {
          const { data: carRow } = await supabase
            .from('car_listings')
            .select('make, model, year, seller_phone')
            .eq('id', listingId)
            .maybeSingle();
          if (carRow?.seller_phone) {
            sendListingFeaturedWhatsApp(
              carRow.seller_phone,
              `${carRow.make} ${carRow.model} ${carRow.year || ''}`.trim(),
              featuredConfig.featured_rank || 1,
              featuredConfig.featured_badge_text || 'أفضل صفقة',
              listingId
            ).catch(() => {});
          }
        }
      } catch {}

      return {
        success: true,
        message: featuredConfig.is_featured
          ? `تم تمييز الإعلان بنجاح وتعيينه في المركز #${featuredConfig.featured_rank || 1} (${featuredConfig.featured_tier === 'top_3' ? 'Top 3' : 'Top 10'})!`
          : 'تم إلغاء تمييز الإعلان وإعادته للترتيب القياسي بنجاح.'
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث تمييز الإعلان' };
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
        status: 'communicated_to_seller',
        createdAt: new Date().toISOString()
      };

      // Check if listingId is a valid UUID before sending to Supabase
      const isUuid = (val?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');
      const validListingId = isUuid(offer.listingId) ? offer.listingId : null;

      // Extract buyer and seller user ids
      const { data: sessionData } = await supabase.auth.getSession();
      const buyerUserId = offer.buyerUserId || sessionData?.session?.user?.id || null;

      let sellerUserId = offer.sellerUserId || null;
      let sellerPhone: string | null = null;
      if (validListingId) {
        const { data: cl } = await supabase.from('car_listings').select('user_id, seller_phone').eq('id', validListingId).maybeSingle();
        if (cl?.user_id && !sellerUserId) sellerUserId = cl.user_id;
        if (cl?.seller_phone) sellerPhone = cl.seller_phone;
      }
      if ((!sellerUserId || !sellerPhone) && offer.caseReference) {
        const { data: cl } = await supabase.from('car_listings').select('user_id, seller_phone').eq('case_reference', offer.caseReference).maybeSingle();
        if (cl?.user_id && !sellerUserId) sellerUserId = cl.user_id;
        if (cl?.seller_phone && !sellerPhone) sellerPhone = cl.seller_phone;
      }
      if (!sellerPhone && sellerUserId && isUuid(sellerUserId)) {
        try {
          const { data: prof } = await supabase.from('profiles').select('phone').eq('id', sellerUserId).maybeSingle();
          if (prof?.phone) sellerPhone = prof.phone;
        } catch {}
      }

      newOffer.buyerUserId = buyerUserId || undefined;
      newOffer.sellerUserId = sellerUserId || undefined;

      // 1. Attempt insertion into public.purchase_offers directly as communicated_to_seller
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
          status: 'communicated_to_seller',
          communicated_to_seller_at: new Date().toISOString()
        });

      if (poError && !poError.message.includes('does not exist')) {
        console.warn('Notice inserting into purchase_offers table:', poError);
      }

      // 2. Automatically dispatch in-app notification to the seller immediately!
      if (sellerUserId) {
        await this.sendCustomerNotification({
          userId: sellerUserId,
          type: 'offer_communicated',
          title: 'وصلك عرض شراء وتفاوض جديد!',
          message: `قدم المشتري (${offer.buyerName}) عرض سعر بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارتك (${offer.carTitle}). يرجى الدخول لمتابعة حسابك وقبول أو رفض العرض.`,
          linkView: 'profile',
          relatedId: offer.listingId || offer.caseReference || offerId
        }, true);
      }

      // 2b. Send direct WhatsApp alert to seller phone & confirmation to buyer phone
      if (sellerPhone) {
        sendNegotiationOfferWhatsApp(
          sellerPhone,
          offer.carTitle,
          offer.offeredPrice,
          offer.caseReference || offerId,
          offer.buyerName,
          offer.askingPrice,
          offer.paymentPreference
        ).catch(err => console.warn('Seller offer WhatsApp notice:', err));
      }
      if (offer.buyerPhone) {
        sendOfferSubmittedBuyerConfirmationWhatsApp(
          offer.buyerPhone,
          offer.buyerName,
          offer.carTitle,
          offer.offeredPrice,
          offer.caseReference || offerId,
          offer.listingId || offer.carId
        ).catch(err => console.warn('Buyer offer confirmation WhatsApp notice:', err));
      }

      // 3. Also notify admin queue via admin_notifications
      try {
        await supabase.from('admin_notifications').insert({
          type: 'purchase_offer',
          title: `عرض شراء جديد (أُرسل تلقائياً للبائع): ${offer.carTitle}`,
          message: `قدم المشتري ${offer.buyerName} (${offer.buyerPhone}) عرض سعر ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على كود ${offer.caseReference} (تم التوجيه الفوري للبائع للموافقة أو الرفض)`,
          listing_id: offer.listingId || null
        });
      } catch {}

      // 4. Keep local mirror in localStorage for immediate responsive feedback
      try {
        const stored = localStorage.getItem('mokhalasa_purchase_offers') || '[]';
        const parsed: PurchaseOffer[] = JSON.parse(stored);
        parsed.unshift(newOffer);
        localStorage.setItem('mokhalasa_purchase_offers', JSON.stringify(parsed));
      } catch {}

      return {
        success: true,
        offerId,
        message: 'تم إرسال وتمرير عرضك المالي مباشرة إلى مالك السيارة! سيتم إشعارك فور تسجيل رده (قبول أو رفض) لمتابعة إجراءات المعاينة والتسوية.'
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
            } else {
              // Prioritize seller decision / accepted / rejected over synthetic initial states
              const existing = combinedMap.get(key)!;
              if (['seller_accepted', 'seller_rejected', 'accepted', 'declined'].includes(o.status)) {
                existing.status = o.status;
                if (o.sellerResponseAt) existing.sellerResponseAt = o.sellerResponseAt;
                if (o.sellerResponseNotes) existing.sellerResponseNotes = o.sellerResponseNotes;
              }
            }
          }
        }
      } catch {}

      // 5. Apply dedicated persistent overrides (Supreme Authority across reloads & sessions)
      try {
        const storedOverrides = localStorage.getItem('mokhalasa_offer_overrides');
        if (storedOverrides) {
          const overrides: Record<string, any> = JSON.parse(storedOverrides);
          for (const [key, offer] of combinedMap.entries()) {
            const ov = overrides[offer.id] ||
                       (offer.listingId && overrides[offer.listingId]) ||
                       (offer.caseReference && overrides[offer.caseReference]) ||
                       (offer.carId && overrides[offer.carId]) ||
                       overrides[key];
            if (ov) {
              offer.status = ov.status;
              if (ov.sellerResponseAt) offer.sellerResponseAt = ov.sellerResponseAt;
              if (ov.sellerResponseNotes) offer.sellerResponseNotes = ov.sellerResponseNotes;
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
      const now = new Date().toISOString();

      // Persist in overrides mirror
      try {
        const storedOverrides = localStorage.getItem('mokhalasa_offer_overrides') || '{}';
        const parsedOverrides = JSON.parse(storedOverrides);
        parsedOverrides[offerId] = {
          status,
          updatedAt: now
        };
        localStorage.setItem('mokhalasa_offer_overrides', JSON.stringify(parsedOverrides));
      } catch {}

      // Update DB if table exists
      await supabase
        .from('purchase_offers')
        .update({ status, updated_at: now })
        .eq('id', offerId);

      // Update localStorage mirror
      try {
        const stored = localStorage.getItem('mokhalasa_purchase_offers') || '[]';
        const parsed: PurchaseOffer[] = JSON.parse(stored);
        const updated = parsed.map(o => (o.id === offerId || o.listingId === offerId) ? { ...o, status } : o);
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

      // 1. Immediately persist to localStorage overrides (Immediate & 100% resilient)
      try {
        const storedOverrides = localStorage.getItem('mokhalasa_offer_overrides') || '{}';
        const parsedOverrides = JSON.parse(storedOverrides);
        const record = {
          status: newStatus,
          notes,
          sellerResponseAt: now,
          sellerResponseNotes: notes,
          updatedAt: now
        };
        parsedOverrides[offerId] = record;

        // Also check cached offers to tag by listingId and caseReference
        const storedOffers = localStorage.getItem('mokhalasa_purchase_offers') || '[]';
        const parsedOffers: PurchaseOffer[] = JSON.parse(storedOffers);
        const found = parsedOffers.find(o => o.id === offerId || o.listingId === offerId || (o.listingId && offerId.includes(o.listingId)));
        if (found) {
          if (found.listingId) parsedOverrides[found.listingId] = record;
          if (found.caseReference) parsedOverrides[found.caseReference] = record;
          if (found.carId) parsedOverrides[found.carId] = record;
        }
        localStorage.setItem('mokhalasa_offer_overrides', JSON.stringify(parsedOverrides));

        // Update in mokhalasa_purchase_offers array as well
        const updatedOffers = parsedOffers.map(o => {
          if (o.id === offerId || o.listingId === offerId || (found?.listingId && o.listingId === found.listingId)) {
            return { ...o, status: newStatus, sellerResponseAt: now, sellerResponseNotes: notes };
          }
          return o;
        });
        localStorage.setItem('mokhalasa_purchase_offers', JSON.stringify(updatedOffers));
      } catch {}

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
      const offer = offersRes.offers.find(o => o.id === offerId || o.listingId === offerId || (o.listingId && offerId.includes(o.listingId)));

      if (offer) {
        // Tag overrides again with accurate offer fields if available
        try {
          const storedOverrides = localStorage.getItem('mokhalasa_offer_overrides') || '{}';
          const parsedOverrides = JSON.parse(storedOverrides);
          const record = {
            status: newStatus,
            notes,
            sellerResponseAt: now,
            sellerResponseNotes: notes,
            updatedAt: now
          };
          if (offer.listingId) parsedOverrides[offer.listingId] = record;
          if (offer.caseReference) parsedOverrides[offer.caseReference] = record;
          if (offer.carId) parsedOverrides[offer.carId] = record;
          localStorage.setItem('mokhalasa_offer_overrides', JSON.stringify(parsedOverrides));
        } catch {}

        // 1. Notify the buyer (via direct userId or matched customer phone)
        let targetBuyerId = offer.buyerUserId;
        if (!targetBuyerId && offer.buyerPhone) {
          try {
            const { data: usr } = await supabase.from('customers').select('id').eq('phone', offer.buyerPhone).maybeSingle();
            if (usr?.id) targetBuyerId = usr.id;
          } catch {}
          if (!targetBuyerId) {
            try {
              const localUsers = JSON.parse(localStorage.getItem('mokhalasa_customers_list') || '[]');
              const match = localUsers.find((u: any) => u.phone === offer.buyerPhone);
              if (match?.id) targetBuyerId = match.id;
            } catch {}
          }
        }

        if (targetBuyerId) {
          if (decision === 'accept') {
            await this.sendCustomerNotification({
              userId: targetBuyerId,
              type: 'offer_accepted',
              title: '🎉 تهانينا! وافق البائع على عرضك المالي',
              message: `وافق البائع على عرض الشراء بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارة ${offer.carTitle}. بانتظار الاعتماد النهائي وتحديد موعد المقابلة والمعاينة البنكية.`,
              linkView: 'profile',
              relatedId: offerId
            }, true);
          } else {
            await this.sendCustomerNotification({
              userId: targetBuyerId,
              type: 'offer_rejected',
              title: 'تم الاعتذار عن عرض الشراء',
              message: `نعتذر، لم يوافق البائع على عرض الشراء بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م على سيارة ${offer.carTitle}. يمكنك تقديم عرض سعر تفاوضي آخر عبر المعرض.`,
              linkView: 'profile',
              relatedId: offerId
            }, true);
          }
        }

        // 1b. Direct WhatsApp alert to buyer's phone (works even if buyer is not in profiles table)
        if (offer.buyerPhone) {
          if (decision === 'accept') {
            sendOfferAcceptedToBuyerWhatsApp(
              offer.buyerPhone,
              offer.buyerName,
              offer.carTitle,
              offer.offeredPrice,
              offer.caseReference || offerId,
              offer.listingId || offer.carId
            ).catch(err => console.warn('Offer accepted buyer WhatsApp notice:', err));
          } else {
            sendOfferRejectedToBuyerWhatsApp(
              offer.buyerPhone,
              offer.buyerName,
              offer.carTitle,
              offer.offeredPrice,
              offer.caseReference || offerId,
              notes,
              offer.listingId || offer.carId
            ).catch(err => console.warn('Offer rejected buyer WhatsApp notice:', err));
          }
        }

        // 1c. Also send WhatsApp confirmation to seller when accepting or rejecting
        try {
          let resolvedSellerPhone: string | undefined;
          if (offer.listingId) {
            const { data: sellerCar } = await supabase
              .from('car_listings')
              .select('seller_phone')
              .eq('id', offer.listingId)
              .maybeSingle();
            resolvedSellerPhone = sellerCar?.seller_phone;
          }
          if (!resolvedSellerPhone && typeof window !== 'undefined') {
            const rawUser = localStorage.getItem('mokhalasa_customer_user');
            if (rawUser) {
              const parsedUser = JSON.parse(rawUser);
              if (parsedUser?.phone) resolvedSellerPhone = parsedUser.phone;
            }
          }
          if (resolvedSellerPhone) {
            if (decision === 'accept') {
              sendOfferAcceptedSellerConfirmationWhatsApp(
                resolvedSellerPhone,
                offer.carTitle,
                offer.offeredPrice,
                offer.buyerName,
                offer.caseReference || offerId
              ).catch(err => console.warn('Seller acceptance WhatsApp notice:', err));
            } else {
              sendOfferRejectedSellerConfirmationWhatsApp(
                resolvedSellerPhone,
                offer.carTitle,
                offer.offeredPrice,
                offer.buyerName,
                offer.caseReference || offerId
              ).catch(err => console.warn('Seller rejection WhatsApp notice:', err));
            }
          }
        } catch {}

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

      // Update overrides
      try {
        const storedOverrides = localStorage.getItem('mokhalasa_offer_overrides') || '{}';
        const parsedOverrides = JSON.parse(storedOverrides);
        parsedOverrides[offerId] = {
          status: 'accepted',
          adminNotes,
          updatedAt: now
        };
        localStorage.setItem('mokhalasa_offer_overrides', JSON.stringify(parsedOverrides));
      } catch {}

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
          }, true);
        }

        // 2. Notify Seller
        let sellerId = offer.sellerUserId;
        let sellerPhone: string | null = null;
        if (offer.listingId) {
          const { data: car } = await supabase
            .from('car_listings')
            .select('user_id, seller_phone')
            .eq('id', offer.listingId)
            .maybeSingle();
          if (!sellerId && car?.user_id) sellerId = car.user_id;
          if (car?.seller_phone) sellerPhone = car.seller_phone;
        }

        if (sellerId) {
          await this.sendCustomerNotification({
            userId: sellerId,
            type: 'offer_accepted',
            title: '✅ تم اعتماد قبولك للعرض وتنسيق المقابلة!',
            message: `تم اعتماد موافقتك على بيع السيارة (${offer.carTitle}) بمبلغ ${offer.offeredPrice.toLocaleString('ar-EG')} ج.م. سيتم التواصل معك خلال 24 ساعة لتحديد موعد المقابلة مع المشتري والتنسيق مع البنك.`,
            linkView: 'profile',
            relatedId: offerId
          }, true);
        }

        // 3. Direct WhatsApp confirmation to both Buyer & Seller phones
        if (offer.buyerPhone) {
          sendDealConfirmedWhatsApp(
            offer.buyerPhone,
            'buyer',
            offer.carTitle,
            offer.offeredPrice,
            offer.caseReference || offerId,
            adminNotes
          ).catch(err => console.warn('Buyer deal confirm WhatsApp notice:', err));
        }
        if (sellerPhone) {
          sendDealConfirmedWhatsApp(
            sellerPhone,
            'seller',
            offer.carTitle,
            offer.offeredPrice,
            offer.caseReference || offerId,
            adminNotes
          ).catch(err => console.warn('Seller deal confirm WhatsApp notice:', err));
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

      // Track read notifications locally to prevent dismissed notifications from re-triggering badges
      let readIds = new Set<string>();
      let readAllTimestamp = 0;
      try {
        const storedRead = localStorage.getItem('mokhalasa_read_notifications');
        if (storedRead) readIds = new Set(JSON.parse(storedRead));
        const storedTs = localStorage.getItem('mokhalasa_notifications_read_all_timestamp');
        if (storedTs) readAllTimestamp = Number(storedTs) || 0;
      } catch {}

      // 1. Try customer_notifications table
      try {
        const { data, error } = await supabase
          .from('customer_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          data.forEach((d: any) => {
            const createdTs = new Date(d.created_at).getTime();
            const isMarkedRead = Boolean(d.is_read || readIds.has(d.id) || (readAllTimestamp > 0 && createdTs <= readAllTimestamp));
            notifsMap.set(d.id, {
              id: d.id,
              userId: d.user_id,
              type: d.type,
              title: d.title,
              message: d.message,
              linkView: d.link_view,
              relatedId: d.related_id,
              isRead: isMarkedRead,
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
              const createdTs = new Date(an.created_at).getTime();
              const isMarkedRead = Boolean(readIds.has(id) || (readAllTimestamp > 0 && createdTs <= readAllTimestamp));
              if (!notifsMap.has(id)) {
                notifsMap.set(id, {
                  id,
                  userId,
                  type: 'general',
                  title: an.title || 'إشعار من منصة مخلصة',
                  message: cleanMsg,
                  linkView: linkMatch ? linkMatch[1] : 'portal',
                  relatedId: refMatch ? refMatch[1] : an.listing_id,
                  isRead: isMarkedRead,
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
            const createdTs = new Date(n.createdAt).getTime();
            const isMarkedRead = Boolean(n.isRead || readIds.has(n.id) || (readAllTimestamp > 0 && createdTs <= readAllTimestamp));
            if (!notifsMap.has(n.id)) notifsMap.set(n.id, { ...n, isRead: isMarkedRead });
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
    notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>,
    skipWhatsApp: boolean = false
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

      // 4. Dispatch real-time WhatsApp alert to recipient phone (if not already sent by a specialized template)
      if (!skipWhatsApp) {
        try {
          let recipientPhone: string | undefined;

          // Try getting phone from profiles
          if (isUuid(notif.userId)) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('phone')
              .eq('id', notif.userId)
              .maybeSingle();
            if (profile?.phone) {
              recipientPhone = profile.phone;
            }
          }

          // Fallback: Check car_listings phone
          if (!recipientPhone && notif.relatedId) {
            const { data: car } = await supabase
              .from('car_listings')
              .select('seller_phone, contact_phone')
              .eq('id', notif.relatedId)
              .maybeSingle();
            recipientPhone = car?.seller_phone || car?.contact_phone;
          }

          // Fallback: Check active customer user
          if (!recipientPhone) {
            try {
              const raw = localStorage.getItem('mokhalasa_customer_user');
              if (raw) {
                const u = JSON.parse(raw);
                if (u.phone && (u.id === notif.userId || !notif.userId)) {
                  recipientPhone = u.phone;
                }
              }
            } catch {}
          }

          if (recipientPhone) {
            const waText = `🚗 *منصة مخلّصة | إشعار جديد*\n\n📌 *${notif.title}*\n${notif.message}\n\n🌐 *لمتابعة حسابك وطلباتك عبر المنصة:*\nhttps://mokhalasa-app.vercel.app/#/profile`;
            sendWhatsAppMessage(recipientPhone, waText).catch(e => console.warn('WhatsApp alert warning:', e));
          }
        } catch (waErr) {
          console.warn('WhatsApp notification dispatch error:', waErr);
        }
      }

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
      // Record in local set of read notification IDs
      try {
        const storedRead = localStorage.getItem('mokhalasa_read_notifications') || '[]';
        const readArr: string[] = JSON.parse(storedRead);
        if (!readArr.includes(notificationId)) {
          readArr.push(notificationId);
          localStorage.setItem('mokhalasa_read_notifications', JSON.stringify(readArr));
        }
      } catch {}

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
      const nowTs = Date.now();
      try {
        localStorage.setItem('mokhalasa_notifications_read_all_timestamp', String(nowTs));

        // Mark all cached in-memory and local customer notifications as read
        const stored = localStorage.getItem('mokhalasa_customer_notifications') || '[]';
        const parsed: InAppNotification[] = JSON.parse(stored);
        const updated = parsed.map(n => n.userId === userId ? { ...n, isRead: true } : n);
        localStorage.setItem('mokhalasa_customer_notifications', JSON.stringify(updated));
      } catch {}

      await supabase
        .from('customer_notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

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
