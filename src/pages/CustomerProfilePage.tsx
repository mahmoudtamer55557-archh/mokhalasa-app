import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CustomerUser, PurchaseOffer, InAppNotification } from '../types';
import { profileService, UserProfileData } from '../services/profileService';
import { listingService, DatabaseCarListing } from '../services/listingService';
import { supabase } from '../services/supabaseClient';
import { 
  Mail, Phone, Calendar, ShieldCheck, Camera, Edit3, 
  CheckCircle2, AlertCircle, Clock, PlusCircle, LogOut, Lock, 
  Car as CarIcon, Eye, X, ChevronLeft, AlertTriangle, Tag,
  Bell, User, Check, RefreshCw, FileText, UploadCloud, Trash2
} from 'lucide-react';

interface CustomerProfilePageProps {
  customerUser: CustomerUser | null;
  onNavigate: (view: string) => void;
  onCustomerLogout: () => void;
  onOpenCustomerLogin: () => void;
  lang?: 'ar' | 'en';
}

export const CustomerProfilePage: React.FC<CustomerProfilePageProps> = ({
  customerUser,
  onNavigate,
  onCustomerLogout,
  onOpenCustomerLogin,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data & loading states
  const [loading, setLoading] = useState(customerUser ? true : false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [listings, setListings] = useState<DatabaseCarListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'account' | 'listings' | 'orders' | 'notifications'>('listings');
  const [myOffers, setMyOffers] = useState<PurchaseOffer[]>([]);

  // In-App Notifications State (Priority 5 & 6)
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [sellerActionMsg, setSellerActionMsg] = useState<string | null>(null);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);
  const [sellerResponseNotes, setSellerResponseNotes] = useState<{ [offerId: string]: string }>({});

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGovernorate, setEditGovernorate] = useState('');
  const [editCity, setEditCity] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Management Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone OTP Verification States (Phase 3 Requirement)
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpChallengeCode, setOtpChallengeCode] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [otpFeedback, setOtpFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // OTP Countdown Timer Effect
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Edit Listing Modal States (Phase 5: Resubmit Workflow)
  const [editingListing, setEditingListing] = useState<DatabaseCarListing | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMileage, setEditMileage] = useState<number>(0);
  const [editPaint, setEditPaint] = useState<string>('فبريكا بالكامل');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editPhoneNum, setEditPhoneNum] = useState<string>('');
  const [editListingLoading, setEditListingLoading] = useState(false);
  const [editListingMsg, setEditListingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Official Documents Upload Modal States
  const [docsModalListing, setDocsModalListing] = useState<DatabaseCarListing | null>(null);
  const [licenseFrontInput, setLicenseFrontInput] = useState<string>('');
  const [licenseBackInput, setLicenseBackInput] = useState<string>('');
  const [idUrlInput, setIdUrlInput] = useState<string>('');
  const [statementUrlInput, setStatementUrlInput] = useState<string>('');
  const [docNotesInput, setDocNotesInput] = useState<string>('');
  const [docsUploading, setDocsUploading] = useState(false);
  const [docsMsg, setDocsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account Deletion States (30-day grace period per Law 151/2020)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restoringAccount, setRestoringAccount] = useState(false);

  const handleRequestDeletion = async () => {
    if (!customerUser?.id) return;
    setDeleteLoading(true);
    setDeleteMsg(null);
    const res = await profileService.requestAccountDeletion(customerUser.id, deleteReason);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteMsg({ type: 'success', text: res.message });
      if (profile) {
        setProfile({
          ...profile,
          accountStatus: 'pending_deletion',
          deletionRequestedAt: new Date().toISOString(),
          deletionScheduledDate: res.scheduledDate
        });
      }
      setTimeout(() => {
        setDeleteModalOpen(false);
        onCustomerLogout();
      }, 2500);
    } else {
      setDeleteMsg({ type: 'error', text: res.message });
    }
  };

  const handleCancelDeletion = async () => {
    if (!customerUser?.id) return;
    setRestoringAccount(true);
    const res = await profileService.cancelAccountDeletion(customerUser.id);
    setRestoringAccount(false);
    if (res.success) {
      if (profile) {
        setProfile({
          ...profile,
          accountStatus: 'active',
          deletionRequestedAt: undefined,
          deletionScheduledDate: undefined
        });
      }
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
  };

  const handleDocFileSelected = (field: 'licenseFront' | 'licenseBack' | 'id' | 'statement', file: File | null) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى المسموح به 15 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (field === 'licenseFront') setLicenseFrontInput(result);
      else if (field === 'licenseBack') setLicenseBackInput(result);
      else if (field === 'id') setIdUrlInput(result);
      else if (field === 'statement') setStatementUrlInput(result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditListing = (item: DatabaseCarListing) => {
    setEditingListing(item);
    setEditPrice(Number(item.asking_price) || 0);
    setEditMileage(Number(item.mileage) || 0);
    setEditPaint(item.paint_condition || 'فبريكا بالكامل');
    setEditDesc(item.condition_description || '');
    setEditPhoneNum(item.seller_phone || customerUser?.phone || '');
    setEditListingMsg(null);
  };

  const handleSaveListingChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setEditListingLoading(true);
    setEditListingMsg(null);

    const res = await listingService.updateListingBySeller(editingListing.id, {
      asking_price: Number(editPrice),
      mileage: Number(editMileage),
      paint_condition: editPaint,
      condition_description: editDesc.trim(),
      seller_phone: editPhoneNum.trim()
    });

    setEditListingLoading(false);
    if (res.success) {
      setEditListingMsg({ type: 'success', text: res.message });
      setListings(prev => prev.map(l => l.id === editingListing.id ? {
        ...l,
        asking_price: Number(editPrice),
        mileage: Number(editMileage),
        paint_condition: editPaint,
        condition_description: editDesc.trim(),
        seller_phone: editPhoneNum.trim(),
        status: 'pending_review'
      } : l));
      setTimeout(() => {
        setEditingListing(null);
      }, 1400);
    } else {
      setEditListingMsg({ type: 'error', text: res.message || 'حدث خطأ أثناء حفظ التعديلات.' });
    }
  };

  const handleOpenDocsModal = (item: DatabaseCarListing) => {
    setDocsModalListing(item);
    setLicenseFrontInput(item.official_documents?.licenseFrontUrl || item.official_documents?.licenseUrl || '');
    setLicenseBackInput(item.official_documents?.licenseBackUrl || '');
    setIdUrlInput(item.official_documents?.nationalIdUrl || '');
    setStatementUrlInput(item.official_documents?.bankStatementUrl || '');
    setDocNotesInput(item.official_documents?.notes || '');
    setDocsMsg(null);
  };

  const handleSaveListingDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docsModalListing) return;
    if (!licenseFrontInput.trim() && !licenseBackInput.trim() && !idUrlInput.trim() && !statementUrlInput.trim()) {
      setDocsMsg({ type: 'error', text: 'يرجى إرفاق أو إدخال مستند واحد على الأقل للمتابعة.' });
      return;
    }

    setDocsUploading(true);
    setDocsMsg(null);

    const res = await listingService.uploadListingDocuments(docsModalListing.id, {
      licenseUrl: licenseFrontInput.trim() || licenseBackInput.trim(),
      licenseFrontUrl: licenseFrontInput.trim(),
      licenseBackUrl: licenseBackInput.trim(),
      nationalIdUrl: idUrlInput.trim(),
      bankStatementUrl: statementUrlInput.trim(),
      notes: docNotesInput.trim()
    });

    setDocsUploading(false);
    if (res.success) {
      setDocsMsg({ type: 'success', text: res.message });
      setListings(prev => prev.map(l => l.id === docsModalListing.id ? {
        ...l,
        documents_submitted: true,
        documents_submitted_at: new Date().toISOString(),
        official_documents: {
          licenseUrl: licenseFrontInput.trim() || licenseBackInput.trim(),
          licenseFrontUrl: licenseFrontInput.trim(),
          licenseBackUrl: licenseBackInput.trim(),
          nationalIdUrl: idUrlInput.trim(),
          bankStatementUrl: statementUrlInput.trim(),
          notes: docNotesInput.trim(),
          submittedAt: new Date().toISOString()
        }
      } : l));
      setTimeout(() => {
        setDocsModalListing(null);
      }, 1400);
    } else {
      setDocsMsg({ type: 'error', text: res.message || 'تعذر حفظ المستندات.' });
    }
  };

  // Load Notifications
  const loadNotifications = useCallback(async () => {
    if (!customerUser) return;
    setNotificationsLoading(true);
    const res = await listingService.getCustomerNotifications(customerUser.id);
    if (res.success) {
      setNotifications(res.notifications);
    }
    setNotificationsLoading(false);
  }, [customerUser]);

  // Load Profile & User's Listings
  useEffect(() => {
    if (!customerUser) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const res = await profileService.getProfile(customerUser.id);
      if (res.success && res.profile) {
        setProfile(res.profile);
        setEditFullName(res.profile.fullName);
        setEditPhone(res.profile.phone);
        setEditGovernorate(res.profile.governorate || 'القاهرة');
        setEditCity(res.profile.city || '');
      }

      setListingsLoading(true);
      const listingsRes = await listingService.getCustomerListings(customerUser.id);
      if (listingsRes.success) {
        setListings(listingsRes.listings);
      }
      setListingsLoading(false);

      const offersRes = await listingService.getPurchaseOffers();
      if (offersRes.success) {
        setMyOffers(offersRes.offers);
      }

      const notifsRes = await listingService.getCustomerNotifications(customerUser.id);
      if (notifsRes.success) {
        setNotifications(notifsRes.notifications);
      }

      setLoading(false);
    };

    loadData();
  }, [customerUser]);

  // Real-time updates for customer: incoming offers & notifications (Priority 5 & 6)
  useEffect(() => {
    if (!customerUser) return;
    const channel = supabase
      .channel(`customer-live-${customerUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_offers' },
        async () => {
          const offersRes = await listingService.getPurchaseOffers();
          if (offersRes.success) {
            setMyOffers(offersRes.offers);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_notifications', filter: `user_id=eq.${customerUser.id}` },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      listingService.getPurchaseOffers().then(res => {
        if (res.success) setMyOffers(res.offers);
      });
      loadNotifications();
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [customerUser, loadNotifications]);

  // Seller Respond to Offer (Priority 5 & 6)
  const handleSellerRespondToOffer = async (offerId: string, decision: 'accept' | 'reject') => {
    setRespondingOfferId(offerId);
    setSellerActionMsg(null);
    const defaultNotes = decision === 'accept'
      ? 'موافق مبدئياً على السعر المعروض ونرحب بالمعاينة الفنية الميدانية'
      : 'نعتذر، السعر المقدم غير مناسب';
    const notes = sellerResponseNotes[offerId] || defaultNotes;
    const res = await listingService.respondToOfferBySeller(offerId, decision, notes);
    setRespondingOfferId(null);
    if (res.success) {
      setSellerActionMsg(res.message);
      const offersRes = await listingService.getPurchaseOffers();
      if (offersRes.success) {
        setMyOffers(offersRes.offers);
      }
      loadNotifications();
    } else {
      setSellerActionMsg(`خطأ: ${res.message}`);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    if (!customerUser) return;
    await listingService.markAllNotificationsAsRead(customerUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Filter incoming offers (Seller) vs outgoing offers (Buyer)
  const incomingOffers = useMemo(() => {
    if (!customerUser) return [];
    return myOffers.filter(
      o => o.sellerUserId === customerUser.id || listings.some(l => l.id === o.listingId)
    );
  }, [myOffers, customerUser, listings]);

  const outgoingOffers = useMemo(() => {
    if (!customerUser) return [];
    return myOffers.filter(
      o => o.buyerUserId === customerUser.id || (customerUser.phone && o.buyerPhone === customerUser.phone)
    );
  }, [myOffers, customerUser]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Profile Completion Percentage
  const calculateCompletion = (p: UserProfileData | null): number => {
    if (!p) return 0;
    let score = 30; // Registered account & email
    if (p.fullName && p.fullName !== 'عميل مخلصة') score += 25;
    if (p.phone && p.phone.length >= 10) score += 25;
    if (p.avatarUrl) score += 10;
    if (p.governorate) score += 10;
    return Math.min(score, 100);
  };

  const completionPercent = calculateCompletion(profile);

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customerUser) return;

    setAvatarUploading(true);
    setFeedbackMessage(null);

    const res = await profileService.uploadAvatar(customerUser.id, file);
    if (res.success && res.url) {
      // Update state and profile
      setProfile(prev => prev ? { ...prev, avatarUrl: res.url } : null);
      await profileService.updateProfile(customerUser.id, { avatarUrl: res.url });
      setFeedbackMessage({ type: 'success', text: 'تم تحديث الصورة الشخصية بنجاح.' });
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'فشل رفع الصورة.' });
    }
    setAvatarUploading(false);
  };

  // Profile Update Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUser) return;

    // Validate Phone format (Egyptian mobile)
    const cleanedPhone = editPhone.replace(/[\s\-()]/g, '');
    const isEgyptianPhone = /^(\+20|0020|20)?01[0125]\d{8}$/.test(cleanedPhone) || /^01[0125]\d{8}$/.test(cleanedPhone);

    if (!isEgyptianPhone) {
      setFeedbackMessage({ type: 'error', text: 'يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 01 (11 رقماً).' });
      return;
    }

    if (!editFullName.trim()) {
      setFeedbackMessage({ type: 'error', text: 'يرجى إدخال اسمك الكريم.' });
      return;
    }

    setSaveLoading(true);
    setFeedbackMessage(null);

    const res = await profileService.updateProfile(customerUser.id, {
      fullName: editFullName,
      phone: editPhone,
      governorate: editGovernorate,
      city: editCity
    });

    if (res.success) {
      setProfile(prev => prev ? {
        ...prev,
        fullName: editFullName,
        phone: editPhone,
        governorate: editGovernorate,
        city: editCity
      } : null);
      setIsEditing(false);
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }

    setSaveLoading(false);
  };

  // Phone OTP Request Handler via WhatsApp API
  const handleRequestOtp = async () => {
    const targetPhone = otpPhone.trim() || profile?.phone || customerUser?.phone || '';
    if (!targetPhone) {
      setOtpFeedback({ type: 'error', text: 'يرجى إدخال رقم الهاتف أولاً.' });
      return;
    }

    setOtpLoading(true);
    setOtpFeedback(null);
    const res = await profileService.requestPhoneOtp(targetPhone, customerUser?.id);
    setOtpLoading(false);

    if (res.success) {
      setOtpChallengeCode(res.challengeCode || null);
      setOtpCountdown(45);
      setOtpFeedback({
        type: 'info',
        text: `تم إرسال كود التحقق في رسالة واتساب إلى (${targetPhone}).`
      });
    } else {
      setOtpFeedback({ type: 'error', text: res.message });
    }
  };

  // Phone OTP Verify Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUser) return;

    if (otpInput.trim().length < 4 || otpInput.trim().length > 6) {
      setOtpFeedback({ type: 'error', text: 'يرجى إدخال رمز التحقق المكون من 4 أرقام.' });
      return;
    }

    setOtpLoading(true);
    setOtpFeedback(null);
    const targetPhone = otpPhone.trim() || profile?.phone || customerUser?.phone || '';
    const res = await profileService.verifyPhoneOtp(customerUser.id, targetPhone, otpInput);
    setOtpLoading(false);

    if (res.success) {
      setProfile(prev => prev ? { ...prev, isVerified: true, phone: targetPhone } : null);
      setOtpFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setOtpModalOpen(false);
        setOtpInput('');
        setOtpChallengeCode(null);
      }, 1800);
    } else {
      setOtpFeedback({ type: 'error', text: res.message });
    }
  };

  // Password Change Handler with Re-authentication
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isGoogleAccount = customerUser?.provider === 'google';

    if (!isGoogleAccount && !currentPassword) {
      setPasswordMessage({ type: 'error', text: 'يرجى إدخال كلمة المرور الحالية لتأكيد هويتك.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'يجب ألا تقل كلمة المرور عن 8 أحرف وأرقام.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    let res: { success: boolean; message: string };
    if (!isGoogleAccount && currentPassword) {
      res = await profileService.changePasswordWithReauth(
        profile?.email || customerUser?.email || '',
        currentPassword,
        newPassword
      );
    } else {
      res = await profileService.updatePassword(newPassword);
    }

    if (res.success) {
      setPasswordMessage({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordModalOpen(false), 2000);
    } else {
      setPasswordMessage({ type: 'error', text: res.message });
    }
    setPasswordLoading(false);
  };

  // Withdraw Listing Handler
  const handleWithdrawListing = async (listingId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في سحب هذا الإعلان؟ لن يظهر للمشترين بعد الآن.')) {
      return;
    }

    const res = await listingService.withdrawListing(listingId);
    if (res.success) {
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'withdrawn' } : l));
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
  };

  // Status Badge Mapper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            بانتظار مراجعة الإدارة
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            معتمد للنشر
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <Eye className="w-3 h-3 text-blue-500" />
            معروض للبيع في المعرض
          </span>
        );
      case 'needs_changes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            يلزم تعديل البيانات
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-red-50 text-red-700 border border-red-200">
            <X className="w-3 h-3 text-red-500" />
            إعلان مرفوض
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-500" />
            تم البيع والمخالصة
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
            تم سحب الإعلان
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Guard: Unauthenticated View
  if (!customerUser && !loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-card text-center space-y-5 animate-scaleUp">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-brand-green">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-brand-navy">
              هذه الصفحة مخصصة للمستخدمين المسجلين
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              يرجى تسجيل الدخول أو إنشاء حساب جديد للوصول إلى لوحة «حسابي»، متابعة سياراتك المعروضة، وإدارة بياناتك الشخصية.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={onOpenCustomerLogin}
              className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition"
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
            >
              إنشاء حساب جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              )}
              <span className="font-bold">{feedbackMessage.text}</span>
            </div>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User Avatar & Basic Info */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-navy to-slate-800 text-white flex items-center justify-center font-black text-2xl overflow-hidden border-2 border-white shadow-md">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile?.fullName?.charAt(0) || 'م'}</span>
                  )}
                </div>

                {/* Change Avatar Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1.5 -left-1.5 p-2 rounded-xl bg-brand-green hover:bg-emerald-600 text-white shadow-md transition disabled:opacity-50"
                  title="تغيير الصورة الشخصية"
                >
                  {avatarUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-brand-navy">
                    {profile?.fullName || customerUser?.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-brand-green border border-emerald-200">
                    {profile?.role === 'owner' ? 'مالك المنصة' : profile?.role === 'staff' ? 'موظف عمليات' : 'حساب عميل'}
                  </span>

                  {/* Verification Status Badge (Phase 3 Requirement) */}
                  {profile?.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>رقم هاتف موثق ومؤكد ✓</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPhone(profile?.phone || customerUser?.phone || '');
                        setOtpModalOpen(true);
                        setOtpFeedback(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>رقم الهاتف غير مؤكد — تأكيد الآن (OTP)</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {profile?.email || customerUser?.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile?.phone || customerUser?.phone || 'لم يسجل هاتف'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    عضو منذ {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }) : '2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-brand-green" />
                  <span>تعديل بياناتي</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition"
                >
                  إلغاء التعديل
                </button>
              )}

              <button
                onClick={() => setPasswordModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>كلمة المرور والأمان</span>
              </button>

              <button
                onClick={onCustomerLogout}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>تسجيل الخروج</span>
              </button>
            </div>

          </div>

          {/* Profile Completion Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                نسبة اكتمال ملف الحساب:
              </span>
              <span className="font-black text-brand-green font-mono">{completionPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-brand-green to-emerald-400 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Edit Profile Form Panel (Collapsible) */}
        {isEditing && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-green/30 shadow-card animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-green" />
                <h3 className="font-black text-base text-brand-navy">تحديث البيانات الشخصية</h3>
              </div>
              <span className="text-3xs text-slate-400">البيانات الحساسة كالمعرف والبريد محمية أمنياً</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 block">الاسم بالكامل:</label>
                    <span className="text-3xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      مثبت أمنياً
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={editFullName}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-slate-100/90 cursor-not-allowed"
                    title="الاسم الأساسي مثبت أمنياً لسلامة المعاملات والعقود"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 block">رقم التليفون الأساسي:</label>
                    <span className="text-3xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      مثبت أمنياً
                    </span>
                  </div>
                  <input
                    type="tel"
                    disabled
                    dir="ltr"
                    value={editPhone}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-slate-100/90 cursor-not-allowed text-right"
                    title="رقم الهاتف الأساسي مثبت أمنياً لحسابك"
                  />
                </div>

                {/* Governorate */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">المحافظة:</label>
                  <select
                    value={editGovernorate}
                    onChange={(e) => setEditGovernorate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-brand-green focus:outline-none"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="الدقهلية">الدقهلية</option>
                    <option value="البحيرة">البحيرة</option>
                    <option value="المنوفية">المنوفية</option>
                    <option value="الغربية">الغربية</option>
                    <option value="كفر الشيخ">كفر الشيخ</option>
                    <option value="دمياط">دمياط</option>
                    <option value="بورسعيد">بورسعيد</option>
                    <option value="الإسماعيلية">الإسماعيلية</option>
                    <option value="السويس">السويس</option>
                    <option value="بني سويف">بني سويف</option>
                    <option value="الفيوم">الفيوم</option>
                    <option value="المنيا">المنيا</option>
                    <option value="أسيوط">أسيوط</option>
                    <option value="سوهاج">سوهاج</option>
                    <option value="قنا">قنا</option>
                    <option value="الأقصر">الأقصر</option>
                    <option value="أسوان">أسوان</option>
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">المدينة / الحي:</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="مثال: التجمع الخامس، الشيخ زايد، سموحة..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

              </div>

              {/* Immutable Security Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-3xs text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">الضوابط الأمنية للحساب:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>معرف المستخدم (UID): <span className="font-mono">{customerUser?.id}</span> (غير قابل للتعديل).</li>
                  <li>البريد الإلكتروني موثق عبر Supabase ولا يمكن تغييره إلا بطلب تأكيد منفصل.</li>
                  <li>صلاحيات الحساب محددة بقواعد RLS ولا يمكن ترقيتها من واجهة المستخدم.</li>
                </ul>
              </div>

              {/* Save / Cancel Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  {saveLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ التعديلات</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section: My Submitted Car Listings & Purchase Offers */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* 4 Clean Tabs (Priority 6) */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setProfileActiveTab('account')}
                className={`pb-2.5 px-3 text-xs font-black transition border-b-2 flex items-center gap-1.5 ${
                  profileActiveTab === 'account'
                    ? 'border-brand-green text-brand-navy'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-4 h-4 text-brand-green" />
                <span>حسابي</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('listings')}
                className={`pb-2.5 px-3 text-xs font-black transition border-b-2 flex items-center gap-1.5 ${
                  profileActiveTab === 'listings'
                    ? 'border-brand-green text-brand-navy'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <CarIcon className="w-4 h-4 text-brand-green" />
                <span>إعلاناتي</span>
                <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-slate-100 text-slate-700">
                  {listings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('orders')}
                className={`pb-2.5 px-3 text-xs font-black transition border-b-2 flex items-center gap-1.5 ${
                  profileActiveTab === 'orders'
                    ? 'border-brand-green text-brand-navy'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Tag className="w-4 h-4 text-brand-green" />
                <span>متابعة طلباتي</span>
                {(incomingOffers.length > 0 || outgoingOffers.length > 0) && (
                  <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-emerald-100 text-emerald-800">
                    {incomingOffers.length + outgoingOffers.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('notifications')}
                className={`pb-2.5 px-3 text-xs font-black transition border-b-2 flex items-center gap-1.5 relative ${
                  profileActiveTab === 'notifications'
                    ? 'border-brand-green text-brand-navy'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bell className="w-4 h-4 text-brand-green" />
                <span>الإشعارات</span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-3xs font-black bg-rose-500 text-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>

            {profileActiveTab === 'listings' ? (
              <button
                onClick={() => onNavigate('sell-wizard')}
                className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>اعرض سيارة جديدة للبيع</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('marketplace')}
                className="px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
              >
                <Eye className="w-4 h-4" />
                <span>تصفح المعرض</span>
              </button>
            )}
          </div>

          {/* PENDING DELETION WARNING BANNER */}
          {(profile?.accountStatus === 'pending_deletion' || customerUser?.accountStatus === 'pending_deletion') && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-rose-800">
                    تنبيه: حسابك مسجل حالياً تحت طلب الحذف المجدول
                  </h4>
                  <p className="text-2xs text-rose-700 leading-relaxed">
                    تم تسجيل طلب حذف حسابك وفقاً لقانون حماية البيانات رقم 151 لسنة 2020. الحساب في فترة سماح مدتها 30 يوماً تنتهي في {' '}
                    <span className="font-mono font-bold" dir="ltr">
                      {profile?.deletionScheduledDate ? new Date(profile.deletionScheduledDate).toLocaleDateString('ar-EG') : 'خلال 30 يوماً'}
                    </span>
                    . تم إيقاف إعلاناتك مؤقتاً، ويمكنك التراجع عن أمر الحذف واستعادة نشاط حسابك وإعلاناتك بالكامل بنقرة واحدة أدناه.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelDeletion}
                  disabled={restoringAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${restoringAccount ? 'animate-spin' : ''}`} />
                  <span>{restoringAccount ? 'جاري استعادة الحساب...' : 'التراجع عن الحذف واستعادة الحساب الآن'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: ACCOUNT DETAILS */}
          {profileActiveTab === 'account' && (
            <div className="space-y-6 animate-fadeIn text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-brand-navy text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-green" />
                    <span>البيانات الأساسية للحساب</span>
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">الاسم الكريم:</span>
                      <span className="font-bold">{profile?.fullName || customerUser?.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">البريد الإلكتروني:</span>
                      <span className="font-mono text-2xs">{profile?.email || customerUser?.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">رقم الهاتف:</span>
                      <span className="font-mono font-bold" dir="ltr">{profile?.phone || customerUser?.phone || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">المحافظة والمدينة:</span>
                      <span className="font-bold">{profile?.governorate || 'القاهرة'} — {profile?.city || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">حالة التوثيق:</span>
                      <span>
                        {profile?.isVerified ? (
                          <span className="text-emerald-700 font-bold">موثق برمز OTP ✓</span>
                        ) : (
                          <span className="text-amber-700 font-bold">غير موثق (يلزم OTP)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-brand-navy text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-green" />
                      <span>توثيق الهوية والأمان المصرفي</span>
                    </h4>
                    <p className="text-2xs text-slate-500 leading-relaxed">
                      وفقاً لمعايير الأمان المالي لمنصة «مخلصة»، يشترط توثيق رقم الهاتف برمز OTP لتأكيد الجدية في نشر الإعلانات أو تقديم عروض الشراء لحماية حقوق الأطراف كافة.
                    </p>
                    {!profile?.isVerified && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-2xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>رقم هاتفك يحتاج إلى توثيق سريع</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpPhone(profile?.phone || customerUser?.phone || '');
                            setOtpModalOpen(true);
                            setOtpFeedback(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition text-3xs"
                        >
                          بدء توثيق الهاتف برمز OTP الآن
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition"
                    >
                      تعديل البيانات
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition"
                    >
                      الأمان وكلمة المرور
                    </button>
                  </div>
                </div>

                {/* DATA PRIVACY & ACCOUNT DELETION CARD (LAW 151/2020) */}
                <div className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <h4 className="font-extrabold text-brand-navy text-sm">
                        إدارة البيانات وحذف الحساب (حق النسيان - قانون 151 لسنة 2020)
                      </h4>
                    </div>
                    <span className="text-3xs px-2.5 py-1 rounded-full bg-slate-200 font-bold text-slate-700 self-start sm:self-auto">
                      فترة سماح 30 يوم للتراجع
                    </span>
                  </div>

                  <p className="text-2xs text-slate-500 leading-relaxed">
                    تلتزم منصة «مخلصة» بحماية خصوصية بياناتك الشخصية ومستنداتك. إذا قررت التوقف عن استخدام المنصة، يحق لك طلب حذف حسابك نهائياً. يتم إيقاف الحساب فورياً مع منحك فترة سماح مدتها 30 يوماً للتراجع واستعادة الحساب عند تسجيل الدخول، وبعد انقضاء الـ 30 يوماً دون أي نشاط يتم مسح سجلاتك وملفاتك نهائياً من كافة خوادمنا المشفرة.
                  </p>

                  <div className="pt-1 flex items-center gap-3">
                    {(profile?.accountStatus === 'pending_deletion' || customerUser?.accountStatus === 'pending_deletion') ? (
                      <button
                        type="button"
                        onClick={handleCancelDeletion}
                        disabled={restoringAccount}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${restoringAccount ? 'animate-spin' : ''}`} />
                        <span>{restoringAccount ? 'جاري الإلغاء...' : 'إلغاء طلب الحذف واستعادة الحساب الآن'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteReason('');
                          setDeleteMsg(null);
                          setDeleteModalOpen(true);
                        }}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>طلب حذف الحساب نهائياً</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: LISTINGS FEED */}
          {profileActiveTab === 'listings' && (
            <>
              {listingsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>جاري تحميل قائمة سياراتك من قاعدة البيانات الآمنة...</p>
                </div>
              ) : listings.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <CarIcon className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-sm text-brand-navy">
                    لم تقم بإضافة أي سيارات للبيع بعد
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    هل لديك سيارة محملة بأقساط أو ترغب في تسوية مديونيتها البنكية بأمان؟ ابدأ بعرضها الآن مع مخلصة.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigate('sell-wizard')}
                      className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-900 text-white font-black text-xs shadow-md transition"
                    >
                      اعرض عربيتك الآن مع مخلصة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {listings.map((item) => (
                    <div 
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-200">
                            {item.images && item.images.length > 0 ? (
                              <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <CarIcon className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-brand-navy">
                              {item.make} {item.model} — {item.year}
                            </h4>
                            <div className="text-2xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                              <span>{item.governorate}</span>
                              <span>•</span>
                              <span>{item.mileage.toLocaleString('ar-EG')} كم</span>
                              <span>•</span>
                              <span>تاريخ الإضافة: {new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-left font-bold">
                            <div className="text-sm font-black text-brand-green">
                              {Number(item.asking_price).toLocaleString('ar-EG')} ج.م
                            </div>
                            <div className="text-3xs text-slate-400">السعر المطلوب</div>
                          </div>
                          {renderStatusBadge(item.status)}
                        </div>
                      </div>

                      {/* Review Feedback Alert if changes needed */}
                      {item.review_feedback && item.status === 'needs_changes' && (
                        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-2.5 shadow-sm">
                          <div className="font-extrabold text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <span>ملاحظات التدقيق والمطلوب تعديله من إدارة مخلصة:</span>
                            </div>
                            <button
                              onClick={() => handleOpenEditListing(item)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-2xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل الإعلان وإعادة الإرسال</span>
                            </button>
                          </div>
                          <p className="text-amber-900 text-xs leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/80 font-medium">
                            {item.review_feedback}
                          </p>
                        </div>
                      )}

                      {/* Rejection Alert */}
                      {item.review_feedback && item.status === 'rejected' && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5">
                          <div className="font-extrabold text-rose-900 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>سبب رفض الإعلان:</span>
                          </div>
                          <p className="text-rose-800 text-2xs leading-relaxed">
                            {item.review_feedback}
                          </p>
                        </div>
                      )}

                      {/* Official Documents Section */}
                      <div className={`p-4 rounded-2xl border text-xs space-y-2.5 transition ${
                        item.documents_submitted 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                          : item.documents_requested 
                          ? 'bg-blue-50 border-blue-200 text-blue-950' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-green" />
                            <span className="font-extrabold text-xs">الأوراق والمستندات الرسمية (رخصة، بطاقة، بيان سداد البنك):</span>
                          </div>
                          {item.documents_submitted ? (
                            <span className="text-3xs font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              تم رفع المستندات بنجاح
                            </span>
                          ) : item.documents_requested ? (
                            <span className="text-3xs font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto animate-pulse">
                              <Clock className="w-3 h-3 text-blue-600" />
                              مطلوبة من قِبل إدارة مخلصة
                            </span>
                          ) : (
                            <span className="text-3xs text-slate-400">اختيارية حالياً ومطلوبة عند إتمام البيع</span>
                          )}
                        </div>

                        <p className="text-2xs text-slate-600 leading-relaxed">
                          {item.documents_submitted 
                            ? 'أوراقك الرسمية مسجلة ومحفوظة لدى فريق العمليات بمخلصة لتدقيق تسوية البنك وفك الحظر.'
                            : 'لتسريع تسوية المديونية وتأكيد جدية المشترين، يمكنك رفع صور رخصة السيارة والبطاقة القومية وبيان السداد المعجل مباشرة عبر الموقع أو إرسالها لواتساب مخلصة.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDocsModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-2xs transition flex items-center gap-1.5 shadow-sm"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{item.documents_submitted ? 'تحديث أو استعراض المستندات' : 'رفع المستندات من الجهاز'}</span>
                          </button>

                          <a
                            href={`https://wa.me/201018898144?text=${encodeURIComponent(`مرحباً إدارة مخلصة، أرغب في إرسال المستندات الرسمية لإعلاني كود: ${item.id.slice(0, 8)} (${item.make} ${item.model} ${item.year})`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-2xs transition flex items-center gap-1.5"
                          >
                            <span>إرسال المستندات عبر واتساب</span>
                          </a>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-3xs text-slate-400 font-mono">
                          كود الإعلان: {item.id.slice(0, 8)}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.status === 'needs_changes' && (
                            <button
                              onClick={() => handleOpenEditListing(item)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-2xs font-black transition flex items-center gap-1 shadow-sm"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>تعديل الإعلان</span>
                            </button>
                          )}

                          {item.status !== 'withdrawn' && item.status !== 'sold' && (
                            <button
                              onClick={() => handleWithdrawListing(item.id)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-2xs font-bold transition flex items-center gap-1"
                              title="سحب الإعلان من المعرض مع الاحتفاظ ببياناته بسجلات المنصة"
                            >
                              <X className="w-3 h-3" />
                              <span>سحب الإعلان</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => onNavigate('marketplace')}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-2xs font-bold transition flex items-center gap-1"
                          >
                            <span>معاينة في المعرض</span>
                            <ChevronLeft className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: TRACK REQUESTS & OFFERS (PRIORITY 5 & 6) */}
          {profileActiveTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              {sellerActionMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  {sellerActionMsg}
                </div>
              )}

              {/* SECTION 1: INCOMING OFFERS ON SELLER LISTINGS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-black text-sm text-brand-navy flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-green" />
                    <span>عروض الشراء الواردة على سياراتي المعروضة</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-bold">
                    {incomingOffers.length} عروض
                  </span>
                </div>

                {incomingOffers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    لا توجد عروض شراء واردة على سياراتك حالياً. بمجرد قيام مشتري بتقديم عرض وتمريره من فريق مخلصة سيظهر هنا لاتخاذ قرارك.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {incomingOffers.map((offer) => {
                      const isPendingSellerResponse = offer.status === 'communicated_to_seller' || offer.status === 'new';
                      return (
                        <div
                          key={offer.id}
                          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-brand-navy">{offer.carTitle}</span>
                                <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-slate-100 text-slate-600">
                                  {offer.caseReference}
                                </span>
                              </div>
                              <div className="text-2xs text-slate-500 font-medium mt-1">
                                مشتري معتمد: <strong>{offer.buyerName}</strong> • طريقة السداد: {offer.paymentPreference === 'cash_at_bank' ? 'سداد مباشر بالبنك' : 'طلب تمويل جديد'}
                              </div>
                            </div>

                            <div className="text-left font-mono">
                              <span className="text-sm font-black text-emerald-600 block">
                                العرض: {offer.offeredPrice.toLocaleString('ar-EG')} ج.م
                              </span>
                              <span className="text-3xs text-slate-400">
                                السعر المطلوب: {offer.askingPrice.toLocaleString('ar-EG')} ج.م
                              </span>
                            </div>
                          </div>

                          {offer.notes && (
                            <div className="p-2.5 rounded-xl bg-slate-50 text-2xs text-slate-600 border border-slate-100">
                              <strong>ملاحظات المشتري: </strong> {offer.notes}
                            </div>
                          )}

                          {/* Seller Action Controls (Priority 5 & 6) */}
                          {isPendingSellerResponse ? (
                            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                              <div className="text-2xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>تم تمرير هذا العرض لك من مستشار مخلصة — يرجى تحديد موقفك:</span>
                              </div>

                              <input
                                type="text"
                                value={sellerResponseNotes[offer.id] || ''}
                                onChange={(e) => setSellerResponseNotes(prev => ({ ...prev, [offer.id]: e.target.value }))}
                                placeholder="أضف ملاحظة للمشتري ومستشار مخلصة (اختياري)..."
                                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                              />

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={respondingOfferId === offer.id}
                                  onClick={() => handleSellerRespondToOffer(offer.id, 'accept')}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {respondingOfferId === offer.id ? (
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>✓ قبول العرض مبدئياً</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={respondingOfferId === offer.id}
                                  onClick={() => handleSellerRespondToOffer(offer.id, 'reject')}
                                  className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>✕ اعتذار عن العرض</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-2xs">
                              <span className="text-slate-400 font-mono">
                                تاريخ التقديم: {new Date(offer.createdAt).toLocaleString('ar-EG')}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full font-bold ${
                                offer.status === 'accepted' || offer.status === 'accepted_by_seller'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {offer.status === 'accepted' || offer.status === 'accepted_by_seller'
                                  ? '✓ وافقت على العرض مبدئياً'
                                  : '✕ تم الاعتذار عن العرض'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: OUTGOING OFFERS SUBMITTED BY ME */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-black text-sm text-brand-navy flex items-center gap-2">
                    <Eye className="w-4 h-4 text-brand-green" />
                    <span>عروض الشراء التي قدمتها على سيارات المعرض</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-bold">
                    {outgoingOffers.length} عروض
                  </span>
                </div>

                {outgoingOffers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    لم تقم بتقديم أي عروض شراء حتى الآن. تصفح المعرض وقدم عرضك على أي سيارة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {outgoingOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-extrabold text-brand-navy">{offer.carTitle}</div>
                          <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold ${
                            offer.status === 'accepted' || offer.status === 'accepted_by_seller'
                              ? 'bg-emerald-100 text-emerald-800'
                              : offer.status === 'declined' || offer.status === 'rejected_by_seller'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {offer.status === 'accepted' || offer.status === 'accepted_by_seller' ? '🎉 وافق البائع مبدئياً' :
                             offer.status === 'declined' || offer.status === 'rejected_by_seller' ? 'تم الاعتذار' :
                             offer.status === 'communicated_to_seller' ? 'تم إرسال العرض للبائع' : 'قيد المراجعة'}
                          </span>
                        </div>
                        <div className="flex justify-between text-2xs text-slate-500">
                          <span>عرضك: <strong className="font-mono text-emerald-700">{offer.offeredPrice.toLocaleString('ar-EG')} ج.م</strong></span>
                          <span>السعر المطلوب: <strong className="font-mono text-slate-700">{offer.askingPrice.toLocaleString('ar-EG')} ج.م</strong></span>
                        </div>
                        <div className="text-3xs text-slate-400">
                          * حماية الخصوصية (Priority 8): رقم هاتف البائع محمي ولا يتم كشفه؛ التنسيق يتم مباشرة بإشراف مخلصة.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: IN-APP NOTIFICATIONS (PRIORITY 5 & 6) */}
          {profileActiveTab === 'notifications' && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-green" />
                  <h4 className="font-black text-sm text-brand-navy">سجل الإشعارات والتنبيهات المباشرة</h4>
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-bold transition flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-brand-green" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
              </div>

              {notificationsLoading ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-green" />
                  <p>جاري تحميل الإشعارات...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                  <h5 className="font-bold text-slate-700">لا توجد إشعارات جديدة حالياً</h5>
                  <p className="text-2xs text-slate-500">ستصلك هنا تنبيهات فورية عند مراجعة إعلاناتك أو تقديم عروض شراء عليها.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition space-y-1 ${
                        n.isRead
                          ? 'bg-white border-slate-200'
                          : 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${n.isRead ? 'bg-slate-300' : 'bg-brand-green animate-pulse'}`} />
                          <h5 className="font-extrabold text-brand-navy text-xs">{n.title}</h5>
                        </div>
                        <span className="text-3xs text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-600 leading-relaxed pr-4">
                        {n.message}
                      </p>

                      {/* Direct Problem / Action Navigator */}
                      {(n.title.includes('تعديل') || n.type === 'listing_status_changed') ? (
                        <button
                          type="button"
                          onClick={() => {
                            const matchingListing = listings.find(l => l.id === n.relatedId);
                            if (matchingListing) {
                              handleOpenEditListing(matchingListing);
                            } else {
                              onNavigate('seller-portal');
                            }
                          }}
                          className="mt-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-2xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>🚨 حل المشكلة وتعديل الإعلان فوراً</span>
                        </button>
                      ) : (n.title.includes('مستندات') || n.title.includes('أوراق')) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const matchingListing = listings.find(l => l.id === n.relatedId);
                            if (matchingListing) {
                              handleOpenDocsModal(matchingListing);
                            } else {
                              onNavigate('seller-portal');
                            }
                          }}
                          className="mt-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-2xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>📄 إرفاق المستندات المطلوبة</span>
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Password Management Modal (Phase 4 Compliant) */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-elevated border border-slate-100 p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">
                  {customerUser?.provider === 'google' ? 'أمان الحساب (Google)' : 'تغيير كلمة المرور'}
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {passwordMessage.text}
              </div>
            )}

            {customerUser?.provider === 'google' ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-blue-950">
                  <div className="flex items-center gap-2 font-black text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>حسابك مسجل ومدار عبر خدمة Google الآمنة</span>
                  </div>
                  <p className="text-2xs text-blue-800 leading-relaxed">
                    تسجيل الدخول يتم مباشرة بنقرة واحدة عبر حساب Google الخاص بك (Single Sign-On). لا يتطلب حسابك كلمة مرور منفصلة أو إدخال كلمة مرور حالية.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-2xs text-slate-600 leading-relaxed">
                  إذا كنت ترغب في إنشاء كلمة مرور إضافية لتسجيل الدخول بالبريد مستقبلاً، يمكنك النقر على الزر أدناه لإرسال رابط إنشاء كلمة المرور إلى بريدك.
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    إغلاق
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (profile?.email || customerUser?.email) {
                        setPasswordLoading(true);
                        const res = await profileService.sendPasswordResetEmail(profile?.email || customerUser.email);
                        setPasswordLoading(false);
                        setPasswordMessage({ type: res.success ? 'success' : 'error', text: res.message });
                      }
                    }}
                    disabled={passwordLoading}
                    className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold shadow-md transition disabled:opacity-60"
                  >
                    {passwordLoading ? 'جاري الإرسال...' : 'إرسال رابط تعيين كلمة مرور'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">كلمة المرور الحالية:</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية لتأكيد الهوية"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">كلمة المرور الجديدة:</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف وأرقام على الأقل"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">تأكيد كلمة المرور الجديدة:</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold shadow-md transition disabled:opacity-60"
                  >
                    {passwordLoading ? 'جاري التحقق...' : 'تحديث كلمة المرور'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (profile?.email) {
                        const res = await profileService.sendPasswordResetEmail(profile.email);
                        setPasswordMessage({ type: res.success ? 'success' : 'error', text: res.message });
                      }
                    }}
                    className="text-3xs text-brand-green hover:underline font-bold"
                  >
                    هل نسيت كلمة المرور؟ أرسل رابط إعادة التعيين إلى بريدك الإلكتروني
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Phone OTP Verification Modal (Phase 3 Requirement) */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-elevated border border-slate-100 p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">
                  تأكيد وتوثيق رقم الهاتف
                </h3>
              </div>
              <button
                onClick={() => setOtpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {otpFeedback && (
              <div className={`p-3 rounded-xl border text-xs font-bold leading-relaxed ${
                otpFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : otpFeedback.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {otpFeedback.text}
              </div>
            )}

            {/* Staging Provider Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">مزود التحقق:</span>
                <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-amber-100 text-amber-800">
                  Staging SMS Provider
                </span>
              </div>
              <p className="text-3xs text-slate-500 leading-relaxed">
                نظراً لعدم ربط مفاتيح بوابة SMS خارجية مدفوعة حالياً، تم تفعيل وضع التوثيق الآمن (Staging Mode). الرمز المولد يظهر لك مباشرة أدناه لاختبار وتفعيل الحساب.
              </p>
              {otpChallengeCode && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-center font-mono font-black text-lg text-emerald-900 tracking-widest select-all">
                  رمز التحقق: {otpChallengeCode}
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">رقم الهاتف المراد توثيقه:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={otpPhone || profile?.phone || ''}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-green focus:outline-none text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpLoading || otpCountdown > 0}
                    className="px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs whitespace-nowrap transition disabled:opacity-50"
                  >
                    {otpCountdown > 0 ? `إعادة الإرسال (${otpCountdown}s)` : 'طلب الرمز'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">أدخل رمز التحقق (6 أرقام):</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  dir="ltr"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-widest px-3.5 py-3 rounded-xl border border-slate-200 text-base font-mono font-black focus:ring-2 focus:ring-brand-green focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpInput.length < 6}
                  className="px-5 py-2 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold shadow-md transition disabled:opacity-60"
                >
                  {otpLoading ? 'جاري التحقق...' : 'تأكيد الرمز وتوثيق الحساب'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Edit Listing Modal (Needs Changes Resubmission Workflow) */}
      {editingListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">
                  تعديل بيانات الإعلان وإعادة الإرسال
                </h3>
              </div>
              <button
                onClick={() => setEditingListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <span className="font-black text-brand-navy block">
                {editingListing.make} {editingListing.model} ({editingListing.year})
              </span>
              <span className="text-3xs text-slate-500 font-mono">كود الإعلان: {editingListing.id}</span>
            </div>

            {editingListing.review_feedback && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block">ملاحظات الإدارة المطلوب تعديلها:</span>
                <p className="text-amber-800 text-2xs leading-relaxed">{editingListing.review_feedback}</p>
              </div>
            )}

            {editListingMsg && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${
                editListingMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {editListingMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveListingChanges} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">السعر المطلوب الجديد (ج.م):</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-green focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">قراءة العداد (كم):</label>
                  <input
                    type="number"
                    required
                    value={editMileage}
                    onChange={(e) => setEditMileage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">حالة الدهان:</label>
                  <select
                    value={editPaint}
                    onChange={(e) => setEditPaint(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-brand-green focus:outline-none"
                  >
                    <option value="فبريكا بالكامل">فبريكا بالكامل (بدون أي رش)</option>
                    <option value="رش خارجي نظافة">رش خارجي نظافة (بدون دواخل)</option>
                    <option value="دهان أجزاء محددة">دهان أجزاء محددة (إكصدامات/رفرف)</option>
                    <option value="رش كلي">رش كلي</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">رقم هاتف التواصل:</label>
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    value={editPhoneNum}
                    onChange={(e) => setEditPhoneNum(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-green focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">توضيحات ووصف حالة السيارة المحدث:</label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="اكتب التوضيحات والتعديلات التي طلبتها الإدارة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={editListingLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  {editListingLoading ? 'جاري الحفظ والإرسال...' : 'حفظ التعديلات وإعادة الإرسال للمراجعة'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Official Documents Upload Modal */}
      {docsModalListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">
                  رفع المستندات والأوراق الرسمية للسيارة
                </h3>
              </div>
              <button
                onClick={() => setDocsModalListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <span className="font-black text-brand-navy block">
                {docsModalListing.make} {docsModalListing.model} ({docsModalListing.year})
              </span>
              <p className="text-3xs text-slate-500 mt-0.5">
                المستندات محفوظة بسرية تامة ومخصصة فقط لمراجعة مستشار تسوية البنك وفك الحظر.
              </p>
            </div>

            {docsMsg && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${
                docsMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {docsMsg.text}
              </div>
            )}

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold text-emerald-950 block">
                  خصوصية تامة وحماية مشفرة
                </span>
                <p className="text-3xs text-emerald-800 leading-relaxed">
                  هذه المستندات مشفرة ولا تظهر لأي زائر أو مشترٍ في الموقع. مخصصة حصرياً لفريق إدارة مخلصة لمطابقة السجل واعتماد شارة (أوراق مفحوصة وموثقة).
                </p>
              </div>
            </div>

            {docsMsg && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${
                docsMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {docsMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveListingDocs} className="space-y-4 text-xs max-h-[60vh] overflow-y-auto px-1">
              {/* 1. License Front */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <span>1. رخصة السيارة (الوجه الأمامي)</span>
                    <span className="text-3xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">أساسي</span>
                  </label>
                  {licenseFrontInput && (
                    <button
                      type="button"
                      onClick={() => setLicenseFrontInput('')}
                      className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>

                {licenseFrontInput ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    {licenseFrontInput.startsWith('data:image') || licenseFrontInput.startsWith('http') ? (
                      <img src={licenseFrontInput} alt="رخصة السيارة - أمامي" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">PDF</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        تم إرفاق الوجه الأمامي
                      </span>
                      <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                        {licenseFrontInput.slice(0, 45)}...
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
                      onChange={(e) => handleDocFileSelected('licenseFront', e.target.files?.[0] || null)}
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
                  {licenseBackInput && (
                    <button
                      type="button"
                      onClick={() => setLicenseBackInput('')}
                      className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>

                {licenseBackInput ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    {licenseBackInput.startsWith('data:image') || licenseBackInput.startsWith('http') ? (
                      <img src={licenseBackInput} alt="رخصة السيارة - خلفي" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">PDF</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        تم إرفاق الوجه الخلفي
                      </span>
                      <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                        {licenseBackInput.slice(0, 45)}...
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
                      onChange={(e) => handleDocFileSelected('licenseBack', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 3. National ID */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <span>3. بطاقة الرقم القومي للمالك (سارية)</span>
                    <span className="text-3xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">للتحقق الإداري فقط</span>
                  </label>
                  {idUrlInput && (
                    <button
                      type="button"
                      onClick={() => setIdUrlInput('')}
                      className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>

                {idUrlInput ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    {idUrlInput.startsWith('data:image') || idUrlInput.startsWith('http') ? (
                      <img src={idUrlInput} alt="بطاقة الرقم القومي" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">مستند</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        تم إرفاق البطاقة القومية
                      </span>
                      <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                        {idUrlInput.slice(0, 45)}...
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
                      onChange={(e) => handleDocFileSelected('id', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 4. Bank Statement / Payoff Quote */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <span>4. بيان السداد المعجل / مديونية البنك</span>
                    <span className="text-3xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">لتسوية التمويل</span>
                  </label>
                  {statementUrlInput && (
                    <button
                      type="button"
                      onClick={() => setStatementUrlInput('')}
                      className="text-3xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>

                {statementUrlInput ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    {statementUrlInput.startsWith('data:image') || statementUrlInput.startsWith('http') ? (
                      <img src={statementUrlInput} alt="بيان البنك" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">PDF</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-2xs font-extrabold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        تم إرفاق بيان السداد البنكي
                      </span>
                      <p className="text-3xs text-slate-500 truncate mt-0.5 dir-ltr text-right">
                        {statementUrlInput.slice(0, 45)}...
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
                      onChange={(e) => handleDocFileSelected('statement', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 5. Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ملاحظات إضافية حول الأوراق والتوكيلات (اختياري):</label>
                <textarea
                  rows={2}
                  value={docNotesInput}
                  onChange={(e) => setDocNotesInput(e.target.value)}
                  placeholder="مثال: الرخصة سارية حتى شهر 8، والبيان البنكي مستخرج بتاريخ أمس..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="text-2xs text-emerald-900 font-bold">تفضل الإرسال المباشر عبر واتساب؟</span>
                <a
                  href={`https://wa.me/201018898144?text=${encodeURIComponent(`أرغب في إرسال صور الأوراق والمستندات لإعلاني: ${docsModalListing.make} ${docsModalListing.model} (كود: ${docsModalListing.id.slice(0, 8)})`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-3xs font-black text-emerald-800 underline hover:text-emerald-950"
                >
                  فتح واتساب مخلصة
                </a>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDocsModalListing(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={docsUploading}
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  {docsUploading ? 'جاري الحفظ...' : 'حفظ المستندات وإشعار الإدارة'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 4. ACCOUNT DELETION CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-rose-100 shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-rose-900">
                طلب حذف الحساب نهائياً
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف حسابك من منصة «مخلصة»؟
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-2xs text-rose-800 space-y-2 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>ضوابط الحذف وفقاً للقانون رقم 151 لسنة 2020:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pr-1 text-slate-700">
                <li>يتم إيقاف حسابك وإخفاء سياراتك المعروضة من السوق فورياً.</li>
                <li>يُمنح حسابك <strong>مهلة سماح مدتها 30 يوماً</strong> تبدأ من الآن.</li>
                <li>خلال الـ 30 يوماً، يمكنك التراجع واستعادة حسابك بمجرد تسجيل الدخول.</li>
                <li>بعد انقضاء الـ 30 يوماً دون نشاط، تُحذف بياناتك ومستنداتك نهائياً وبلا رجعة.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-xs text-slate-700 block">سبب الحذف (اختياري لمساعدتنا على تحسين الخدمة):</label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="مثال: قمت ببيع سيارتي بالفعل، أو لم أعد بحاجة للخدمة..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
              />
            </div>

            {deleteMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${deleteMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {deleteMsg.text}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                إلغاء والاحتفاظ بحسابي
              </button>
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'جاري تسجيل الطلب...' : 'تأكيد طلب الحذف (مهلة 30 يوم)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerProfilePage;
