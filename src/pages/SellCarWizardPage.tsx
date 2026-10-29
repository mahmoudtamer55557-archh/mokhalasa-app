import React, { useState, useCallback } from 'react';
import { 
  Car, ListingVehicleStatus, VehicleLocation, 
  RequiredDocumentMetadata, PhotoSlotItem, 
  DistressReason, UrgencyLevel, OwnerRelationship, DistressedVehicleCase,
  CustomerUser, SaleType
} from '../types';
import { COMPREHENSIVE_BANK_DATABASE } from '../data/bankDatabase';
import { getDocumentsForStatus } from '../data/documentChecklistData';
import { VEHICLE_MAKES, getModelsByMake } from '../data/vehicleCatalog';
import { computeVehicleValuation } from '../utils/valuationEngine';
import { calculateItemizedSettlement } from '../utils/settlementCalculator';
import VehicleMakeModelPicker from '../components/sell/VehicleMakeModelPicker';
import LocationPicker from '../components/sell/LocationPicker';
import DocumentChecklist from '../components/sell/DocumentChecklist';
import VehiclePhotoUploader from '../components/sell/VehiclePhotoUploader';
import { listingService } from '../services/listingService';
import { profileService } from '../services/profileService';
import { geminiService } from '../services/geminiService';
import { isValidEgyptianPhone, getPhoneValidationError } from '../utils/phoneValidator';
import { 
  CheckCircle2, ArrowRight, ArrowLeft, Banknote, 
  AlertCircle, FileText, Sparkles, Car as CarIcon, 
  PhoneCall, Check, Lock, Send, 
  Clock, MessageSquare, Key, AlertTriangle, ShieldCheck, X, Phone
} from 'lucide-react';

interface SellCarWizardPageProps {
  customerUser?: CustomerUser | null;
  onListingCreated: (newCar: Car, newCase?: DistressedVehicleCase) => void;
  onNavigate: (view: string) => void;
  onRequirePhoneCompletion?: () => void;
  editingCase?: DistressedVehicleCase | null;
  onFinishEdit?: () => void;
  resumeDraft?: boolean;
  lang?: 'ar' | 'en';
}

export const NO_ISSUES_OPTION = 'لا توجد أي مشاكل أو ملاحظات (حالة ممتازة وخالية من الأعطال)';

const COMMON_ISSUES_OPTIONS = [
  'أعطال ميكانيكية أو صوت في الموتور',
  'مشاكل أو تفويت أو نتعة في الفتيس',
  'خبطات سابقة أو لحامات بالشاسيه أو القوايم',
  'رش خارجي نظافة أو تغيير رفارف/إكصدامات',
  'مشاكل في التكييف أو أعطال بالكهرباء',
  'كاوتش متهالك أو عفشة تحتاج تربيط وصيانة',
  'رخصة التسيير منتهية أو قاربت على الانتهاء',
  'شروخ بالزجاج الأمامي أو ملاحظات بالصالون'
];

export const SellCarWizardPage: React.FC<SellCarWizardPageProps> = ({
  customerUser,
  onListingCreated,
  onNavigate,
  onRequirePhoneCompletion,
  editingCase,
  onFinishEdit,
  resumeDraft,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';

  // Step state: 1 to 7, plus 8 for confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastErrorTarget, setLastErrorTarget] = useState<{ key: string; domId: string; step?: number } | null>(null);

  const clearFieldError = useCallback((fieldKey: string) => {
    setFieldErrors(prev => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setValidationError(null);
  }, []);

  const reportMissingField = useCallback((fieldKey: string, domId: string, errorMsg: string, targetStep?: number) => {
    setValidationError(errorMsg);
    setFieldErrors({ [fieldKey]: errorMsg });
    setLastErrorTarget({ key: fieldKey, domId, step: targetStep });

    if (targetStep && currentStep !== targetStep) {
      setCurrentStep(targetStep);
    }

    // Smooth scroll and focus after render/step transition
    setTimeout(() => {
      const el = document.getElementById(domId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof (el as HTMLElement).focus === 'function') {
          (el as HTMLElement).focus();
        }
        // Visual attention ring
        el.classList.add('ring-4', 'ring-red-500/40');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-red-500/40');
        }, 2200);
      }
    }, 150);
  }, [currentStep]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdCaseReference, setCreatedCaseReference] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [createdAccessKey, setCreatedAccessKey] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [showIneligibleModal, setShowIneligibleModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpChallengeCode, setOtpChallengeCode] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [otpFeedback, setOtpFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(Boolean(customerUser?.isVerified || customerUser?.phone));

  // AI Ad Writing Assistant States
  const [isGeneratingAiDesc, setIsGeneratingAiDesc] = useState(false);
  const [aiFeedbackMsg, setAiFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PRIMARY SALE TRACK: 'direct_installment' | 'cash' | 'bank_settlement'
  const [saleType, setSaleType] = useState<SaleType>('direct_installment');

  // DIRECT INSTALLMENT SPECIFIC STATES
  const [directDownPayment, setDirectDownPayment] = useState<number>(150000);
  const [directMonthlyInstallment, setDirectMonthlyInstallment] = useState<number>(7500);
  const [directInstallmentMonths, setDirectInstallmentMonths] = useState<number>(36);
  const [directGuarantees, setDirectGuarantees] = useState<string[]>([
    'شيكات بنكية موقعة',
    'إيصالات أمانة',
    'حظر بيع بالرخصة (عرفي)'
  ]);
  const [directSellerType, setDirectSellerType] = useState<'showroom' | 'individual'>('showroom');

  // STEP 1: Financing Eligibility & Distress Cause
  const [distressReason, setDistressReason] = useState<DistressReason>('installment_burden');
  const [urgency, setUrgency] = useState<UrgencyLevel>('very_urgent');
  const [vehicleStatus, setVehicleStatus] = useState<ListingVehicleStatus>('direct_installment');
  const [ownerRelationship, setOwnerRelationship] = useState<OwnerRelationship>('direct_owner');
  const [hasContactedLender, setHasContactedLender] = useState<boolean | 'not_sure'>(true);
  const [hasOfficialQuote, setHasOfficialQuote] = useState<boolean | 'not_sure'>('not_sure');

  // STEP 2: Vehicle Specs, Condition & Honest Disclosures (Initialized clean without demo defaults)
  const [selectedMakeId, setSelectedMakeId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTrim, setSelectedTrim] = useState('');
  const [isCustomTrim, setIsCustomTrim] = useState(false);
  const [customTrimText, setCustomTrimText] = useState('');
  const [transmission, setTransmission] = useState<'أوتوماتيك' | 'مانيوال' | 'CVT' | 'ثنائي التعشيق (Dual Clutch)'>('أوتوماتيك');
  const [fuelType, setFuelType] = useState<'بنزين' | 'هايبرد (هجين)' | 'كهرباء بالكامل (EV)' | 'غاز طبيعي' | 'ديزل'>('بنزين');
  const [engineSize, setEngineSize] = useState('');
  const [mileage, setMileage] = useState(0);
  const [color, setColor] = useState('');
  const [paintCondition, setPaintCondition] = useState<'فابريكا بالكامل' | 'رش رفرفين نظافة' | 'رش إكصدامات فقط' | 'رش خارجي نظافة' | 'أخرى'>('فابريكا بالكامل');
  const [chassisVin, setChassisVin] = useState('');
  const [trafficUnit, setTrafficUnit] = useState('');
  const [sellerType, setSellerType] = useState<'مالك أول' | 'مالك ثانٍ' | 'توكيل'>('مالك أول');
  const [licenseValidityMonths, setLicenseValidityMonths] = useState<number>(12);

  // Arabic condition story description (reviewed & edited by user, or AI generated)
  const [sellerConditionStory, setSellerConditionStory] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([NO_ISSUES_OPTION]);

  // STEP 3: Financing Details
  const [bankKey, setBankKey] = useState('credit_agricole');
  const [outstandingPrincipal, setOutstandingPrincipal] = useState(0);
  const [monthlyInstallment, setMonthlyInstallment] = useState(0);
  const [remainingMonths, setRemainingMonths] = useState(0);
  const [hasArrears, setHasArrears] = useState(false);
  const [arrearsAmount, setArrearsAmount] = useState(0);
  const [sellerExpectedPrice, setSellerExpectedPrice] = useState<number>(0);

  // STEP 4: Photos (Minimum 4 required - starting clean with 0 uploads)
  const [photoSlots, setPhotoSlots] = useState<PhotoSlotItem[]>([
    {
      id: 'slot-front',
      slotType: 'front',
      labelAr: 'الواجهة الأمامية',
      labelEn: 'Front Exterior',
      descriptionAr: 'صورة أفقية لكامل مقدمة السيارة والشبكة والإكصدام',
      isRequired: true
    },
    {
      id: 'slot-rear',
      slotType: 'rear',
      labelAr: 'الواجهة الخلفية',
      labelEn: 'Rear Exterior',
      descriptionAr: 'صورة تظهر الشنطة والفوانيس الخلفية ولوحة السيارة',
      isRequired: true
    },
    {
      id: 'slot-right',
      slotType: 'right',
      labelAr: 'الجانب الأيمن',
      labelEn: 'Right Side',
      descriptionAr: 'صورة طولية لكامل الجانب الأيمن والجنوط والأبواب',
      isRequired: true
    },
    {
      id: 'slot-left',
      slotType: 'left',
      labelAr: 'الجانب الأيسر',
      labelEn: 'Left Side',
      descriptionAr: 'صورة طولية لكامل الجانب الأيسر وجانب السائق',
      isRequired: true
    },
    {
      id: 'slot-interior',
      slotType: 'interior',
      labelAr: 'الصالون وتابلوه القيادة',
      labelEn: 'Interior & Dashboard',
      descriptionAr: 'صورة من مقعد السائق توضح الشاشة والفرش وحالة الصالون',
      isRequired: true
    },
    {
      id: 'slot-odometer',
      slotType: 'odometer',
      labelAr: 'عداد الكيلومترات بوضوح',
      labelEn: 'Odometer Reading',
      descriptionAr: 'صورة للعداد والكونتاكت مفتوح لإثبات قراءة الكيلومترات',
      isRequired: true
    }
  ]);

  // STEP 5: Documents (INITIAL UPLOADS ARE OPTIONAL AS REQUIRED BY PROMPT!)
  const [documents, setDocuments] = useState<RequiredDocumentMetadata[]>(() =>
    getDocumentsForStatus('bank_loan').map(d => ({ ...d, isRequired: false })) // Initial upload optional!
  );

  // STEP 6: Location & Contact
  const [location, setLocation] = useState<VehicleLocation>({
    governorate: customerUser?.governorate || 'القاهرة',
    city: customerUser?.city || 'التجمع الخامس (القاهرة الجديدة)',
    latitude: 30.0131,
    longitude: 31.4328,
    isGpsLocated: true,
    displayAddress: `${customerUser?.governorate || 'القاهرة'} - ${customerUser?.city || 'التجمع الخامس (القاهرة الجديدة)'}`
  });
  const [sellerName, setSellerName] = useState(customerUser?.name || '');
  const [sellerPhone, setSellerPhone] = useState(customerUser?.phone || '');
  const [preferredContactTime, setPreferredContactTime] = useState('مساءً (من 5 إلى 9 مساءً)');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Sync seller info when customerUser logs in or changes (React pattern: adjust state during render)
  const [prevCustomerUserId, setPrevCustomerUserId] = useState(customerUser?.id);
  if (customerUser && customerUser.id !== prevCustomerUserId) {
    setPrevCustomerUserId(customerUser.id);
    if (customerUser.name && customerUser.name !== 'عميل مخلصة') {
      setSellerName(customerUser.name);
    }
    if (customerUser.phone) {
      setSellerPhone(customerUser.phone);
      setIsPhoneVerified(true);
    } else if (customerUser.isVerified) {
      setIsPhoneVerified(true);
    }
    if (customerUser.governorate) {
      setLocation(prev => ({
        ...prev,
        governorate: customerUser.governorate!,
        city: customerUser.city || prev.city,
        displayAddress: `${customerUser.governorate} - ${customerUser.city || prev.city}`
      }));
    }
  }

  // Effect 1: Pre-populate when entering in Edit Mode for an existing case
  React.useEffect(() => {
    if (editingCase) {
      const v = editingCase.vehicle;
      const f = editingCase.financing;
      const s = editingCase.seller;

      // Find make and model in catalog
      const foundMake = VEHICLE_MAKES.find(
        m => m.nameAr.toLowerCase() === v.make.toLowerCase() || m.nameEn.toLowerCase() === v.make.toLowerCase()
      );
      if (foundMake) {
        setSelectedMakeId(foundMake.id);
        const models = getModelsByMake(foundMake.id);
        const foundModel = models.find(
          md => md.nameAr.toLowerCase() === v.model.toLowerCase() || md.nameEn.toLowerCase() === v.model.toLowerCase() || v.model.toLowerCase().includes(md.id)
        );
        if (foundModel) setSelectedModelId(foundModel.id);
      }

      setSelectedYear(v.year || null);
      setSelectedTrim(v.trim || '');
      setTransmission(v.transmission || 'أوتوماتيك');
      if (v.fuelType) setFuelType(v.fuelType as any);
      setEngineSize(v.engineSize || '');
      setMileage(v.mileage || 0);
      setColor(v.color || '');
      setPaintCondition((v.inspection?.paintCondition as any) || 'فابريكا بالكامل');
      setTrafficUnit(v.trafficDepartment || '');
      setSellerType((v.sellerType as any) || 'مالك أول');
      setLicenseValidityMonths(v.licenseValidityMonths || 12);
      setSellerConditionStory(editingCase.sellerConditionStory || v.description || '');
      if (editingCase.disclosedIssues && editingCase.disclosedIssues.length > 0) {
        setSelectedIssues(editingCase.disclosedIssues);
      }

      setVehicleStatus(editingCase.vehicle.vehicleStatus || 'bank_loan');
      setDistressReason(editingCase.distressReason || 'installment_burden');
      setUrgency(editingCase.urgency || 'urgent');
      setOwnerRelationship(s.relationship || 'direct_owner');

      if (f.institutionKey) setBankKey(f.institutionKey);
      setOutstandingPrincipal(f.estimatedOutstandingPrincipal || f.outstandingPrincipal || 0);
      setMonthlyInstallment(f.monthlyInstallment || 0);
      setRemainingMonths(f.remainingMonths || 0);
      setHasArrears(Boolean(f.arrearsAmount && f.arrearsAmount > 0));
      setArrearsAmount(f.arrearsAmount || 0);
      setSellerExpectedPrice(v.askingPrice || 0);

      if (v.images && v.images.length > 0) {
        setPhotoSlots(prev => prev.map((slot, i) => ({
          ...slot,
          previewUrl: v.images[i] || slot.previewUrl
        })));
      }

      if (s.name) setSellerName(s.name);
      if (s.phone) setSellerPhone(s.phone);
      if (s.preferredContactTime) setPreferredContactTime(s.preferredContactTime);
      if (s.governorate) {
        setLocation({
          governorate: s.governorate,
          city: s.city || '',
          latitude: 30.0131,
          longitude: 31.4328,
          isGpsLocated: true,
          displayAddress: `${s.governorate} - ${s.city || ''}`
        });
      }

      if (editingCase.documents && editingCase.documents.length > 0) {
        setDocuments(editingCase.documents);
      }
    }
  }, [editingCase]);

  // Effect 2: Load Draft if resuming or if draft exists and not in edit mode
  React.useEffect(() => {
    if (!editingCase) {
      try {
        const savedDraft = localStorage.getItem('mokhalasa_wizard_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (resumeDraft || parsed.currentStep > 1 || parsed.selectedMakeId) {
            if (parsed.currentStep) setCurrentStep(Math.min(parsed.currentStep, 7));
            if (parsed.selectedMakeId) setSelectedMakeId(parsed.selectedMakeId);
            if (parsed.selectedModelId) setSelectedModelId(parsed.selectedModelId);
            if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
            if (parsed.selectedTrim) setSelectedTrim(parsed.selectedTrim);
            if (parsed.mileage) setMileage(parsed.mileage);
            if (parsed.color) setColor(parsed.color);
            if (parsed.trafficUnit) setTrafficUnit(parsed.trafficUnit);
            if (parsed.sellerConditionStory) setSellerConditionStory(parsed.sellerConditionStory);
            if (parsed.selectedIssues) setSelectedIssues(parsed.selectedIssues);
            if (parsed.distressReason) setDistressReason(parsed.distressReason);
            if (parsed.urgency) setUrgency(parsed.urgency);
            if (parsed.vehicleStatus) setVehicleStatus(parsed.vehicleStatus);
            if (parsed.ownerRelationship) setOwnerRelationship(parsed.ownerRelationship);
            if (parsed.bankKey) setBankKey(parsed.bankKey);
            if (parsed.outstandingPrincipal) setOutstandingPrincipal(parsed.outstandingPrincipal);
            if (parsed.monthlyInstallment) setMonthlyInstallment(parsed.monthlyInstallment);
            if (parsed.remainingMonths) setRemainingMonths(parsed.remainingMonths);
            if (parsed.hasArrears !== undefined) setHasArrears(parsed.hasArrears);
            if (parsed.arrearsAmount) setArrearsAmount(parsed.arrearsAmount);
            if (parsed.sellerExpectedPrice) setSellerExpectedPrice(parsed.sellerExpectedPrice);
            if (parsed.sellerName) setSellerName(parsed.sellerName);
            if (parsed.sellerPhone) setSellerPhone(parsed.sellerPhone);
            if (parsed.location) setLocation(parsed.location);
          }
        }
      } catch {}
    }
  }, [editingCase, resumeDraft]);

  // Effect 3: Auto-save Incomplete Draft to LocalStorage whenever seller makes progress
  React.useEffect(() => {
    if (!editingCase && (selectedMakeId || currentStep > 1 || outstandingPrincipal > 0)) {
      try {
        const draftPayload = {
          currentStep,
          selectedMakeId,
          selectedModelId,
          selectedYear,
          selectedTrim,
          transmission,
          fuelType,
          engineSize,
          mileage,
          color,
          paintCondition,
          chassisVin,
          trafficUnit,
          sellerType,
          licenseValidityMonths,
          sellerConditionStory,
          selectedIssues,
          distressReason,
          urgency,
          vehicleStatus,
          ownerRelationship,
          bankKey,
          outstandingPrincipal,
          monthlyInstallment,
          remainingMonths,
          hasArrears,
          arrearsAmount,
          sellerExpectedPrice,
          sellerName,
          sellerPhone,
          preferredContactTime,
          location,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('mokhalasa_wizard_draft', JSON.stringify(draftPayload));
      } catch {}
    }
  }, [
    editingCase, currentStep, selectedMakeId, selectedModelId, selectedYear,
    selectedTrim, transmission, fuelType, engineSize, mileage, color,
    paintCondition, chassisVin, trafficUnit, sellerType, licenseValidityMonths,
    sellerConditionStory, selectedIssues, distressReason, urgency,
    vehicleStatus, ownerRelationship, bankKey, outstandingPrincipal,
    monthlyInstallment, remainingMonths, hasArrears, arrearsAmount,
    sellerExpectedPrice, sellerName, sellerPhone, preferredContactTime, location
  ]);

  // Valuation calculation on demand
  const valuation = computeVehicleValuation({
    make: selectedMakeId === 'nissan' ? 'Nissan' : selectedMakeId === 'hyundai' ? 'Hyundai' : selectedMakeId === 'chery' ? 'Chery' : selectedMakeId || 'عام',
    model: selectedModelId.includes('sunny') ? 'Sunny' : selectedModelId.includes('elantra') ? 'Elantra CN7' : selectedModelId.includes('tiggo') ? 'Tiggo 7' : selectedModelId || 'عام',
    year: selectedYear || 2024,
    trim: isCustomTrim ? customTrimText : selectedTrim,
    mileage,
    paintCondition,
    disclosedProblems: selectedIssues.filter(i => i !== NO_ISSUES_OPTION),
    outstandingDebt: outstandingPrincipal,
    urgency
  });

  const selectedBank = COMPREHENSIVE_BANK_DATABASE[bankKey] || COMPREHENSIVE_BANK_DATABASE['credit_agricole'];
  const earlySettlementFee = Math.round(outstandingPrincipal * selectedBank.earlySettlementRate);

  const settlementStatement = calculateItemizedSettlement({
    grossSalePrice: sellerExpectedPrice || valuation.suggestedAskingPrice,
    lenderSettlementAmount: outstandingPrincipal,
    lenderSettlementSource: selectedBank.bankNameAr,
    earlySettlementFee,
    releaseLetterFee: selectedBank.releaseLetterFee + selectedBank.trafficLetterFee,
    trafficAndGovFees: 800,
    inspectionFee: 1200
  });

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  // Toggle issue checkbox with mutual exclusivity for "لا توجد مشاكل"
  const toggleIssue = (issue: string) => {
    if (issue === NO_ISSUES_OPTION) {
      setSelectedIssues([NO_ISSUES_OPTION]);
      return;
    }
    setSelectedIssues(prev => {
      const withoutClean = prev.filter(i => i !== NO_ISSUES_OPTION);
      if (withoutClean.includes(issue)) {
        const next = withoutClean.filter(i => i !== issue);
        return next.length === 0 ? [NO_ISSUES_OPTION] : next;
      } else {
        return [...withoutClean, issue];
      }
    });
  };

  // Status & Track Change Handler
  const handleStatusChange = (status: ListingVehicleStatus) => {
    if (status === 'fully_owned' || status === 'cash_only') {
      setSaleType('cash');
      setVehicleStatus('fully_owned');
      setDocuments(getDocumentsForStatus('fully_owned').map(d => ({ ...d, isRequired: false })));
      return;
    }
    if (status === 'direct_installment') {
      setSaleType('direct_installment');
      setVehicleStatus('direct_installment');
      setDocuments(getDocumentsForStatus('fully_owned').map(d => ({ ...d, isRequired: false })));
      return;
    }
    setSaleType('bank_settlement');
    setVehicleStatus(status);
    setDocuments(getDocumentsForStatus(status).map(d => ({ ...d, isRequired: false })));
  };

  // Validation with automatic jump, scroll, focus, and red highlight
  const validateStep = (step: number): boolean => {
    setValidationError(null);

    if (step === 1) {
      // Step 1: All tracks are eligible
      return true;
    }

    if (step === 2) {
      if (!selectedMakeId) {
        reportMissingField('make', 'field-make-trigger', 'يرجى اختيار ماركة السيارة (الشركة المصنعة).', 2);
        return false;
      }
      if (!selectedModelId) {
        reportMissingField('model', 'field-model-trigger', 'يرجى اختيار موديل السيارة (الطراز).', 2);
        return false;
      }
      if (!selectedYear) {
        reportMissingField('year', 'field-year', 'يرجى اختيار سنة الصنع (الموديل من 2018 فما بعد).', 2);
        return false;
      }
      if (isCustomTrim && !customTrimText.trim()) {
        reportMissingField('customTrim', 'field-customTrim', 'يرجى كتابة اسم الفئة وتجهيزها المدون بالرخصة.', 2);
        return false;
      }
      if (!mileage || mileage <= 0) {
        reportMissingField('mileage', 'field-mileage', 'يرجى إدخال قراءة العداد الحالية للسيارة بالكيلومتر.', 2);
        return false;
      }
      if (!trafficUnit.trim()) {
        reportMissingField('trafficUnit', 'field-trafficUnit', 'يرجى كتابة أو اختيار وحدة المرور التابع لها الترخيص (حقل إجباري).', 2);
        return false;
      }
      if (!sellerConditionStory.trim() || sellerConditionStory.trim().length < 20) {
        reportMissingField('conditionStory', 'field-conditionStory', 'يرجى كتابة وصف تفصيلي لحالة السيارة وأي ملاحظات تود مشاركتها (20 حرفاً على الأقل).', 2);
        return false;
      }
    }

    if (step === 3) {
      if (saleType === 'cash') {
        if (!sellerExpectedPrice || sellerExpectedPrice <= 0) {
          reportMissingField('cashPrice', 'field-cashPrice', 'يرجى تحديد السعر المطلوب للبيع كاش.', 3);
          return false;
        }
      } else if (saleType === 'direct_installment') {
        if (!sellerExpectedPrice || sellerExpectedPrice <= 0) {
          reportMissingField('installmentTotal', 'field-installmentTotal', 'يرجى تحديد إجمالي سعر السيارة بالتقسيط.', 3);
          return false;
        }
        if (!directDownPayment || directDownPayment <= 0) {
          reportMissingField('downPayment', 'field-downPayment', 'يرجى إدخال أقل قيمة للمقدم المطلوب بالتقسيط.', 3);
          return false;
        }
        if (!directMonthlyInstallment || directMonthlyInstallment <= 0) {
          reportMissingField('monthlyInstallment', 'field-monthlyInstallment', 'يرجى إدخال قيمة القسط الشهري بالتقسيط المباشر.', 3);
          return false;
        }
      } else {
        if (vehicleStatus === 'bank_loan' || vehicleStatus === 'consumer_finance') {
          if (!outstandingPrincipal || outstandingPrincipal <= 0) {
            reportMissingField('outstandingPrincipal', 'field-outstandingPrincipal', 'يرجى إدخال أصل الدين المتبقي التقريبي.', 3);
            return false;
          }
        }
      }
    }

    if (step === 4) {
      const uploadedPhotosCount = photoSlots.filter((p) => !!p.previewUrl).length;
      if (uploadedPhotosCount < 4) {
        reportMissingField('photos', 'field-photosSection', `يلزم رفع 4 صور رئيسية على الأقل للسيارة للمراجعة. (تم رفع ${uploadedPhotosCount} فقط).`, 4);
        return false;
      }
    }

    if (step === 6) {
      if (!sellerName.trim()) {
        reportMissingField('sellerName', 'field-sellerName', 'يرجى إدخال اسمك بالكامل.', 6);
        return false;
      }
      if (!sellerPhone.trim() || !/^01[0125][0-9]{8}$/.test(sellerPhone.trim())) {
        reportMissingField('sellerPhone', 'field-sellerPhone', 'يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقماً يبدأ بـ 01).', 6);
        return false;
      }
    }

    if (step === 7) {
      if (!agreedToTerms) {
        reportMissingField('agreedToTerms', 'field-agreedToTerms', 'يرجى الموافقة على شروط المراجعة والإقرار بصحة البيانات المدخلة.', 7);
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // OTP Countdown Timer (Priority 7 Requirement)
  React.useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  const handleOpenPhoneOtpModal = useCallback(async () => {
    setShowPhoneOtpModal(true);
    setOtpFeedback(null);
    setOtpLoading(true);
    const targetPhone = sellerPhone || customerUser?.phone || '';
    const res = await profileService.requestPhoneOtp(targetPhone);
    setOtpLoading(false);
    if (res.success && res.challengeCode) {
      setOtpChallengeCode(res.challengeCode);
      setOtpCountdown(180);
      setOtpFeedback({
        type: 'info',
        text: `تم إنشاء رمز التحقق التجريبي: ${res.challengeCode} (صالح لمدة 3 دقائق)`
      });
    }
  }, [sellerPhone, customerUser]);

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUser) return;
    if (otpInput.trim().length !== 6) {
      setOtpFeedback({ type: 'error', text: 'يرجى إدخال رمز التحقق المكون من 6 أرقام.' });
      return;
    }

    setOtpLoading(true);
    setOtpFeedback(null);
    const targetPhone = sellerPhone || customerUser.phone || '';
    const res = await profileService.verifyPhoneOtp(customerUser.id, targetPhone, otpInput.trim());
    setOtpLoading(false);

    if (res.success) {
      setIsPhoneVerified(true);
      setOtpFeedback({ type: 'success', text: 'تم توثيق وتأكيد رقم هاتفك بنجاح!' });
      setTimeout(() => {
        setShowPhoneOtpModal(false);
        setOtpInput('');
        setOtpChallengeCode(null);
      }, 1200);
    } else {
      setOtpFeedback({ type: 'error', text: res.message });
    }
  };

  // Feature 1: AI Car Ad Writing Assistant
  const handleGenerateAiDescription = async () => {
    setIsGeneratingAiDesc(true);
    setAiFeedbackMsg(null);

    const selectedMakeObj = VEHICLE_MAKES.find((m) => m.id === selectedMakeId);
    const selectedModelObj = getModelsByMake(selectedMakeId).find((m) => m.id === selectedModelId);

    const res = await geminiService.generateCarDescription({
      make: selectedMakeObj ? selectedMakeObj.nameAr : 'سيارة',
      model: selectedModelObj ? selectedModelObj.nameAr : '',
      year: selectedYear || 2023,
      trim: isCustomTrim ? customTrimText : selectedTrim,
      mileage,
      paintCondition,
      disclosedDefects: selectedIssues.filter(i => i !== NO_ISSUES_OPTION),
      askingPrice: sellerExpectedPrice || valuation.suggestedAskingPrice,
      trafficUnit
    });

    setIsGeneratingAiDesc(false);
    if (res.success && res.description) {
      setSellerConditionStory(res.description);
      clearFieldError('conditionStory');
      setAiFeedbackMsg({
        type: 'success',
        text: 'تمت صياغة وصف الإعلان بنجاح بواسطة الذكاء الاصطناعي! يمكنك مراجعته وتعديل أي تفاصيل بحرية قبل المتابعة.'
      });
    } else {
      setAiFeedbackMsg({
        type: 'error',
        text: res.message || 'تعذر توليد الوصف آلياً. يرجى كتابة وصف حالتك يدوياً.'
      });
    }
  };

  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;

    // Cross-step validation to guarantee no mandatory text bars are missing anywhere
    if (!validateStep(2)) return;
    if (!validateStep(3)) return;
    if (!validateStep(4)) return;
    if (!validateStep(6)) return;

    if (!agreedToTerms) {
      reportMissingField('agreedToTerms', 'field-agreedToTerms', 'يرجى الموافقة على شروط المراجعة والإقرار بصحة البيانات المدخلة.', 7);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const selectedMakeObj = VEHICLE_MAKES.find((m) => m.id === selectedMakeId);
    const selectedModelObj = getModelsByMake(selectedMakeId).find((m) => m.id === selectedModelId);

    // Upload real files to Supabase Storage if user selected local image files
    let uploadedImages: string[] = [];
    try {
      uploadedImages = await Promise.all(
        photoSlots.filter((p) => !!p.previewUrl).map(async (slot) => {
          if (slot.file) {
            try {
              const uploadRes = await listingService.uploadListingImage(slot.file);
              if (uploadRes.success && uploadRes.url) {
                return uploadRes.url;
              }
            } catch {}
          }
          return slot.previewUrl!;
        })
      );
    } catch {
      uploadedImages = photoSlots.filter(p => !!p.previewUrl).map(p => p.previewUrl!);
    }

    const caseRef = `MK-CASE-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newCar: Car = {
      id: `car-${Date.now().toString().slice(-5)}`,
      make: selectedMakeObj ? selectedMakeObj.nameEn : 'Nissan',
      model: selectedModelObj ? selectedModelObj.nameEn : 'Sunny',
      year: selectedYear || 2023,
      trim: isCustomTrim ? customTrimText : selectedTrim,
      transmission,
      engineSize,
      fuelType,
      mileage,
      city: location.displayAddress,
      cityEn: location.governorate,
      locationDetails: location,
      color,
      vinChassisMasked: chassisVin ? `${chassisVin.slice(0, 3)}***${chassisVin.slice(-4)}` : undefined,
      askingPrice: sellerExpectedPrice || valuation.suggestedAskingPrice,
      estimatedMarketValue: valuation.suggestedAskingPrice,
      images: uploadedImages.length > 0 ? uploadedImages : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
      saleType,
      directInstallment: saleType === 'direct_installment' ? {
        downPayment: directDownPayment,
        monthlyInstallment: directMonthlyInstallment,
        installmentMonths: directInstallmentMonths,
        totalInstallmentPrice: sellerExpectedPrice || (directDownPayment + directMonthlyInstallment * directInstallmentMonths),
        requiredGuarantees: directGuarantees,
        sellerType: directSellerType
      } : undefined,
      financingType: (saleType === 'direct_installment' ? 'direct_installment' : (saleType === 'cash' ? 'fully_owned' : vehicleStatus)) as any,
      vehicleStatus: (saleType === 'direct_installment' ? 'direct_installment' : (saleType === 'cash' ? 'cash_only' : vehicleStatus)) as any,
      distressReason,
      urgency,
      disclosedProblems: selectedIssues,
      sellerConditionStory,
      financingDetails: {
        providerName: selectedBank.bankName,
        providerNameAr: selectedBank.bankNameAr,
        financingType: vehicleStatus === 'consumer_finance' ? 'consumer_finance' : 'bank_loan',
        outstandingPrincipal,
        monthlyInstallment,
        remainingMonths,
        arrearsAmount: hasArrears ? arrearsAmount : 0,
        earlySettlementFee,
        releaseFee: selectedBank.releaseLetterFee + selectedBank.trafficLetterFee,
        totalSettlementRequired: outstandingPrincipal + earlySettlementFee + selectedBank.releaseLetterFee,
        hasSaleBan: true,
        sellerNetProceeds: (sellerExpectedPrice || valuation.suggestedAskingPrice) - (outstandingPrincipal + earlySettlementFee),
        hasOfficialStatement: hasOfficialQuote === true,
        hasContactedBank: hasContactedLender === true,
        isEstimateOnly: true
      },
      inspection: {
        isInspected: false,
        score: 0,
        inspectorName: 'بانتظار جدولة الفحص الفني الميداني المعتمد',
        date: new Date().toISOString().split('T')[0],
        engineCondition: 'ممتاز',
        transmissionCondition: 'ممتاز',
        paintCondition,
        chassisStatus: 'سليم 100% بدون أي ملاحظات',
        disclosedDefects: selectedIssues,
        notes: sellerConditionStory
      },
      licenseValidityMonths,
      trafficDepartment: trafficUnit.trim() || 'مرور فيصل',
      sellerType,
      status: 'under_review',
      createdAt: new Date().toISOString().split('T')[0],
      featured: false,
      description: sellerConditionStory
    };

    const generatedAccessKey = `MK-SEC-${Math.floor(100 + Math.random() * 900)}`;

    const newCase: DistressedVehicleCase = {
      caseReference: caseRef,
      accessKey: generatedAccessKey,
      editStatus: 'none',
      pendingEditsCount: 0,
      revisions: [],
      createdAt: new Date().toISOString().split('T')[0],
      status: 'new_request',
      assignedEmployeeId: 'emp-2',
      assignedEmployeeName: 'أحمد الشريف',
      urgency,
      distressReason,
      seller: {
        name: sellerName,
        phone: sellerPhone,
        preferredContactTime,
        governorate: location.governorate,
        city: location.city,
        relationship: ownerRelationship
      },
      vehicle: newCar,
      disclosedIssues: selectedIssues,
      sellerConditionStory,
      financing: {
        institutionKey: bankKey,
        institutionName: selectedBank.bankNameAr,
        productType: 'تمويل سيارات بحظر بيع',
        estimatedOutstandingPrincipal: outstandingPrincipal,
        monthlyInstallment,
        remainingMonths,
        arrearsAmount: hasArrears ? arrearsAmount : 0,
        hasOfficialStatement: hasOfficialQuote === true,
        isVerifiedByStaff: false,
        unverifiedNotice: 'تقدير مبدئي من البائع — يتطلب استعلام سداد معجل رسمي.'
      },
      valuation,
      settlementStatement,
      callLogs: [],
      timeline: [
        {
          id: `tm-${Date.now()}`,
          caseId: caseRef,
          status: 'new_request',
          changedBy: 'بوابة تسجيل الحالات',
          reason: 'تسجيل طلب تخارج من قسط سيارة',
          timestamp: new Date().toLocaleTimeString('ar-EG')
        }
      ],
      buyerInquiries: [],
      internalNotes: [`سبب البيع: ${distressReason}`, `مستوى الاستعجال: ${urgency}`],
      documents: []
    };

    // Require user login so the listing is permanently saved in user's profile
    if (!customerUser) {
      setValidationError('يرجى تسجيل الدخول أو إنشاء حسابك أولاً لحفظ الإعلان في حسابك ومتابعة حالته.');
      setIsSubmitting(false);
      setShowAuthModal(true);
      return;
    }

    const effectivePhone = sellerPhone.trim() || customerUser.phone || '';
    const phoneErr = getPhoneValidationError(effectivePhone);
    if (phoneErr) {
      setValidationError(`رقم الهاتف مطلوب لاعتماد الإعلان: ${phoneErr}`);
      setIsSubmitting(false);
      if (onRequirePhoneCompletion) onRequirePhoneCompletion();
      return;
    }

    // Check if in Edit Mode for an existing case
    if (editingCase) {
      const targetListingId = editingCase.vehicle.id || editingCase.caseReference;
      const updateResult = await listingService.updateFullListingFromWizard(targetListingId, {
        make: selectedMakeObj ? selectedMakeObj.nameAr : (newCar.make || 'نيسان'),
        model: selectedModelObj ? selectedModelObj.nameAr : (newCar.model || 'صني'),
        year: selectedYear || 2024,
        trim: isCustomTrim ? customTrimText : selectedTrim,
        transmission,
        fuel_type: fuelType,
        engine_size: engineSize,
        mileage,
        color,
        governorate: location.governorate,
        city: location.city,
        traffic_unit: trafficUnit.trim() || 'مرور فيصل',
        asking_price: sellerExpectedPrice || valuation.suggestedAskingPrice,
        condition_description: sellerConditionStory,
        paint_condition: paintCondition,
        disclosed_defects: selectedIssues.filter(i => i !== NO_ISSUES_OPTION),
        has_financing: vehicleStatus === 'bank_loan' || vehicleStatus === 'consumer_finance',
        financing_type: vehicleStatus,
        financing_provider: selectedBank.bankNameAr,
        outstanding_amount: outstandingPrincipal,
        monthly_installment: monthlyInstallment,
        images: uploadedImages
      });

      if (!updateResult.success) {
        setValidationError(updateResult.message || 'حدث خطأ أثناء حفظ التعديلات.');
        setIsSubmitting(false);
        return;
      }

      // Update case revisions in client state
      const updatedCase: DistressedVehicleCase = {
        ...editingCase,
        status: 'pending_review',
        editStatus: 'pending_review',
        pendingEditsCount: (editingCase.pendingEditsCount || 0) + 1,
        sellerConditionStory,
        disclosedIssues: selectedIssues,
        seller: {
          ...editingCase.seller,
          preferredContactTime,
          governorate: location.governorate,
          city: location.city
        },
        vehicle: {
          ...editingCase.vehicle,
          ...newCar,
          askingPrice: sellerExpectedPrice || valuation.suggestedAskingPrice,
          mileage,
          images: uploadedImages
        },
        financing: {
          ...editingCase.financing,
          estimatedOutstandingPrincipal: outstandingPrincipal,
          monthlyInstallment,
          remainingMonths
        }
      };

      onListingCreated(updatedCase.vehicle, updatedCase);
      try {
        localStorage.removeItem('mokhalasa_wizard_draft');
      } catch {}
      setIsSubmitting(false);
      alert('✅ تم حفظ كافة تعديلات الإعلان بنجاح وإرسالها لفريق العمليات للاعتماد!');
      if (onFinishEdit) onFinishEdit();
      onNavigate('seller-portal');
      return;
    }

    // Submit to Supabase car_listings table (strictly awaiting database confirmation)
    const submitResult = await listingService.submitListing({
      make: selectedMakeObj ? selectedMakeObj.nameAr : (newCar.make || 'نيسان'),
      model: selectedModelObj ? selectedModelObj.nameAr : (newCar.model || 'صني'),
      year: selectedYear || 2023,
      trim: isCustomTrim ? customTrimText : selectedTrim,
      transmission,
      fuel_type: fuelType,
      engine_size: engineSize,
      mileage,
      color,
      governorate: location.governorate,
      city: location.city,
      traffic_unit: trafficUnit.trim() || 'مرور فيصل',
      asking_price: sellerExpectedPrice || valuation.suggestedAskingPrice,
      condition_description: sellerConditionStory,
      paint_condition: paintCondition,
      disclosed_defects: selectedIssues.filter(i => i !== NO_ISSUES_OPTION),
      sale_type: saleType,
      is_direct_installment: saleType === 'direct_installment',
      down_payment: saleType === 'direct_installment' ? directDownPayment : 0,
      installment_period_months: saleType === 'direct_installment' ? directInstallmentMonths : remainingMonths,
      required_guarantees: saleType === 'direct_installment' ? directGuarantees : [],
      direct_installment_seller_type: directSellerType,
      has_financing: saleType === 'bank_settlement',
      financing_type: saleType === 'direct_installment' ? 'direct_installment' : (saleType === 'cash' ? 'fully_owned' : vehicleStatus),
      financing_provider: saleType === 'bank_settlement' ? selectedBank.bankNameAr : (saleType === 'direct_installment' ? 'تقسيط مباشر بدون بنوك' : 'ملكية خالصة'),
      outstanding_amount: saleType === 'bank_settlement' ? outstandingPrincipal : 0,
      monthly_installment: saleType === 'direct_installment' ? directMonthlyInstallment : (saleType === 'bank_settlement' ? monthlyInstallment : 0),
      remaining_months: saleType === 'direct_installment' ? directInstallmentMonths : remainingMonths,
      seller_name: sellerName,
      seller_phone: sellerPhone,
      images: uploadedImages
    });

    if (!submitResult.success) {
      setValidationError(submitResult.message || 'حدث خطأ أثناء حفظ الإعلان في قاعدة البيانات.');
      setIsSubmitting(false);
      return;
    }

    setCreatedListingId(submitResult.listingId || null);
    onListingCreated(newCar, newCase);

    setCreatedCaseReference(caseRef);
    setCreatedAccessKey(generatedAccessKey);
    // Also save in localStorage for instant seamless portal access
    try {
      localStorage.setItem('mokhalasa_last_case_ref', caseRef);
      localStorage.setItem('mokhalasa_last_access_key', generatedAccessKey);
      localStorage.setItem('mokhalasa_last_phone', sellerPhone);
      localStorage.removeItem('mokhalasa_wizard_draft'); // Clean up completed draft
    } catch {
      // LocalStorage fallback
    }
    setIsSubmitting(false);
    setCurrentStep(8); // Success view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [
    isSubmitting, agreedToTerms, selectedMakeId, selectedModelId, photoSlots, isCustomTrim,
    customTrimText, selectedTrim, transmission, engineSize, fuelType, mileage,
    location, color, chassisVin, sellerExpectedPrice, valuation, vehicleStatus,
    distressReason, urgency, selectedIssues, sellerConditionStory, bankKey, selectedBank,
    outstandingPrincipal, monthlyInstallment, remainingMonths, hasArrears,
    arrearsAmount, earlySettlementFee, hasOfficialQuote, hasContactedLender,
    paintCondition, ownerRelationship, sellerName, sellerPhone, preferredContactTime,
    settlementStatement, onListingCreated, selectedYear, customerUser, isPhoneVerified, handleOpenPhoneOtpModal,
    editingCase, onFinishEdit, onNavigate
  ]);

  const stepLabels = [
    'طريقة البيع والأهلية',
    'السيارة وإفصاح العيوب',
    saleType === 'cash' ? 'السعر الكاش' : (saleType === 'direct_installment' ? 'خطة التقسيط المباشر' : 'المديونية والأقساط'),
    'صور السيارة',
    'المستندات (مرحلية)',
    'الموقع والتواصل',
    'التقييم والمراجعة'
  ];

  return (
    <div className="min-h-screen bg-brand-bg py-8 sm:py-10 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Wizard Header / Edit Mode Indicator */}
        {editingCase ? (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-black text-lg">
                ✏️
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-3xs font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                  وضع تعديل بيانات الإعلان
                </span>
                <h2 className="text-base font-black text-slate-900">
                  تعديل الطلب رقم: {editingCase.caseReference}
                </h2>
                <p className="text-2xs text-slate-600">
                  يمكنك مراجعة كافة صفحات الإعلان وتعديل أي مواصفات أو السعر أو الصور ثم حفظها لإعادة المراجعة.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-12 sm:pr-0">
              <button
                type="button"
                onClick={() => {
                  if (onFinishEdit) onFinishEdit();
                  onNavigate('seller-portal');
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
              >
                إلغاء التعديل والعودة
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-3xs font-extrabold mx-auto">
              <Clock className="w-3.5 h-3.5 text-brand-green" />
              <span>الوقت المتوقع لإكمال النموذج: 3 دقائق • حفظ تلقائي ومرحلي</span>
            </div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
              بوابة تسجيل حالات التخارج والتعثر التمويلي
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
              عايز تبيع عربيتك وتتخلص من عبء الأقساط؟
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              خطوات ميسرة لتسجيل حالتك، تقييم سعرها العادل من واقع السوق، وبدء إجراءات السداد والتسوية مع البنك بإشراف فريق مخلصة.
            </p>
          </div>
        )}

        {/* Draft Notice if draft was restored in fresh mode */}
        {!editingCase && typeof window !== 'undefined' && localStorage.getItem('mokhalasa_wizard_draft') && currentStep > 1 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-2xs text-emerald-900 animate-fadeIn">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>تم استرجاع مسودة الطلب السابق تلقائياً لتكمل البيانات من حيث توقفت.</span>
            </span>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('mokhalasa_wizard_draft');
                  window.location.reload();
                } catch {}
              }}
              className="text-emerald-700 hover:text-emerald-950 underline font-bold text-right"
            >
              البدء من جديد وتفريغ المسودة
            </button>
          </div>
        )}

        {/* Stepper Indicator */}
        {currentStep <= 7 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="hidden sm:grid sm:grid-cols-7 gap-1.5">
              {stepLabels.map((lbl, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (stepNum < currentStep) {
                        setValidationError(null);
                        setCurrentStep(stepNum);
                      }
                    }}
                    className={`px-2 py-2 rounded-xl text-center transition flex flex-col items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-50 border border-brand-green/40 text-brand-navy shadow-2xs'
                        : isCompleted
                        ? 'bg-slate-50 hover:bg-slate-100 text-brand-green cursor-pointer'
                        : 'text-slate-400 cursor-default'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-2xs font-black flex items-center justify-center ${
                        isActive
                          ? 'bg-brand-green text-white'
                          : isCompleted
                          ? 'bg-emerald-100 text-brand-green'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓' : stepNum}
                    </span>
                    <span className="text-3xs font-extrabold leading-tight line-clamp-1">{lbl}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex sm:hidden justify-between items-center text-xs font-extrabold text-brand-navy">
              <span>الخطوة {currentStep} من 7: {stepLabels[currentStep - 1]}</span>
              <span className="text-brand-green font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {Math.round((currentStep / 7) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-green h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {validationError && (
          <div className="bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl p-4 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 font-black leading-relaxed">{validationError}</div>
            </div>
            {lastErrorTarget && (
              <button
                type="button"
                onClick={() => {
                  reportMissingField(lastErrorTarget.key, lastErrorTarget.domId, validationError, lastErrorTarget.step);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-2xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto cursor-pointer"
              >
                <span>انتقل للحقل المطلوب الآن</span>
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0" />
              </button>
            )}
          </div>
        )}

        {/* ================= STEP 1: ELIGIBILITY & TRACK SELECTION ================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Banknote className="w-5 h-5 text-brand-green" />
                <span>الخطوة 1: اختيار طريقة البيع وموقف السيارة</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                اختر النظام الأنسب لسيارتك سواء كان تقسيطاً مباشراً بدون بنك، بيع كاش ملكية خالصة، أو تسوية مديونية بنكية
              </p>
            </div>

            {/* PRIMARY 3-WAY TRACK SELECTOR */}
            <div className="space-y-2">
              <label className="block font-black text-sm text-brand-navy mb-2">
                اختر طريقة ونظام عرض السيارة للبيع: <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Direct Installment Track */}
                <button
                  type="button"
                  onClick={() => {
                    setSaleType('direct_installment');
                    setVehicleStatus('direct_installment');
                  }}
                  className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative ${
                    saleType === 'direct_installment'
                      ? 'border-amber-500 bg-amber-50/70 text-brand-navy ring-2 ring-amber-500/30 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                      🟡 تقسيط مباشر
                    </span>
                    {saleType === 'direct_installment' && <Check className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">بدون بنوك (معارض وأفراد)</h3>
                    <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                      بيع سيارتك بنظام التقسيط المباشر بشيكات أو إيصالات أمانة، للسيارات التي ترفضها البنوك وبدون تعقيدات ائتمانية.
                    </p>
                  </div>
                </button>

                {/* 2. Pure Cash Sale Track */}
                <button
                  type="button"
                  onClick={() => {
                    setSaleType('cash');
                    setVehicleStatus('fully_owned');
                  }}
                  className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative ${
                    saleType === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/70 text-brand-navy ring-2 ring-emerald-500/30 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs">
                      🟢 بيع كاش عادي
                    </span>
                    {saleType === 'cash' && <Check className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">ملكية خالصة حرة</h3>
                    <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                      سيارة ملكك بالكامل بدون أي أقساط أو حظر بيع بالرخصة، واستلام قيمتها كاش بالكامل فوراً.
                    </p>
                  </div>
                </button>

                {/* 3. Bank Debt Settlement Track */}
                <button
                  type="button"
                  onClick={() => {
                    setSaleType('bank_settlement');
                    if (vehicleStatus === 'fully_owned' || vehicleStatus === 'direct_installment') {
                      setVehicleStatus('bank_loan');
                    }
                  }}
                  className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative ${
                    saleType === 'bank_settlement'
                      ? 'border-blue-600 bg-blue-50/70 text-brand-navy ring-2 ring-blue-600/30 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="p-2 rounded-xl bg-blue-100 text-blue-900 font-black text-xs">
                      🏦 تسوية بنكية
                    </span>
                    {saleType === 'bank_settlement' && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">عليها حظر بيع / أقساط</h3>
                    <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                      خدمة مخلصة الأصلية لفك الحظر وحساب السداد المعجل والتخارج الآمن من قسط السيارة.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Direct Installment Extra Settings */}
            {saleType === 'direct_installment' && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4.5 space-y-3">
                <span className="font-extrabold text-amber-950 block text-xs">
                  صفة البائع لعرض التقسيط المباشر:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDirectSellerType('showroom')}
                    className={`p-3 rounded-xl border text-right font-bold text-xs flex items-center justify-between ${
                      directSellerType === 'showroom'
                        ? 'border-amber-600 bg-white text-amber-900 shadow-xs ring-1 ring-amber-500'
                        : 'border-amber-200/70 bg-amber-50/40 text-amber-800 hover:bg-white'
                    }`}
                  >
                    <span>معرض سيارات / تاجر معتمد</span>
                    {directSellerType === 'showroom' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectSellerType('individual')}
                    className={`p-3 rounded-xl border text-right font-bold text-xs flex items-center justify-between ${
                      directSellerType === 'individual'
                        ? 'border-amber-600 bg-white text-amber-900 shadow-xs ring-1 ring-amber-500'
                        : 'border-amber-200/70 bg-amber-50/40 text-amber-800 hover:bg-white'
                    }`}
                  >
                    <span>فرد / مالك مباشر يبيع بالتقسيط المباشر</span>
                    {directSellerType === 'individual' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* Bank Debt Settlement Regulatory Notice & Status */}
            {saleType === 'bank_settlement' && (
              <>
                <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-blue-900 block">إقرار وتنبيه قانوني بخصوص التمويل وحظر البيع:</span>
                    <p className="text-2xs text-blue-800 leading-relaxed">
                      بيع سيارة محملة بأقساط أو حظر بيع يتطلب الحصول على موافقة رسمية من البنك أو جهة التمويل وإيداع حصيلة المخالصة بالفرع المانح. تتولى منصة «مخلصة» الإشراف والتنسيق الفني والميداني.
                    </p>
                  </div>
                </div>

                {/* Vehicle financing status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                    ما هو الموقف الحالي للسيارة من التمويل والأقساط؟ <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'bank_loan', label: 'سيارة عليها أقساط بنكية (حظر بيع بالرخصة)' },
                      { id: 'consumer_finance', label: 'تمويل شركة تقسيط (كونتكت، فاليو، درايف، سهولة)' },
                      { id: 'settlement_or_arrears', label: 'أقساط متأخرة أو مفاوضات تسوية مع التحصيل' },
                      { id: 'loan_paid_pending_clearance', label: 'تم سداد القرض وبانتظار خطاب فك الحظر' },
                      { id: 'personal_loan_free_license', label: 'قرض شخصي نقدي (الرخصة حرة بدون حظر)' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleStatusChange(item.id as ListingVehicleStatus)}
                        className={`p-3 rounded-xl border text-right text-xs font-bold transition flex items-center justify-between ${
                          vehicleStatus === item.id
                            ? 'border-brand-green bg-emerald-50 text-brand-navy ring-2 ring-brand-green/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{item.label}</span>
                        {vehicleStatus === item.id && <Check className="w-4 h-4 text-brand-green flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4 text-xs">
              
              {/* Reason for selling */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  ما هو السبب الرئيسي الذي يجعلك تبيع السيارة الآن؟ <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <select
                  value={distressReason}
                  onChange={(e) => setDistressReason(e.target.value as DistressReason)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  <option value="installment_burden">توفير سيولة أو تخفيف أعباء والتزامات مالية</option>
                  <option value="downsizing_car">الاستبدال بسيارة أخرى أو تجديد الموديل</option>
                  <option value="relocation_travel">سفر للخارج أو تغيير محل الإقامة</option>
                  <option value="accumulating_interest">التخلص من الفوائد بالسداد المعجل (للسيارات الممولة)</option>
                  <option value="emergency_expenses">التزامات أو استثمارات شخصية طارئة</option>
                  <option value="reducing_overhead">تقليل النفقات والمصاريف التشغيلية</option>
                  <option value="other">سبب آخر</option>
                </select>
              </div>

              {/* Registered owner relationship */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    هل رخصة السيارة مسجلة باسمك مباشرة؟
                  </label>
                  <select
                    value={ownerRelationship}
                    onChange={(e) => setOwnerRelationship(e.target.value as OwnerRelationship)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="direct_owner">نعم، المالك الأصلي المسجل بالرخصة</option>
                    <option value="power_of_attorney">وكيل بموجب توكيل رسمي بالشهر العقاري</option>
                    <option value="first_degree_relative">قريب درجة أولى بتفويض عائلي</option>
                    <option value="heir">وريث بموجب إعلام وراثة رسمي</option>
                    <option value="not_sure">مش متأكد (يحتاج مراجعة خاصة)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    مدى الاستعجال في إتمام البيع:
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="very_urgent">عاجل جداً (خلال أسبوع إلى 10 أيام)</option>
                    <option value="urgent">عاجل (خلال أسبوعين إلى شهر)</option>
                    <option value="flexible">مرن (أكثر من شهر - البحث عن أفضل عائد)</option>
                  </select>
                </div>
              </div>

              {/* Contacted lender & Statement availability (Only for bank settlement) */}
              {saleType === 'bank_settlement' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">
                      هل تواصلت مع البنك/الجهة بشأن السداد المعجل؟
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="contactedLender"
                          checked={hasContactedLender === true}
                          onChange={() => setHasContactedLender(true)}
                          className="accent-brand-green"
                        />
                        <span>نعم، تواصلت</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="contactedLender"
                          checked={hasContactedLender === false}
                          onChange={() => setHasContactedLender(false)}
                          className="accent-brand-green"
                        />
                        <span>لا، لم أتواصل</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-500">
                        <input
                          type="radio"
                          name="contactedLender"
                          checked={hasContactedLender === 'not_sure'}
                          onChange={() => setHasContactedLender('not_sure')}
                          className="accent-brand-green"
                        />
                        <span>مش متأكد</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">
                      هل لديك بيان مديونية أو استعلام سداد معجل حديث؟
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="hasQuote"
                          checked={hasOfficialQuote === true}
                          onChange={() => setHasOfficialQuote(true)}
                          className="accent-brand-green"
                        />
                        <span>نعم، لدي ورقة مختومة</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="hasQuote"
                          checked={hasOfficialQuote === false}
                          onChange={() => setHasOfficialQuote(false)}
                          className="accent-brand-green"
                        />
                        <span>لا، لست متأكداً</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-500">
                        <input
                          type="radio"
                          name="hasQuote"
                          checked={hasOfficialQuote === 'not_sure'}
                          onChange={() => setHasOfficialQuote('not_sure')}
                          className="accent-brand-green"
                        />
                        <span>مش متأكد</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-8 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>المتابعة: مواصفات السيارة والعيوب</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SPECS, EXTENSIVE CONDITION STORY & DISCLOSURES ================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-brand-green" />
                <span>الخطوة 2: مواصفات السيارة والإفصاح الكامل عن حالتها</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                الصراحة في وصف الأعطال والدهان تحميك من فسخ الصفقة بعد الفحص الفني
              </p>
            </div>

            {/* Vehicle Catalog Dependent Dropdowns */}
            <VehicleMakeModelPicker
              selectedMakeId={selectedMakeId}
              onSelectMakeId={setSelectedMakeId}
              selectedModelId={selectedModelId}
              onSelectModelId={setSelectedModelId}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              selectedTrim={selectedTrim}
              onSelectTrim={setSelectedTrim}
              isCustomTrim={isCustomTrim}
              setIsCustomTrim={setIsCustomTrim}
              customTrimText={customTrimText}
              setCustomTrimText={setCustomTrimText}
              transmission={transmission}
              setTransmission={setTransmission}
              fuelType={fuelType}
              setFuelType={setFuelType}
              engineSize={engineSize}
              setEngineSize={setEngineSize}
              mileage={mileage}
              setMileage={setMileage}
              color={color}
              setColor={setColor}
              paintCondition={paintCondition}
              setPaintCondition={setPaintCondition}
              chassisVin={chassisVin}
              setChassisVin={setChassisVin}
              lang={lang}
              fieldErrors={fieldErrors}
              onClearFieldError={clearFieldError}
            />

            {/* MANDATORY LICENSE & TRAFFIC UNIT SECTION */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="border-b border-slate-200/80 pb-2">
                <h3 className="font-extrabold text-xs text-brand-navy flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-green" />
                  <span>بيانات الترخيص ووحدة المرور المسجل بها السيارة</span>
                </h3>
                <p className="text-3xs text-slate-500 mt-0.5">
                  بيانات رسمية أساسية لتنسيق إجراءات الاستعلام واستخراج شهادة المخالصة ونقل القيد.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Traffic Unit (Mandatory) */}
                <div className="space-y-1.5 sm:col-span-2" id="field-trafficUnit-wrapper">
                  <label className="block font-black text-brand-navy text-2xs">
                    وحدة المرور التابع لها الترخيص <span className="text-red-500">* (إجباري)</span>
                  </label>
                  <input
                    id="field-trafficUnit"
                    type="text"
                    required
                    value={trafficUnit}
                    onChange={(e) => {
                      setTrafficUnit(e.target.value);
                      clearFieldError('trafficUnit');
                    }}
                    placeholder="مثال: مرور فيصل، مرور مدينة نصر، مرور التجمع..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-white focus:outline-none transition ${
                      fieldErrors.trafficUnit
                        ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                        : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-green'
                    }`}
                  />
                  {fieldErrors.trafficUnit && (
                    <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.trafficUnit}</span>
                    </div>
                  )}
                  {/* Quick Suggestions Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-3xs text-slate-400 font-bold">اختيار سريع:</span>
                    {['مرور فيصل', 'مرور مدينة نصر', 'مرور التجمع', 'مرور القطامية', 'مرور الدقي', 'مرور 6 أكتوبر', 'مرور المعادي', 'مرور النزهة', 'مرور الشروق'].map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          setTrafficUnit(unit);
                          clearFieldError('trafficUnit');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-3xs font-bold transition border ${
                          trafficUnit === unit
                            ? 'bg-brand-green text-slate-950 border-brand-green'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seller Type */}
                <div className="space-y-1.5">
                  <label className="block font-black text-brand-navy text-2xs">
                    صفة البائع بالرخصة
                  </label>
                  <select
                    value={sellerType}
                    onChange={(e) => setSellerType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="مالك أول">مالك أول</option>
                    <option value="مالك ثانٍ">مالك ثانٍ</option>
                    <option value="توكيل">توكيل رسمي بالشهر العقاري</option>
                  </select>
                </div>
              </div>
            </div>

            {/* MANDATORY LARGE ARABIC TEXTAREA PROMPT (Prompt Specification) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3" id="field-conditionStory-wrapper">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                  <div>
                    <label className="block text-xs font-black text-brand-navy">
                      احكيلنا عن العربية بالتفصيل: حالتها إيه؟ فيها أعطال أو حوادث أو دهان؟ <span className="text-red-500">*</span>
                    </label>
                    <p className="text-3xs text-slate-500 mt-0.5">
                      الإفصاح الأمين يبني الثقة ويسرع تسوية المديونية واعتماد الإعلان.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={isGeneratingAiDesc}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-2xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 flex-shrink-0"
                  title="توليد مسودة وصف محايد للإعلان بناءً على بيانات سيارتك"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGeneratingAiDesc ? 'جاري الصياغة...' : 'ساعدني في كتابة الإعلان'}</span>
                </button>
              </div>

              {aiFeedbackMsg && (
                <div className={`p-3 rounded-xl border text-xs font-bold animate-fadeIn flex items-center gap-2 ${
                  aiFeedbackMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {aiFeedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                  <span>{aiFeedbackMsg.text}</span>
                </div>
              )}

              <textarea
                id="field-conditionStory"
                rows={4}
                required
                value={sellerConditionStory}
                onChange={(e) => {
                  setSellerConditionStory(e.target.value);
                  clearFieldError('conditionStory');
                }}
                placeholder="اكتب كل الملاحظات بصراحة، أو اضغط زر (ساعدني في كتابة الإعلان) لتوليد مسودة بناءً على بيانات السيارة ثم عدلها بحرية..."
                className={`w-full p-3.5 rounded-xl border font-semibold text-xs bg-white focus:outline-none transition ${
                  fieldErrors.conditionStory
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                    : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-green'
                }`}
              />
              {fieldErrors.conditionStory && (
                <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.conditionStory}</span>
                </div>
              )}
            </div>

            {/* Common Issues Checkboxes */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                حدد إذا كانت هناك أي من الملاحظات التالية موجودة بالسيارة:
              </label>

              {/* Clean Condition Option (لا توجد مشاكل) - Phase 5 Requirement */}
              <label
                className={`p-3 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition ${
                  selectedIssues.includes(NO_ISSUES_OPTION)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-extrabold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIssues.includes(NO_ISSUES_OPTION)}
                  onChange={() => toggleIssue(NO_ISSUES_OPTION)}
                  className="accent-brand-green w-5 h-5 cursor-pointer rounded"
                />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
                  <span className="text-xs">{NO_ISSUES_OPTION}</span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {COMMON_ISSUES_OPTIONS.map((issue) => (
                  <label
                    key={issue}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                      selectedIssues.includes(issue)
                        ? 'border-amber-400 bg-amber-50/70 text-amber-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIssues.includes(issue)}
                      onChange={() => toggleIssue(issue)}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <span className="text-2xs">{issue}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-8 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>المتابعة: تفاصيل المديونية والأقساط</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: FINANCIAL CONDITIONS & PRICING ================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            
            {/* Header dynamically tailored to track */}
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Banknote className="w-5 h-5 text-brand-green" />
                <span>
                  {saleType === 'cash'
                    ? 'الخطوة 3: السعر المطلوب للبيع كاش (ملكية خالصة)'
                    : saleType === 'direct_installment'
                    ? 'الخطوة 3: شروط وخطة التقسيط المباشر والضمانات'
                    : 'الخطوة 3: بيانات الجهة الدائنة والأقساط التقديرية'}
                </span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                {saleType === 'cash'
                  ? 'حدد السعر الذي ترغب في استلامه نقداً دون أي تعقيدات بنكية'
                  : saleType === 'direct_installment'
                  ? 'حدد أقل مقدم تقبله، وقيمة القسط الشهري، والضمانات المطلوبة من المشتري'
                  : 'تسجيل بيانات القسط التقريبية لمساعدتك في استخراج بيان المديونية الرسمي لاحقاً'}
              </p>
            </div>

            {/* TRACK 1: PURE CASH SALE */}
            {saleType === 'cash' && (
              <div className="space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-emerald-900 block">سيارة ملكية حرة (بدون أي التزامات بنكية أو حظر):</span>
                    <p className="text-2xs text-emerald-800 leading-relaxed">
                      يتم بيع السيارة نقداً بصورة مباشرة، ويتم التنازل للمشتري في الشهر العقاري واستلام كامل المبلغ دون أي انتظار لخطابات فك حظر أو إجراءات بنكية.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4" id="field-cashPrice-wrapper">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block font-black text-slate-800 text-xs">
                        السعر المطلوب للبيع كاش: <span className="text-red-500">*</span>
                      </label>
                      <span className="text-3xs text-slate-500">القيمة النقدية الصافية للسيارة</span>
                    </div>
                    <div className="text-lg font-black text-brand-green">
                      {sellerExpectedPrice > 0 ? formatEGP(sellerExpectedPrice) : 'حدد السعر'}
                    </div>
                  </div>

                  <input
                    id="field-cashPrice"
                    type="number"
                    step="10000"
                    value={sellerExpectedPrice || ''}
                    onChange={(e) => {
                      setSellerExpectedPrice(Number(e.target.value));
                      clearFieldError('cashPrice');
                    }}
                    placeholder="مثال: 650000"
                    className={`w-full px-4 py-3 rounded-xl border font-black bg-white text-sm focus:outline-none transition ${
                      fieldErrors.cashPrice
                        ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                        : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-brand-green'
                    }`}
                  />
                  {fieldErrors.cashPrice && (
                    <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fieldErrors.cashPrice}</span>
                    </div>
                  )}

                  {/* Market estimate guidance */}
                  {valuation.suggestedAskingPrice > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-2xs text-slate-600">
                      <span>متوسط سعر السوق المقترح للسيارة:</span>
                      <span className="font-black text-brand-navy">{formatEGP(valuation.suggestedAskingPrice)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRACK 2: DIRECT INSTALLMENT (SHOWROOMS & INDIVIDUALS) */}
            {saleType === 'direct_installment' && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-amber-900 block">نظام التقسيط المباشر (Direct In-House Financing):</span>
                    <p className="text-2xs text-amber-800 leading-relaxed">
                      هذا النظام مخصص للمعارض والتجار والملاك الذين يبيعون سياراتهم بالتقسيط مباشرة للمشتري بدون وساطة بنوك أو شركات تمويل، وتحديد الضمانات (شيكات / إيصالات أمانة / حظر عرفي) لحفظ حقوق الطرفين.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Total Installment Price */}
                  <div id="field-installmentTotal-wrapper">
                    <label className="block font-black text-slate-800 mb-1.5">
                      إجمالي سعر السيارة بالتقسيط: <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-installmentTotal"
                      type="number"
                      step="10000"
                      value={sellerExpectedPrice || ''}
                      onChange={(e) => {
                        setSellerExpectedPrice(Number(e.target.value));
                        clearFieldError('installmentTotal');
                      }}
                      placeholder="مثال: 750000"
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white focus:outline-none transition ${
                        fieldErrors.installmentTotal
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                          : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500'
                      }`}
                    />
                    {fieldErrors.installmentTotal ? (
                      <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{fieldErrors.installmentTotal}</span>
                      </div>
                    ) : (
                      <span className="text-3xs text-slate-400 mt-0.5 block">إجمالي ثمن البيع شاملاً الفائدة</span>
                    )}
                  </div>

                  {/* Minimum Down Payment */}
                  <div id="field-downPayment-wrapper">
                    <label className="block font-black text-slate-800 mb-1.5">
                      أقل مقدم مطلوب (Down Payment): <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-downPayment"
                      type="number"
                      step="5000"
                      value={directDownPayment || ''}
                      onChange={(e) => {
                        setDirectDownPayment(Number(e.target.value));
                        clearFieldError('downPayment');
                      }}
                      placeholder="مثال: 200000"
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white focus:outline-none transition ${
                        fieldErrors.downPayment
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                          : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500'
                      }`}
                    />
                    {fieldErrors.downPayment && (
                      <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{fieldErrors.downPayment}</span>
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-1">
                      {[0.25, 0.3, 0.4, 0.5].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setDirectDownPayment(Math.round((sellerExpectedPrice || 600000) * pct));
                            clearFieldError('downPayment');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 text-3xs font-bold text-slate-600 hover:bg-amber-100 hover:text-amber-900 transition"
                        >
                          {pct * 100}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Installment */}
                  <div id="field-monthlyInstallment-wrapper">
                    <label className="block font-black text-slate-800 mb-1.5">
                      قيمة القسط الشهري: <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-monthlyInstallment"
                      type="number"
                      step="500"
                      value={directMonthlyInstallment || ''}
                      onChange={(e) => {
                        setDirectMonthlyInstallment(Number(e.target.value));
                        clearFieldError('monthlyInstallment');
                      }}
                      placeholder="مثال: 8500"
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white focus:outline-none transition ${
                        fieldErrors.monthlyInstallment
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                          : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500'
                      }`}
                    />
                    {fieldErrors.monthlyInstallment && (
                      <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{fieldErrors.monthlyInstallment}</span>
                      </div>
                    )}
                  </div>

                  {/* Installment Months Duration */}
                  <div>
                    <label className="block font-black text-slate-800 mb-1.5">
                      مدة التقسيط بالشهور: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[12, 24, 36, 48].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setDirectInstallmentMonths(months)}
                          className={`py-2 px-1 rounded-xl border text-center text-xs font-black transition ${
                            directInstallmentMonths === months
                              ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {months} شهر
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Required Guarantees */}
                  <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block font-black text-slate-800 text-xs">
                      الضمانات المطلوبة من المشتري:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {[
                        'شيكات بنكية موقعة',
                        'إيصالات أمانة',
                        'حظر بيع بالرخصة (عرفي)',
                        'صورة بطاقة سارية وضامن',
                        'عقد بيع بالتقسيط معتمد وموثق',
                        'إثبات سكن أو محل إقامة'
                      ].map((guarantee) => {
                        const isChecked = directGuarantees.includes(guarantee);
                        return (
                          <label
                            key={guarantee}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                              isChecked
                                ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setDirectGuarantees(prev =>
                                  prev.includes(guarantee)
                                    ? prev.filter(g => g !== guarantee)
                                    : [...prev, guarantee]
                                );
                              }}
                              className="accent-amber-500 w-4 h-4"
                            />
                            <span className="text-2xs">{guarantee}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Installment Calculation Summary */}
                  <div className="sm:col-span-2 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-3xs font-extrabold text-amber-900 uppercase block">ملخص خطة التقسيط المباشر:</span>
                      <div className="font-black text-slate-900 text-sm mt-0.5">
                        المقدم: {formatEGP(directDownPayment)} + ({formatEGP(directMonthlyInstallment)} × {directInstallmentMonths} شهر)
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-3xs text-slate-500 block">إجمالي سداد المشتري:</span>
                      <span className="text-base font-black text-amber-700">
                        {formatEGP(directDownPayment + (directMonthlyInstallment * directInstallmentMonths))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRACK 3: BANK DEBT SETTLEMENT */}
            {saleType === 'bank_settlement' && (
              <div className="space-y-4 text-xs">
                {/* Clear Unverified Estimate Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">تنبيه: الأرقام المدخلة هنا هي تقدير مبدئي من البائع (غير معتمدة رسمياً)</span>
                    <p className="text-2xs text-blue-800 leading-relaxed">
                      لا نعتمد هذه المبالغ كأرقام تسوية نهائية؛ بل سيقوم فريق مخلصة بمراجعة بيان المديونية الرسمي (Payoff Quote) الصادر والمختوم من فرع البنك قبل توقيع أي اتفاق مع المشتري.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">جهة التمويل (البنك أو الشركة الدائنة):</label>
                    <select
                      value={bankKey}
                      onChange={(e) => setBankKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                    >
                      {Object.entries(COMPREHENSIVE_BANK_DATABASE).map(([key, b]) => (
                        <option key={key} value={key}>
                          {b.bankNameAr} (عمولة سداد معجل {(b.earlySettlementRate * 100).toFixed(1)}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div id="field-outstandingPrincipal-wrapper">
                    <label className="block font-bold text-slate-700 mb-1.5">
                      أصل الدين المتبقي التقريبي (Principal): <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-outstandingPrincipal"
                      type="number"
                      step="5000"
                      value={outstandingPrincipal || ''}
                      onChange={(e) => {
                        setOutstandingPrincipal(Number(e.target.value));
                        clearFieldError('outstandingPrincipal');
                      }}
                      placeholder="مثال: 250000"
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white focus:outline-none transition ${
                        fieldErrors.outstandingPrincipal
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                          : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-green'
                      }`}
                    />
                    {fieldErrors.outstandingPrincipal && (
                      <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{fieldErrors.outstandingPrincipal}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">قيمة القسط الشهري (اختياري):</label>
                    <input
                      type="number"
                      step="500"
                      value={monthlyInstallment || ''}
                      onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                      placeholder="مثال: 9500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">عدد الشهور/الأقساط المتبقية (اختياري):</label>
                    <input
                      type="number"
                      value={remainingMonths || ''}
                      onChange={(e) => setRemainingMonths(Number(e.target.value))}
                      placeholder="مثال: 30"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>

                  {/* Overdue Arrears */}
                  <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasArrears}
                        onChange={(e) => setHasArrears(e.target.checked)}
                        className="w-4 h-4 accent-brand-green"
                      />
                      <span>هل توجد أقساط متأخرة أو غرامات تأخير حالياً؟</span>
                    </label>

                    {hasArrears && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-bold text-slate-600">المبلغ التقريبي للمتأخرات:</span>
                        <input
                          type="number"
                          value={arrearsAmount}
                          onChange={(e) => setArrearsAmount(Number(e.target.value))}
                          placeholder="المبلغ"
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Seller Expected Price */}
                  <div className="sm:col-span-2 pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-bold text-slate-700">السعر المتوقع أو المطلوب للسيارة (اختياري):</label>
                      <span className="text-xs font-black text-brand-green">{sellerExpectedPrice > 0 ? formatEGP(sellerExpectedPrice) : 'غير محدد بعد'}</span>
                    </div>
                    <input
                      type="range"
                      min="300000"
                      max="2500000"
                      step="25000"
                      value={sellerExpectedPrice || 500000}
                      onChange={(e) => setSellerExpectedPrice(Number(e.target.value))}
                      className="w-full accent-brand-green cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-8 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>المتابعة: صور السيارة</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: VEHICLE PHOTOS (MINIMUM 4) ================= */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-green" />
                <span>الخطوة 4: صور السيارة (4 صور كحد أدنى للمراجعة)</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                صور واضحة لحالة البودي والعداد والصالون تمكن الخبير من تقييم السيارة بدقة
              </p>
            </div>

            <div id="field-photosSection" className={fieldErrors.photos ? 'p-3 rounded-2xl border-2 border-red-500 bg-red-50/20' : ''}>
              {fieldErrors.photos && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{fieldErrors.photos}</span>
                </div>
              )}
              <VehiclePhotoUploader
                photoSlots={photoSlots}
                onUploadPhoto={(slotType, file) => {
                  const url = URL.createObjectURL(file);
                  setPhotoSlots(prev => prev.map(s => s.slotType === slotType ? { ...s, previewUrl: url, file } : s));
                  clearFieldError('photos');
                }}
                onRemovePhoto={(id) => {
                  setPhotoSlots(prev => prev.map(s => s.id === id ? { ...s, previewUrl: undefined, file: undefined } : s));
                }}
                lang={lang}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-8 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>المتابعة: المستندات (مرحلية)</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: DOCUMENTS (INITIAL UPLOAD OPTIONAL) ================= */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-green" />
                <span>الخطوة 5: التحقق من المستندات (رفع مرحلي اختياري مبدئياً)</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                تيسيراً عليك، يمكنك إرسال الطلب الآن دون رفع البطاقة أو العقد فوراً، وسيطلبها الفريق لاحقاً عند التقدم في الصفقة
              </p>
            </div>

            {/* Prompt Specification Notice: Initial Upload is Optional */}
            <div className="bg-emerald-50 border border-brand-green/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-brand-navy">
              <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold">لست ملزماً برفع بطاقتك أو عقد التمويل الآن!</span>
                <p className="text-2xs text-slate-600 leading-relaxed">
                  يمكنك الاكتفاء بإرسال بيانات السيارة والتواصل للمعاينة المبدئية. قبل إتمام أي إجراء بنكي أو عرض السيارة للمشترين، سيتولى فريق مخلصة مساعدتك في استيفاء الوثائق المطلوبة عبر قناة اتصال مشفرة وخاصة.
                </p>
              </div>
            </div>

            {/* Strict Privacy & Security Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-black text-brand-navy">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>سياسة حماية وسرية المستندات والبيانات الشخصية:</span>
              </div>
              <ul className="text-2xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li><strong>الغرض من الجمع:</strong> التحقق من الموقف المالي وحساب المديونية الفعلية للبنك وسلامة التراخيص فقط.</li>
                <li><strong>السرية التامة:</strong> لا تُعرض المستندات لأي مشترٍ أو زائر على المنصة إطلاقاً، وتطلع عليها فقط الإدارة القانونية المعتمدة.</li>
                <li><strong>الحفظ والحذف:</strong> تُحفظ المستندات في بيئة سحابية مشفرة وتُحذف فور إتمام عملية البيع والتنازل، ويمكنك طلب حذفها في أي وقت عبر التواصل مع الدعم.</li>
              </ul>
            </div>

            <DocumentChecklist
              documents={documents}
              vehicleStatus={vehicleStatus}
              onUpdateDocument={(docId, file) => {
                setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'uploaded', uploadedFileName: file.name } : d));
              }}
              onRemoveDocument={(docId) => {
                setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'optional', uploadedFileName: undefined } : d));
              }}
              lang={lang}
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-8 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>المتابعة: الموقع وبيانات التواصل</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: LOCATION & SELLER CONTACT ================= */}
        {currentStep === 6 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-brand-green" />
                <span>الخطوة 6: الموقع التقريبي وبيانات التواصل مع البائع</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                بياناتك سرية تماماً ولن تظهر للمشترين؛ التواصل مقتصر حصرياً على موظفي مخلصة المعتمدين
              </p>
            </div>

            <LocationPicker
              location={location}
              onChangeLocation={setLocation}
              lang={lang}
            />

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div id="field-sellerName-wrapper">
                <label className="block font-bold text-slate-700 mb-1.5">اسم البائع بالكامل: <span className="text-red-500">*</span></label>
                <input
                  id="field-sellerName"
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => {
                    setSellerName(e.target.value);
                    clearFieldError('sellerName');
                  }}
                  placeholder="مثال: م. طارق العسلي"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white focus:outline-none transition ${
                    fieldErrors.sellerName
                      ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                      : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-green'
                  }`}
                />
                {fieldErrors.sellerName && (
                  <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{fieldErrors.sellerName}</span>
                  </div>
                )}
              </div>

              <div id="field-sellerPhone-wrapper">
                <label className="block font-bold text-slate-700 mb-1.5">رقم الهاتف المحمول (مصر): <span className="text-red-500">*</span></label>
                <input
                  id="field-sellerPhone"
                  type="tel"
                  required
                  value={sellerPhone}
                  onChange={(e) => {
                    setSellerPhone(e.target.value);
                    clearFieldError('sellerPhone');
                  }}
                  placeholder="01012345678"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white focus:outline-none font-mono transition ${
                    fieldErrors.sellerPhone
                      ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20 text-red-900'
                      : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-green'
                  }`}
                />
                {fieldErrors.sellerPhone && (
                  <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{fieldErrors.sellerPhone}</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">الوقت المفضل لتواصل فريق مخلصة معك:</label>
                <select
                  value={preferredContactTime}
                  onChange={(e) => setPreferredContactTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  <option value="صباحاً (من 10 صباحاً إلى 1 ظهراً)">صباحاً (من 10 صباحاً إلى 1 ظهراً)</option>
                  <option value="ظهراً (من 1 ظهراً إلى 5 مساءً)">ظهراً (من 1 ظهراً إلى 5 مساءً)</option>
                  <option value="مساءً (من 5 إلى 9 مساءً)">مساءً (من 5 إلى 9 مساءً)</option>
                  <option value="أي وقت متاح">أي وقت متاح</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-8 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>المتابعة: التقييم السعري والمراجعة</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 7: VALUATION PREVIEW & FINAL SUBMIT ================= */}
        {currentStep === 7 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-green" />
                <span>الخطوة 7: التقييم السعري التقديري ومراجعة الطلب</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-1">
                تقدير عادل لقيمة سيارتك من واقع إعلانات السوق، مع بيان صافي الكاش التقديري
              </p>
            </div>

            {/* Fair-Price Valuation Engine Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-3xs font-extrabold bg-brand-green text-white px-2 py-0.5 rounded-full">
                    تقييم محرك مخلصة الذكي
                  </span>
                  <h3 className="text-base font-black text-white mt-1">
                    متوسط سعر السوق: {formatEGP(valuation.suggestedAskingPrice)}
                  </h3>
                  <div className="text-3xs text-slate-300">
                    النطاق المتوقع: {formatEGP(valuation.estimatedMarketRange.min)} إلى {formatEGP(valuation.estimatedMarketRange.max)}
                  </div>
                </div>

                <div className="bg-white/10 px-3 py-2 rounded-xl text-center sm:text-right">
                  <div className="text-3xs text-amber-300 font-bold">سعر البيع السريع المقترح (7-10 أيام):</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {formatEGP(valuation.suggestedFasterSaleRange.min)} - {formatEGP(valuation.suggestedFasterSaleRange.max)}
                  </div>
                </div>
              </div>

              {/* Data Sources and Confidence */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-3xs text-slate-300">
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-400 block">درجة الثقة بالبيانات:</span>
                  <span className="font-bold text-emerald-400">{valuation.confidenceLevel}</span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-400 block">عدد الإعلانات المقارنة:</span>
                  <span className="font-bold text-white">{valuation.comparableCount} إعلانات مطابقة</span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block">مصادر البيانات المعتمدة:</span>
                  <span className="font-bold text-white">ContactCars & YallaMotor</span>
                </div>
              </div>

              {/* Net Proceeds Calculation Preview */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {saleType === 'cash' ? (
                  <>
                    <div>
                      <span className="font-bold text-slate-300">إجمالي المبلغ النقدي المستحق للبائع عند التنازل:</span>
                      <div className="text-2xs text-slate-400 mt-0.5">
                        سيارة ملكية خالصة حرة — تسليم كاش فوري وتنازل بالشهر العقاري
                      </div>
                    </div>
                    <div className="text-base font-black text-emerald-400">
                      {formatEGP(sellerExpectedPrice || valuation.suggestedAskingPrice)}
                    </div>
                  </>
                ) : saleType === 'direct_installment' ? (
                  <>
                    <div>
                      <span className="font-bold text-slate-300">خطة تحصيل التقسيط المباشر المتفق عليها:</span>
                      <div className="text-2xs text-slate-400 mt-0.5">
                        مقدم {formatEGP(directDownPayment)} + ({formatEGP(directMonthlyInstallment)} × {directInstallmentMonths} شهر)
                      </div>
                    </div>
                    <div className="text-base font-black text-amber-400">
                      إجمالي التحصيل: {formatEGP(directDownPayment + (directMonthlyInstallment * directInstallmentMonths))}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-bold text-slate-300">صافي عائد البائع التقديري بعد تصفية القرض والعمولة:</span>
                      <div className="text-2xs text-slate-400 mt-0.5">
                        (سعر البيع {formatEGP(sellerExpectedPrice || valuation.suggestedAskingPrice)} - سداد البنك {formatEGP(outstandingPrincipal + earlySettlementFee)} - عمولة 1.5% {formatEGP(Math.round((sellerExpectedPrice || valuation.suggestedAskingPrice) * 0.015))})
                      </div>
                    </div>
                    <div className="text-base font-black text-brand-green">
                      {formatEGP(settlementStatement.netProceedsToSeller)}
                    </div>
                  </>
                )}
              </div>

              <div className="text-3xs text-slate-400 italic">
                {valuation.disclaimerAr}
              </div>
            </div>

            {/* Declarations & Agreement */}
            <div id="field-agreedToTerms-wrapper" className={`rounded-2xl p-4 space-y-3 transition ${
              fieldErrors.agreedToTerms ? 'bg-red-50/70 border-2 border-red-500 shadow-sm' : 'bg-slate-50 border border-slate-200'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="field-agreedToTerms"
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    clearFieldError('agreedToTerms');
                  }}
                  className="w-4 h-4 accent-brand-green mt-0.5 cursor-pointer"
                />
                <div className="text-xs text-slate-800 leading-relaxed space-y-1">
                  <strong className={fieldErrors.agreedToTerms ? 'text-red-900' : ''}>
                    أقر بصحة البيانات وأوافق على شروط المراجعة والتسوية: <span className="text-red-500">*</span>
                  </strong>
                  <p className="text-2xs text-slate-600">
                    أؤكد أنني أفصحت بأمانة عن كافة العيوب المعروفة لي بالسيارة، وأن بيانات القسط تقريبية لحين تدقيقها رسمياً مع البنك، وأعلم بأن تسجيل الطلب لا يضمن البيع بسعر محدد ولا يمثل موافقة بنكية مسبقة، وأن عمولة مخلصة هي 1.5% من إجمالي البيع تستحق فقط عند إتمام الصفقة.
                  </p>
                </div>
              </label>
              {fieldErrors.agreedToTerms && (
                <div className="text-3xs font-extrabold text-red-600 flex items-center gap-1 pt-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.agreedToTerms}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>تعديل البيانات</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!agreedToTerms || isSubmitting}
                className={`py-3.5 px-8 rounded-xl font-extrabold text-xs shadow-lg transition flex items-center gap-2 ${
                  agreedToTerms && !isSubmitting
                    ? 'bg-brand-green hover:bg-emerald-600 text-white shadow-brand-green/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{editingCase ? 'جاري حفظ التعديلات وإرسالها...' : 'جاري نشر الإعلان وتأكيد البيانات...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{editingCase ? 'حفظ التعديلات وإرسالها للمراجعة' : 'نشر الإعلان الآن'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 8: SUCCESS CONFIRMATION (PHASE 2 COMPLIANT) ================= */}
        {currentStep === 8 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-card text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider">تم النشر بنجاح وبدء التدقيق الإداري</span>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">
                تم نشر إعلانك بنجاح
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                تم حفظ بيانات سيارتك وتأكيد استلام الطلب رسمياً في نظام مخلصة. تم تعيين مسؤول لمراجعة الأوراق تمهيداً للاعتماد النهائي في المعرض.
              </p>
            </div>

            {/* Vehicle Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-right max-w-lg mx-auto space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-brand-navy text-sm">
                  {selectedYear} {VEHICLE_MAKES.find(m => m.id === selectedMakeId)?.nameAr || 'نيسان'} {getModelsByMake(selectedMakeId).find(m => m.id === selectedModelId)?.nameAr || 'صني'}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                  {formatEGP(sellerExpectedPrice || valuation.suggestedAskingPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-3xs text-slate-600">
                <div>
                  <span className="text-slate-400 block">الموقع:</span>
                  <span className="font-bold text-slate-800">{location.displayAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">اللون والدهان:</span>
                  <span className="font-bold text-slate-800">{color} ({paintCondition})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">رقم الإعلان بالنظام:</span>
                  <span className="font-mono font-bold text-brand-navy truncate block">
                    {createdListingId || 'MK-LST-PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">حالة الإعلان الحالية:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                    <Clock className="w-3 h-3 text-amber-500" />
                    بانتظار مراجعة الإدارة
                  </span>
                </div>
              </div>
            </div>

            {/* Seamless Customer Dashboard & Tracking Hub */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 max-w-lg mx-auto shadow-elevated border border-slate-800 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm text-white">إعلانك محفوظ بأمان في حسابك الشخصي</span>
                </div>
                <span className="text-3xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                  مربوط بحسابك الموحد
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                جميع مراحل المراجعة، طلبات التعديل، إشعارات القبول، وعروض الشراء المقدمة من المشترين ستصلك لحظة بلحظة وتظهر لك مباشرة في صفحة <strong>«حسابي وإعلاناتي»</strong> دون الحاجة لأي روابط أو أكواد أمان منفصلة.
              </p>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 text-2xs space-y-1 text-slate-300">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الخطوة التالية لمسؤول المعاملات في مخلصة:</span>
                </div>
                <p className="leading-relaxed">
                  يقوم مستشار مخلصة بمراجعة بيانات السيارة، والتأكد من توافق القسط وأصل المديونية مع جهة التمويل، واعتماد النشر في المعرض العام خلال ساعات العمل الرسمية.
                </p>
              </div>
            </div>

            {/* Next Steps Guide */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-right max-w-lg mx-auto space-y-3 text-xs text-slate-700">
              <div className="font-extrabold text-brand-navy pb-1 border-b border-slate-200">
                ماذا تفعل الآن؟
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white text-3xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span>تابع حالة إعلانك وتفاصيله من صفحة <strong>«إعلاناتي»</strong> في حسابك.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white text-3xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span>في حال طلب مستندات (رخصة / بطاقة / بيان مديونية)، يمكنك رفعها مباشرة من حسابك أو إرسالها لواتساب مخلصة.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white text-3xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span>بمجرد موافقة الإدارة، يظهر إعلانك فوراً لآلاف المشترين في المعرض العام.</span>
              </div>
            </div>

            {/* Streamlined Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <CarIcon className="w-4 h-4" />
                <span>متابعة إعلاناتي وحالة الطلب</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                تصفح سوق السيارات
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ================= OPTIONAL GUIDANCE MODAL ================= */}
      {showIneligibleModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 text-right">
            
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-lg text-brand-navy">
                سيارتك مؤهلة للعرض والبيع في مخلصة!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                إذا كانت سيارتك ملكية حرة بدون ديون، يمكنك بيعها نقداً كاش فوراً، أو عرضها بنظام التقسيط المباشر للمشترين.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowIneligibleModal(false);
                  setSaleType('cash');
                  setVehicleStatus('fully_owned');
                }}
                className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
              >
                بيع كاش (ملكية خالصة)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowIneligibleModal(false);
                  setSaleType('direct_installment');
                  setVehicleStatus('direct_installment');
                }}
                className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition"
              >
                بيع بالتقسيط المباشر
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= AUTH REQUIRED MODAL (PRIORITY 1 & 7) ================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-right">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-lg text-brand-navy">
                تسجيل الدخول مطلوب لحفظ الإعلان
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                وفقاً لضوابط الأمان والمصداقية، يجب تسجيل الدخول أو إنشاء حساب لربط السيارة بملفك الشخصي ومتابعة طلبات المشترين.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>بياناتك في أمان تام</span>
              </div>
              <p className="text-2xs text-blue-700 leading-relaxed">
                لن تفقد البيانات التي أدخلتها؛ سيتم ربط الإعلان بحسابك بمجرد تسجيل الدخول.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  onNavigate('profile');
                }}
                className="w-full py-3 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تسجيل الدخول / إنشاء حساب الآن</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                إلغاء ومواصلة مراجعة البيانات
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default SellCarWizardPage;
