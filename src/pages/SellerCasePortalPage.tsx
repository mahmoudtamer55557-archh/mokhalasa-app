import React, { useState, useEffect, useMemo } from 'react';
import { 
  DistressedVehicleCase, CaseRevisionRecord, CustomerUser, 
  PurchaseOffer, InAppNotification 
} from '../types';
import { listingService, DatabaseCarListing } from '../services/listingService';
import { 
  Clock, CheckCircle2, AlertTriangle, Edit3, Phone, ArrowRight, 
  Banknote, FileText, UploadCloud, Tag, Bell, User, Check, X, 
  ChevronLeft, AlertCircle, Calendar, ShieldCheck, MessageSquare, 
  ExternalLink, Car as CarIcon, Camera, Trash2
} from 'lucide-react';

interface SellerCasePortalPageProps {
  cases: DistressedVehicleCase[];
  onUpdateCase: (updatedCase: DistressedVehicleCase) => void;
  onNavigate: (view: string) => void;
  customerUser?: CustomerUser | null;
  initialCaseRef?: string;
  lang?: 'ar' | 'en';
  targetProblemCaseRef?: string | null;
  targetProblemAction?: 'edit' | 'documents' | 'offers' | null;
  onClearTargetProblem?: () => void;
}

const COMMON_DEFECTS_LIST = [
  'أعطال ميكانيكية أو صوت في الموتور',
  'مشاكل أو نتعة في الفتيس',
  'رش خارجي نظافة أو تغيير إكصدامات',
  'صيانة دورية قادمة تحتاج مصاريف',
  'رخصة التسيير منتهية أو قاربت على الانتهاء',
  'شروخ بالزجاج الأمامي أو ملاحظات بالصالون'
];

export const SellerCasePortalPage: React.FC<SellerCasePortalPageProps> = ({
  cases,
  onUpdateCase,
  onNavigate,
  customerUser,
  initialCaseRef = '',
  lang = 'ar',
  targetProblemCaseRef,
  targetProblemAction,
  onClearTargetProblem
}) => {
  const isAr = lang === 'ar';

  // Live Database Listings State
  const [dbListings, setDbListings] = useState<DatabaseCarListing[]>([]);
  const [dbOffers, setDbOffers] = useState<PurchaseOffer[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [offerActionMsg, setOfferActionMsg] = useState<string | null>(null);

  // Map user's dbListings into DistressedVehicleCase format if not already in cases
  const dbConvertedCases = useMemo(() => {
    if (!dbListings || dbListings.length === 0) return [];
    return dbListings.map((db): DistressedVehicleCase => {
      const caseRef = db.case_reference || `MK-${db.id.slice(0, 8).toUpperCase()}`;
      return {
        caseReference: caseRef,
        accessKey: 'MK-AUTH',
        createdAt: db.created_at ? db.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        status: (db.status as any) || 'new_request',
        editStatus: 'none',
        pendingEditsCount: 0,
        revisions: [],
        assignedEmployeeId: 'emp-1',
        assignedEmployeeName: 'أ. محمود تامر (المسؤول العام)',
        urgency: 'urgent',
        distressReason: 'financial_pressure',
        seller: {
          name: db.seller_name || customerUser?.name || 'مالك السيارة',
          phone: db.seller_phone || customerUser?.phone || '',
          preferredContactTime: 'أي وقت',
          governorate: db.governorate || 'القاهرة',
          city: db.city || '',
          relationship: 'sole_owner'
        },
        vehicle: {
          id: db.id,
          make: db.make,
          model: db.model,
          year: db.year,
          trim: db.trim || '',
          price: db.asking_price,
          askingPrice: db.asking_price,
          estimatedMarketValue: db.asking_price,
          mileage: db.mileage,
          transmission: (db.transmission as any) || 'أوتوماتيك',
          fuelType: (db.fuel_type as any) || 'بنزين',
          engineSize: '1600 cc',
          city: db.governorate || 'القاهرة',
          cityEn: 'Cairo',
          color: 'فضي',
          images: Array.isArray(db.images) && db.images.length > 0 ? db.images : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
          financingType: (db.financing_type as any) || 'bank_loan',
          inspection: {
            isInspected: false,
            score: 85,
            inspectorName: 'فحص مبدئي',
            date: new Date().toISOString().split('T')[0],
            engineCondition: 'جيد جداً',
            transmissionCondition: 'جيد جداً',
            paintCondition: 'فابريكا بالكامل',
            chassisStatus: 'سليم 100% بدون أي ملاحظات',
            notes: ''
          },
          licenseValidityMonths: 12,
          trafficDepartment: 'مرور القاهرة',
          sellerType: 'مالك أول',
          status: 'under_review',
          createdAt: db.created_at || new Date().toISOString(),
          description: db.condition_description || ''
        },
        disclosedIssues: Array.isArray(db.disclosed_defects) ? db.disclosed_defects : [],
        sellerConditionStory: db.condition_description || '',
        financing: {
          institutionKey: 'bank',
          institutionName: db.financing_provider || 'بنك / شركة تمويل',
          productType: db.financing_type || 'قرض سيارة',
          estimatedOutstandingPrincipal: db.outstanding_amount || 0,
          outstandingPrincipal: db.outstanding_amount || 0,
          monthlyInstallment: db.monthly_installment || 0,
          remainingMonths: db.remaining_months || 0,
          remainingInstallmentsCount: db.remaining_months || 0,
          arrearsAmount: 0,
          overdueInstallmentsCount: 0,
          overdueAmount: 0,
          approximatePayoffQuote: db.outstanding_amount || 0,
          clearanceStatus: 'pending_settlement',
          hasOfficialStatement: false,
          isVerifiedByStaff: false,
          unverifiedNotice: 'بيانات غير معتمدة رسمياً'
        },
        settlementStatement: {
          grossSalePrice: db.asking_price || 0,
          lenderSettlementAmount: db.outstanding_amount || 0,
          lenderSettlementSource: db.financing_provider || 'بنك / شركة تمويل',
          lenderSettlementValidityDate: new Date().toISOString(),
          earlySettlementFee: 0,
          releaseLetterFee: 0,
          trafficAndGovFees: 0,
          inspectionFee: 0,
          platformCommission: Math.round((db.asking_price || 0) * 0.015),
          commissionRate: 0.015,
          otherCosts: [],
          totalDeductions: (db.outstanding_amount || 0) + Math.round((db.asking_price || 0) * 0.015),
          netProceedsToSeller: Math.max(0, (db.asking_price || 0) - ((db.outstanding_amount || 0) + Math.round((db.asking_price || 0) * 0.015))),
          shortfallAmount: 0,
          isShortfall: false,
          isPreliminary: true,
          sellerAccepted: false,
          buyerAccepted: false
        },
        settlement: {
          askingPrice: db.asking_price,
          estimatedPayoff: db.outstanding_amount || 0,
          overdueFines: 0,
          settlementProcessingFee: Math.round(db.asking_price * 0.015),
          totalDeductions: (db.outstanding_amount || 0) + Math.round(db.asking_price * 0.015),
          sellerNetCash: Math.max(0, db.asking_price - ((db.outstanding_amount || 0) + Math.round(db.asking_price * 0.015)))
        },
        callLogs: [],
        timeline: [],
        buyerInquiries: [],
        internalNotes: [],
        documents: []
      };
    });
  }, [dbListings, customerUser]);

  // Combined available requests (Directly accessible, no verification gate)
  const availableCases = useMemo(() => {
    const combined: DistressedVehicleCase[] = [];
    const seenRefs = new Set<string>();

    for (const c of dbConvertedCases) {
      if (!seenRefs.has(c.caseReference)) {
        seenRefs.add(c.caseReference);
        combined.push(c);
      }
    }
    for (const c of cases) {
      if (!seenRefs.has(c.caseReference)) {
        seenRefs.add(c.caseReference);
        combined.push(c);
      }
    }
    return combined;
  }, [cases, dbConvertedCases]);

  // Selected Active Case State (No verification gate: direct default selection)
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    if (initialCaseRef) {
      const match = availableCases.find(c => c.caseReference === initialCaseRef);
      if (match) return match.caseReference;
    }
    const savedLastRef = typeof window !== 'undefined' ? localStorage.getItem('mokhalasa_last_case_ref') : null;
    if (savedLastRef) {
      const match = availableCases.find(c => c.caseReference === savedLastRef);
      if (match) return match.caseReference;
    }
    return availableCases[0]?.caseReference || '';
  });

  // Sync selectedCaseId when availableCases update
  useEffect(() => {
    if (!selectedCaseId && availableCases.length > 0) {
      setSelectedCaseId(availableCases[0].caseReference);
    }
  }, [availableCases, selectedCaseId]);

  const activeCase = useMemo(() => {
    return availableCases.find(c => c.caseReference === selectedCaseId) || availableCases[0] || null;
  }, [availableCases, selectedCaseId]);

  // Active Tab: 'details' | 'offers' | 'notifications' | 'documents'
  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'notifications' | 'documents'>('details');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMileage, setEditMileage] = useState<number>(0);
  const [editConditionStory, setEditConditionStory] = useState<string>('');
  const [editDisclosedIssues, setEditDisclosedIssues] = useState<string[]>([]);
  const [editContactTime, setEditContactTime] = useState<string>('');
  const [editReasonNote, setEditReasonNote] = useState<string>('');
  const [editSaveSuccess, setEditSaveSuccess] = useState(false);

  // Documents Modal / State
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [licenseUrl, setLicenseUrl] = useState('');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState('');
  const [licenseBackUrl, setLicenseBackUrl] = useState('');
  const [idUrl, setIdUrl] = useState('');
  const [statementUrl, setStatementUrl] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docsSaveSuccess, setDocsSaveSuccess] = useState(false);
  const [docsUploading, setDocsUploading] = useState(false);

  const handleCaseDocFile = (field: 'front' | 'back' | 'id' | 'statement', file: File | null) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      if (field === 'front') setLicenseFrontUrl(res);
      else if (field === 'back') setLicenseBackUrl(res);
      else if (field === 'id') setIdUrl(res);
      else if (field === 'statement') setStatementUrl(res);
    };
    reader.readAsDataURL(file);
  };

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  // Load real database data for user
  useEffect(() => {
    const loadRealData = async () => {
      if (customerUser?.id) {
        const listingsRes = await listingService.getCustomerListings(customerUser.id);
        if (listingsRes.success) setDbListings(listingsRes.listings);

        const notifsRes = await listingService.getCustomerNotifications(customerUser.id);
        if (notifsRes.success) setNotifications(notifsRes.notifications);
      }

      const offersRes = await listingService.getPurchaseOffers();
      if (offersRes.success) setDbOffers(offersRes.offers);
    };

    loadRealData();
  }, [customerUser]);

  // Open Edit Modal
  const handleOpenEditModal = () => {
    if (!activeCase) return;
    setEditPrice(activeCase.vehicle.askingPrice);
    setEditMileage(activeCase.vehicle.mileage);
    setEditConditionStory(activeCase.sellerConditionStory || activeCase.vehicle.description || '');
    setEditDisclosedIssues(activeCase.disclosedIssues || []);
    setEditContactTime(activeCase.seller.preferredContactTime || '');
    setEditReasonNote('');
    setIsEditModalOpen(true);
    setEditSaveSuccess(false);
  };

  // Directly respond to problem targeting ("وتوجهني للمشكلة")
  useEffect(() => {
    if (targetProblemCaseRef) {
      const match = availableCases.find(c => c.caseReference === targetProblemCaseRef || c.vehicle.id === targetProblemCaseRef);
      if (match) {
        setSelectedCaseId(match.caseReference);
      }
    }
    if (targetProblemAction === 'edit' && activeCase) {
      setEditPrice(activeCase.vehicle.askingPrice);
      setEditMileage(activeCase.vehicle.mileage);
      setEditConditionStory(activeCase.sellerConditionStory || activeCase.vehicle.description || '');
      setEditDisclosedIssues(activeCase.disclosedIssues || []);
      setEditContactTime(activeCase.seller.preferredContactTime || '');
      setEditReasonNote('');
      setIsEditModalOpen(true);
      setEditSaveSuccess(false);
      onClearTargetProblem?.();
    } else if (targetProblemAction === 'documents') {
      setIsDocsModalOpen(true);
      onClearTargetProblem?.();
    } else if (targetProblemAction === 'offers') {
      setActiveTab('offers');
      onClearTargetProblem?.();
    }
  }, [targetProblemCaseRef, targetProblemAction, availableCases, activeCase, onClearTargetProblem]);

  const handleToggleDefect = (defect: string) => {
    setEditDisclosedIssues(prev => 
      prev.includes(defect) ? prev.filter(d => d !== defect) : [...prev, defect]
    );
  };

  // Save Edits & Resubmit
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    const newRevisions: CaseRevisionRecord[] = [];
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (editPrice !== activeCase.vehicle.askingPrice) {
      newRevisions.push({
        id: `rev-${Date.now()}-1`,
        caseId: activeCase.caseReference,
        timestamp,
        changedBy: 'seller',
        authorName: activeCase.seller.name,
        fieldKey: 'askingPrice',
        fieldLabelAr: 'السعر المطلوب',
        previousValue: activeCase.vehicle.askingPrice,
        newValue: editPrice,
        isFinancialOrLegal: false,
        requiresStaffReview: true,
        reviewStatus: 'pending_review',
        reviewNotes: editReasonNote || 'تعديل السعر من قِبل البائع'
      });
    }

    if (editMileage !== activeCase.vehicle.mileage) {
      newRevisions.push({
        id: `rev-${Date.now()}-2`,
        caseId: activeCase.caseReference,
        timestamp,
        changedBy: 'seller',
        authorName: activeCase.seller.name,
        fieldKey: 'mileage',
        fieldLabelAr: 'قراءة العداد (كم)',
        previousValue: activeCase.vehicle.mileage,
        newValue: editMileage,
        isFinancialOrLegal: false,
        requiresStaffReview: true,
        reviewStatus: 'pending_review',
        reviewNotes: 'تحديث قراءة العداد الفعلية'
      });
    }

    const updatedCase: DistressedVehicleCase = {
      ...activeCase,
      status: 'pending_review',
      editStatus: 'pending_review',
      pendingEditsCount: (activeCase.pendingEditsCount || 0) + (newRevisions.length > 0 ? newRevisions.length : 1),
      sellerConditionStory: editConditionStory,
      disclosedIssues: editDisclosedIssues,
      seller: {
        ...activeCase.seller,
        preferredContactTime: editContactTime || activeCase.seller.preferredContactTime
      },
      vehicle: {
        ...activeCase.vehicle,
        sellerConditionStory: editConditionStory,
        disclosedProblems: editDisclosedIssues,
        askingPrice: editPrice,
        mileage: editMileage
      },
      revisions: [...newRevisions, ...(activeCase.revisions || [])],
      timeline: [
        {
          id: `tm-${Date.now()}`,
          caseId: activeCase.caseReference,
          status: 'pending_review',
          changedBy: 'المالك (متابعة طلبي)',
          reason: `تحديث بيانات السيارة وإعادة الإرسال للمراجعة`,
          timestamp: new Date().toLocaleTimeString('ar-EG')
        },
        ...(activeCase.timeline || [])
      ]
    };

    onUpdateCase(updatedCase);
    setEditSaveSuccess(true);

    // If matching db listing exists, update in Supabase
    const matchingDb = dbListings.find(l => l.case_reference === activeCase.caseReference || l.id === activeCase.vehicle.id);
    if (matchingDb) {
      await listingService.updateListingBySeller(matchingDb.id, {
        asking_price: editPrice,
        mileage: editMileage,
        condition_description: editConditionStory
      });
    }

    setTimeout(() => {
      setIsEditModalOpen(false);
      setEditSaveSuccess(false);
    }, 1500);
  };

  // Handle Offer Response
  const handleRespondToOffer = async (offerId: string, decision: 'accept' | 'reject') => {
    setOfferActionMsg(null);
    const res = await listingService.respondToOfferBySeller(
      offerId, 
      decision, 
      decision === 'accept' ? 'موافق مبدئياً على السعر المعروض وننتظر موعد المعاينة' : 'السعر المعروض غير مناسب'
    );
    if (res.success) {
      const newStatus = decision === 'accept' ? 'seller_accepted' : 'seller_rejected';
      setOfferActionMsg(decision === 'accept' ? 'تم قبول العرض وإشعار مستشار مخلصة لترتيب المعاينة!' : 'تم رفض العرض.');
      setDbOffers(prev => prev.map(o => (o.id === offerId || o.listingId === offerId || (o.listingId && offerId.includes(o.listingId))) ? { ...o, status: newStatus as any } : o));
    }
  };

  // Save Documents
  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    const matchingDb = dbListings.find(l => l.case_reference === activeCase.caseReference || l.id === activeCase.vehicle.id);
    const targetId = matchingDb?.id || activeCase.caseReference;

    setDocsUploading(true);
    await listingService.uploadListingDocuments(targetId, {
      licenseUrl: licenseFrontUrl || licenseUrl,
      licenseFrontUrl: licenseFrontUrl || licenseUrl,
      licenseBackUrl,
      nationalIdUrl: idUrl,
      bankStatementUrl: statementUrl,
      notes: docNotes
    });
    setDocsUploading(false);

    setDocsSaveSuccess(true);
    setTimeout(() => {
      setIsDocsModalOpen(false);
      setDocsSaveSuccess(false);
    }, 1500);
  };

  // Withdraw Active Case
  const handleWithdrawActiveCase = async () => {
    if (!activeCase) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في سحب هذا الإعلان من المعرض؟ سيتم حفظ كافة بيانات السيارة وأرشفتها بسجلات مخلصة وإخفائها من العرض العام.')) {
      return;
    }
    const matchingDb = dbListings.find(l => l.case_reference === activeCase.caseReference || l.id === activeCase.vehicle.id);
    const targetId = matchingDb?.id || activeCase.caseReference;
    const res = await listingService.withdrawListing(targetId);
    if (res.success) {
      alert('تم سحب الإعلان بنجاح وإشعار فريق العمليات بمخلصة مع الاحتفاظ بالبيانات بسجلاتك.');
      window.location.reload();
    } else {
      alert(res.message);
    }
  };

  // Filter offers for active case
  const activeOffers = useMemo(() => {
    if (!activeCase) return [];
    return dbOffers.filter(
      o => o.caseReference === activeCase.caseReference ||
           o.carId === activeCase.vehicle.id ||
           o.listingId === activeCase.vehicle.id ||
           (activeCase.vehicle.id && o.carId && o.carId.includes(activeCase.vehicle.id)) ||
           (activeCase.vehicle.id && o.listingId && o.listingId.includes(activeCase.vehicle.id))
    );
  }, [dbOffers, activeCase]);

  // Split offers into pending (waiting for seller response) and responded (locked state)
  const { pendingOffers, respondedOffers } = useMemo(() => {
    const pending: PurchaseOffer[] = [];
    const responded: PurchaseOffer[] = [];

    activeOffers.forEach(o => {
      if (
        o.status === 'seller_accepted' ||
        o.status === 'accepted' ||
        o.status === 'rejected' ||
        o.status === 'seller_rejected' ||
        o.status === 'declined'
      ) {
        responded.push(o);
      } else {
        pending.push(o);
      }
    });

    return { pendingOffers: pending, respondedOffers: responded };
  }, [activeOffers]);

  if (!activeCase) {
    return (
      <div className="min-h-screen bg-brand-bg py-12 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-card space-y-4">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-black text-brand-navy">لا توجد طلبات بيع مسجلة حالياً</h2>
          <p className="text-xs text-slate-500">
            يمكنك نشر إعلان بيع سيارتك المحملة بأقساط أو مديونية بسهولة عبر معالج البيع.
          </p>
          <button
            onClick={() => onNavigate('sell-wizard')}
            className="w-full py-3 rounded-xl bg-brand-green text-white font-extrabold text-xs shadow-md"
          >
            بيع سيارتك الآن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 sm:px-6 lg:px-8 font-cairo">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green mb-1">
              <FileText className="w-4 h-4" />
              <span>متابعة وتحديث طلبات بيع السيارات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
              متابعة طلبي
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة حالة السيارة، الإشعارات والتنبيهات، عروض الأسعار، والمستندات المطلوبة لحظة بلحظة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-3.5 py-2 rounded-xl bg-white border border-brand-border text-xs font-bold text-slate-700 hover:text-brand-navy shadow-sm transition flex items-center gap-1.5"
            >
              <span>سوق السيارات</span>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="px-3.5 py-2 rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/30 text-xs font-bold hover:bg-brand-green/20 transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>حسابي وإعلاناتي</span>
            </button>
          </div>
        </div>

        {/* Multi-Request Switcher (If user has multiple vehicles) */}
        {availableCases.length > 1 && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-extrabold text-slate-600 text-3xs whitespace-nowrap px-1">
              اختر الطلب:
            </span>
            {availableCases.map((c) => (
              <button
                key={c.caseReference}
                onClick={() => setSelectedCaseId(c.caseReference)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeCase.caseReference === c.caseReference
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <CarIcon className="w-3.5 h-3.5 text-brand-green" />
                <span>{c.vehicle.make} {c.vehicle.model} ({c.caseReference})</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Request Overview Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-border shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-black font-mono text-brand-navy">
                {activeCase.vehicle.make} {activeCase.vehicle.model} {activeCase.vehicle.year}
              </span>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {activeCase.caseReference}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-2xs font-extrabold ${
                activeCase.status === 'listing_approved' || activeCase.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeCase.status === 'needs_changes'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : activeCase.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {activeCase.status === 'listing_approved' || activeCase.status === 'published'
                  ? '✓ معتمد ومنشور بالمعرض'
                  : activeCase.status === 'needs_changes'
                  ? '✏ مطلوب تعديل من الإدارة'
                  : activeCase.status === 'rejected'
                  ? '✕ تم الرفض'
                  : '⏳ بانتظار مراجعة الإدارة'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {activeCase.vehicle.trim} • {activeCase.vehicle.city} • جهة التمويل: {activeCase.financing.institutionName}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-green" />
              <span>تعديل بيانات الإعلان</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDocsModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-green" />
              <span>المستندات</span>
            </button>

            {activeCase.status !== 'withdrawn' && activeCase.status !== 'completed' && (
              <button
                type="button"
                onClick={handleWithdrawActiveCase}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                title="سحب الإعلان من المعرض مع الاحتفاظ ببياناته بسجلات المنصة"
              >
                <X className="w-3.5 h-3.5" />
                <span>سحب الإعلان</span>
              </button>
            )}
          </div>
        </div>

        {/* Needs Changes Alert Banner */}
        {activeCase.status === 'needs_changes' && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 text-xs text-amber-950 space-y-3 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>ملاحظات التدقيق والمطلوب تعديله من إدارة مخلصة:</span>
              </div>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-2xs shadow-sm transition flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل وحفظ الآن</span>
              </button>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed bg-white/80 p-3 rounded-2xl border border-amber-200/80 font-medium">
              يرجى مراجعة وتحديث السعر أو العداد أو توضيحات الفحص المطلوبة لإعادة إرسال الإعلان للمراجعة والاعتماد فوراً.
            </p>
          </div>
        )}

        {/* Tab Navigation Controls */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
            }`}
          >
            <CarIcon className="w-4 h-4" />
            <span>حالة وتفاصيل الطلب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'offers'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>عروض الأسعار والطلبات</span>
            {activeOffers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-black bg-emerald-500 text-white">
                {activeOffers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>الإشعارات والتنبيهات</span>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-black bg-amber-500 text-white">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المستندات والأوراق</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: DETAILS & REQUEST OVERVIEW                             */}
        {/* ============================================================== */}
        {activeTab === 'details' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (7 cols): Specs, Disclosures, Story */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Vehicle Presentation Card */}
                <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-lg text-brand-navy">
                        {activeCase.vehicle.make} {activeCase.vehicle.model} {activeCase.vehicle.year}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {activeCase.vehicle.trim} • {activeCase.vehicle.city}
                      </p>
                    </div>

                    <div className="text-left">
                      <span className="text-3xs text-slate-400 font-bold block">السعر المطلوب</span>
                      <span className="text-lg font-black text-brand-green">{formatEGP(activeCase.vehicle.askingPrice)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-3xs">قراءة العداد</span>
                      <span className="font-extrabold text-slate-800">{activeCase.vehicle.mileage.toLocaleString('ar-EG')} كم</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-3xs">جهة التمويل</span>
                      <span className="font-extrabold text-slate-800 truncate block">{activeCase.financing.institutionName}</span>
                    </div>
                  </div>

                  {/* Condition Narrative */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-brand-navy block">وصف حالة السيارة من البائع:</span>
                    <p className="text-slate-600 leading-relaxed text-2xs">
                      {activeCase.sellerConditionStory || 'تم فحص السيارة وهي بحالة ممتازة وجاهزة للمعاينة وتسوية البنك.'}
                    </p>
                  </div>

                  {/* Disclosed Defects */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">الملاحظات والعيوب المفصح عنها:</span>
                    {activeCase.disclosedIssues && activeCase.disclosedIssues.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activeCase.disclosedIssues.map((issue, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-2xs font-bold">
                            • {issue}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">لا توجد عيوب مفصح عنها.</p>
                    )}
                  </div>
                </div>

                {/* Revision History Log */}
                <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-brand-navy flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-green" />
                      <span>سجل التعديلات والمراجعة</span>
                    </h4>
                    <span className="text-2xs text-slate-400">
                      {activeCase.revisions?.length || 0} تعديل سابق
                    </span>
                  </div>

                  {activeCase.revisions && activeCase.revisions.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeCase.revisions.map(rev => (
                        <div key={rev.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-brand-navy">{rev.fieldLabelAr}</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-3xs ${
                              rev.reviewStatus === 'approved' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : rev.reviewStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rev.reviewStatus === 'approved' ? '✓ تم الاعتماد' : rev.reviewStatus === 'rejected' ? '✕ مرفوض' : 'قيد المراجعة'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-2xs text-slate-500 pt-0.5">
                            <span>السابق: <strong className="line-through">{typeof rev.previousValue === 'number' ? formatEGP(rev.previousValue) : JSON.stringify(rev.previousValue)}</strong></span>
                            <span>←</span>
                            <span>الجديد: <strong className="text-brand-navy">{typeof rev.newValue === 'number' ? formatEGP(rev.newValue) : JSON.stringify(rev.newValue)}</strong></span>
                          </div>

                          {rev.reviewNotes && (
                            <p className="text-3xs text-slate-500 italic pt-0.5">
                              ملاحظة: {rev.reviewNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">لا توجد أي تعديلات سابقة مسجلة على هذا الطلب.</p>
                  )}
                </div>

              </div>

              {/* Right Column (5 cols): Case Officer & Financials */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Case Officer Contact Card */}
                <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
                  <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">
                    مسؤول التخارج المتابع لطلبك:
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {activeCase.assignedEmployeeName.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-brand-navy text-sm">{activeCase.assignedEmployeeName}</h4>
                      <p className="text-xs text-slate-500">فريق تسوية قروض السيارات وفك الحظر</p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/201018898144?text=${encodeURIComponent(`مرحباً أستاذ ${activeCase.assignedEmployeeName}، بخصوص طلب سيارتي كود (${activeCase.caseReference}) في منصة مخلصة.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>تواصل مباشر عبر واتساب</span>
                  </a>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-3.5 text-xs">
                  <h4 className="font-extrabold text-sm text-brand-navy pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-brand-green" />
                    <span>كشف التسوية البنكية المتوقع</span>
                  </h4>

                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>سعر البيع المطلوب:</span>
                      <strong className="text-brand-navy">{formatEGP(activeCase.vehicle.askingPrice)}</strong>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>تسوية البنك (تودع بحساب القرض):</span>
                      <strong>-{formatEGP(activeCase.settlementStatement.lenderSettlementAmount)}</strong>
                    </div>
                    <div className="flex justify-between text-brand-green font-bold">
                      <span>عمولة مخلصة (1.5%):</span>
                      <span>-{formatEGP(activeCase.settlementStatement.platformCommission)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-brand-navy text-sm">
                      <span>صافي النقدية المتوقعة لك:</span>
                      <span className="text-emerald-700">{formatEGP(activeCase.settlementStatement.netProceedsToSeller)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PURCHASE OFFERS & BUYER BIDS                           */}
        {/* ============================================================== */}
        {activeTab === 'offers' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                  <Tag className="w-5 h-5 text-brand-green" />
                  <span>عروض الأسعار المقدمة من المشترين</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  جميع العروض الواردة على سيارتك مع إمكانية القبول أو الرفض بالتنسيق مع مسؤول مخلصة.
                </p>
              </div>
            </div>

            {offerActionMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold">
                {offerActionMsg}
              </div>
            )}

            {activeOffers.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Tag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-black text-sm text-brand-navy">لا توجد عروض أسعار جديدة حالياً</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  بمجرد اعتماد ونشر إعلانك في المعرض العام، ستصلك هنا فوراً جميع عروض الشراء الجادة المقدمة من المشترين.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Pending Offers requiring Seller Action */}
                {pendingOffers.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <h4 className="font-black text-xs text-slate-800">
                        عروض شراء جديدة بانتظار موافقتك أو رفضك ({pendingOffers.length})
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {pendingOffers.map((offer) => (
                        <div key={offer.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-brand-navy">{offer.buyerName}</span>
                              <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800">
                                عرض جديد بانتظار ردك
                              </span>
                            </div>
                            <p className="text-2xs text-slate-500">
                              تاريخ العرض: {new Date(offer.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                            {offer.notes && (
                              <p className="text-2xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200/80">
                                ملاحظة المشتري: {offer.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                            <div className="text-sm font-black text-brand-green font-mono">
                              {formatEGP(offer.offeredPrice)}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => handleRespondToOffer(offer.id, 'accept')}
                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-2xs shadow-sm transition flex items-center justify-center gap-1"
                              >
                                <span>قبول العرض مبدئياً</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondToOffer(offer.id, 'reject')}
                                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-2xs transition"
                              >
                                <span>اعتذار عن العرض</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Responded Offers (Locked & Settled) */}
                {respondedOffers.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <h4 className="font-black text-xs text-slate-700">
                        عروض تم الرد عليها والبت فيها ({respondedOffers.length})
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {respondedOffers.map((offer) => {
                        const isAccepted = offer.status === 'seller_accepted' || offer.status === 'accepted';
                        return (
                          <div 
                            key={offer.id} 
                            className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                              isAccepted 
                                ? 'bg-emerald-50/60 border-emerald-300/80' 
                                : 'bg-slate-50 border-slate-200 opacity-75'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-brand-navy">{offer.buyerName}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold ${
                                  offer.status === 'accepted' 
                                    ? 'bg-emerald-600 text-white' 
                                    : isAccepted 
                                    ? 'bg-emerald-200 text-emerald-900' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {offer.status === 'accepted' 
                                    ? '✓ تم الاعتماد النهائي (تواصل لتحديد المقابلة خلال 24 ساعة)' 
                                    : isAccepted 
                                    ? '✓ تمت موافقتك المبدئية بنجاح' 
                                    : '✕ تم الاعتذار عن هذا العرض'}
                                </span>
                              </div>
                              <p className="text-2xs text-slate-500">
                                تاريخ العرض: {new Date(offer.createdAt).toLocaleDateString('ar-EG')}
                              </p>
                              {isAccepted && (
                                <p className="text-2xs text-emerald-800 font-bold bg-white/80 p-2 rounded-xl border border-emerald-200/80">
                                  🔒 تم تثبيت موافقتك على العرض ولا يمكن التراجع أو إلغاؤه، وجاري الآن اعتماد إدارة مخلصة لتحديد موعد المقابلة البنكية.
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                              <div className="text-sm font-black text-brand-green font-mono">
                                {formatEGP(offer.offeredPrice)}
                              </div>
                              <span className="text-3xs font-bold text-slate-400">
                                {isAccepted ? 'عرض معتمد' : 'عرض ملغي'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: IN-APP NOTIFICATIONS & UPDATES                         */}
        {/* ============================================================== */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-green" />
                <span>سجل الإشعارات والتنبيهات</span>
              </h3>
              <span className="text-2xs text-slate-400">
                {notifications.length} إشعار
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">لا توجد إشعارات جديدة حالياً</p>
                <p className="text-2xs text-slate-400">ستصلك هنا كافة تحديثات الإدارة ومراحل مراجعة الإعلان وعروض المشترين.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brand-navy flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                        <span>{notif.title}</span>
                      </span>
                      <span className="text-3xs text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Direct Action Link */}
                    {(notif.title.includes('تعديل') || notif.type === 'listing_status_changed') ? (
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-2xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>🚨 حل المشكلة وتعديل الإعلان فوراً</span>
                      </button>
                    ) : (notif.title.includes('مستندات') || notif.title.includes('أوراق')) ? (
                      <button
                        type="button"
                        onClick={() => setIsDocsModalOpen(true)}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-2xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>📄 إرفاق المستندات المطلوبة</span>
                      </button>
                    ) : (notif.type === 'new_offer' || notif.title.includes('عرض')) ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('offers')}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-2xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>💰 فحص العرض والرد عليه</span>
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: OFFICIAL DOCUMENTS                                     */}
        {/* ============================================================== */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-green" />
                  <span>المستندات والأوراق الرسمية</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  رخصة السيارة، بطاقة الرقم القومي، وبيان المديونية البنكية لتسريع تسوية القرض وفك الحظر.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-brand-navy block">1. رخصة السيارة:</span>
                  <p className="text-3xs text-slate-500">صورة واضحة للرخصة وجهين سارية.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-brand-navy block">2. بطاقة الرقم القومي:</span>
                  <p className="text-3xs text-slate-500">صورة بطاقة المالك سارية وجهين.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-brand-navy block">3. بيان مديونية البنك:</span>
                  <p className="text-3xs text-slate-500">خطاب استعلام سداد معجل رسمي.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDocsModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>إرفاق أو تحديث الأوراق الآن</span>
                </button>

                <a
                  href={`https://wa.me/201018898144?text=${encodeURIComponent(`أرغب في إرسال المستندات الرسمية لإعلاني كود (${activeCase.caseReference}) عبر واتساب مباشرة.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إرسال الأوراق عبر واتساب مباشرة</span>
                </a>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* EDIT MODAL: SELLER VEHICLE EDIT DRAWER                         */}
      {/* ============================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-elevated border border-slate-100 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-green" />
                <h3 className="font-black text-base text-brand-navy">
                  تعديل بيانات السيارة والإعلان ({activeCase.caseReference})
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {editSaveSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto animate-bounce" />
                <h4 className="font-black text-brand-navy text-sm">
                  تم استلام طلب التعديل بنجاح!
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تم حفظ التعديلات وإدراجها في سجل المراجعات للمطابقة وتحديث الإعلان في المعرض العام.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveEdits} className="space-y-4 text-xs">
                
                {/* Admin Feedback / Problem Director Alert */}
                {(activeCase.status === 'needs_changes' || activeCase.adminFeedback) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>توجيه الإدارة والمطلوب تعديله:</span>
                    </div>
                    <p className="text-amber-800 text-2xs leading-relaxed font-semibold">
                      {activeCase.adminFeedback || activeCase.timeline?.find(t => t.status === 'needs_changes')?.reason || 'يرجى مراجعة وتحديث بيانات السعر والعداد وتوضيحات الفحص لإعادة الإرسال والاعتماد فوراً.'}
                    </p>
                  </div>
                )}
                
                {/* Asking Price Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-slate-700">السعر الإجمالي المطلوب للبيع (ج.م):</label>
                    <span className="font-black text-brand-navy">{formatEGP(editPrice)}</span>
                  </div>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-brand-navy focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                {/* Mileage Input */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">قراءة العداد الحالية (كم):</label>
                  <input
                    type="number"
                    required
                    value={editMileage}
                    onChange={(e) => setEditMileage(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                {/* Disclosed Defects Checkboxes */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">
                    العيوب والملاحظات المفصح عنها:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMON_DEFECTS_LIST.map((defect, idx) => (
                      <label key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-2xs">
                        <input
                          type="checkbox"
                          checked={editDisclosedIssues.includes(defect)}
                          onChange={() => handleToggleDefect(defect)}
                          className="mt-0.5 rounded text-brand-green focus:ring-brand-green accent-brand-green"
                        />
                        <span className="text-slate-700 font-medium">{defect}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Condition Narrative */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">قصة حالة السيارة ووصف البائع:</label>
                  <textarea
                    rows={3}
                    value={editConditionStory}
                    onChange={(e) => setEditConditionStory(e.target.value)}
                    placeholder="اكتب تفاصيل حالة الصيانة والدهان وسجل التوكيل..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                  />
                </div>

                {/* Reason for Edit */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block">سبب التعديل:</label>
                  <input
                    type="text"
                    value={editReasonNote}
                    onChange={(e) => setEditReasonNote(e.target.value)}
                    placeholder="مثال: تخفيض السعر لتسريع البيع قبل ميعاد القسط القادم"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition"
                  >
                    حفظ التعديلات وإرسالها للمراجعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DOCUMENTS MODAL                                                */}
      {/* ============================================================== */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-elevated border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-green" />
                <h3 className="font-black text-base text-brand-navy">
                  إرفاق المستندات الرسمية ({activeCase.caseReference})
                </h3>
              </div>
              <button
                onClick={() => setIsDocsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold text-emerald-950 block">
                  خصوصية تامة وحماية مشفرة
                </span>
                <p className="text-3xs text-emerald-800 leading-relaxed">
                  هذه الأوراق مشفرة ومحفوظة بسرية تامة ولا تظهر للعامة. تقتصر فقط على مسؤولي العمليات لمطابقة السجل واعتماد شارة (أوراق مفحوصة وموثقة) على الإعلان.
                </p>
              </div>
            </div>

            {docsSaveSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto animate-bounce" />
                <h4 className="font-black text-brand-navy text-sm">تم حفظ المستندات بنجاح!</h4>
                <p className="text-xs text-slate-500">تم إرسال إشعار لمسؤول المعاملة لمطابقة الأوراق.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveDocs} className="space-y-3.5 text-xs max-h-[60vh] overflow-y-auto px-1">
                {/* 1. License Front */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 flex items-center gap-1.5">
                      <span>1. رخصة السيارة (الوجه الأمامي)</span>
                      <span className="text-3xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">أساسي</span>
                    </label>
                    {licenseFrontUrl && (
                      <button
                        type="button"
                        onClick={() => setLicenseFrontUrl('')}
                        className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  {licenseFrontUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      {licenseFrontUrl.startsWith('data:image') || licenseFrontUrl.startsWith('http') ? (
                        <img src={licenseFrontUrl} alt="رخصة السيارة - أمامي" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                      ) : (
                        <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">PDF</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          تم إرفاق الوجه الأمامي
                        </span>
                        <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                          {licenseFrontUrl.slice(0, 45)}...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-brand-green bg-white rounded-xl cursor-pointer transition text-center group">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-brand-green transition mb-1" />
                      <span className="text-2xs font-bold text-slate-700 group-hover:text-brand-green transition">التقاط بالكاميرا أو اختيار صورة من الهاتف / الكمبيوتر</span>
                      <span className="text-3xs text-slate-400 mt-0.5">يدعم JPG, PNG, WEBP, PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => handleCaseDocFile('front', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 2. License Back */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 flex items-center gap-1.5">
                      <span>2. رخصة السيارة (الوجه الخلفي)</span>
                      <span className="text-3xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">أساسي</span>
                    </label>
                    {licenseBackUrl && (
                      <button
                        type="button"
                        onClick={() => setLicenseBackUrl('')}
                        className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  {licenseBackUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      {licenseBackUrl.startsWith('data:image') || licenseBackUrl.startsWith('http') ? (
                        <img src={licenseBackUrl} alt="رخصة السيارة - خلفي" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                      ) : (
                        <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">PDF</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          تم إرفاق الوجه الخلفي
                        </span>
                        <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                          {licenseBackUrl.slice(0, 45)}...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-brand-green bg-white rounded-xl cursor-pointer transition text-center group">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-brand-green transition mb-1" />
                      <span className="text-2xs font-bold text-slate-700 group-hover:text-brand-green transition">التقاط بالكاميرا أو اختيار صورة من الهاتف / الكمبيوتر</span>
                      <span className="text-3xs text-slate-400 mt-0.5">يدعم JPG, PNG, WEBP, PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => handleCaseDocFile('back', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 3. National ID */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 flex items-center gap-1.5">
                      <span>3. بطاقة الرقم القومي</span>
                      <span className="text-3xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">للتحقق الإداري فقط</span>
                    </label>
                    {idUrl && (
                      <button
                        type="button"
                        onClick={() => setIdUrl('')}
                        className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  {idUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      {idUrl.startsWith('data:image') || idUrl.startsWith('http') ? (
                        <img src={idUrl} alt="بطاقة الرقم القومي" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                      ) : (
                        <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">مستند</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          تم إرفاق البطاقة القومية
                        </span>
                        <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                          {idUrl.slice(0, 45)}...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-brand-green bg-white rounded-xl cursor-pointer transition text-center group">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-brand-green transition mb-1" />
                      <span className="text-2xs font-bold text-slate-700 group-hover:text-brand-green transition">التقاط صورة البطاقة القومية</span>
                      <span className="text-3xs text-slate-400 mt-0.5">يدعم JPG, PNG, WEBP</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => handleCaseDocFile('id', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 4. Bank Statement */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 flex items-center gap-1.5">
                      <span>4. بيان السداد المعجل / مديونية البنك</span>
                      <span className="text-3xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">لتسوية التمويل</span>
                    </label>
                    {statementUrl && (
                      <button
                        type="button"
                        onClick={() => setStatementUrl('')}
                        className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  {statementUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      {statementUrl.startsWith('data:image') || statementUrl.startsWith('http') ? (
                        <img src={statementUrl} alt="بيان البنك" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                      ) : (
                        <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">PDF</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          تم إرفاق بيان السداد البنكي
                        </span>
                        <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                          {statementUrl.slice(0, 45)}...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-brand-green bg-white rounded-xl cursor-pointer transition text-center group">
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-brand-green transition mb-1" />
                      <span className="text-2xs font-bold text-slate-700 group-hover:text-brand-green transition">رفع بيان المديونية البنكية أو المخالصة</span>
                      <span className="text-3xs text-slate-400 mt-0.5">يدعم صورة أو مستند PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleCaseDocFile('statement', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 5. Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ملاحظات إضافية:</label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="ملاحظات حول سريان الرخصة والتوكيلات..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-2xs text-emerald-900 font-bold">تفضل الإرسال المباشر عبر واتساب؟</span>
                  <a
                    href={`https://wa.me/201018898144?text=${encodeURIComponent(`أرغب في إرسال صور الأوراق والمستندات لحالتي (${activeCase.caseReference}) عبر واتساب مباشرة.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-3xs font-black text-emerald-800 underline hover:text-emerald-950"
                  >
                    فتح واتساب مخلصة
                  </a>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={docsUploading}
                    className="flex-1 py-3 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition disabled:opacity-60"
                  >
                    {docsUploading ? 'جاري الحفظ...' : 'حفظ وإشعار الإدارة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDocsModalOpen(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default SellerCasePortalPage;
