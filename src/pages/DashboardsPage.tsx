import React, { useState, useMemo } from 'react';
import { 
  Car, DistressedVehicleCase, CallLogEntry, 
  CaseLifecycleStatus 
} from '../types';
import { INITIAL_DISTRESSED_CASES, MOCK_EMPLOYEES } from '../data/mockDistressedCases';
import { 
  LayoutDashboard, User, ShieldCheck, 
  CheckCircle2, Clock, FileText, Banknote, 
  PhoneCall, UploadCloud, Search, PlusCircle, Scale
} from 'lucide-react';

interface DashboardsPageProps {
  cars?: Car[];
  distressedCases?: DistressedVehicleCase[];
  onUpdateCase?: (updatedCase: DistressedVehicleCase) => void;
  onSelectCar?: (car: Car) => void;
  activeRole?: 'seller' | 'buyer' | 'admin' | 'employee' | 'owner';
  onChangeRole?: (role: any) => void;
  lang?: 'ar' | 'en';
}

const LIFECYCLE_STATUS_LABELS: Record<string, { labelAr: string; color: string }> = {
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
  on_hold: { labelAr: '25. معلق / وجود عجز مالي', color: 'bg-red-100 text-red-800' }
};

export const DashboardsPage: React.FC<DashboardsPageProps> = ({
  cars: _cars,
  distressedCases = INITIAL_DISTRESSED_CASES,
  onUpdateCase: _onUpdateCase,
  onSelectCar: _onSelectCar,
  activeRole = 'seller',
  onChangeRole,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [currentRole, setCurrentRole] = useState<'seller' | 'employee' | 'owner'>(
    activeRole === 'admin' ? 'employee' : activeRole === 'owner' ? 'owner' : 'seller'
  );
  
  // State for all cases in memory
  const [cases, setCases] = useState<DistressedVehicleCase[]>(distressedCases);

  // Selected case for Owner Tracker view
  const [selectedCaseRef, setSelectedCaseRef] = useState<string>(cases[0]?.caseReference || 'MK-CASE-2026-001');

  // Selected case for Employee CRM modal / management
  const [activeManagingCase, setActiveManagingCase] = useState<DistressedVehicleCase | null>(null);

  // Employee CRM Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Call Logger Modal State
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [callTargetCase, setCallTargetCase] = useState<DistressedVehicleCase | null>(null);
  const [callParty, setCallParty] = useState<'seller' | 'buyer' | 'lender'>('seller');
  const [callType, setCallType] = useState<'phone_call' | 'whatsapp' | 'meeting' | 'inspection'>('phone_call');
  const [callOutcome, setCallOutcome] = useState<string>('answered_agreed');
  const [callNotes, setCallNotes] = useState<string>('');
  const [callFollowUpDate, setCallFollowUpDate] = useState<string>('2026-10-25');

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  const handleRoleChange = (role: 'seller' | 'employee' | 'owner') => {
    setCurrentRole(role);
    onChangeRole?.(role);
  };

  // Currently viewed case in Seller Tracker
  const currentOwnerCase = useMemo(() => {
    return cases.find(c => c.caseReference === selectedCaseRef) || cases[0];
  }, [cases, selectedCaseRef]);

  // Filtered cases for Employee CRM
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchUrgency = urgencyFilter === 'all' || c.urgency === urgencyFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        c.caseReference.toLowerCase().includes(q) ||
        c.seller.name.toLowerCase().includes(q) ||
        c.seller.phone.includes(q) ||
        c.vehicle.make.toLowerCase().includes(q) ||
        c.vehicle.model.toLowerCase().includes(q) ||
        c.financing.institutionName.toLowerCase().includes(q);
      return matchStatus && matchUrgency && matchSearch;
    });
  }, [cases, statusFilter, urgencyFilter, searchQuery]);

  // Status progression mapping (7 visual milestones)
  const getProgressMilestoneIndex = (status: CaseLifecycleStatus): number => {
    switch (status) {
      case 'new_request':
      case 'awaiting_initial_contact':
      case 'seller_contacted':
        return 1;
      case 'eligibility_review':
      case 'awaiting_missing_info':
      case 'awaiting_documents':
        return 2;
      case 'awaiting_lender_confirmation':
      case 'awaiting_official_settlement':
      case 'valuation_in_progress':
      case 'valuation_reviewed':
        return 3;
      case 'awaiting_seller_price_approval':
      case 'listing_approved':
      case 'buyer_inquiry_received':
      case 'buyer_qualification':
        return 4;
      case 'offer_received':
      case 'awaiting_seller_response':
      case 'negotiation':
        return 5;
      case 'settlement_coordination':
      case 'awaiting_lender_action':
        return 6;
      case 'awaiting_restriction_release':
      case 'transfer_process':
      case 'completed':
        return 7;
      default:
        return 1;
    }
  };

  // Submit Call Log
  const handleSaveCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTargetCase) return;

    const newLog: CallLogEntry = {
      id: `cl-${Date.now()}`,
      caseId: callTargetCase.caseReference,
      employeeId: 'emp-2',
      employeeName: 'أحمد الشريف',
      contactType: callType,
      party: callParty === 'lender' ? 'lender_rep' : callParty,
      outcome: callOutcome as any,
      notes: callNotes,
      followUpDate: callFollowUpDate,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedCases = cases.map(c => {
      if (c.caseReference === callTargetCase.caseReference) {
        return {
          ...c,
          callLogs: [newLog, ...(c.callLogs || [])]
        };
      }
      return c;
    });

    setCases(updatedCases);
    if (activeManagingCase && activeManagingCase.caseReference === callTargetCase.caseReference) {
      setActiveManagingCase({
        ...activeManagingCase,
        callLogs: [newLog, ...(activeManagingCase.callLogs || [])]
      });
    }

    setShowCallModal(false);
    setCallNotes('');
    alert(isAr ? 'تم تسجيل المكالمة وتحديث سجل المتابعة بنجاح!' : 'Call log saved successfully!');
  };

  // Update Status from CRM
  const handleUpdateStatus = (caseRef: string, newStatus: CaseLifecycleStatus) => {
    const updatedCases = cases.map(c => {
      if (c.caseReference === caseRef) {
        const newTimelineEvent = {
          id: `tm-${Date.now()}`,
          caseId: caseRef,
          status: newStatus,
          changedBy: 'أحمد الشريف (مسؤول الحالات)',
          reason: `تغيير الحالة يدويًا إلى ${LIFECYCLE_STATUS_LABELS[newStatus]?.labelAr || newStatus}`,
          timestamp: new Date().toLocaleTimeString('ar-EG')
        };
        return {
          ...c,
          status: newStatus,
          timeline: [newTimelineEvent, ...(c.timeline || [])]
        };
      }
      return c;
    });

    setCases(updatedCases);
    if (activeManagingCase && activeManagingCase.caseReference === caseRef) {
      setActiveManagingCase(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Role Switcher */}
        <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green mb-1">
              <LayoutDashboard className="w-4 h-4" />
              <span>{isAr ? 'بوابة إدارة الصفقات ومتابعة الحالات' : 'Mokhalasa Operations & Account Portal'}</span>
            </div>
            <h1 className="text-2xl font-black text-brand-navy">
              {currentRole === 'seller' 
                ? (isAr ? 'متابعة حالة سيارتي (Seller Case Tracker)' : 'Seller Case Tracker') 
                : currentRole === 'employee' 
                ? (isAr ? 'نظام خدمة العملاء والعمليات (Internal CRM)' : 'Internal CRM & Ops Console') 
                : (isAr ? 'لوحة الإدارة التنفيذية والرقابة (Executive Console)' : 'Executive Management Console')}
            </h1>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 self-start md:self-auto">
            <button
              onClick={() => handleRoleChange('seller')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentRole === 'seller' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isAr ? 'مالك السيارة' : 'Seller'}</span>
            </button>
            <button
              onClick={() => handleRoleChange('employee')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentRole === 'employee' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'فريق العمليات (CRM)' : 'CRM Staff'}</span>
            </button>
            <button
              onClick={() => handleRoleChange('owner')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentRole === 'owner' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isAr ? 'الإدارة العامة' : 'Owner'}</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ROLE 1: SELLER / PRIVATE CASE TRACKER                          */}
        {/* ============================================================== */}
        {currentRole === 'seller' && currentOwnerCase && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Case Selection & Reference Header */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  رقم الملف المرجعي للحالة:
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black font-mono text-brand-navy bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                    {currentOwnerCase.caseReference}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    LIFECYCLE_STATUS_LABELS[currentOwnerCase.status]?.color || 'bg-slate-100 text-slate-700'
                  }`}>
                    {LIFECYCLE_STATUS_LABELS[currentOwnerCase.status]?.labelAr || currentOwnerCase.status}
                  </span>
                </div>
              </div>

              {/* Case switcher for testing */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500 font-bold">اختيار ملف آخر:</span>
                <select
                  value={selectedCaseRef}
                  onChange={(e) => setSelectedCaseRef(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy bg-slate-50"
                >
                  {cases.map(c => (
                    <option key={c.caseReference} value={c.caseReference}>
                      {c.caseReference} - {c.vehicle.make} {c.vehicle.model} ({c.seller.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual 7-Stage Progress Stepper */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h2 className="text-sm font-extrabold text-brand-navy flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-green" />
                  <span>المسار الإجرائي الفعلي لصفقة التخارج (خطوة بخطوة):</span>
                </h2>
                <span className="text-xs font-bold text-brand-green">
                  المرحلة {getProgressMilestoneIndex(currentOwnerCase.status)} من 7
                </span>
              </div>

              {/* Progress Milestones Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                {[
                  { step: 1, title: 'تسجيل الطلب', desc: 'الأهلية والبيانات' },
                  { step: 2, title: 'تدقيق المديونية', desc: 'استعلام البنك' },
                  { step: 3, title: 'رفع المستندات', desc: 'الرخصة والبطاقة' },
                  { step: 4, title: 'عرض السيارة', desc: 'استقبال المشترين' },
                  { step: 5, title: 'الاتفاق الثلاثي', desc: 'توقيع العقود' },
                  { step: 6, title: 'سداد البنك', desc: 'إيداع بالفرع' },
                  { step: 7, title: 'نقل الملكية', desc: 'الشهر العقاري' }
                ].map((m) => {
                  const currentMilestone = getProgressMilestoneIndex(currentOwnerCase.status);
                  const isPast = m.step < currentMilestone;
                  const isCurrent = m.step === currentMilestone;
                  return (
                    <div
                      key={m.step}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isCurrent 
                          ? 'bg-brand-navy text-white border-brand-navy shadow-md ring-2 ring-brand-green/50' 
                          : isPast 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isCurrent ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {m.step}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-extrabold block truncate">{m.title}</span>
                      <span className={`text-[10px] block truncate mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                        {m.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Explanation Box */}
              <div className="p-4 rounded-2xl bg-brand-surface/60 border border-brand-border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="font-extrabold text-brand-navy block">
                    الموقف الحالي لسيارتك: {LIFECYCLE_STATUS_LABELS[currentOwnerCase.status]?.labelAr}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {currentOwnerCase.distressReasonNotes || 'يقوم مستشار مخلصة المعين بمتابعة الإجراءات ومطابقة بيان السداد المعجل لضمان حماية حقوقك.'}
                  </p>
                </div>
                {currentOwnerCase.settlementStatement.isShortfall && (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold flex-shrink-0">
                    ⚠️ تنبيه عجز مالي: يتطلب ضخ كاش {formatEGP(currentOwnerCase.settlementStatement.shortfallAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Financial Summary & Settlement Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Settlement Statement (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-brand-navy flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-brand-green" />
                    <span>كشف الحساب المالي والتسوية التقديرية</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    بنك: <strong className="text-brand-navy">{currentOwnerCase.financing.institutionName}</strong>
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>سعر البيع المطلوب للسيارة:</span>
                    <span className="font-bold text-brand-navy text-sm">{formatEGP(currentOwnerCase.settlementStatement.grossSalePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span>تسوية البنك الدائن (تودع بحساب القرض):</span>
                    <span className="font-bold">-{formatEGP(currentOwnerCase.settlementStatement.lenderSettlementAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>المصاريف الحكومية والتوثيق والفحص:</span>
                    <span className="font-bold">
                      -{formatEGP(currentOwnerCase.settlementStatement.trafficAndGovFees + currentOwnerCase.settlementStatement.releaseLetterFee + currentOwnerCase.settlementStatement.inspectionFee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-brand-green font-bold">
                    <span>عمولة مخلصة لتنظيم الصفقة (1.5%):</span>
                    <span>-{formatEGP(currentOwnerCase.settlementStatement.platformCommission)}</span>
                  </div>

                  <div className={`flex justify-between items-center p-3 rounded-xl font-black text-sm pt-2 border-t border-slate-200 ${
                    currentOwnerCase.settlementStatement.isShortfall 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span>
                      {currentOwnerCase.settlementStatement.isShortfall ? 'مبلغ العجز المطلوب منك سداده:' : 'صافي المبلغ المسترد لك كاش:'}
                    </span>
                    <span>
                      {currentOwnerCase.settlementStatement.isShortfall 
                        ? formatEGP(currentOwnerCase.settlementStatement.shortfallAmount)
                        : formatEGP(currentOwnerCase.settlementStatement.netProceedsToSeller)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold text-brand-navy block">تأكيد عدم استلام مخلصة لأموال القرض:</span>
                  <p>
                    مبلغ تسوية البنك ({formatEGP(currentOwnerCase.settlementStatement.lenderSettlementAmount)}) يُسدد من المشتري مباشرة إلى حساب قرضك بالبنك. لا تستلم مخلصة أي أموال تسوية.
                  </p>
                </div>
              </div>

              {/* Right Column: Case Officer Contact & Documents Drawer (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Dedicated Case Officer Contact Card */}
                <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    مستشار الصفقة المعين لحسابك:
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-base">
                      {currentOwnerCase.assignedEmployeeName.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-brand-navy text-sm">{currentOwnerCase.assignedEmployeeName}</h4>
                      <p className="text-xs text-slate-500">مسؤول تخارج السيارات والقروض المتعثرة</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <a
                      href={`https://wa.me/201018898144?text=${encodeURIComponent(`مرحباً أستاذ ${currentOwnerCase.assignedEmployeeName}، بخصوص ملف سيارتي كود (${currentOwnerCase.caseReference}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-bold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>تواصل مباشر عبر واتساب</span>
                    </a>
                  </div>
                </div>

                {/* Subsequent Documents Status Drawer */}
                <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-brand-navy flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-brand-green" />
                      <span>المستندات المطلوبة للصفقة</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">تدقيق إلكتروني</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-brand-navy block">بطاقة الرقم القومي (سارية)</span>
                        <span className="text-[10px] text-slate-400">وجه وظهر</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ معتمد
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-brand-navy block">رخصة تسيير السيارة</span>
                        <span className="text-[10px] text-slate-400">سارية بحظر بيع</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ معتمد
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-brand-navy block">بيان مديونية / سداد معجل رسمي</span>
                        <span className="text-[10px] text-slate-400">مختوم من فرع البنك</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                        قيد التدقيق
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(isAr ? 'تم فتح خزانة المستندات الآمنة لرفع ملفات جديدة.' : 'Secure document drawer opened.')}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <UploadCloud className="w-4 h-4 text-brand-green" />
                    <span>رفع مستند إضافي للملف</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* ROLE 2: EMPLOYEE / INTERNAL CRM CONSOLE                        */}
        {/* ============================================================== */}
        {currentRole === 'employee' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4.5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">إجمالي ملفات التخارج</span>
                <span className="text-2xl font-black text-brand-navy mt-1 block">{cases.length} ملفات</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">متابعة يومية بالبنوك</span>
              </div>
              <div className="bg-white rounded-2xl p-4.5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">حالات عاجلة جداً</span>
                <span className="text-2xl font-black text-red-600 mt-1 block">
                  {cases.filter(c => c.urgency === 'very_urgent').length} حالات
                </span>
                <span className="text-[10px] text-red-500 font-bold mt-0.5 block">أولوية تسويقية وتنسيق</span>
              </div>
              <div className="bg-white rounded-2xl p-4.5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">حالات عجز مالي (On Hold)</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">
                  {cases.filter(c => c.settlementStatement.isShortfall).length} حالة
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">تتطلب اتفاق تغطية العجز</span>
              </div>
              <div className="bg-white rounded-2xl p-4.5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">عمولات مخلصة المتوقعة</span>
                <span className="text-2xl font-black text-brand-green mt-1 block">
                  {formatEGP(cases.reduce((sum, c) => sum + (c.settlementStatement.platformCommission || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">بنسبة 1.5% من إجمالي البيع</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم الملف، اسم البائع، الهاتف، أو نوع السيارة..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="all">كافة الحالات (25 مرحلة)</option>
                    {Object.entries(LIFECYCLE_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.labelAr}</option>
                    ))}
                  </select>

                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="all">كافة مستويات الاستعجال</option>
                    <option value="very_urgent">عاجل جداً (أسبوع)</option>
                    <option value="urgent">عاجل (أسبوعين)</option>
                    <option value="normal">عادي (شهر)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cases Table */}
            <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-brand-navy">
                  ملفات التخارج النشطة ({filteredCases.length})
                </h3>
                <span className="text-xs text-slate-400">تحديث فوري للسجلات</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-3 px-4">كود الملف</th>
                      <th className="py-3 px-4">البائع والاتصال</th>
                      <th className="py-3 px-4">بيانات السيارة</th>
                      <th className="py-3 px-4">البنك وأصل الدين</th>
                      <th className="py-3 px-4">السعر المطلوب</th>
                      <th className="py-3 px-4">الحالة الإجرائية (25)</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCases.map((c: DistressedVehicleCase) => {
                      const isShortfall = c.settlementStatement.isShortfall;
                      return (
                        <tr key={c.caseReference} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-black text-brand-navy">
                            {c.caseReference}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">{c.seller.name}</span>
                            <span className="text-[11px] text-slate-400">{c.seller.phone} ({c.seller.city})</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-brand-navy block">{c.vehicle.make} {c.vehicle.model} {c.vehicle.year}</span>
                            <span className="text-[11px] text-slate-500">{c.vehicle.mileage.toLocaleString()} كم</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-700 block">{c.financing.institutionName}</span>
                            <span className="text-[11px] text-red-600 font-bold">
                              دين: {formatEGP(c.financing.estimatedOutstandingPrincipal)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-brand-navy block">{formatEGP(c.settlementStatement.grossSalePrice)}</span>
                            {isShortfall && (
                              <span className="text-[10px] text-red-600 font-bold block">
                                عجز: {formatEGP(c.settlementStatement.shortfallAmount)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              LIFECYCLE_STATUS_LABELS[c.status]?.color || 'bg-slate-100 text-slate-700'
                            }`}>
                              {LIFECYCLE_STATUS_LABELS[c.status]?.labelAr || c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setActiveManagingCase(c)}
                                className="px-2.5 py-1.5 rounded-lg bg-brand-navy text-white text-[11px] font-bold hover:bg-slate-800 transition"
                                title="إدارة الحالة وتعديل المرحلة"
                              >
                                تفاصيل
                              </button>
                              <button
                                onClick={() => {
                                  setCallTargetCase(c);
                                  setShowCallModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition"
                                title="تسجيل مكالمة / تحديث متابعة"
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
        {/* ROLE 3: OWNER / EXECUTIVE CONSOLE                              */}
        {/* ============================================================== */}
        {currentRole === 'owner' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Executive KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">إجمالي ديون تم تسويتها</span>
                <span className="text-2xl font-black text-brand-navy mt-1 block">18,450,000 ج.م</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">100% سداد مباشر بحسابات القروض</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">عمولات مخلصة المحصلة (1.5%)</span>
                <span className="text-2xl font-black text-brand-green mt-1 block">276,750 ج.م</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">متوسط عمولة 9,500 ج.م / صفقة</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">نسبة نجاح التخارج ومنع التعثر</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">94.8%</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">خلال أقل من 14 يوم عمل</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">مؤشر الامتثال وانعدام الاحتجاز</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">100%</span>
                <span className="text-[10px] text-brand-green font-bold mt-0.5 block">Zero-Custody Certified</span>
              </div>
            </div>

            {/* Zero Custody & Regulatory Audit Console */}
            <div className="bg-slate-900 text-white rounded-3xl p-7 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-green" />
                  <h3 className="font-extrabold text-base">
                    سجل الرقابة المالية والامتثال التنظيمي (Financial Compliance Log)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  متوافق مع لوائح البنك المركزي والرقابة المالية 2026
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-brand-green block">1. بروتوكول عدم حيازة الأموال:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    كافة مبالغ تسوية البنوك تودع بحسابات القروض مباشرة من المشتري، والمنصة لا تملك أي حساب وسيط أو محفظة ائتمانية.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-brand-green block">2. تجنب التوكيلات العامة المفتوحة:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    منع استخدام التوكيلات العرفية غير المشروطة وتطبيق عقود بيع نهائية مسجلة بالشهر العقاري فور استلام مخالصة البنك.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-bold text-brand-green block">3. حماية البيانات وسرية الأطراف:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    حجب أرقام تواصل البائعين عن الجمهور، وتعتيم أرقام الشاسيه والبطاقات القومية وفقاً لقانون حماية البيانات رقم 151 لسنة 2020.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Allocation Table */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
              <h3 className="font-extrabold text-base text-brand-navy">
                توزيع ملفات التخارج على مستشاري المنصة:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MOCK_EMPLOYEES.map(emp => (
                  <div key={emp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brand-navy text-sm">{emp.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-[10px] text-brand-green">
                        {emp.role === 'owner' ? 'المدير العام' : emp.role === 'legal_officer' ? 'شؤون قانونية' : 'مسؤول حالات'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1">
                      <span>الملفات المسندة:</span>
                      <strong className="text-brand-navy">{emp.assignedCasesCount} ملفات</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 1: CALL LOGGER & INTERACTION RECORDER                    */}
        {/* ============================================================== */}
        {showCallModal && callTargetCase && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-elevated border border-slate-100 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-brand-green" />
                  <h3 className="font-extrabold text-base text-brand-navy">
                    تسجيل مكالمة / تحديث متابعة ({callTargetCase.caseReference})
                  </h3>
                </div>
                <button
                  onClick={() => setShowCallModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCallLog} className="space-y-3.5 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">الطرف المتصل به:</label>
                    <select
                      value={callParty}
                      onChange={(e) => setCallParty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                    >
                      <option value="seller">البائع ({callTargetCase.seller.name})</option>
                      <option value="buyer">المشتري المهتم</option>
                      <option value="lender">مسؤول الائتمان بالبنك</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">نوع الاتصال:</label>
                    <select
                      value={callType}
                      onChange={(e) => setCallType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                    >
                      <option value="phone_call">مكالمة هاتفية</option>
                      <option value="whatsapp">محادثة واتساب</option>
                      <option value="meeting">اجتماع بفرع البنك</option>
                      <option value="inspection">معاينة فنية ميدانية</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">نتيجة الاتصال والموقف:</label>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50"
                  >
                    <option value="answered_agreed">تم الرد والاتفاق على الخطوة القادمة</option>
                    <option value="in_negotiation">قيد التفاوض على السعر</option>
                    <option value="no_answer">لم يرد / الهاتف مغلق</option>
                    <option value="needs_time">طلب مهلة للتفكير أو تدبير المبلغ</option>
                    <option value="documents_pending">بانتظار استخراج خطاب السداد المعجل</option>
                    <option value="bank_appointment_set">تم تحديد موعد الإيداع بفرع البنك</option>
                    <option value="deal_closed">تم إتمام الإيداع والتوثيق بنجاح</option>
                    <option value="refused_valuation">رفض التقييم السعري المقترح</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">تاريخ المتابعة القادم (Next Follow-up):</label>
                  <input
                    type="date"
                    value={callFollowUpDate}
                    onChange={(e) => setCallFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-brand-navy"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ملاحظات المكالمة الداخلية (Internal Notes):</label>
                  <textarea
                    rows={3}
                    required
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="اكتب ملخص ما تم في الاتصال بالتفصيل..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs shadow-md transition"
                  >
                    حفظ السجل وتحديث الملف
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCallModal(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: CASE DETAIL & LIFECYCLE STATUS MANAGER                */}
        {/* ============================================================== */}
        {activeManagingCase && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-elevated border border-slate-100 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                    <span>إدارة ملف التخارج:</span>
                    <span className="font-mono text-brand-green">{activeManagingCase.caseReference}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeManagingCase.vehicle.make} {activeManagingCase.vehicle.model} • البائع: {activeManagingCase.seller.name}
                  </p>
                </div>
                <button
                  onClick={() => setActiveManagingCase(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Status Update Dropdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="font-extrabold text-xs text-brand-navy block">
                  تحديث مرحلة دورة الحياة (25 Lifecycle Statuses):
                </label>
                <select
                  value={activeManagingCase.status}
                  onChange={(e) => handleUpdateStatus(activeManagingCase.caseReference, e.target.value as CaseLifecycleStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {Object.entries(LIFECYCLE_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.labelAr}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  * يتم تسجيل كل تغيير في سجل التدقيق والمطابقة وتحديث حساب المالك تلقائياً.
                </p>
              </div>

              {/* Call History & Audit Trail */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-brand-navy flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-green" />
                    <span>سجل الاتصالات والمتابعات ({activeManagingCase.callLogs?.length || 0}):</span>
                  </h4>
                  <button
                    onClick={() => {
                      setCallTargetCase(activeManagingCase);
                      setShowCallModal(true);
                    }}
                    className="text-[11px] font-bold text-brand-green hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>تسجيل اتصال جديد</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeManagingCase.callLogs && activeManagingCase.callLogs.length > 0 ? (
                    activeManagingCase.callLogs.map(log => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-navy">{log.employeeName} ({log.createdAt})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-600">
                            {log.party === 'seller' ? 'البائع' : 'المشتري'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{log.notes}</p>
                        {log.followUpDate && (
                          <span className="text-[10px] text-brand-green font-bold block">
                            المتابعة القادمة: {log.followUpDate}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                      لا توجد مكالمات مسجلة حتى الآن لهذا الملف.
                    </div>
                  )}
                </div>
              </div>

              {/* Inquiries Connected to this case */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold text-xs text-brand-navy">
                  طلبات المشترين المرتبطة ({activeManagingCase.buyerInquiries?.length || 0}):
                </h4>
                {activeManagingCase.buyerInquiries && activeManagingCase.buyerInquiries.length > 0 ? (
                  <div className="space-y-2">
                    {activeManagingCase.buyerInquiries.map(inq => (
                      <div key={inq.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-brand-navy block">{inq.buyerName} ({inq.buyerPhone})</span>
                          <span className="text-[11px] text-slate-500">العرض: {formatEGP(inq.offeredPrice || 0)}</span>
                        </div>
                        <a
                          href={`https://wa.me/20${inq.buyerPhone}?text=${encodeURIComponent(`مرحباً أستاذ ${inq.buyerName}، من فريق منصة مخلصة بخصوص اهتمامك بسيارة ${activeManagingCase.vehicle.make}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-brand-green text-white font-bold text-[11px] hover:bg-brand-green-hover transition"
                        >
                          واتساب
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">لم تصل طلبات شراء جديدة لهذه الحالة بعد.</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveManagingCase(null)}
                  className="px-5 py-2.5 rounded-xl bg-brand-navy text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardsPage;