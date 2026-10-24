import React, { useState, useEffect, useMemo } from 'react';
import { Car, DistressedVehicleCase, BuyerInquiryRecord, CustomerUser, InAppNotification } from './types';
import { INITIAL_CARS } from './data/mockData';
import { INITIAL_DISTRESSED_CASES } from './data/mockDistressedCases';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { CarDetailPage } from './pages/CarDetailPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SellCarWizardPage } from './pages/SellCarWizardPage';
import { SellerCasePortalPage } from './pages/SellerCasePortalPage';
import { PrivateOperationsDashboard } from './pages/PrivateOperationsDashboard';
import { StaticPages } from './pages/StaticPages';
import { CustomerLoginModal } from './components/auth/CustomerLoginModal';
import { RegisterPage } from './pages/RegisterPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { supabase } from './services/supabaseClient';
import { mapSupabaseUserToCustomerUser } from './services/authService';
import { listingService } from './services/listingService';
import { MessageSquare, CheckCircle2, X, AlertTriangle, ChevronLeft } from 'lucide-react';

// Helper to parse view from URL hash
const parseViewFromHash = (hash: string): string => {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return 'home';
  if (['staff', 'owner', 'seller-portal', 'marketplace', 'sell-wizard', 'calculator', 'how-it-works', 'faq', 'contact', 'terms', 'privacy', 'car-detail', 'dashboards', 'register', 'profile'].includes(clean)) {
    return clean;
  }
  if (clean === 'register' || clean === 'signup') return 'register';
  if (clean === 'profile' || clean === 'account' || clean === 'my-account') return 'profile';
  if (clean === 'sell') return 'sell-wizard';
  if (clean === 'portal') return 'seller-portal';
  if (clean === 'admin') return 'owner';
  if (clean === 'staff-login') return 'staff';
  return 'home';
};

export function App() {
  const [currentView, setCurrentView] = useState<string>(() => 
    parseViewFromHash(typeof window !== 'undefined' ? window.location.hash : '')
  );
  const [cars, setCars] = useState<Car[]>(INITIAL_CARS);
  const [selectedCar, setSelectedCar] = useState<Car | null>(INITIAL_CARS[0]);
  const [favorites, setFavorites] = useState<string[]>(['car-1']);
  const [userRole, setUserRole] = useState<'seller' | 'buyer' | 'admin' | 'staff' | 'owner'>('seller');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Customer Session State (Google Sign-In)
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('mokhalasa_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [customerAuthTab, setCustomerAuthTab] = useState<'login' | 'register'>('login');
  const [customerLoginOpen, setCustomerLoginOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const clean = window.location.hash.replace(/^#\/?/, '').trim();
      return clean === 'login' || clean === 'customer-login' || clean === 'register' || clean === 'signup';
    }
    return false;
  });

  // Distressed Cases Global Store
  const [distressedCases, setDistressedCases] = useState<DistressedVehicleCase[]>(INITIAL_DISTRESSED_CASES);

  // Global In-App Notifications ("برّه وتوجهني للمشكلة")
  const [globalNotifications, setGlobalNotifications] = useState<InAppNotification[]>([]);
  const [targetProblemCaseRef, setTargetProblemCaseRef] = useState<string | null>(null);
  const [targetProblemAction, setTargetProblemAction] = useState<'edit' | 'documents' | 'offers' | null>(null);

  // Listen for Supabase Authentication State (Vital for Google OAuth Redirect & Session Persistence)
  useEffect(() => {
    // 1. Explicitly check for OAuth Code exchange or OAuth Error in URL (from Google redirect)
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const rawHash = window.location.hash.replace(/^#\/?/, '');
        const hashQueryIdx = rawHash.indexOf('?');
        const hashParams = new URLSearchParams(hashQueryIdx >= 0 ? rawHash.slice(hashQueryIdx) : rawHash);

        const error = urlParams.get('error_description') || urlParams.get('error') || hashParams.get('error_description') || hashParams.get('error');
        if (error) {
          console.error('Google OAuth Error:', error);
          alert(`تنبيه تسجيل الدخول بـ Google:\n${decodeURIComponent(error)}\n\nيرجى التأكد من ضبط الروابط المسموح بها في Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs.`);
          window.history.replaceState(null, '', window.location.pathname + '#/home');
          return;
        }

        const code = urlParams.get('code') || hashParams.get('code');
        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error('Error exchanging OAuth code:', exchangeErr);
          } else if (data?.session?.user) {
            const mapped = mapSupabaseUserToCustomerUser(data.session.user);
            setCustomerUser(mapped);
            try {
              localStorage.setItem('mokhalasa_customer_user', JSON.stringify(mapped));
            } catch {}
            window.history.replaceState(null, '', window.location.pathname + '#/profile');
            setCurrentView('profile');
            return;
          }
        }
      } catch (err) {
        console.error('OAuth Callback processing error:', err);
      }
    };

    handleOAuthCallback();

    // 2. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const mapped = mapSupabaseUserToCustomerUser(session.user);
        setCustomerUser(mapped);
        try {
          localStorage.setItem('mokhalasa_customer_user', JSON.stringify(mapped));
        } catch {}
      }
    });

    // 3. Realtime Auth State Listener (Triggered when Google OAuth redirects back)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const mapped = mapSupabaseUserToCustomerUser(session.user);
        setCustomerUser(mapped);
        try {
          localStorage.setItem('mokhalasa_customer_user', JSON.stringify(mapped));
        } catch {}

        // If URL has OAuth callback fragments, clean them and land on profile
        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname + '#/profile');
          setCurrentView('profile');
        }
      } else if (event === 'SIGNED_OUT') {
        setCustomerUser(null);
        try {
          localStorage.removeItem('mokhalasa_customer_user');
        } catch {}
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync notifications from Database and Active Cases
  useEffect(() => {
    const loadGlobalNotifications = async () => {
      let loadedNotifs: InAppNotification[] = [];
      if (customerUser?.id) {
        const res = await listingService.getCustomerNotifications(customerUser.id);
        if (res.success && res.notifications) {
          loadedNotifs = res.notifications;
        }
      }

      // Also synthesize alerts from in-memory distressedCases if needed
      const problemCases = distressedCases.filter(c => c.status === 'needs_changes');
      const synthesized: InAppNotification[] = problemCases.map(c => ({
        id: `synth-problem-${c.caseReference}`,
        userId: customerUser?.id || 'guest',
        type: 'listing_status_changed',
        title: `مطلوب تعديل على إعلان سيارتك (${c.vehicle.make} ${c.vehicle.model})`,
        message: c.adminFeedback || c.timeline?.find(t => t.status === 'needs_changes')?.reason || 'طلبت إدارة مخلصة تعديل بيانات السعر أو العداد أو حالة السيارة للموافقة على النشر.',
        linkView: 'seller-portal',
        relatedId: c.caseReference,
        isRead: false,
        createdAt: new Date().toISOString()
      }));

      // Merge avoiding duplicates
      const all: InAppNotification[] = [...synthesized];
      for (const n of loadedNotifs) {
        if (!all.some(existing => existing.id === n.id)) {
          all.push(n);
        }
      }
      setGlobalNotifications(all);
    };

    loadGlobalNotifications();
  }, [customerUser, distressedCases]);

  const unreadNotificationsCount = useMemo(() => {
    return globalNotifications.filter(n => !n.isRead).length;
  }, [globalNotifications]);

  // Urgent Problem Case for Sticky Banner
  const urgentNeedsChangesCase = useMemo(() => {
    return distressedCases.find(c => c.status === 'needs_changes') || null;
  }, [distressedCases]);

  // Direct to Problem Handler ("وتوجهني للمشكلة")
  const handleDirectToProblem = (notification: InAppNotification) => {
    const targetRef = notification.relatedId;
    if (notification.type === 'listing_status_changed' || notification.title.includes('تعديل')) {
      setTargetProblemCaseRef(targetRef || null);
      setTargetProblemAction('edit');
      handleNavigate('seller-portal');
    } else if (notification.title.includes('مستندات') || notification.title.includes('أوراق')) {
      setTargetProblemCaseRef(targetRef || null);
      setTargetProblemAction('documents');
      handleNavigate('seller-portal');
    } else if (notification.type === 'new_offer' || notification.title.includes('عرض')) {
      setTargetProblemCaseRef(targetRef || null);
      setTargetProblemAction('offers');
      handleNavigate('seller-portal');
    } else {
      setTargetProblemCaseRef(targetRef || null);
      setTargetProblemAction(null);
      handleNavigate('seller-portal');
    }

    // Mark as read
    setGlobalNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    if (customerUser?.id) {
      listingService.markNotificationAsRead(notification.id);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setGlobalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (customerUser?.id) {
      await listingService.markAllNotificationsAsRead(customerUser.id);
    }
  };

  // Quick Consultation Modal State
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [consultationName, setConsultationName] = useState('');
  const [consultationPhone, setConsultationPhone] = useState('');
  const [consultationBank, setConsultationBank] = useState('كريدي أجريكول مصر');
  const [consultationQuestion, setConsultationQuestion] = useState('');
  const [consultationSubmitted, setConsultationSubmitted] = useState(false);

  // Listen to hash changes for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const clean = window.location.hash.replace(/^#\/?/, '').trim();
      if (clean === 'login' || clean === 'customer-login') {
        setCustomerAuthTab('login');
        setCustomerLoginOpen(true);
      } else if (clean === 'register' || clean === 'signup') {
        setCustomerAuthTab('register');
        setCustomerLoginOpen(true);
      }
      const view = parseViewFromHash(window.location.hash);
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync document title and direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.title = lang === 'ar' 
      ? 'مخلصة | منصة بيع السيارات المحملة بأقساط وتسوية ديون البنوك'
      : 'Mokhalasa | Safe Auto Loan Exit & Financed Car Platform';
  }, [lang]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.location.hash = `#/${view}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCar = (car: Car) => {
    setSelectedCar(car);
    setCurrentView('car-detail');
    window.location.hash = '#/car-detail';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (carId: string) => {
    setFavorites(prev => 
      prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
    );
  };

  const handleListingCreated = (newCar: Car, newCase?: DistressedVehicleCase) => {
    // Note: Do NOT add newCar to public `cars` marketplace yet!
    // The listing remains hidden from public visitors until the admin reviews and approves it in the staff dashboard.
    setSelectedCar(newCar);
    if (newCase) {
      setDistressedCases(prev => [newCase, ...prev]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddBuyerInquiry = (inquiry: BuyerInquiryRecord) => {
    setDistressedCases(prev => prev.map(c => {
      if (c.caseReference === inquiry.caseReference || c.vehicle.id === inquiry.carId) {
        return {
          ...c,
          buyerInquiries: [inquiry, ...(c.buyerInquiries || [])],
          status: c.status === 'listing_approved' ? 'buyer_inquiry_received' : c.status
        };
      }
      return c;
    }));
  };

  // Synchronize case updates and approved revisions with public marketplace
  const handleUpdateCase = (updatedCase: DistressedVehicleCase) => {
    setDistressedCases(prev => prev.map(c => 
      c.caseReference === updatedCase.caseReference ? updatedCase : c
    ));

    // If case has approved vehicle changes, update the public cars array
    if (updatedCase.vehicle) {
      setCars(prev => prev.map(car => {
        if (car.id === updatedCase.vehicle.id || car.id === updatedCase.caseReference) {
          return {
            ...car,
            askingPrice: updatedCase.vehicle.askingPrice,
            mileage: updatedCase.vehicle.mileage,
            description: updatedCase.sellerConditionStory || car.description,
            sellerConditionStory: updatedCase.sellerConditionStory,
            disclosedProblems: updatedCase.disclosedIssues || car.disclosedProblems
          };
        }
        return car;
      }));
    }
  };

  const handleToggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleChangeRole = (role: 'seller' | 'buyer' | 'admin' | 'staff' | 'owner') => {
    setUserRole(role);
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultationSubmitted(true);
    setTimeout(() => {
      setConsultationSubmitted(false);
      setConsultationModalOpen(false);
      setConsultationName('');
      setConsultationPhone('');
      setConsultationQuestion('');
    }, 2800);
  };

  // Listen to Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const customer = mapSupabaseUserToCustomerUser(session.user);
        setCustomerUser(customer);
        try {
          localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
        } catch {}
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const customer = mapSupabaseUserToCustomerUser(session.user);
        setCustomerUser(customer);
        try {
          localStorage.setItem('mokhalasa_customer_user', JSON.stringify(customer));
        } catch {}
      } else {
        setCustomerUser(null);
        try {
          localStorage.removeItem('mokhalasa_customer_user');
        } catch {}
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch verified & approved public listings from Supabase to merge with marketplace
  useEffect(() => {
    let isMounted = true;

    const fetchApprovedListings = async () => {
      const res = await listingService.getPublicListings();
      if (isMounted && res.success) {
        if (res.cars && res.cars.length > 0) {
          setCars(res.cars);
        } else {
          const showDemo = typeof window !== 'undefined' && localStorage.getItem('mokhalasa_show_demo_cars') === 'true';
          setCars(showDemo ? INITIAL_CARS : []);
        }
      }
    };

    fetchApprovedListings();

    // Instant local event listener when listings are approved, rejected, or withdrawn
    const handleListingsUpdated = (e: any) => {
      const { listingId, status } = e.detail || {};
      if (listingId && (status === 'rejected' || status === 'withdrawn' || status === 'pending_review' || status === 'needs_changes')) {
        setCars(prev => prev.filter(c => c.id !== listingId));
      }
      fetchApprovedListings();
    };
    window.addEventListener('mokhalasa-listings-updated', handleListingsUpdated);

    // Subscribe to car_listings changes so when an admin approves/publishes, the marketplace refreshes immediately
    const channel = supabase
      .channel('mokhalasa-public-cars-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'car_listings' }, () => {
        fetchApprovedListings();
      })
      .subscribe();

    // Polling fallback every 12s
    const pollInterval = setInterval(fetchApprovedListings, 12000);

    return () => {
      isMounted = false;
      window.removeEventListener('mokhalasa-listings-updated', handleListingsUpdated);
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const handleCustomerLoginSuccess = (user: CustomerUser) => {
    setCustomerUser(user);
    try {
      localStorage.setItem('mokhalasa_customer_user', JSON.stringify(user));
    } catch {}
  };

  const handleCustomerLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setCustomerUser(null);
    try {
      localStorage.removeItem('mokhalasa_customer_user');
    } catch {}
  };

  // Retrieve any previously saved seller portal credentials
  const lastCaseRef = typeof window !== 'undefined' ? (localStorage.getItem('mokhalasa_last_case_ref') || '') : '';
  const lastAccessKey = typeof window !== 'undefined' ? (localStorage.getItem('mokhalasa_last_access_key') || '') : '';

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg font-cairo text-brand-text selection:bg-brand-green/20 selection:text-brand-navy">
      {/* Universal Public Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        lang={lang}
        onToggleLang={handleToggleLang}
        userRole={userRole}
        onChangeRole={handleChangeRole}
        onOpenConsultation={() => setConsultationModalOpen(true)}
        isStaffSessionActive={['staff', 'owner', 'dashboards'].includes(currentView)}
        customerUser={customerUser}
        onOpenCustomerLogin={(tab = 'login') => {
          setCustomerAuthTab(tab);
          setCustomerLoginOpen(true);
        }}
        onCustomerLogout={handleCustomerLogout}
        notifications={globalNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onNotificationClick={handleDirectToProblem}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      {/* Global Sticky Urgent Alert Banner ("برّه وتوجهني للمشكلة") */}
      {urgentNeedsChangesCase && (
        <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold font-cairo border-b border-amber-700 animate-fadeIn sticky top-[65px] z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-200 flex-shrink-0 animate-bounce" />
            <span>
              تنبيه عاجل من الإدارة: مطلوب تعديل على إعلان سيارتك ({urgentNeedsChangesCase.vehicle.make} {urgentNeedsChangesCase.vehicle.model}) — {urgentNeedsChangesCase.adminFeedback || 'يرجى مراجعة وتحديث بيانات السعر والعداد لتأكيد النشر.'}
            </span>
          </div>
          <button
            onClick={() => {
              setTargetProblemCaseRef(urgentNeedsChangesCase.caseReference);
              setTargetProblemAction('edit');
              handleNavigate('seller-portal');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-950 font-black text-2xs shadow transition flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto"
          >
            <span>🚨 حل المشكلة وتعديل الإعلان فوراً</span>
            <ChevronLeft className="w-3.5 h-3.5 text-amber-700" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* PUBLIC: Home Page */}
        {currentView === 'home' && (
          <HomePage
            cars={cars}
            onSelectCar={handleSelectCar}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigate}
            lang={lang}
          />
        )}

        {/* PUBLIC: Vehicle Catalog */}
        {currentView === 'marketplace' && (
          <MarketplacePage
            cars={cars}
            onSelectCar={handleSelectCar}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigate}
            lang={lang}
          />
        )}

        {/* PUBLIC: Single Car Detail */}
        {currentView === 'car-detail' && selectedCar && (
          <CarDetailPage
            car={selectedCar}
            onBack={() => handleNavigate('marketplace')}
            onBookInspection={(c) => {
              setConsultationQuestion(`أرغب في حجز موعد فحص فني معتمد لسيارة ${c.make} ${c.model} ${c.year} (كود: ${c.id}).`);
              setConsultationModalOpen(true);
            }}
            onAddBuyerInquiry={handleAddBuyerInquiry}
            isFavorite={favorites.includes(selectedCar.id)}
            onToggleFavorite={handleToggleFavorite}
            customerUser={customerUser}
            lang={lang}
          />
        )}

        {/* PUBLIC: Settlement & Fee Calculator */}
        {currentView === 'calculator' && (
          <CalculatorPage
            onNavigate={handleNavigate}
            lang={lang}
          />
        )}

        {/* PUBLIC: Seller Intake Wizard */}
        {currentView === 'sell-wizard' && (
          <SellCarWizardPage
            customerUser={customerUser}
            onListingCreated={handleListingCreated}
            onNavigate={handleNavigate}
            lang={lang}
          />
        )}

        {/* PUBLIC: Seller Request Tracking (متابعة طلبي) */}
        {currentView === 'seller-portal' && (
          <SellerCasePortalPage
            cases={distressedCases}
            onUpdateCase={handleUpdateCase}
            onNavigate={handleNavigate}
            customerUser={customerUser}
            initialCaseRef={lastCaseRef}
            lang={lang}
            targetProblemCaseRef={targetProblemCaseRef}
            targetProblemAction={targetProblemAction}
            onClearTargetProblem={() => {
              setTargetProblemAction(null);
            }}
          />
        )}

        {/* PRIVATE: Operations Dashboard for Staff / Case Officers */}
        {currentView === 'staff' && (
          <PrivateOperationsDashboard
            cases={distressedCases}
            onUpdateCase={handleUpdateCase}
            onNavigate={handleNavigate}
            initialRole="staff"
            lang={lang}
          />
        )}

        {/* PRIVATE: Operations Dashboard for Platform Owner / Executive */}
        {(currentView === 'owner' || currentView === 'dashboards') && (
          <PrivateOperationsDashboard
            cases={distressedCases}
            onUpdateCase={handleUpdateCase}
            onNavigate={handleNavigate}
            initialRole="owner"
            lang={lang}
          />
        )}

        {/* PUBLIC: Registration Page */}
        {currentView === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onOpenLogin={() => {
              setCustomerLoginOpen(true);
            }}
            lang={lang}
          />
        )}

        {/* AUTHENTICATED: Customer Profile & Listings Portal */}
        {currentView === 'profile' && (
          <CustomerProfilePage
            customerUser={customerUser}
            onNavigate={handleNavigate}
            onCustomerLogout={handleCustomerLogout}
            onOpenCustomerLogin={() => setCustomerLoginOpen(true)}
            lang={lang}
          />
        )}

        {/* PUBLIC: Static Informational & Trust Pages */}
        {['how-it-works', 'faq', 'terms', 'privacy', 'contact'].includes(currentView) && (
          <StaticPages
            type={currentView as 'how-it-works' | 'faq' | 'terms' | 'privacy' | 'contact'}
            onNavigate={handleNavigate}
            lang={lang}
          />
        )}
      </main>

      {/* Universal Footer */}
      <Footer
        onNavigate={handleNavigate}
        lang={lang}
      />

      {/* Customer Login / Register Modal */}
      <CustomerLoginModal
        isOpen={customerLoginOpen}
        onClose={() => setCustomerLoginOpen(false)}
        onLoginSuccess={handleCustomerLoginSuccess}
        initialTab={customerAuthTab}
        lang={lang}
      />

      {/* Global Consultation Modal ("اسأل فريق مخلصة") */}
      {consultationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-elevated border border-slate-100 space-y-4 animate-scaleUp">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">
                  استشارة مجانية مع مستشار مخلصة
                </h3>
              </div>
              <button
                onClick={() => setConsultationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {consultationSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto animate-bounce" />
                <h4 className="font-black text-brand-navy text-sm">
                  تم استلام طلب الاستشارة بنجاح!
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  سيقوم مستشار مصرفي متخصص من مخلصة بالتواصل معك هاتفياً للإجابة على استفساراتك حول تسوية البنك وفك الحظر.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-3 text-xs">
                <p className="text-slate-500 text-xs">
                  اسأل فريق مخلصة عن إجراءات السداد المعجل، تفادي غرامات التأخير، أو كيفية بيع سيارتك بدون أي مخاطرة قانونية.
                </p>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">الاسم:</label>
                  <input
                    type="text"
                    required
                    value={consultationName}
                    onChange={(e) => setConsultationName(e.target.value)}
                    placeholder="مثال: م. أحمد عبد الله"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">رقم الهاتف (واتساب):</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={consultationPhone}
                    onChange={(e) => setConsultationPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">البنك أو جهة التمويل الحالية:</label>
                  <select
                    value={consultationBank}
                    onChange={(e) => setConsultationBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
                  >
                    <option value="كريدي أجريكول مصر">بنك كريدي أجريكول مصر</option>
                    <option value="البنك التجاري الدولي CIB">البنك التجاري الدولي (CIB)</option>
                    <option value="بنك قطر الوطني QNB">بنك قطر الوطني الأهلي (QNB)</option>
                    <option value="بنك مصر">بنك مصر</option>
                    <option value="البنك الأهلي المصري">البنك الأهلي المصري</option>
                    <option value="شركة تمويل استهلاكي">شركة تمويل استهلاكي (كونتكت، درايف، فاليو...)</option>
                    <option value="أخرى">جهة أخرى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">سؤالك أو الموقف الحالي:</label>
                  <textarea
                    rows={2}
                    value={consultationQuestion}
                    onChange={(e) => setConsultationQuestion(e.target.value)}
                    placeholder="مثال: عندي قسط متأخر وعايز أعرف إزاي أبيع بدون ما أدخل في مشاكل قانونية..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs shadow-md transition"
                  >
                    طلب التواصل مع مستشار مخلصة
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
