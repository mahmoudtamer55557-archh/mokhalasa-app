import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  DistressedVehicleCase, EmployeeUser, CallLogEntry, 
  CaseLifecycleStatus, CaseRevisionRecord, PurchaseOffer 
} from '../types';
import { MOCK_EMPLOYEES } from '../data/mockDistressedCases';
import { StaffLoginPage } from './StaffLoginPage';
import { listingService, DatabaseCarListing, ListingModerationStatus } from '../services/listingService';
import { supabase } from '../services/supabaseClient';
import { 
  LayoutDashboard, ShieldCheck, LogOut, CheckCircle2, 
  FileText, PhoneCall, 
  User, Search, Check, X, RefreshCw, Eye, 
  Edit3, Scale, UserCheck, ExternalLink,
  Car as CarIcon, Tag, MessageSquare, Send,
  AlertTriangle, Trash2, Clock, Sparkles,
  Download, FileSpreadsheet
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { isWhatsAppServiceEnabled, setWhatsAppServiceEnabled } from '../services/whatsappService';

interface PrivateOperationsDashboardProps {
  cases: DistressedVehicleCase[];
  onUpdateCase: (updatedCase: DistressedVehicleCase) => void;
  onNavigate: (view: string) => void;
  initialRole?: 'owner' | 'staff';
  lang?: 'ar' | 'en';
}

const LIFECYCLE_STATUS_LABELS: Record<CaseLifecycleStatus, { labelAr: string; color: string }> = {
  new_request: { labelAr: '1. طلب جديد مسجل', color: 'bg-blue-100 text-blue-800' },
  awaiting_initial_contact: { labelAr: '2. بانتظار التواصل المبدئي', color: 'bg-amber-100 text-amber-800' },
  seller_contacted: { labelAr: '3. تم التواصل مع البائع', color: 'bg-blue-100 text-blue-800' },
  eligibility_review: { labelAr: '4. مراجعة الأهلية والتعثر', color: 'bg-indigo-100 text-indigo-800' },
  awaiting_missing_info: { labelAr: '5. بانتظار استكمال البيانات', color: 'bg-yellow-100 text-yellow-800' },
  awaiting_documents: { labelAr: '6. بانتظار المستندات', color: 'bg-orange-100 text-orange-800' },
  awaiting_lender_confirmation: { labelAr: '7. بانتظار إفادة جهة التمويل', color: 'bg-purple-100 text-purple-800' },
  awaiting_official_settlement: { labelAr: '8. بانتظار بيان المديونية الرسمي', color: 'bg-purple-100 text-purple-800' },
  valuation_in_progress: { labelAr: '9. التقييم السعري جاري', color: 'bg-sky-100 text-sky-800' },
  valuation_reviewed: { labelAr: '10. تم تدقيق التقييم', color: 'bg-teal-100 text-teal-800' },
  awaiting_seller_price_approval: { labelAr: '11. بانتظار موافقة البائع على السعر', color: 'bg-amber-100 text-amber-800' },
  listing_approved: { labelAr: '12. تم اعتماد الإعلان للنشر', color: 'bg-emerald-100 text-emerald-800' },
  buyer_inquiry_received: { labelAr: '13. تم استلام طلبات مشترين', color: 'bg-cyan-100 text-cyan-800' },
  buyer_qualification: { labelAr: '14. تأهيل وفحص قدرة المشتري', color: 'bg-blue-100 text-blue-800' },
  offer_received: { labelAr: '15. تم تقديم عرض سعر', color: 'bg-violet-100 text-violet-800' },
  awaiting_seller_response: { labelAr: '16. بانتظار رد البائع على العرض', color: 'bg-amber-100 text-amber-800' },
  negotiation: { labelAr: '17. مرحلة التفاوض والاتفاق', color: 'bg-indigo-100 text-indigo-800' },
  settlement_coordination: { labelAr: '18. تنسيق السداد بالبنك', color: 'bg-emerald-100 text-emerald-800' },
  awaiting_lender_action: { labelAr: '19. بانتظار إجراءات البنك', color: 'bg-purple-100 text-purple-800' },
  awaiting_restriction_release: { labelAr: '20. بانتظار خطاب رفع الحظر', color: 'bg-teal-100 text-teal-800' },
  transfer_process: { labelAr: '21. إجراءات المرور والشهر العقاري', color: 'bg-emerald-100 text-emerald-800' },
  completed: { labelAr: '22. تمت المعاملة بنجاح', color: 'bg-green-100 text-green-800' },
  rejected_ineligible: { labelAr: '23. مرفوض - غير مؤهل', color: 'bg-rose-100 text-rose-800' },
  cancelled: { labelAr: '24. ملغي', color: 'bg-slate-100 text-slate-800' },
  on_hold: { labelAr: '25. معلق / وجود عجز مالي', color: 'bg-red-100 text-red-800' },
  published: { labelAr: 'منشور بالمعرض', color: 'bg-emerald-100 text-emerald-800' },
  needs_changes: { labelAr: 'مطلوب تعديل', color: 'bg-amber-100 text-amber-800' },
  pending_review: { labelAr: 'قيد التدقيق', color: 'bg-blue-100 text-blue-800' },
  approved: { labelAr: 'معتمد', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { labelAr: 'مرفوض', color: 'bg-rose-100 text-rose-800' },
  withdrawn: { labelAr: 'مسحوب من المعرض', color: 'bg-slate-100 text-slate-800' }
};

export const PrivateOperationsDashboard: React.FC<PrivateOperationsDashboardProps> = ({
  cases,
  onUpdateCase,
  onNavigate,
  initialRole = 'owner',
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';

  // Authenticated Staff User Session (defaults to null; never persists credentials across reload)
  const [currentStaffUser, setCurrentStaffUser] = useState<EmployeeUser | null>(null);

  const [activeTab, setActiveTab] = useState<'cases' | 'moderation' | 'purchase_offers' | 'customers' | 'audit_logs' | 'edits_review' | 'team' | 'compliance'>('moderation');

  // Supabase Moderation Queue State
  const [dbListings, setDbListings] = useState<DatabaseCarListing[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationFilter, setModerationFilter] = useState<string>('all');

  // Filtered listings for display based on active moderationFilter
  const displayedListings = useMemo(() => {
    if (moderationFilter === 'all') return dbListings;
    if (moderationFilter === 'published') {
      return dbListings.filter(l => l.status === 'published' || l.status === 'approved');
    }
    if (moderationFilter === 'approved') {
      return dbListings.filter(l => l.status === 'approved' || l.status === 'published');
    }
    return dbListings.filter(l => l.status === moderationFilter);
  }, [dbListings, moderationFilter]);

  const [selectedModerationListing, setSelectedModerationListing] = useState<DatabaseCarListing | null>(null);
  const [adminFeedbackInput, setAdminFeedbackInput] = useState<string>('');
  const [moderationActionLoading, setModerationActionLoading] = useState(false);
  const [moderationMessage, setModerationMessage] = useState<string | null>(null);

  // Deactivation modal state (Priority 3)
  const [listingToDeactivate, setListingToDeactivate] = useState<DatabaseCarListing | null>(null);
  const [deactivationReasonInput, setDeactivationReasonInput] = useState<string>('');
  const [deactivationLoading, setDeactivationLoading] = useState<boolean>(false);

  // Follow-up modal state (Priority 4)
  const [listingForFollowup, setListingForFollowup] = useState<DatabaseCarListing | null>(null);
  const [followupActionType, setFollowupActionType] = useState<'call_log' | 'internal_note' | 'price_discussion' | 'bank_coordination'>('call_log');
  const [followupResult, setFollowupResult] = useState<string>('تم الرد والاتفاق');
  const [followupContent, setFollowupContent] = useState<string>('');
  const [followupNextAction, setFollowupNextAction] = useState<string>('');
  const [followupStatus, setFollowupStatus] = useState<string>('in_progress');
  const [followupLoading, setFollowupLoading] = useState<boolean>(false);

  // Supabase Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Purchase Offers State (Phase 8 & 9 Requirement)
  const [purchaseOffers, setPurchaseOffers] = useState<PurchaseOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerActionMsg, setOfferActionMsg] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // Gemini AI Executive Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  // WhatsApp OTP Service Toggle (for 2-day trial and beyond)
  const [isWhatsAppActive, setIsWhatsAppActive] = useState<boolean>(isWhatsAppServiceEnabled());
  const toggleWhatsApp = () => {
    const next = !isWhatsAppActive;
    setWhatsAppServiceEnabled(next);
    setIsWhatsAppActive(next);
  };

  // Load Database Listings for Moderation (Loads all so tab counts & filters work instantly)
  const loadModerationListings = useCallback(async () => {
    setModerationLoading(true);
    const res = await listingService.getAdminListings('all');
    if (res.success) {
      setDbListings(res.listings);
    }
    setModerationLoading(false);
  }, []);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    const res = await listingService.getAuditLogs(50);
    if (res.success) {
      setAuditLogs(res.logs);
    }
    setAuditLogsLoading(false);
  }, []);

  // Load Purchase Offers
  const loadPurchaseOffers = useCallback(async () => {
    setOffersLoading(true);
    const res = await listingService.getPurchaseOffers();
    if (res.success) {
      setPurchaseOffers(res.offers);
    }
    setOffersLoading(false);
  }, []);

  // Load authoritative data on initial mount
  useEffect(() => {
    let isCancelled = false;
    listingService.getAdminListings(moderationFilter).then(res => {
      if (!isCancelled && res.success) {
        setDbListings(res.listings);
      }
    });
    listingService.getPurchaseOffers().then(res => {
      if (!isCancelled && res.success) {
        setPurchaseOffers(res.offers);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [moderationFilter]);

  // Real-time Supabase Subscription & Live Sync (Priority 2 & 5)
  // Everything published on the site or submitted as an offer streams directly into the dashboard
  useEffect(() => {
    const channel = supabase
      .channel('mokhalasa-operations-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'car_listings' },
        () => {
          loadModerationListings();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_offers' },
        () => {
          loadPurchaseOffers();
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      loadModerationListings();
      loadPurchaseOffers();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [loadModerationListings, loadPurchaseOffers]);

  // Customers List & Excel Export State
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerFilterStatus, setCustomerFilterStatus] = useState<'all' | 'verified' | 'pending_deletion'>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      // 1. Fetch from Supabase profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      let list = data || [];

      // 2. Merge with localStorage demo / active customers if present
      const stored = localStorage.getItem('mokhalasa_customer_user');
      if (stored) {
        try {
          const localUser = JSON.parse(stored);
          if (localUser && localUser.id && !list.some((c: any) => c.id === localUser.id)) {
            list = [
              {
                id: localUser.id,
                full_name: localUser.name,
                phone: localUser.phone,
                email: localUser.email,
                governorate: localUser.governorate || 'القاهرة',
                city: localUser.city || '',
                is_verified: localUser.isVerified,
                account_status: localUser.accountStatus || 'active',
                created_at: localUser.createdAt || new Date().toISOString()
              },
              ...list
            ];
          }
        } catch {}
      }

      setCustomersList(list);
    } catch (err) {
      console.warn('Error fetching customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const exportCustomersToExcel = () => {
    if (!customersList.length) {
      setExportNotice('لا توجد بيانات عملاء متاحة للتصدير حالياً.');
      return;
    }

    // Prepare CSV with UTF-8 BOM so Microsoft Excel in Windows displays Arabic text flawlessly!
    const BOM = '\uFEFF';
    const headers = ['معرف العميل (ID)', 'الاسم بالكامل', 'رقم الهاتف', 'البريد الإلكتروني', 'المحافظة', 'المدينة', 'حالة التحقق (OTP)', 'حالة الحساب', 'تاريخ التسجيل'];
    
    const rows = customersList.map((c: any) => [
      `"${c.id || ''}"`,
      `"${(c.full_name || c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.governorate || 'القاهرة'}"`,
      `"${c.city || ''}"`,
      `"${c.is_verified ? 'موثق' : 'غير موثق'}"`,
      `"${c.account_status === 'pending_deletion' ? 'بانتظار الحذف (30 يوم)' : 'نشط'}"`,
      `"${new Date(c.created_at || Date.now()).toLocaleDateString('ar-EG')}"`
    ]);

    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `Mokhalasa_Customers_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`تم تحميل شيت بيانات العملاء بنجاح (${customersList.length} عميل) على جهازك!`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  useEffect(() => {
    let isCancelled = false;
    if (activeTab === 'moderation') {
      listingService.getAdminListings('all').then(res => {
        if (!isCancelled && res.success) {
          setDbListings(res.listings);
        }
      });
    } else if (activeTab === 'purchase_offers') {
      listingService.getPurchaseOffers().then(res => {
        if (!isCancelled && res.success) {
          setPurchaseOffers(res.offers);
        }
      });
    } else if (activeTab === 'audit_logs') {
      listingService.getAuditLogs(50).then(res => {
        if (!isCancelled && res.success) {
          setAuditLogs(res.logs);
        }
      });
    } else if (activeTab === 'customers') {
      fetchCustomers();
    }
    return () => {
      isCancelled = true;
    };
  }, [activeTab, moderationFilter]);

  // Handle Offer Status Update
  const handleUpdateOfferStatus = async (offerId: string, newStatus: PurchaseOffer['status']) => {
    setOfferActionMsg(null);
    const res = await listingService.updatePurchaseOfferStatus(offerId, newStatus);
    if (res.success) {
      setPurchaseOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: newStatus } : o));
      setOfferActionMsg(res.message);
    }
  };

  // Forward Offer to Seller (Priority 5)
  const handleForwardOffer = async (offerId: string) => {
    setOfferActionMsg(null);
    const res = await listingService.forwardOfferToSeller(offerId, currentStaffUser?.name || 'مستشار مخلصة');
    if (res.success) {
      setOfferActionMsg(res.message);
      await loadPurchaseOffers();
    } else {
      setOfferActionMsg(`خطأ: ${res.message}`);
    }
  };

  // Confirm Deal & Send 24-hr Meeting Notification to Both Parties
  const handleConfirmDeal = async (offerId: string) => {
    setOfferActionMsg(null);
    const res = await listingService.confirmDealByAdmin(offerId);
    if (res.success) {
      setOfferActionMsg(res.message);
      await loadPurchaseOffers();
      alert(`✅ ${res.message}`);
    } else {
      setOfferActionMsg(`خطأ: ${res.message}`);
      alert(`خطأ: ${res.message}`);
    }
  };

  // 1-Click Purge of All Test Data (Listings, Offers, Notifications) for Pre-Launch Testing
  const handlePurgeAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ تأكيد تصفير بيانات الاختبار:\n\nهل أنت متأكد من مسح كافة الإعلانات والعروض والإشعارات التجريبية؟\nسيتم إفراغ قاعدة البيانات لتبدأ التجربة والاختبار على نظيف تماماً قبل الإطلاق.'
    );
    if (!confirmed) return;
    setIsPurging(true);
    try {
      const res = await listingService.purgeAllTestData();
      alert(res.message);
      await loadModerationListings();
      await loadPurchaseOffers();
    } catch (err: any) {
      alert('حدث خطأ أثناء التصفير: ' + (err?.message || 'خطأ غير معروف'));
    } finally {
      setIsPurging(false);
    }
  };

  // Handle Deactivation / Safe Removal with mandatory reason (Priority 3)
  const handleDeactivateListing = async () => {
    if (!listingToDeactivate) return;
    if (!deactivationReasonInput.trim()) {
      alert('سبب إلغاء أو سحب الإعلان إلزامي لتوثيق الإجراء وإشعار البائع.');
      return;
    }
    setDeactivationLoading(true);
    const res = await listingService.removeListingWithReason(
      listingToDeactivate.id,
      deactivationReasonInput.trim(),
      currentStaffUser?.name || 'مسؤول المراجعة والعمليات'
    );
    setDeactivationLoading(false);
    if (res.success) {
      setModerationMessage(res.message);
      setDbListings(prev => prev.map(item => item.id === listingToDeactivate.id ? { ...item, status: 'rejected' as any, deactivation_reason: deactivationReasonInput.trim() } : item));
      setListingToDeactivate(null);
      setDeactivationReasonInput('');
      await loadModerationListings();
      alert(isAr ? `✅ ${res.message}` : `✅ ${res.message}`);
    } else {
      alert(`خطأ: ${res.message}`);
    }
  };

  // Handle Save Followup (Priority 4)
  const handleSaveFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingForFollowup || !followupContent.trim()) return;
    setFollowupLoading(true);
    const res = await listingService.addListingFollowup(listingForFollowup.id, {
      staffName: currentStaffUser?.name || 'مسؤول العمليات',
      actionType: followupActionType,
      callResult: followupResult,
      content: followupContent.trim(),
      nextAction: followupNextAction.trim(),
      followupStatus
    });
    setFollowupLoading(false);
    if (res.success) {
      setModerationMessage(res.message);
      setListingForFollowup(null);
      setFollowupContent('');
      setFollowupNextAction('');
      await loadModerationListings();
    } else {
      alert(`خطأ: ${res.message}`);
    }
  };

  // Handle Admin Moderation Action
  const handleModerate = async (listingId: string, status: ListingModerationStatus, feedback?: string) => {
    setModerationActionLoading(true);
    setModerationMessage(null);

    // Optimistic UI update so the badge and status update instantly in front of the admin
    setDbListings(prev => prev.map(item => item.id === listingId ? { ...item, status: status, review_feedback: feedback || item.review_feedback } : item));

    // Synchronize in-memory cases store so customer portal & notifications reflect immediately
    const targetCase = cases.find(c => c.vehicle.id === listingId || c.caseReference === listingId);
    if (targetCase) {
      onUpdateCase({
        ...targetCase,
        status: status as any,
        adminFeedback: feedback,
        timeline: [
          {
            id: `tm-${Date.now()}`,
            caseId: targetCase.caseReference,
            status: status as any,
            changedBy: currentStaffUser?.name || 'محمود تامر (المسؤول العام)',
            reason: feedback || (status === 'needs_changes' ? 'طلب تعديل من الإدارة' : 'تحديث حالة الإعلان'),
            timestamp: new Date().toLocaleTimeString('ar-EG')
          },
          ...(targetCase.timeline || [])
        ]
      });
    }

    const res = await listingService.moderateListing(listingId, status, feedback);
    if (res.success) {
      setModerationMessage(res.message);
      setAdminFeedbackInput('');
      setSelectedModerationListing(null);
      await loadModerationListings();
      alert(isAr ? `✅ ${res.message}` : `✅ ${res.message}`);
    } else {
      setModerationMessage(`خطأ: ${res.message}`);
      alert(isAr ? `تعذر إتمام الإجراء الإداري: ${res.message}` : `Error: ${res.message}`);
      await loadModerationListings();
    }
    setModerationActionLoading(false);
  };

  // Handle Request Official Documents (License, ID, Payoff statement)
  const handleRequestDocuments = async (listingId: string) => {
    const res = await listingService.requestListingDocuments(listingId);
    if (res.success) {
      alert(`✅ ${res.message}`);
      await loadModerationListings();
    } else {
      alert(`خطأ: ${res.message}`);
    }
  };

  // Handle Toggle Visibility (Hide/Unhide listing temporarily during meeting/agreement)
  const handleToggleVisibility = async (listingId: string, hide: boolean) => {
    const res = await listingService.toggleListingVisibility(
      listingId,
      hide,
      currentStaffUser?.name || 'مسؤول العمليات'
    );
    if (res.success) {
      setDbListings(prev => prev.map(l => l.id === listingId ? { ...l, is_hidden: hide } : l));
      if (selectedModerationListing && selectedModerationListing.id === listingId) {
        setSelectedModerationListing(prev => prev ? { ...prev, is_hidden: hide } : null);
      }
      alert(`✅ ${res.message}`);
      await loadModerationListings();
    } else {
      alert(`خطأ: ${res.message}`);
    }
  };

  // Handle Verify Documents (Grant or Revoke Verified Trust Badge)
  const handleVerifyDocuments = async (listingId: string, isVerified: boolean, notes?: string) => {
    const res = await listingService.verifyListingDocuments(
      listingId,
      isVerified,
      notes,
      currentStaffUser?.name || 'مسؤول مراجعة المستندات'
    );
    if (res.success) {
      setDbListings(prev => prev.map(l => l.id === listingId ? { ...l, documents_verified: isVerified } : l));
      if (selectedModerationListing && selectedModerationListing.id === listingId) {
        setSelectedModerationListing(prev => prev ? { ...prev, documents_verified: isVerified } : null);
      }
      alert(`✅ ${res.message}`);
      await loadModerationListings();
    } else {
      alert(`خطأ: ${res.message}`);
    }
  };

  // Specific Document Rejection Modal State
  const [docRejectModal, setDocRejectModal] = useState<{
    isOpen: boolean;
    listingId: string;
    docField: 'licenseFront' | 'licenseBack' | 'nationalId' | 'bankStatement';
    docLabel: string;
    presetReason: string;
    customReason: string;
  }>({
    isOpen: false,
    listingId: '',
    docField: 'licenseFront',
    docLabel: '',
    presetReason: 'الصورة غير واضحة وبها انعكاس ضوء أو تمويه',
    customReason: ''
  });

  // Handle Review Specific Document (Individual Verification or Rejection)
  const handleReviewSpecificDocument = async (
    listingId: string, 
    docField: 'licenseFront' | 'licenseBack' | 'nationalId' | 'bankStatement', 
    decision: 'verify' | 'reject', 
    rejectReason?: string
  ) => {
    const res = await listingService.reviewSpecificDocument(
      listingId,
      docField,
      decision,
      rejectReason,
      currentStaffUser?.name || 'مسؤول فحص المستندات'
    );
    if (res.success) {
      alert(`✅ ${res.message}`);
      await loadModerationListings();
      if (selectedModerationListing && selectedModerationListing.id === listingId) {
        const fresh = await listingService.getAdminListings('all');
        const found = fresh.listings.find((l: DatabaseCarListing) => l.id === listingId);
        if (found) setSelectedModerationListing(found);
      }
    } else {
      alert(`خطأ: ${res.message}`);
    }
  };

  // Document Lightbox Preview State
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Modal States
  const [activeManagingCase, setActiveManagingCase] = useState<DistressedVehicleCase | null>(null);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [callTargetCase, setCallTargetCase] = useState<DistressedVehicleCase | null>(null);
  const [callParty, setCallParty] = useState<'seller' | 'buyer' | 'lender_rep'>('seller');
  const [callType, setCallType] = useState<'phone_call' | 'whatsapp' | 'meeting' | 'inspection'>('phone_call');
  const [callOutcome, setCallOutcome] = useState<string>('answered_agreed');
  const [callNotes, setCallNotes] = useState<string>('');
  const [callFollowUpDate, setCallFollowUpDate] = useState<string>('2026-10-25');

  // Review Edit Note state
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');

  const isOwner = currentStaffUser?.role === 'owner';

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  // STRICT PERMISSION BOUNDARY:
  // - Owner sees all cases.
  // - Case Officer sees ONLY cases assigned to their employee ID.
  const authorizedCases = useMemo(() => {
    if (!currentStaffUser) return [];
    if (isOwner) {
      return cases;
    }
    return cases.filter(c => c.assignedEmployeeId === currentStaffUser.id);
  }, [cases, currentStaffUser, isOwner]);

  // Filtered cases for list
  const filteredCases = useMemo(() => {
    return authorizedCases.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchUrgency = urgencyFilter === 'all' || c.urgency === urgencyFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        c.caseReference.toLowerCase().includes(q) ||
        c.seller.name.toLowerCase().includes(q) ||
        c.seller.phone.includes(q) ||
        c.vehicle.make.toLowerCase().includes(q) ||
        c.vehicle.model.toLowerCase().includes(q);
      return matchStatus && matchUrgency && matchSearch;
    });
  }, [authorizedCases, statusFilter, urgencyFilter, searchQuery]);

  // All pending seller edit revisions
  const pendingEditRevisions = useMemo(() => {
    const list: { caseItem: DistressedVehicleCase; revision: CaseRevisionRecord }[] = [];
    authorizedCases.forEach(c => {
      if (c.revisions) {
        c.revisions.forEach(rev => {
          if (rev.reviewStatus === 'pending_review') {
            list.push({ caseItem: c, revision: rev });
          }
        });
      }
    });
    return list;
  }, [authorizedCases]);

  // Login Switcher for demonstration
  const handleSwitchUser = (empId: string) => {
    const target = MOCK_EMPLOYEES.find(e => e.id === empId);
    if (target) {
      setCurrentStaffUser(target);
      setActiveManagingCase(null);
    }
  };

  const handleLogout = () => {
    setCurrentStaffUser(null);
  };

  // Generate Executive Operations Summary using Gemini AI
  const handleGenerateExecutiveSummary = async () => {
    setIsGeneratingAiSummary(true);
    setAiSummaryError(null);
    try {
      const pendingListingsCount = dbListings.filter(l => l.status === 'pending_review').length;
      const publishedCount = dbListings.filter(l => l.status === 'published' || l.status === 'approved').length;
      const needsChangesCount = dbListings.filter(l => l.status === 'needs_changes').length;
      const openOffersCount = purchaseOffers.filter(o => o.status === 'new' || o.status === 'contacted' || o.status === 'communicated_to_seller').length;

      const res = await geminiService.getAdminExecutiveSummary({
        pendingListingsCount,
        publishedCount,
        openOffersCount,
        needsChangesCount,
        recentActivity: `ملفات تخارج نشطة: ${authorizedCases.length}، طلبات تعديل بانتظار الاعتماد: ${pendingEditRevisions.length}`
      });

      if (res.success && res.summary) {
        setAiSummary(res.summary);
      } else {
        setAiSummaryError(res.message || 'تعذر توليد الملخص التنفيذي حالياً.');
      }
    } catch (err: any) {
      setAiSummaryError(err?.message || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  // Approve a Seller Revision
  const handleApproveRevision = useCallback((caseRef: string, revisionId: string) => {
    const targetCase = cases.find(c => c.caseReference === caseRef);
    if (!targetCase) return;

    const targetRev = targetCase.revisions?.find(r => r.id === revisionId);
    if (!targetRev) return;

    // Apply the new value to the actual vehicle
    const updatedVehicle = { ...targetCase.vehicle };
    if (targetRev.fieldKey === 'askingPrice') {
      updatedVehicle.askingPrice = Number(targetRev.newValue);
    } else if (targetRev.fieldKey === 'mileage') {
      updatedVehicle.mileage = Number(targetRev.newValue);
    } else if (targetRev.fieldKey === 'disclosedIssues') {
      updatedVehicle.disclosedProblems = targetRev.newValue;
    } else if (targetRev.fieldKey === 'sellerConditionStory') {
      updatedVehicle.sellerConditionStory = targetRev.newValue;
    }

    const updatedRevisions = (targetCase.revisions || []).map(r => {
      if (r.id === revisionId) {
        return {
          ...r,
          reviewStatus: 'approved' as const,
          reviewNotes: reviewNoteInput || 'تم التدقيق والاعتماد ونشر التعديل',
          reviewedBy: currentStaffUser?.name,
          reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return r;
    });

    const stillHasPending = updatedRevisions.some(r => r.reviewStatus === 'pending_review');
    const newTimelineId = `tm-${Date.now()}`;
    const newTimestamp = new Date().toLocaleTimeString('ar-EG');

    const updatedCase: DistressedVehicleCase = {
      ...targetCase,
      vehicle: updatedVehicle,
      editStatus: stillHasPending ? 'pending_review' : 'none',
      revisions: updatedRevisions,
      timeline: [
        {
          id: newTimelineId,
          caseId: caseRef,
          status: targetCase.status,
          changedBy: currentStaffUser?.name || 'فريق الإدارة',
          reason: `اعتماد تعديل (${targetRev.fieldLabelAr}) وإدراجه بالإعلان`,
          timestamp: newTimestamp
        },
        ...(targetCase.timeline || [])
      ]
    };

    onUpdateCase(updatedCase);
    setReviewNoteInput('');
    alert(isAr ? 'تم اعتماد التعديل وتحديث بيانات الإعلان بنجاح!' : 'Revision approved and published.');
  }, [cases, currentStaffUser, isAr, onUpdateCase, reviewNoteInput]);

  // Reject a Seller Revision
  const handleRejectRevision = (caseRef: string, revisionId: string) => {
    const targetCase = cases.find(c => c.caseReference === caseRef);
    if (!targetCase) return;

    const updatedRevisions = (targetCase.revisions || []).map(r => {
      if (r.id === revisionId) {
        return {
          ...r,
          reviewStatus: 'rejected' as const,
          reviewNotes: reviewNoteInput || 'رُفض التعديل لعدم تطابقه مع مستندات القرض',
          reviewedBy: currentStaffUser?.name,
          reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return r;
    });

    const stillHasPending = updatedRevisions.some(r => r.reviewStatus === 'pending_review');

    const updatedCase: DistressedVehicleCase = {
      ...targetCase,
      editStatus: stillHasPending ? 'pending_review' : 'none',
      revisions: updatedRevisions,
      timeline: [
        {
          id: `tm-${Date.now()}`,
          caseId: caseRef,
          status: targetCase.status,
          changedBy: currentStaffUser?.name || 'فريق الإدارة',
          reason: `رفض تعديل مقدم من البائع`,
          timestamp: new Date().toLocaleTimeString('ar-EG')
        },
        ...(targetCase.timeline || [])
      ]
    };

    onUpdateCase(updatedCase);
    setReviewNoteInput('');
    alert(isAr ? 'تم رفض التعديل وإخطار البائع.' : 'Revision rejected.');
  };

  // Save Call Log
  const handleSaveCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTargetCase) return;

    const newLog: CallLogEntry = {
      id: `cl-${Date.now()}`,
      caseId: callTargetCase.caseReference,
      employeeId: currentStaffUser?.id || 'emp-2',
      employeeName: currentStaffUser?.name || 'مسؤول العمليات',
      contactType: callType,
      party: callParty,
      outcome: callOutcome,
      notes: callNotes,
      followUpDate: callFollowUpDate,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedCase: DistressedVehicleCase = {
      ...callTargetCase,
      callLogs: [newLog, ...(callTargetCase.callLogs || [])]
    };

    onUpdateCase(updatedCase);
    if (activeManagingCase && activeManagingCase.caseReference === callTargetCase.caseReference) {
      setActiveManagingCase(updatedCase);
    }

    setShowCallModal(false);
    setCallNotes('');
    alert(isAr ? 'تم حفظ سجل المكالمة والمتابعة بنجاح!' : 'Call log saved successfully!');
  };

  // Update Status
  const handleUpdateStatus = (caseRef: string, newStatus: CaseLifecycleStatus) => {
    const targetCase = cases.find(c => c.caseReference === caseRef);
    if (!targetCase) return;

    const updatedCase: DistressedVehicleCase = {
      ...targetCase,
      status: newStatus,
      timeline: [
        {
          id: `tm-${Date.now()}`,
          caseId: caseRef,
          status: newStatus,
          changedBy: `${currentStaffUser?.name} (${isOwner ? 'المدير العام' : 'مسؤول الحالة'})`,
          reason: `تغيير الحالة الإجرائية إلى ${LIFECYCLE_STATUS_LABELS[newStatus]?.labelAr}`,
          timestamp: new Date().toLocaleTimeString('ar-EG')
        },
        ...(targetCase.timeline || [])
      ]
    };

    onUpdateCase(updatedCase);
    if (activeManagingCase && activeManagingCase.caseReference === caseRef) {
      setActiveManagingCase(updatedCase);
    }
  };

  // If no staff user session is authenticated, render the dedicated Staff Login Page
  if (!currentStaffUser) {
    return (
      <StaffLoginPage
        onLoginSuccess={(user) => {
          setCurrentStaffUser(user);
        }}
        onNavigateToPublic={() => onNavigate('home')}
        initialRoleHint={initialRole}
        lang={lang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-cairo">
      
      {/* Top Private Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/30 flex items-center justify-center font-black">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">نظام العمليات وإدارة الصفقات الداخلي</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold">
                {isOwner ? 'OWNER / ADMIN' : 'STAFF CRM'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">منطقة إدارية سرية — مخصصة للموظفين المصرح لهم فقط</p>
          </div>
        </div>

        {/* Current User & Session Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <User className="w-3.5 h-3.5 text-brand-green" />
            <span className="font-bold text-white">{currentStaffUser?.name}</span>
            <span className="text-[10px] text-slate-400">({isOwner ? 'المالك والمدير العام' : 'مسؤول حالات'})</span>
          </div>

          {/* User selector for demo testing (Owner audit view) */}
          {isOwner && (
            <select
              value={currentStaffUser?.id}
              onChange={(e) => handleSwitchUser(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none"
              title="تبديل المنظور الرقابي للمالك"
            >
              <option value="emp-mahmoud">👑 محمود تامر (المالك والمشرف العام - All Cases)</option>
              <option value="emp-2">👤 أحمد الشريف (Cases 001 & 003)</option>
              <option value="emp-3">👤 سارة مجدي (Case 002)</option>
            </select>
          )}

          <button
            onClick={handleGenerateExecutiveSummary}
            disabled={isGeneratingAiSummary}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            title="توليد ملخص تنفيذي استشاري بالذكاء الاصطناعي (Gemini)"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAiSummary ? 'جاري التحليل...' : 'ملخص تنفيذي ذكي'}</span>
          </button>

          <button
            onClick={toggleWhatsApp}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isWhatsAppActive
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title="تبديل تفعيل أو إيقاف رسائل وكود الواتساب للمنصة (فترة التجربة / تشغيل دائم)"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${isWhatsAppActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{isWhatsAppActive ? 'واتساب OTP: مفعل' : 'واتساب OTP: معطل'}</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
            title="العودة للموقع العام لـ مخلصة"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>الموقع العام</span>
          </button>

          <button
            onClick={handlePurgeAllData}
            disabled={isPurging}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold transition flex items-center gap-1.5"
            title="إفراغ بيانات الاختبار بالكامل (إعلانات، عروض، إشعارات)"
          >
            <Trash2 className={`w-3.5 h-3.5 text-red-400 ${isPurging ? 'animate-spin' : ''}`} />
            <span>{isPurging ? 'جاري التصفير...' : 'تصفير بيانات الاختبار'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
            title="تسجيل الخروج من لوحة العمليات"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'cases' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ملفات التخارج النشطة ({authorizedCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('edits_review')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'edits_review' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>طلبات تعديل الإعلانات</span>
            {pendingEditRevisions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {pendingEditRevisions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'moderation' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مراجعة واعتماد إعلانات السيارات</span>
            {dbListings.filter(l => l.status === 'pending_review').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                {dbListings.filter(l => l.status === 'pending_review').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('purchase_offers')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'purchase_offers' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>عروض الشراء والتفاوض ({purchaseOffers.length})</span>
            {purchaseOffers.filter(o => o.status === 'new').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {purchaseOffers.filter(o => o.status === 'new').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('customers');
              fetchCustomers();
            }}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'customers' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>سجل العملاء وتصدير Excel</span>
            {customersList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                {customersList.length}
              </span>
            )}
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'audit_logs' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجلات التدقيق والأمان (Audit Logs)</span>
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  activeTab === 'team' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>إدارة الفريق وتوزيع الحالات</span>
              </button>

              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  activeTab === 'compliance' ? 'bg-brand-green text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>الرقابة والامتثال المصرفي (Zero-Custody)</span>
              </button>
            </>
          )}
        </div>

        {/* AI Executive Operations Summary Banner */}
        {(aiSummary || aiSummaryError) && (
          <div className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/50 rounded-3xl p-5 shadow-2xl relative animate-fadeIn space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-900/40 rounded-2xl border border-purple-700/60 shadow-inner">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>الملخص التنفيذي الاستشاري الذكي</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/50">Gemini Flash AI</span>
                  </h3>
                  <p className="text-2xs text-purple-300">تحليل فوري لحالة لوحة العمليات، الأولويات التشغيلية، ومتابعة المعاملات المتعثرة</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateExecutiveSummary}
                  disabled={isGeneratingAiSummary}
                  className="px-2.5 py-1 text-2xs bg-slate-800 hover:bg-slate-700 text-purple-200 rounded-lg border border-purple-800 transition flex items-center gap-1 disabled:opacity-50"
                  title="تحديث الملخص"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
                  <span>تحديث</span>
                </button>
                <button
                  onClick={() => { setAiSummary(null); setAiSummaryError(null); }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="إغلاق التقرير"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {aiSummaryError && (
              <div className="p-3 bg-red-950/70 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{aiSummaryError}</span>
              </div>
            )}

            {aiSummary && (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-900/30 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {aiSummary}
              </div>
            )}

            <div className="flex items-center justify-between text-2xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                <span>تقرير استشاري استدلالي مشتق من إحصاءات المنصة الحالية دون إرسال بيانات شخصية (Zero PII).</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px]">Model: Gemini 2.5 Flash</span>
            </div>
          </div>
        )}
        {/* ============================================================== */}
        {activeTab === 'cases' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Comprehensive Bank Exit Lifecycle Guide Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 rounded-3xl border border-brand-green/30 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-brand-green font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-brand-green flex-shrink-0" />
                <span>دليل فهم وإدارة «ملفات التخارج المصرفي» (Distress Exit Protocol)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>ما هو ملف التخارج؟</strong> هو ملف سيارة عليها حظر بيع بنكي أو أقساط متبقية، يتولى فريق منصة «مخلصة» إدارته قانونياً ومالياً لحماية البائع والمشتري بدون أن تستلم المنصة أي أموال من ثمن السيارة (Zero-Custody).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1 text-2xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400">1. حصر المديونية والأهلية</div>
                  <p className="text-slate-400">استخراج بيان مديونية رسمي من البنك لتحديد أصل الدين المتبقي، وفحص وجود فائض مالي للبائع أو عجز يتطلب تغطية.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-sky-400">2. نشر الإعلان واستقبال المشترين</div>
                  <p className="text-slate-400">نشر السيارة في معرض «مخلصة» واستقبال عروض شراء جادة وفحص قدرة المشتري على السداد الفوري بالبنك.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400">3. سداد البنك وإصدار المخالصة</div>
                  <p className="text-slate-400">المقابلة بفرع البنك الدائن: المشتري يسدد المديونية مباشرة في حساب القرض لاستخراج المخالصة الرسمية وخطاب رفع الحظر.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-brand-green">4. نقل الملكية بالمرور</div>
                  <p className="text-slate-400">تسجيل عقد البيع النهائي بالشهر العقاري، ونقل قيد السيارة في المرور، واستلام عمولة المنصة (1.5%).</p>
                </div>
              </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">الحالات المسندة لك</span>
                <span className="text-2xl font-black text-white mt-1 block">{authorizedCases.length} ملفات</span>
                <span className="text-[10px] text-brand-green font-bold mt-0.5 block">
                  {isOwner ? 'كافة حالات المنصة' : `خاصة بـ ${currentStaffUser?.name}`}
                </span>
              </div>

              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">حالات عاجلة جداً</span>
                <span className="text-2xl font-black text-red-400 mt-1 block">
                  {authorizedCases.filter(c => c.urgency === 'very_urgent').length}
                </span>
                <span className="text-[10px] text-red-400/80 font-bold mt-0.5 block">تخارج خلال 7 أيام</span>
              </div>

              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">حالات عجز مالي (On Hold)</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {authorizedCases.filter(c => c.settlementStatement.isShortfall).length}
                </span>
                <span className="text-[10px] text-amber-400/80 font-bold mt-0.5 block">تتطلب ضخ فارق من البائع</span>
              </div>

              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">إجمالي العمولات المستهدفة</span>
                <span className="text-2xl font-black text-brand-green mt-1 block">
                  {formatEGP(authorizedCases.reduce((s, c) => s + (c.settlementStatement.platformCommission || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">عمولة 1.5% عند الإغلاق</span>
              </div>
            </div>

            {/* Search & Status Filters */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بكود الملف، اسم البائع، الهاتف، أو نوع السيارة..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  <option value="all">كافة الحالات (25 مرحلة)</option>
                  {Object.entries(LIFECYCLE_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.labelAr}</option>
                  ))}
                </select>

                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  <option value="all">كافة مستويات الاستعجال</option>
                  <option value="very_urgent">عاجل جداً</option>
                  <option value="urgent">عاجل</option>
                  <option value="normal">عادي</option>
                </select>
              </div>
            </div>

            {/* Cases Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                    <tr>
                      <th className="py-3 px-4">كود الملف</th>
                      <th className="py-3 px-4">البائع والاتصال</th>
                      <th className="py-3 px-4">السيارة والمواصفات</th>
                      <th className="py-3 px-4">البنك وأصل الدين</th>
                      <th className="py-3 px-4">السعر المطلوب</th>
                      <th className="py-3 px-4">الحالة الإجرائية (25)</th>
                      <th className="py-3 px-4">المسؤول</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCases.map(c => {
                      const hasPendingEdit = c.revisions?.some(r => r.reviewStatus === 'pending_review');
                      return (
                        <tr key={c.caseReference} className="hover:bg-slate-900/60 transition">
                          <td className="py-3.5 px-4 font-mono font-black text-brand-green">
                            {c.caseReference}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{c.seller.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{c.seller.phone} ({c.seller.city})</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{c.vehicle.make} {c.vehicle.model} {c.vehicle.year}</span>
                            <span className="text-[11px] text-slate-400">{c.vehicle.mileage.toLocaleString()} كم</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-300 block">{c.financing.institutionName}</span>
                            <span className="text-[11px] text-red-400 font-mono">
                              دين: {formatEGP(c.financing.estimatedOutstandingPrincipal)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            <span className="text-white block">{formatEGP(c.vehicle.askingPrice)}</span>
                            {c.settlementStatement.isShortfall && (
                              <span className="text-[10px] text-red-400 font-bold block">
                                عجز: {formatEGP(c.settlementStatement.shortfallAmount)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              LIFECYCLE_STATUS_LABELS[c.status]?.color || 'bg-slate-800 text-slate-300'
                            }`}>
                              {LIFECYCLE_STATUS_LABELS[c.status]?.labelAr || c.status}
                            </span>
                            {hasPendingEdit && (
                              <span className="inline-block mr-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                                تعديل مطلوب
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {c.assignedEmployeeName}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setActiveManagingCase(c)}
                                className="px-2.5 py-1.5 rounded-lg bg-brand-green text-slate-950 font-bold hover:bg-emerald-400 transition"
                              >
                                إدارة الملف
                              </button>
                              <button
                                onClick={() => {
                                  setCallTargetCase(c);
                                  setShowCallModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 text-brand-green hover:bg-slate-700 transition"
                                title="تسجيل مكالمة / متابعة"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: EDIT REQUESTS & REVISIONS REVIEW QUEUE                  */}
        {/* ============================================================== */}
        {activeTab === 'edits_review' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Guide Explainer Banner for Edit Requests */}
            <div className="p-4.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3 shadow-md">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="font-black text-white text-sm">ما هي طلبات التعديل وبناءً على ماذا تظهر هنا؟</div>
                <p className="text-2xs text-slate-300 leading-relaxed">
                  تظهر طلبات التعديل عندما يقوم البائع بتعديل السعر المطلوب (مثل تخفيض السعر لتسريع البيع أو استجابة لنصيحة الإدارة) أو تحديث قراءة العداد ومواصفات سيارته من خلال حسابه، أو بعد طلب الإدارة منه تعديل بيانات الإعلان.
                  تقوم الإدارة هنا بمراجعة الفارق بين القيمة القديمة والجديدة والضغط على <strong>«اعتماد التعديل»</strong> لترقية الإعلان فوراً في المعرض، أو <strong>«رفض»</strong> مع إشعار البائع بالسبب.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-brand-green" />
                  <span>طابور تدقيق تعديلات البائعين (Seller Edit Review Queue)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعديلات مؤثرة قام بها البائعون تتطلب تدقيقاً قبل تحديث الإعلان العام أو إغلاق الصفقات.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                {pendingEditRevisions.length} طلبات قيد المراجعة
              </span>
            </div>

            {pendingEditRevisions.length > 0 ? (
              <div className="space-y-4">
                {pendingEditRevisions.map(({ caseItem, revision }) => (
                  <div key={revision.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    
                    <div className="flex justify-between items-start gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-green">{caseItem.caseReference}</span>
                          <span className="text-white font-extrabold">{caseItem.vehicle.make} {caseItem.vehicle.model}</span>
                          <span className="text-xs text-slate-400">• البائع: {caseItem.seller.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          تاريخ تقديم التعديل: {revision.timestamp}
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                        في انتظار المراجعة
                      </span>
                    </div>

                    {/* Diff Viewer Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 space-y-1">
                        <span className="text-red-400 font-bold block">القيمة السابقة ({revision.fieldLabelAr}):</span>
                        <div className="font-black text-white text-sm">
                          {typeof revision.previousValue === 'number' ? formatEGP(revision.previousValue) : JSON.stringify(revision.previousValue)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                        <span className="text-emerald-400 font-bold block">القيمة الجديدة المقترحة من البائع:</span>
                        <div className="font-black text-brand-green text-sm">
                          {typeof revision.newValue === 'number' ? formatEGP(revision.newValue) : JSON.stringify(revision.newValue)}
                        </div>
                      </div>
                    </div>

                    {revision.reviewNotes && (
                      <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <strong className="text-brand-green ml-1">مبرر التعديل:</strong> {revision.reviewNotes}
                      </p>
                    )}

                    {/* Action Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <div className="w-full sm:w-1/2">
                        <input
                          type="text"
                          value={reviewNoteInput}
                          onChange={(e) => setReviewNoteInput(e.target.value)}
                          placeholder="ملاحظات مسؤول المراجعة للبائع..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApproveRevision(caseItem.caseReference, revision.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-green hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>اعتماد التعديل وتحديث الإعلان</span>
                        </button>
                        <button
                          onClick={() => handleRejectRevision(caseItem.caseReference, revision.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 rounded-2xl p-10 border border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto" />
                <h4 className="font-extrabold text-sm text-white">لا توجد أي طلبات تعديل معلقة حالياً</h4>
                <p className="text-xs text-slate-400">كافة بيانات السيارات والإعلانات مطابقة ومحدثة.</p>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: TEAM & WORKLOAD (OWNER ONLY)                            */}
        {/* ============================================================== */}
        {activeTab === 'team' && isOwner && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-extrabold text-base text-white">
              فريق العمليات وتوزيع الحالات (Workload Distribution):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MOCK_EMPLOYEES.map(emp => {
                const assigned = cases.filter(c => c.assignedEmployeeId === emp.id);
                return (
                  <div key={emp.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-white text-sm">{emp.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-brand-green font-bold text-[10px]">
                        {emp.role === 'owner' ? 'المدير العام' : emp.role === 'legal_officer' ? 'شؤون قانونية' : 'مسؤول حالات'}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 pt-1">
                      <span>الحالات المسندة:</span>
                      <strong className="text-white">{assigned.length} ملفات</strong>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                      {assigned.map(c => (
                        <div key={c.caseReference} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <span className="font-mono text-brand-green">{c.caseReference}</span>
                          <span className="text-slate-300">{c.vehicle.make} {c.vehicle.model}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: COMPLIANCE AUDIT (OWNER ONLY)                           */}
        {/* ============================================================== */}
        {activeTab === 'compliance' && isOwner && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-brand-green font-extrabold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>ضوابط الامتثال المصرفي والقانوني وقانون حماية البيانات 151 لسنة 2020</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                تطبق منصة «مخلصة» أعلى معايير الحوكمة المالية لمنع أي شبهة غسيل أموال أو احتجاز ودائع. لا تحتفظ المنصة بأي أموال تخص تسوية البنوك في أي حساب شخصي، وتتم كافة الإيداعات مباشرة في خزينة البنك الدائن.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">حجب أرقام الشاسيه والبطاقات</span>
                  <p className="text-slate-400 text-[11px]">يتم تعتيم أرقام الشاسيه والبطاقات القومية برمجياً لمنع استغلالها خارج إطار الصفقة.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">حظر التوكيلات العامة المفتوحة</span>
                  <p className="text-slate-400 text-[11px]">منع بيع سيارات القروض بالتوكيلات العرفية، وفرض البيع النهائي المسجل بالشهر العقاري.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">Zero-Custody Banking</span>
                  <p className="text-slate-400 text-[11px]">إيداع مالي مباشر في فرع البنك الدائن باسم حساب القرض مع إيصال مصرفي رسمي مختوم.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: VEHICLE LISTINGS MODERATION QUEUE (SUPABASE INTEGRATED)   */}
        {/* ============================================================== */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-green" />
                    <span>قائمة مراجعة واعتماد إعلانات السيارات (Moderation Queue)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    مراجعة بيانات السيارات المدخلة، مطابقة مواصفات المديونية، واعتماد أو رفض أو طلب تعديل الإعلانات قبل ظهورها في المعرض العام.
                  </p>
                </div>

                <button
                  onClick={loadModerationListings}
                  disabled={moderationLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${moderationLoading ? 'animate-spin text-brand-green' : 'text-slate-400'}`} />
                  <span>تحديث القائمة</span>
                </button>
              </div>

              {moderationMessage && (
                <div className="p-3 bg-slate-900 border border-brand-green/40 rounded-xl text-xs font-bold text-brand-green flex items-center justify-between">
                  <span>{moderationMessage}</span>
                  <button onClick={() => setModerationMessage(null)} className="text-slate-400 hover:text-white p-1">✕</button>
                </div>
              )}

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: 'all', label: 'الكل', count: dbListings.length },
                  { id: 'pending_review', label: 'بانتظار المراجعة', count: dbListings.filter(l => l.status === 'pending_review').length },
                  { id: 'published', label: 'منشور بالمعرض', count: dbListings.filter(l => l.status === 'published' || l.status === 'approved').length },
                  { id: 'needs_changes', label: 'مطلوب تعديلات', count: dbListings.filter(l => l.status === 'needs_changes').length },
                  { id: 'rejected', label: 'مرفوض', count: dbListings.filter(l => l.status === 'rejected').length },
                  { id: 'archived', label: 'مؤرشف', count: dbListings.filter(l => l.status === 'archived' || l.status === 'withdrawn').length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setModerationFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 ${
                      moderationFilter === tab.id
                        ? 'bg-brand-green text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-3xs font-mono font-bold ${
                      moderationFilter === tab.id ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Status Metrics Overview (Priority 3) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-3xs text-emerald-400 font-bold block uppercase">منشور ونشط</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {dbListings.filter(l => l.status === 'published' || l.status === 'approved').length}
                </span>
                <span className="text-3xs text-slate-500">متاح بالمعرض العام</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-3xs text-amber-400 font-bold block uppercase">قيد المراجعة</span>
                <span className="text-xl font-black text-amber-300 mt-1 block">
                  {dbListings.filter(l => l.status === 'pending_review').length}
                </span>
                <span className="text-3xs text-slate-500">بانتظار الاعتماد</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-3xs text-blue-400 font-bold block uppercase">عروض شراء</span>
                <span className="text-xl font-black text-blue-300 mt-1 block">
                  {purchaseOffers.length}
                </span>
                <span className="text-3xs text-slate-500">طلبات المشترين</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-3xs text-violet-400 font-bold block uppercase">قيد التفاوض</span>
                <span className="text-xl font-black text-violet-300 mt-1 block">
                  {purchaseOffers.filter(o => o.status === 'negotiating' || o.status === 'communicated_to_seller').length}
                </span>
                <span className="text-3xs text-slate-500">مرحلة الاتفاق</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-3xs text-teal-400 font-bold block uppercase">معتمدة / مباعة</span>
                <span className="text-xl font-black text-teal-300 mt-1 block">
                  {dbListings.filter(l => l.status === 'approved' || l.status === 'sold').length}
                </span>
                <span className="text-3xs text-slate-500">جاهزة أو مخلصة</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-3xs text-rose-400 font-bold block uppercase">مرفوض / مسحوب</span>
                <span className="text-xl font-black text-rose-300 mt-1 block">
                  {dbListings.filter(l => l.status === 'rejected' || l.status === 'archived').length}
                </span>
                <span className="text-3xs text-slate-500">غير معتمد أو ملغي</span>
              </div>
            </div>

            {/* Listings Grid */}
            {moderationLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
                <p>جاري تحميل الإعلانات من قاعدة البيانات...</p>
              </div>
            ) : displayedListings.length === 0 ? (
              <div className="py-16 text-center bg-slate-950 rounded-3xl border border-slate-800 space-y-2">
                <CarIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-white">لا توجد إعلانات تطابق الفلتر المحدد حالياً</h4>
                <p className="text-xs text-slate-500">سيظهر هنا أي إعلان يقدمه العملاء عبر نموذج «اعرض عربيتك للبيع».</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayedListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-600">
                          {item.images && item.images.length > 0 ? (
                            <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CarIcon className="w-8 h-8" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black text-sm text-white flex flex-wrap items-center gap-2">
                            <span>{item.make} {item.model} — {item.year}</span>
                            <span className="font-mono text-3xs text-slate-400 font-normal">#{item.id.slice(0, 8)}</span>
                            {item.is_direct_installment || item.sale_type === 'direct_installment' ? (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🟡 تقسيط مباشر
                              </span>
                            ) : item.sale_type === 'cash' || item.financing_type === 'fully_owned' ? (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                🟢 بيع كاش
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                🏦 تسوية بنكية
                              </span>
                            )}
                          </h4>
                          <div className="text-2xs text-slate-400 font-medium flex flex-wrap items-center gap-2">
                            <span>المحافظة: {item.governorate}</span>
                            <span>•</span>
                            <span>العداد: {Number(item.mileage).toLocaleString('ar-EG')} كم</span>
                            <span>•</span>
                            {item.is_direct_installment || item.sale_type === 'direct_installment' ? (
                              <span className="text-amber-300 font-bold">
                                مقدم: {Number(item.down_payment || 0).toLocaleString('ar-EG')} ج.م | قسط: {Number(item.monthly_installment || 0).toLocaleString('ar-EG')} ج.م
                              </span>
                            ) : (
                              <span>جهة التمويل: {item.financing_provider || 'غير محدد'}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-left">
                          <div className="text-sm font-black text-brand-green font-mono">
                            {Number(item.asking_price).toLocaleString('ar-EG')} ج.م
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-3xs font-black shadow-sm ${
                            item.status === 'pending_review' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            (item.status === 'published' || item.status === 'approved') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                            item.status === 'needs_changes' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            item.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {item.status === 'pending_review' ? '⏳ بانتظار مراجعة الإدارة' :
                             item.status === 'published' ? '🚀 تم النشر في المعرض' :
                             item.status === 'approved' ? '✓ معتمد' :
                             item.status === 'needs_changes' ? '✏ مطلوب تعديلات' :
                             item.status === 'rejected' ? '✕ مرفوض' : item.status}
                          </span>
                        </div>

                        <button
                          onClick={() => { setSelectedModerationListing(item); setAdminFeedbackInput(item.review_feedback || ''); }}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-green" />
                          <span>فحص الإعلان</span>
                        </button>
                      </div>
                    </div>

                    {/* Condition Story Summary */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                      <div className="font-bold text-slate-300">وصف البائع للحالة والتعثر:</div>
                      <p className="text-slate-400 text-2xs leading-relaxed line-clamp-2">
                        {item.condition_description}
                      </p>
                    </div>

                    {/* Seller Contact & Case Code Bar (Priority 2, 3, 4) */}
                    <div className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-2xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">كود الملف:</span>
                        <span className="font-mono font-bold text-brand-green">
                          {item.case_reference || (`MK-${item.id.slice(0, 8).toUpperCase()}`)}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">المرور:</span>
                        <span className="font-bold text-amber-300">{item.traffic_unit || 'مرور فيصل'}</span>
                        {item.is_hidden && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/50">
                              👁️ مخفي مؤقتاً عن المعرض
                            </span>
                          </>
                        )}
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">البائع:</span>
                        <span className="font-bold text-white">{item.seller_name || 'مالك أول'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-3xs border border-emerald-800/60" dir="ltr">
                          {item.seller_phone}
                        </span>

                        {/* Direct Click-to-Call */}
                        {item.seller_phone && (
                          <a
                            href={`tel:${item.seller_phone}`}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1 text-3xs border border-slate-700"
                            title="اتصال هاتفي مباشر بالبائع"
                          >
                            <PhoneCall className="w-2.5 h-2.5 text-emerald-400" />
                            <span>اتصال</span>
                          </a>
                        )}

                        {/* Direct WhatsApp */}
                        {item.seller_phone && (() => {
                          const clean = (item.seller_phone || '').replace(/\D/g, '');
                          const intl = clean.startsWith('0') ? `2${clean}` : clean.startsWith('20') ? clean : `20${clean}`;
                          const waMsg = encodeURIComponent(`مرحباً أستاذ ${item.seller_name || ''}، معك مستشار منصة مخلصة بخصوص سيارتك المعروضة (${item.make} ${item.model}) كود: ${item.case_reference || item.id.slice(0, 8)}...`);
                          return (
                            <a
                              href={`https://wa.me/${intl}?text=${waMsg}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 text-3xs shadow-sm"
                              title="تواصل مباشر عبر واتساب"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>واتساب</span>
                            </a>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Temporary Hide / Unhide Toggle */}
                        {(item.status === 'published' || item.status === 'approved' || item.is_hidden) && (
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(item.id, !item.is_hidden)}
                            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 text-3xs border ${
                              item.is_hidden
                                ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-700/60 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title={item.is_hidden ? 'إعادة إظهار الإعلان بالمعرض العام' : 'إخفاء الإعلان مؤقتاً عن المعرض (حجز / جاري المقابلة)'}
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>{item.is_hidden ? '✨ إعادة إظهار بالمعرض' : '👁️ إخفاء مؤقت عن المعرض'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate('marketplace')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1 text-3xs"
                          title="عرض الإعلان على الموقع"
                        >
                          <ExternalLink className="w-3 h-3 text-brand-green" />
                          <span>عرض الإعلان على الموقع</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setListingForFollowup(item); setFollowupContent(''); setFollowupNextAction(''); }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800/50 transition flex items-center gap-1 text-3xs"
                          title="متابعة إدارية وتسجيل مكالمة"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>متابعة إدارية / مكالمات</span>
                        </button>
                        {item.status !== 'rejected' && item.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => { setListingToDeactivate(item); setDeactivationReasonInput(''); }}
                            className="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 font-bold border border-rose-800/50 transition flex items-center gap-1 text-3xs"
                            title="سحب الإعلان مع توثيق السبب"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>سحب الإعلان</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Deactivation Banner if deactivated */}
                    {item.deactivation_reason && (
                      <div className="p-2.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-2xs text-rose-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span><strong>سبب السحب/التعطيل:</strong> {item.deactivation_reason}</span>
                        </div>
                        {item.deactivated_by && <span className="text-slate-400 text-3xs">بواسطة: {item.deactivated_by}</span>}
                      </div>
                    )}

                    {/* Quick Moderate Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-2 text-xs">
                      <div className="text-3xs text-slate-500 font-mono">
                        تاريخ الإضافة: {new Date(item.created_at).toLocaleString('ar-EG')}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Documents Status / Request Button */}
                        {item.documents_verified ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            ✓ الأوراق موثقة ومضمونة
                          </span>
                        ) : item.documents_submitted ? (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-3xs font-bold flex items-center gap-1">
                            <FileText className="w-3 h-3 text-sky-400" />
                            📄 أوراق مرفوعة بانتظار فحصك
                          </span>
                        ) : item.documents_requested ? (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-3xs font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            بانتظار الأوراق
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRequestDocuments(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-3xs font-bold transition flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-brand-green" />
                            <span>طلب المستندات</span>
                          </button>
                        )}

                        {item.status !== 'approved' && item.status !== 'published' && (
                          <button
                            onClick={() => handleModerate(item.id, 'published')}
                            disabled={moderationActionLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white text-2xs font-black transition flex items-center gap-1 shadow-sm"
                          >
                            ✓ اعتماد ونشر بالمعرض (Approve & Publish)
                          </button>
                        )}

                        {(item.status === 'approved' || item.status === 'published') && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-3xs font-black flex items-center gap-1">
                            ✓ منشور بالمعرض الآن
                          </span>
                        )}

                        <button
                          onClick={() => { setSelectedModerationListing(item); setAdminFeedbackInput(item.review_feedback || ''); }}
                          className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 text-2xs font-bold transition"
                        >
                          ✏ طلب تعديلات (Needs Changes)
                        </button>

                        {item.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(item.id, 'rejected', 'الإعلان غير مطابق لمعايير المنصة')}
                            disabled={moderationActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-2xs font-bold transition"
                          >
                            ✕ رفض (Reject)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: PURCHASE OFFERS & BUYER NEGOTIATION (PHASE 8 & 9)        */}
        {/* ============================================================== */}
        {activeTab === 'purchase_offers' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-brand-green" />
                    <span>عروض الشراء والطلبات الواردة (Purchase Offers Queue)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    إدارة وتنسيق عروض المشترين، والاتصال المباشر عبر واتساب وهاتفياً بتنسيق مستشار الصفقات في مخلصة.
                  </p>
                </div>

                <button
                  onClick={loadPurchaseOffers}
                  disabled={offersLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${offersLoading ? 'animate-spin text-brand-green' : 'text-slate-400'}`} />
                  <span>تحديث العروض</span>
                </button>
              </div>

              {offerActionMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 font-bold">
                  {offerActionMsg}
                </div>
              )}
            </div>

            {/* Offers Cards List */}
            {offersLoading ? (
              <div className="p-12 text-center text-slate-400 bg-slate-950 rounded-3xl border border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-green mb-2" />
                <p className="text-xs font-bold">جاري تحميل عروض الشراء...</p>
              </div>
            ) : purchaseOffers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-950 rounded-3xl border border-slate-800 space-y-2">
                <Tag className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-300">لا توجد عروض شراء واردة حتى الآن</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  عند قيام المشترين بتقديم عروض شراء على السيارات المنشورة في المعرض، ستظهر هنا للتنسيق والتواصل المباشر.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchaseOffers.map((offer) => {
                  const cleanPhone = (offer.buyerPhone || '').replace(/\D/g, '');
                  const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('20') ? cleanPhone : `20${cleanPhone}`;
                  const waText = encodeURIComponent(
                    `مرحباً أستاذ ${offer.buyerName}، معك مستشار الصفقات من منصة مخلصة بخصوص عرض الشراء المقدم على سيارة ${offer.carTitle} (كود الحالة: ${offer.caseReference}) بمبلغ ${offer.offeredPrice.toLocaleString()} ج.م...`
                  );

                  // Price Difference Breakdown
                  const priceDiff = offer.offeredPrice - offer.askingPrice;
                  const diffPercent = Math.round((Math.abs(priceDiff) / (offer.askingPrice || 1)) * 100);
                  const isUnder = priceDiff < 0;
                  const isOver = priceDiff > 0;

                  // Car Deal State Checks
                  const isThisOfferAccepted = offer.status === 'accepted';
                  const isAnyOtherOfferAccepted = purchaseOffers.some(
                    o => o.id !== offer.id &&
                         ((offer.listingId && o.listingId === offer.listingId) ||
                          (offer.caseReference && o.caseReference === offer.caseReference)) &&
                         o.status === 'accepted'
                  );

                  return (
                    <div
                      key={offer.id}
                      className={`bg-slate-950 p-5 rounded-2xl border transition space-y-4 ${
                        isThisOfferAccepted
                          ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                          : isAnyOtherOfferAccepted
                          ? 'border-slate-800/60 opacity-80'
                          : offer.status === 'seller_accepted'
                          ? 'border-emerald-500/50 shadow-md'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{offer.buyerName}</span>
                            <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-900 border border-slate-700 text-slate-300 font-mono" dir="ltr">
                              {offer.buyerPhone}
                            </span>
                          </div>
                          <span className="text-2xs text-brand-green font-bold block mt-1">
                            {offer.carTitle} (كود: {offer.caseReference})
                          </span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-3xs font-extrabold border ${
                          isThisOfferAccepted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-black'
                          : isAnyOtherOfferAccepted
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : offer.status === 'seller_accepted'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse font-black'
                          : offer.status === 'new'
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                          : offer.status === 'communicated_to_seller'
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                          : offer.status === 'contacted'
                            ? 'bg-blue-950/50 text-blue-300 border-blue-800/60'
                          : offer.status === 'negotiating'
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                          : 'bg-rose-950/50 text-rose-300 border-rose-800/60'
                        }`}>
                          {isThisOfferAccepted ? '✅ صفقة معتمدة' :
                           isAnyOtherOfferAccepted ? 'قائمة انتظار بديلة' :
                           offer.status === 'seller_accepted' ? '🎉 وافق البائع على العرض' :
                           offer.status === 'communicated_to_seller' ? 'تم الإرسال للبائع' :
                           offer.status === 'new' ? 'طلب جديد' :
                           offer.status === 'contacted' ? 'تم التواصل' :
                           offer.status === 'negotiating' ? 'جاري التفاوض' : 'مرفوض'}
                        </span>
                      </div>

                      {/* 3-Column Negotiation & Price Difference Breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-3xs">السعر المطلوب:</span>
                          <span className="font-bold text-slate-200">
                            {offer.askingPrice.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-3xs">عرض المشتري:</span>
                          <span className="font-bold text-emerald-400">
                            {offer.offeredPrice.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-3xs">فارق التفاوض:</span>
                          <span className={`font-black text-2xs ${
                            isUnder ? 'text-amber-400' : isOver ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {priceDiff === 0
                              ? 'مطابق تماماً'
                              : `${priceDiff > 0 ? '+' : ''}${priceDiff.toLocaleString()} ج.م (${diffPercent}%)`}
                          </span>
                        </div>
                      </div>

                      {/* Deal Status Banners */}
                      {isThisOfferAccepted && (
                        <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <div>
                            <div>✅ صفقة معتمدة نهائياً - تم التنسيق لمقابلة البنك والمعاينة خلال 24 ساعة</div>
                            <div className="text-3xs text-emerald-300/80 font-normal mt-0.5">
                              تم حجز السيارة تلقائياً بالمعرض وإشعار الطرفين (المشتري والبائع) لمتابعة الإجراءات.
                            </div>
                          </div>
                        </div>
                      )}

                      {isAnyOtherOfferAccepted && (
                        <div className="p-2.5 bg-slate-900/90 border border-amber-800/40 rounded-xl text-2xs text-amber-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <strong>عرض بديل (في قائمة الانتظار):</strong> تم اعتماد صفقة أخرى بالفعل لهذه السيارة. يبقى هذا العرض كاحتياطي في حال تعثر إتمام الصفقة الأولى.
                          </div>
                        </div>
                      )}

                      {offer.status === 'seller_accepted' && !isThisOfferAccepted && (
                        <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/50 rounded-xl text-2xs text-emerald-300 flex items-center gap-2 animate-pulse">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span><strong>وافق البائع على السعر!</strong> جاهز للاعتماد النهائي وتحديد موعد المقابلة البنكية.</span>
                        </div>
                      )}

                      <div className="text-2xs text-slate-400 space-y-1 bg-slate-900/50 p-3 rounded-xl">
                        <div>طريقة السداد: <strong className="text-slate-200">{offer.paymentPreference === 'cash_at_bank' ? 'سداد مباشر بالبنك' : offer.paymentPreference === 'need_new_financing' ? 'طلب تمويل جديد' : 'كاش بالشهر العقاري'}</strong></div>
                        <div>وقت الاتصال المفضل: <strong className="text-slate-200">{offer.preferredContactTime}</strong></div>
                        {offer.notes && <div>ملاحظات المشتري: <span className="text-slate-300 italic">"{offer.notes}"</span></div>}
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 gap-2">
                        {/* Status update selector */}
                        {!isThisOfferAccepted && !isAnyOtherOfferAccepted ? (
                          <select
                            value={offer.status}
                            onChange={(e) => handleUpdateOfferStatus(offer.id, e.target.value as any)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-3xs font-bold focus:outline-none"
                          >
                            <option value="new">جديد</option>
                            <option value="contacted">تم التواصل</option>
                            <option value="communicated_to_seller">أرسل للبائع</option>
                            <option value="seller_accepted">وافق البائع</option>
                            <option value="negotiating">جاري التفاوض</option>
                            <option value="accepted">مقبول ومعتمد</option>
                            <option value="declined">مرفوض</option>
                          </select>
                        ) : (
                          <span className="text-3xs text-slate-500 font-mono">
                            {isThisOfferAccepted ? 'معاملة مغلقة ومعتمدة' : 'عرض انتظار بديل'}
                          </span>
                        )}

                        {/* Forward to Seller & Communication Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {offer.status === 'seller_accepted' && !isThisOfferAccepted && (
                            <button
                              type="button"
                              onClick={() => handleConfirmDeal(offer.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-brand-green hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition animate-pulse"
                              title="اعتماد الاتفاق النهائي وإشعار المشتري والبائع بالتواصل خلال 24 ساعة للمقابلة"
                            >
                              <CheckCircle2 className="w-4 h-4 text-slate-950" />
                              <span>اعتماد وتنسيق المقابلة (إشعار الطرفين)</span>
                            </button>
                          )}

                          {!isThisOfferAccepted && !isAnyOtherOfferAccepted && offer.status !== 'communicated_to_seller' && offer.status !== 'seller_accepted' && offer.status !== 'accepted' && offer.status !== 'declined' && (
                            <button
                              type="button"
                              onClick={() => handleForwardOffer(offer.id)}
                              className="px-3 py-1.5 rounded-xl bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border border-brand-green/40 font-bold text-xs flex items-center gap-1.5 transition"
                              title="تمرير العرض للبائع في لوحة حسابه للقبول أو الرفض"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>إرسال العرض للبائع</span>
                            </button>
                          )}

                          {offer.status === 'communicated_to_seller' && !isThisOfferAccepted && !isAnyOtherOfferAccepted && (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-3xs font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>تم الإرسال للبائع (بانتظار رده)</span>
                            </span>
                          )}

                          <a
                            href={`https://wa.me/${intlPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition"
                            title="تواصل واتساب مع المشتري"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>واتساب المشتري</span>
                          </a>

                          <a
                            href={`tel:+${intlPhone}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                            title="اتصال هاتفي بالمشتري"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                            <span>اتصال</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: CUSTOMER DATABASE & EXCEL EXPORT (LOW OVERHEAD / NO SERVER STRAIN) */}
        {/* ============================================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header & Excel Action Banner */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-green" />
                    <span>سجل العملاء وتصدير البيانات إلى Excel</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    قاعدة بيانات مركزية آمنة ومزامنة مع Supabase، مع ميزة التصدير لشيت Excel/CSV فوراً وحفظها على جهازك بدون أي حمل على السيرفر.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={fetchCustomers}
                    disabled={customersLoading}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${customersLoading ? 'animate-spin text-brand-green' : ''}`} />
                    <span>تحديث السجل</span>
                  </button>

                  <button
                    onClick={exportCustomersToExcel}
                    disabled={customersLoading || customersList.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير داتا العملاء إلى Excel / CSV</span>
                  </button>
                </div>
              </div>

              {exportNotice && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{exportNotice}</span>
                </div>
              )}
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-2xs block">إجمالي العملاء المسجلين</span>
                <span className="text-xl font-black text-white">{customersList.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-2xs block">موثقين برمز OTP</span>
                <span className="text-xl font-black text-emerald-400">
                  {customersList.filter(c => c.is_verified).length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-2xs block">حسابات نشطة</span>
                <span className="text-xl font-black text-sky-400">
                  {customersList.filter(c => c.account_status !== 'pending_deletion').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-2xs block">بانتظار الحذف (مهلة 30 يوم)</span>
                <span className="text-xl font-black text-rose-400">
                  {customersList.filter(c => c.account_status === 'pending_deletion').length}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، رقم الهاتف، البريد أو المحافظة..."
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-green text-right"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'verified', label: 'الموثقين فقط' },
                  { id: 'pending_deletion', label: 'طلبات الحذف' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCustomerFilterStatus(tab.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                      customerFilterStatus === tab.id
                        ? 'bg-brand-green text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Table */}
            {customersLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
                <p>جاري مزامنة بيانات العملاء...</p>
              </div>
            ) : customersList.length === 0 ? (
              <div className="p-12 text-center bg-slate-950 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                لا توجد سجلات عملاء حالياً. تظهر السجلات هنا تلقائياً بمجرد تسجيل أي عميل.
              </div>
            ) : (
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs" dir="rtl">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-2xs uppercase">
                        <th className="p-3.5">العميل</th>
                        <th className="p-3.5">الهاتف (واتساب)</th>
                        <th className="p-3.5">البريد الإلكتروني</th>
                        <th className="p-3.5">الموقع</th>
                        <th className="p-3.5">التوثيق (OTP)</th>
                        <th className="p-3.5">حالة الحساب</th>
                        <th className="p-3.5">تاريخ التسجيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {customersList
                        .filter(c => {
                          const matchesSearch = !customerSearchQuery || 
                            (c.full_name || c.name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                            (c.phone || '').includes(customerSearchQuery) ||
                            (c.email || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                            (c.governorate || '').includes(customerSearchQuery);

                          if (!matchesSearch) return false;
                          if (customerFilterStatus === 'verified') return Boolean(c.is_verified);
                          if (customerFilterStatus === 'pending_deletion') return c.account_status === 'pending_deletion';
                          return true;
                        })
                        .map((c, idx) => (
                          <tr key={c.id || idx} className="hover:bg-slate-900/40 transition">
                            <td className="p-3.5 font-bold text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-brand-green/20 text-brand-green flex items-center justify-center font-bold text-2xs">
                                {(c.full_name || c.name || 'ع')[0]}
                              </div>
                              <span>{c.full_name || c.name || 'عميل مخلصة'}</span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-300" dir="ltr">
                              {c.phone ? (
                                <a
                                  href={`https://wa.me/20${c.phone.replace(/^0+/, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 justify-end"
                                  title="فتح محادثة واتساب مع العميل"
                                >
                                  <span>{c.phone}</span>
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-600">غير مسجل</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-2xs text-slate-400">
                              {c.email || '—'}
                            </td>
                            <td className="p-3.5 text-slate-300">
                              {c.governorate || 'القاهرة'} {c.city ? `— ${c.city}` : ''}
                            </td>
                            <td className="p-3.5">
                              {c.is_verified ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-600/30 font-bold text-3xs">
                                  موثق ✓
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-600/30 text-3xs">
                                  غير موثق
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              {c.account_status === 'pending_deletion' ? (
                                <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-600/30 font-bold text-3xs flex items-center gap-1 w-fit">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>بانتظار الحذف (30 يوم)</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-400 border border-sky-600/30 text-3xs font-bold">
                                  نشط
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-400 font-mono text-2xs">
                              {new Date(c.created_at || Date.now()).toLocaleDateString('ar-EG')}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: AUDIT LOGS (IMMUTABLE & APPEND-ONLY)                       */}
        {/* ============================================================== */}
        {activeTab === 'audit_logs' && isOwner && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-green" />
                    <span>سجلات التدقيق الأمني المحكمة (Immutable Audit Logs)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    سجل تاريخي غير قابل للتعديل أو الحذف بفضل سياسات PostgreSQL RLS الصارمة، لتوثيق كافة العمليات الحساسة.
                  </p>
                </div>

                <button
                  onClick={loadAuditLogs}
                  disabled={auditLogsLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLogsLoading ? 'animate-spin text-brand-green' : 'text-slate-400'}`} />
                  <span>تحديث السجلات</span>
                </button>
              </div>

              {/* Security Badge */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>ضمان أمني: الجدول مغلق ضد التعديل أو الحذف (Append-only)، ولا تظهر به كلمات المرور إطلاقاً.</span>
              </div>
            </div>

            {auditLogsLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
                <p>جاري قراءة السجلات المشفرة من خادم Supabase...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-16 text-center bg-slate-950 rounded-3xl border border-slate-800 space-y-2">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-white">لا توجد سجلات تدقيق مسجلة حتى الآن</h4>
                <p className="text-xs text-slate-500">يتم تسجيل الأحداث تلقائياً عند إضافة إعلانات، تعديل الحسابات، أو اتخاذ إجراءات المشرفين.</p>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">التوقيت (UTC)</th>
                        <th className="p-3.5">نوع الحدث</th>
                        <th className="p-3.5">معرف الفاعل (Actor)</th>
                        <th className="p-3.5">معرف السجل (Record ID)</th>
                        <th className="p-3.5">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-2xs">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/50">
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('ar-EG')}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-brand-green/20 text-brand-green border border-brand-green/30">
                              {log.event_type}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {log.actor_id ? log.actor_id.slice(0, 8) + '...' : 'System'}
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {log.record_id ? log.record_id.slice(0, 8) + '...' : '—'}
                          </td>
                          <td className="p-3.5 text-slate-400 font-sans max-w-xs truncate">
                            {log.details ? JSON.stringify(log.details) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL 3: MODERATION REVIEW DETAIL & ACTION                     */}
      {/* ============================================================== */}
      {selectedModerationListing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-7 max-w-2xl w-full border border-slate-800 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  <span>تدقيق ومراجعة الإعلان: {selectedModerationListing.make} {selectedModerationListing.model} ({selectedModerationListing.year})</span>
                </h3>
                <span className="text-3xs text-slate-400 font-mono">ID: {selectedModerationListing.id}</span>
              </div>
              <button onClick={() => setSelectedModerationListing(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            {/* Photos Carousel/Row */}
            {selectedModerationListing.images && selectedModerationListing.images.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-3xs text-slate-400 font-bold">صور السيارة المرفقة:</span>
                <div className="grid grid-cols-4 gap-2">
                  {selectedModerationListing.images.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 block aspect-video hover:opacity-80 transition">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-3xs">السعر المطلوب:</span>
                <span className="font-black text-brand-green font-mono">{Number(selectedModerationListing.asking_price).toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div>
                <span className="text-slate-400 block text-3xs">نظام وطريقة البيع:</span>
                <span className="font-bold text-white">
                  {selectedModerationListing.is_direct_installment || selectedModerationListing.sale_type === 'direct_installment' ? '🟡 تقسيط مباشر' :
                   selectedModerationListing.sale_type === 'cash' || selectedModerationListing.financing_type === 'fully_owned' ? '🟢 بيع كاش' :
                   '🏦 تسوية بنكية'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-3xs">قراءة العداد:</span>
                <span className="font-bold text-white">{Number(selectedModerationListing.mileage).toLocaleString('ar-EG')} كم</span>
              </div>
              <div>
                <span className="text-slate-400 block text-3xs">المحافظة والمدينة:</span>
                <span className="font-bold text-white">{selectedModerationListing.governorate} — {selectedModerationListing.city || 'المركز'}</span>
              </div>
              {(selectedModerationListing.is_direct_installment || selectedModerationListing.sale_type === 'direct_installment') ? (
                <>
                  <div>
                    <span className="text-slate-400 block text-3xs">أقل مقدم مطلوب:</span>
                    <span className="font-bold text-amber-400 font-mono">{Number(selectedModerationListing.down_payment || 0).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-3xs">القسط الشهري:</span>
                    <span className="font-bold text-amber-400 font-mono">{Number(selectedModerationListing.monthly_installment || 0).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-3xs">مدة التقسيط بالشهور:</span>
                    <span className="font-bold text-white font-mono">{selectedModerationListing.installment_period_months || 36} شهراً</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400 block text-3xs">جهة التمويل / البنك:</span>
                    <span className="font-bold text-amber-400">{selectedModerationListing.financing_provider || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-3xs">أصل الدين المتبقي:</span>
                    <span className="font-bold text-white font-mono">{Number(selectedModerationListing.outstanding_amount || 0).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-3xs">القسط الشهري:</span>
                    <span className="font-bold text-white font-mono">{Number(selectedModerationListing.monthly_installment || 0).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-slate-400 block text-3xs">اسم البائع:</span>
                <span className="font-bold text-white">{selectedModerationListing.seller_name || 'مالك السيارة'}</span>
              </div>
              <div className="col-span-2 flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 gap-2">
                <div>
                  <span className="text-slate-400 block text-3xs font-bold">رقم هاتف وتواصل البائع:</span>
                  <span className="font-black text-white font-mono text-sm" dir="ltr">{selectedModerationListing.seller_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedModerationListing.seller_phone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1.5 text-xs border border-slate-700"
                    title="اتصال هاتفي مباشر بالبائع"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اتصال بالبائع</span>
                  </a>
                  {(() => {
                    const clean = (selectedModerationListing.seller_phone || '').replace(/\D/g, '');
                    const intl = clean.startsWith('0') ? `2${clean}` : clean.startsWith('20') ? clean : `20${clean}`;
                    const waMsg = encodeURIComponent(`مرحباً أستاذ ${selectedModerationListing.seller_name || ''}، معك إدارة منصة مخلصة بخصوص سيارتك المعروضة (${selectedModerationListing.make} ${selectedModerationListing.model})...`);
                    return (
                      <a
                        href={`https://wa.me/${intl}?text=${waMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 text-xs shadow-md"
                        title="مراسلة فورية عبر واتساب"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>محادثة واتساب</span>
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-300 block">وصف الحالة والملاحظات:</span>
              <p className="text-slate-400 text-2xs leading-relaxed">{selectedModerationListing.condition_description}</p>
            </div>

            {/* Official Documents Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-green" />
                  <span>الأوراق والمستندات الرسمية المحمية (خاصة بإدارة مخلصة فقط):</span>
                </span>
                <div className="flex items-center gap-2">
                  {selectedModerationListing.documents_verified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      ✓ أوراق موثقة ومضمونة (شارة الثقة مفعلة)
                    </span>
                  ) : selectedModerationListing.documents_submitted ? (
                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      ✓ تم رفع المستندات (بانتظار تدقيقك)
                    </span>
                  ) : selectedModerationListing.documents_requested ? (
                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      ⏳ تم إرسال طلب المستندات
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestDocuments(selectedModerationListing.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-3xs font-bold hover:bg-emerald-900 transition flex items-center gap-1"
                    >
                      <span>📄 طلب المستندات من العميل</span>
                    </button>
                  )}
                </div>
              </div>

              {selectedModerationListing.official_documents ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-3xs">
                  {/* 1. License Front */}
                  {(() => {
                    const doc = selectedModerationListing.official_documents;
                    const url = doc?.licenseFrontUrl || doc?.licenseUrl;
                    const status = doc?.licenseFrontStatus || 'pending';
                    const reason = doc?.licenseFrontRejectReason;
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-bold">الرخصة (وجه أمامي)</span>
                            <span className={`px-2 py-0.5 rounded-full text-4xs font-black ${
                              status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {status === 'verified' ? '✓ معتمد' : status === 'rejected' ? '✕ مرفوض' : '⏳ قيد الفحص'}
                            </span>
                          </div>
                          {reason && (
                            <p className="text-4xs text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-800/80">
                              السبب: {reason}
                            </p>
                          )}
                          {url ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDocPreviewUrl(url);
                                setDocPreviewTitle('رخصة السيارة (الوجه الأمامي)');
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline block text-left w-full text-3xs py-0.5"
                            >
                              معاينة وفحص ↗
                            </button>
                          ) : (
                            <span className="text-slate-600 block text-4xs">لم يرفع بعد</span>
                          )}
                        </div>

                        {url && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                            {status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleReviewSpecificDocument(selectedModerationListing.id, 'licenseFront', 'verify')}
                                className="flex-1 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-4xs hover:bg-emerald-900 transition flex items-center justify-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>اعتماد</span>
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => setDocRejectModal({
                                  isOpen: true,
                                  listingId: selectedModerationListing.id,
                                  docField: 'licenseFront',
                                  docLabel: 'رخصة السيارة (الوجه الأمامي)',
                                  presetReason: 'الصورة غير واضحة وبها انعكاس ضوء أو تمويه',
                                  customReason: ''
                                })}
                                className="flex-1 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 font-bold text-4xs hover:bg-rose-900 transition flex items-center justify-center gap-1"
                              >
                                <X className="w-2.5 h-2.5" />
                                <span>رفض وسبب</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. License Back */}
                  {(() => {
                    const doc = selectedModerationListing.official_documents;
                    const url = doc?.licenseBackUrl;
                    const status = doc?.licenseBackStatus || 'pending';
                    const reason = doc?.licenseBackRejectReason;
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-bold">الرخصة (وجه خلفي)</span>
                            <span className={`px-2 py-0.5 rounded-full text-4xs font-black ${
                              status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {status === 'verified' ? '✓ معتمد' : status === 'rejected' ? '✕ مرفوض' : '⏳ قيد الفحص'}
                            </span>
                          </div>
                          {reason && (
                            <p className="text-4xs text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-800/80">
                              السبب: {reason}
                            </p>
                          )}
                          {url ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDocPreviewUrl(url);
                                setDocPreviewTitle('رخصة السيارة (الوجه الخلفي)');
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline block text-left w-full text-3xs py-0.5"
                            >
                              معاينة وفحص ↗
                            </button>
                          ) : (
                            <span className="text-slate-600 block text-4xs">لم يرفع بعد</span>
                          )}
                        </div>

                        {url && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                            {status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleReviewSpecificDocument(selectedModerationListing.id, 'licenseBack', 'verify')}
                                className="flex-1 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-4xs hover:bg-emerald-900 transition flex items-center justify-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>اعتماد</span>
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => setDocRejectModal({
                                  isOpen: true,
                                  listingId: selectedModerationListing.id,
                                  docField: 'licenseBack',
                                  docLabel: 'رخصة السيارة (الوجه الخلفي)',
                                  presetReason: 'الصورة غير واضحة وبها انعكاس ضوء أو تمويه',
                                  customReason: ''
                                })}
                                className="flex-1 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 font-bold text-4xs hover:bg-rose-900 transition flex items-center justify-center gap-1"
                              >
                                <X className="w-2.5 h-2.5" />
                                <span>رفض وسبب</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. National ID */}
                  {(() => {
                    const doc = selectedModerationListing.official_documents;
                    const url = doc?.nationalIdUrl;
                    const status = doc?.nationalIdStatus || 'pending';
                    const reason = doc?.nationalIdRejectReason;
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-bold">بطاقة الرقم القومي</span>
                            <span className={`px-2 py-0.5 rounded-full text-4xs font-black ${
                              status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {status === 'verified' ? '✓ معتمد' : status === 'rejected' ? '✕ مرفوض' : '⏳ قيد الفحص'}
                            </span>
                          </div>
                          {reason && (
                            <p className="text-4xs text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-800/80">
                              السبب: {reason}
                            </p>
                          )}
                          {url ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDocPreviewUrl(url);
                                setDocPreviewTitle('بطاقة الرقم القومي');
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline block text-left w-full text-3xs py-0.5"
                            >
                              معاينة وفحص ↗
                            </button>
                          ) : (
                            <span className="text-slate-600 block text-4xs">لم يرفع بعد</span>
                          )}
                        </div>

                        {url && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                            {status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleReviewSpecificDocument(selectedModerationListing.id, 'nationalId', 'verify')}
                                className="flex-1 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-4xs hover:bg-emerald-900 transition flex items-center justify-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>اعتماد</span>
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => setDocRejectModal({
                                  isOpen: true,
                                  listingId: selectedModerationListing.id,
                                  docField: 'nationalId',
                                  docLabel: 'بطاقة الرقم القومي',
                                  presetReason: 'الصورة غير واضحة أو البطاقة غير سارية',
                                  customReason: ''
                                })}
                                className="flex-1 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 font-bold text-4xs hover:bg-rose-900 transition flex items-center justify-center gap-1"
                              >
                                <X className="w-2.5 h-2.5" />
                                <span>رفض وسبب</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 4. Bank Statement */}
                  {(() => {
                    const doc = selectedModerationListing.official_documents;
                    const url = doc?.bankStatementUrl;
                    const status = doc?.bankStatementStatus || 'pending';
                    const reason = doc?.bankStatementRejectReason;
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-bold">بيان البنك / المخالصة</span>
                            <span className={`px-2 py-0.5 rounded-full text-4xs font-black ${
                              status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {status === 'verified' ? '✓ معتمد' : status === 'rejected' ? '✕ مرفوض' : '⏳ قيد الفحص'}
                            </span>
                          </div>
                          {reason && (
                            <p className="text-4xs text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-800/80">
                              السبب: {reason}
                            </p>
                          )}
                          {url ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDocPreviewUrl(url);
                                setDocPreviewTitle('بيان المديونية البنكية');
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline block text-left w-full text-3xs py-0.5"
                            >
                              معاينة وفحص ↗
                            </button>
                          ) : (
                            <span className="text-slate-600 block text-4xs">لم يرفع بعد</span>
                          )}
                        </div>

                        {url && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                            {status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => handleReviewSpecificDocument(selectedModerationListing.id, 'bankStatement', 'verify')}
                                className="flex-1 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-4xs hover:bg-emerald-900 transition flex items-center justify-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>اعتماد</span>
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => setDocRejectModal({
                                  isOpen: true,
                                  listingId: selectedModerationListing.id,
                                  docField: 'bankStatement',
                                  docLabel: 'بيان المديونية / مخالصة البنك',
                                  presetReason: 'المستند غير واضح أو منتهي الصلاحية',
                                  customReason: ''
                                })}
                                className="flex-1 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 font-bold text-4xs hover:bg-rose-900 transition flex items-center justify-center gap-1"
                              >
                                <X className="w-2.5 h-2.5" />
                                <span>رفض وسبب</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-3xs text-slate-500 text-center">
                  لم يقم العميل برفع المستندات الرسمية بعد. يمكنك الضغط على «طلب المستندات» لإشعاره.
                </div>
              )}

              {/* Admin Verification Controls */}
              {selectedModerationListing.documents_submitted && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="text-2xs text-slate-300">
                    <strong>إجراء تدقيق المستندات:</strong> بعد مقارنة رقم الشاسيه والموتور واسم المالك بالرخصة والبنك، يمكنك اعتمادها لمنح شارة الأوراق المفحوصة.
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedModerationListing.documents_verified ? (
                      <button
                        type="button"
                        onClick={() => handleVerifyDocuments(selectedModerationListing.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-brand-green hover:bg-emerald-500 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-md"
                        title="اعتماد المستندات الرسمية ومنح شارة الموثوقية بالمعرض"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                        <span>✓ اعتماد المستندات (منح شارة الأوراق المفحوصة والمضمونة)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerifyDocuments(selectedModerationListing.id, false, 'إلغاء الاعتماد لإعادة الفحص')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>إلغاء توثيق الأوراق</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Feedback Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300 block">ملاحظات التدقيق وتوجيهات البائع (في حال طلب تعديل أو رفض):</label>
              <textarea
                rows={2}
                value={adminFeedbackInput}
                onChange={(e) => setAdminFeedbackInput(e.target.value)}
                placeholder="مثال: يرجى توضيح موقف المخالصة البنكية أو رفع صور إضافية واضحة للصالون..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                {(selectedModerationListing.status === 'published' || selectedModerationListing.status === 'approved' || selectedModerationListing.is_hidden) && (
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(selectedModerationListing.id, !selectedModerationListing.is_hidden)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      selectedModerationListing.is_hidden
                        ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-700/60 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedModerationListing.is_hidden ? '✨ إعادة إظهار الإعلان بالمعرض' : '👁️ إخفاء مؤقت عن المعرض (حجز / جاري المقابلة)'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedModerationListing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={() => handleModerate(selectedModerationListing.id, 'needs_changes', adminFeedbackInput.trim() || 'يرجى مراجعة وتدقيق بيانات الإعلان وإعادة إرساله')}
                  disabled={moderationActionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-950 border border-amber-700 text-amber-300 hover:bg-amber-900 font-bold"
                >
                  طلب تعديل من العميل
                </button>

                <button
                  type="button"
                  onClick={() => handleModerate(selectedModerationListing.id, 'rejected', adminFeedbackInput || 'تم الرفض لعدم توافق الشروط')}
                  disabled={moderationActionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 font-bold"
                >
                  رفض الإعلان
                </button>

                <button
                  type="button"
                  onClick={() => handleModerate(selectedModerationListing.id, 'published', adminFeedbackInput)}
                  disabled={moderationActionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  ✓ اعتماد ونشر بالمعرض (Approve & Publish)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CALL LOGGER                                           */}
      {/* ============================================================== */}
      {showCallModal && callTargetCase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-800 space-y-4 animate-scaleUp">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-green" />
                <span>تسجيل مكالمة / متابعة ({callTargetCase.caseReference})</span>
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSaveCallLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">الطرف المتصل به:</label>
                  <select
                    value={callParty}
                    onChange={(e) => setCallParty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="seller">البائع ({callTargetCase.seller.name})</option>
                    <option value="buyer">مشتري مهتم</option>
                    <option value="lender_rep">مسؤول البنك</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">نوع الاتصال:</label>
                  <select
                    value={callType}
                    onChange={(e) => setCallType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="phone_call">مكالمة هاتفية</option>
                    <option value="whatsapp">محادثة واتساب</option>
                    <option value="meeting">اجتماع بفرع البنك</option>
                    <option value="inspection">معاينة فنية ميدانية</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">موقف ونتيجة المكالمة:</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="answered_agreed">تم الرد والاتفاق على الخطوة القادمة</option>
                  <option value="in_negotiation">قيد التفاوض على السعر</option>
                  <option value="no_answer">لم يرد / مغلق</option>
                  <option value="needs_time">طلب مهلة للتفكير أو تدبير المبلغ</option>
                  <option value="documents_pending">بانتظار خطاب السداد المعجل</option>
                  <option value="bank_appointment_set">تم تحديد موعد الإيداع بالبنك</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">تاريخ المتابعة القادمة:</label>
                <input
                  type="date"
                  value={callFollowUpDate}
                  onChange={(e) => setCallFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">ملاحظات داخلية سرية:</label>
                <textarea
                  rows={3}
                  required
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="سجل تفاصيل الاتصال للمتابعة..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
                >
                  حفظ سجل المكالمة
                </button>
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CASE LIFECYCLE STATUS UPDATER                         */}
      {/* ============================================================== */}
      {activeManagingCase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-slate-800 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <span>إدارة الملف:</span>
                  <span className="font-mono text-brand-green">{activeManagingCase.caseReference}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeManagingCase.vehicle.make} {activeManagingCase.vehicle.model} • البائع: {activeManagingCase.seller.name}
                </p>
              </div>
              <button onClick={() => setActiveManagingCase(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            {/* Lifecycle 25-Status Dropdown */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-white block">
                تحديث مرحلة دورة الحياة (25 Lifecycle Statuses):
              </label>
              <select
                value={activeManagingCase.status}
                onChange={(e) => handleUpdateStatus(activeManagingCase.caseReference, e.target.value as CaseLifecycleStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                {Object.entries(LIFECYCLE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.labelAr}</option>
                ))}
              </select>
            </div>

            {/* Call Logs History */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-white block">سجل المكالمات السابقة:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activeManagingCase.callLogs && activeManagingCase.callLogs.length > 0 ? (
                  activeManagingCase.callLogs.map(log => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-0.5">
                      <div className="flex justify-between text-slate-400 font-mono">
                        <span>{log.employeeName} ({log.party === 'seller' ? 'البائع' : 'المشتري'})</span>
                        <span>{log.createdAt}</span>
                      </div>
                      <p className="text-slate-200">{log.notes}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 py-2 text-center">لا توجد مكالمات سابقة مسجلة.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveManagingCase(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SAFE LISTING DEACTIVATION WITH MANDATORY REASON         */}
      {/* ============================================================== */}
      {listingToDeactivate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-rose-800/60 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <Trash2 className="w-5 h-5" />
                <span>سحب وإلغاء الإعلان ({listingToDeactivate.make} {listingToDeactivate.model})</span>
              </div>
              <button
                onClick={() => setListingToDeactivate(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-2xs text-rose-300 leading-relaxed space-y-1">
              <p className="font-bold">تنبيه حوكمة وضوابط أمنية (Priority 3):</p>
              <p>
                يلزم إدخال سبب إداري رسمي ومفصل لسحب الإعلان. سيتم حفظ السبب وتوثيق هوية المسؤول في سجلات التدقيق (Audit Logs)، كما سيتم إرسال إشعار فوري للبائع بالسبب.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300 block">
                سبب السحب أو الإلغاء (إلزامي):
              </label>
              <textarea
                rows={3}
                required
                value={deactivationReasonInput}
                onChange={(e) => setDeactivationReasonInput(e.target.value)}
                placeholder="مثال: تم إثبات وجود تلاعب في قراءة العداد، أو عدم تطابق مستندات البنك، أو رغبة البائع في التراجع..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDeactivateListing}
                disabled={deactivationLoading || !deactivationReasonInput.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs transition flex items-center justify-center gap-1.5"
              >
                {deactivationLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>تأكيد سحب الإعلان وإشعار البائع</span>
              </button>

              <button
                type="button"
                onClick={() => setListingToDeactivate(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LISTING ADMINISTRATIVE FOLLOW-UP & CALL LOGGER           */}
      {/* ============================================================== */}
      {listingForFollowup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-800 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-brand-green" />
                  <span>متابعة إدارية: {listingForFollowup.make} {listingForFollowup.model}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-3xs text-slate-400 font-mono">
                    البائع: {listingForFollowup.seller_name || 'مالك السيارة'} ({listingForFollowup.seller_phone})
                  </span>
                  {listingForFollowup.seller_phone && (
                    <a
                      href={`tel:${listingForFollowup.seller_phone}`}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-3xs flex items-center gap-1 border border-slate-700"
                      title="اتصال هاتفي مباشر"
                    >
                      <PhoneCall className="w-2.5 h-2.5" />
                      <span>اتصال</span>
                    </a>
                  )}
                  {listingForFollowup.seller_phone && (() => {
                    const clean = (listingForFollowup.seller_phone || '').replace(/\D/g, '');
                    const intl = clean.startsWith('0') ? `2${clean}` : clean.startsWith('20') ? clean : `20${clean}`;
                    return (
                      <a
                        href={`https://wa.me/${intl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-3xs flex items-center gap-1 shadow-sm"
                        title="مراسلة عبر واتساب"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>واتساب</span>
                      </a>
                    );
                  })()}
                </div>
              </div>
              <button
                onClick={() => setListingForFollowup(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFollowup} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">نوع الإجراء والمتابعة:</label>
                  <select
                    value={followupActionType}
                    onChange={(e) => setFollowupActionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="call_log">تسجيل مكالمة هاتفية</option>
                    <option value="internal_note">ملاحظة إدارية داخلية</option>
                    <option value="price_discussion">مفاوضات وتعديل السعر</option>
                    <option value="bank_coordination">تنسيق سداد ومديونية البنك</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">نتيجة التواصل:</label>
                  <select
                    value={followupResult}
                    onChange={(e) => setFollowupResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="تم الرد والاتفاق">تم الرد والاتفاق على الخطوة القادمة</option>
                    <option value="قيد التفاوض على السعر">قيد التفاوض على السعر</option>
                    <option value="لم يرد / هاتف مغلق">لم يرد / هاتف مغلق</option>
                    <option value="طلب مهلة للتفكير">طلب مهلة للتفكير</option>
                    <option value="بانتظار مستندات البنك">بانتظار مستندات البنك</option>
                    <option value="تحديد موعد فرع البنك">تحديد موعد فرع البنك</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">تفاصيل ومحتوى المتابعة:</label>
                <textarea
                  rows={3}
                  required
                  value={followupContent}
                  onChange={(e) => setFollowupContent(e.target.value)}
                  placeholder="اكتب خلاصة المكالمة أو الملاحظات الدقيقة..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">الإجراء القادم المخطط:</label>
                  <input
                    type="text"
                    value={followupNextAction}
                    onChange={(e) => setFollowupNextAction(e.target.value)}
                    placeholder="مثال: التواصل غداً لطلب المخالصة"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">موقف المتابعة:</label>
                  <select
                    value={followupStatus}
                    onChange={(e) => setFollowupStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="in_progress">قيد المتابعة النشطة</option>
                    <option value="pending_buyer">بانتظار المشتري</option>
                    <option value="pending_bank">بانتظار البنك</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={followupLoading || !followupContent.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5"
                >
                  {followupLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <PhoneCall className="w-4 h-4" />
                  )}
                  <span>حفظ المتابعة في سجل الإعلان</span>
                </button>

                <button
                  type="button"
                  onClick={() => setListingForFollowup(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADMIN SECURE DOCUMENT LIGHTBOX PREVIEW                  */}
      {/* ============================================================== */}
      {docPreviewUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 max-w-2xl w-full p-5 space-y-3 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
              <span className="font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>{docPreviewTitle} — وثيقة رسمية مشفرة ومحمية</span>
              </span>
              <button
                onClick={() => setDocPreviewUrl(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-[70vh]">
              <img src={docPreviewUrl} alt={docPreviewTitle} className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="flex justify-between items-center text-3xs text-slate-400 pt-1">
              <span>🔒 سرية تامة — متاحة للتدقيق والمطابقة فقط من مستشاري مخلصة المصرح لهم.</span>
              <button
                type="button"
                onClick={() => setDocPreviewUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DOCUMENT REJECTION WITH PRESET & CUSTOM REASON          */}
      {/* ============================================================== */}
      {docRejectModal.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full p-6 space-y-4 animate-scaleUp shadow-2xl text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>رفض مستند: {docRejectModal.docLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocRejectModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-2xs text-slate-300 leading-relaxed">
              يرجى تحديد سبب رفض المستند. سيتم إشعار العميل فوراً وتوجيهه مباشرة لرفع مستند بديل مطابق.
            </p>

            <div className="space-y-2">
              <label className="text-3xs font-bold text-slate-400 block">اختر من الأسباب الشائعة:</label>
              <div className="space-y-1.5">
                {[
                  'الصورة غير واضحة وبها انعكاس ضوء أو تمويه',
                  'رخصة السيارة منتهية الصلاحية ويلزم تجديدها',
                  'البيانات غير مطابقة لبيانات السيارة المعلنة',
                  'مطلوب تصوير الوجهين بوضوح كامل',
                  'بيان مديونية البنك قديم أو غير مختوم',
                  'بطاقة الرقم القومي منتهية أو غير واضحة'
                ].map(preset => (
                  <label
                    key={preset}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      docRejectModal.presetReason === preset
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="docRejectPreset"
                      checked={docRejectModal.presetReason === preset}
                      onChange={() => setDocRejectModal(prev => ({ ...prev, presetReason: preset }))}
                      className="accent-rose-500"
                    />
                    <span className="text-2xs font-medium">{preset}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-400 block">أو اكتب سبباً مخصصاً للعميل:</label>
              <input
                type="text"
                value={docRejectModal.customReason}
                onChange={(e) => setDocRejectModal(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="توضيح إضافي للمشكلة بالمستند..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const finalReason = docRejectModal.customReason.trim() || docRejectModal.presetReason;
                  handleReviewSpecificDocument(
                    docRejectModal.listingId,
                    docRejectModal.docField,
                    'reject',
                    finalReason
                  );
                  setDocRejectModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>تأكيد رفض المستند وإشعار العميل</span>
              </button>
              <button
                type="button"
                onClick={() => setDocRejectModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrivateOperationsDashboard;
