import React, { useState, useRef, useEffect } from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { CustomerUser, InAppNotification } from '../../types';
import { translations } from '../../utils/translations';
import { 
  Menu, X, Globe, PlusCircle, Car as CarIcon, 
  Key, Lock, User, LogOut, ChevronDown, FileText,
  Bell, AlertTriangle, UploadCloud, Tag, CheckCircle2, ChevronLeft
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  userRole?: 'seller' | 'buyer' | 'admin' | 'staff' | 'owner';
  onChangeRole?: (role: any) => void;
  onOpenConsultation?: () => void;
  isStaffSessionActive?: boolean;
  customerUser?: CustomerUser | null;
  onOpenCustomerLogin?: (tab?: 'login' | 'register') => void;
  onCustomerLogout?: () => void;
  notifications?: InAppNotification[];
  unreadNotificationsCount?: number;
  onNotificationClick?: (notification: InAppNotification) => void;
  onMarkAllNotificationsRead?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  lang,
  onToggleLang,
  userRole: _userRole,
  onChangeRole: _onChangeRole,
  onOpenConsultation,
  isStaffSessionActive = false,
  customerUser = null,
  onOpenCustomerLogin,
  onCustomerLogout,
  notifications = [],
  unreadNotificationsCount = 0,
  onNotificationClick,
  onMarkAllNotificationsRead,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const isAr = lang === 'ar';
  const t = translations[lang] || translations.ar;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Public Navigation strictly per Section 1 requirements
  const navItems = [
    { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home' },
    { id: 'marketplace', labelAr: 'تصفح السيارات', labelEn: 'Browse Cars' },
    { id: 'sell-wizard', labelAr: 'بيع عربيتك مع مخلصة', labelEn: 'Sell Your Car' },
    { id: 'how-it-works', labelAr: 'كيف تعمل مخلصة؟', labelEn: 'How It Works' },
    { id: 'blog', labelAr: 'دليل السيارات', labelEn: 'Car Guides' },
    { id: 'faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
    { id: 'contact', labelAr: 'تواصل معنا', labelEn: 'Contact Us' },
  ];

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-border shadow-sm transition-all" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Wordmark (Strictly Wordmark Only - No Icons beside text) */}
          <div className="flex-shrink-0 flex items-center">
            <MokhalasaSvgLogo
              variant="dark"
              height={36}
              onClick={() => handleNav('home')}
              className="hover:opacity-90 transition-opacity cursor-pointer sm:hidden"
            />
            <MokhalasaSvgLogo
              variant="dark"
              height={44}
              onClick={() => handleNav('home')}
              className="hover:opacity-90 transition-opacity cursor-pointer hidden sm:block"
            />
          </div>

          {/* Desktop Navigation Links — Clean Public Flow */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors duration-150 ${
                    active
                      ? 'text-brand-green bg-brand-green/10 font-extrabold'
                      : 'text-brand-text hover:text-brand-navy hover:bg-slate-100'
                  }`}
                >
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Utilities */}
          <div className="hidden lg:flex items-center gap-2.5">
            
            {/* Direct Notifications Center ("برّه") */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(prev => !prev)}
                className={`relative p-2 rounded-xl border text-slate-700 hover:text-brand-navy hover:bg-slate-50 transition flex items-center justify-center ${
                  notifDropdownOpen ? 'bg-slate-100 border-slate-300' : 'border-slate-200'
                }`}
                title={t.nav.notifications}
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-elevated border border-slate-200 p-3 z-50 text-right animate-scaleUp font-cairo">
                  <div className="flex items-center justify-between px-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-black text-xs text-brand-navy">
                      <Bell className="w-4 h-4 text-brand-green" />
                      <span>{t.nav.notifications}</span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onMarkAllNotificationsRead?.()}
                        className="text-3xs text-brand-green hover:underline font-bold"
                      >
                        {t.nav.markAllRead}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1 space-y-1">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notif) => {
                        const isProblem = notif.title.includes('تعديل') || notif.type === 'listing_status_changed';
                        const isDocs = notif.title.includes('مستندات') || notif.title.includes('أوراق');
                        const isOffer = notif.type === 'new_offer' || notif.title.includes('عرض');

                        return (
                          <div 
                            key={notif.id}
                            className={`p-3 rounded-2xl transition space-y-2 ${
                              !notif.isRead ? 'bg-amber-50/60 border border-amber-200/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {isProblem ? (
                                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                ) : isDocs ? (
                                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                    <UploadCloud className="w-4 h-4" />
                                  </div>
                                ) : isOffer ? (
                                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-xs text-brand-navy leading-tight">{notif.title}</div>
                                  <div className="text-3xs text-slate-400 mt-0.5">
                                    {new Date(notif.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                                  </div>
                                </div>
                              </div>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />
                              )}
                            </div>

                            <p className="text-2xs text-slate-600 leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-100">
                              {notif.message}
                            </p>

                            {/* Direct Action Navigator */}
                            <button
                              type="button"
                              onClick={() => {
                                setNotifDropdownOpen(false);
                                onNotificationClick?.(notif);
                              }}
                              className={`w-full py-2 px-3 rounded-xl font-black text-2xs flex items-center justify-center gap-1.5 transition shadow-sm ${
                                isProblem 
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                  : isDocs
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : isOffer
                                  ? 'bg-brand-green hover:bg-emerald-600 text-white'
                                  : 'bg-brand-navy hover:bg-slate-800 text-white'
                              }`}
                            >
                              <span>
                                {isProblem 
                                  ? (isAr ? '🚨 حل المشكلة وتعديل الإعلان فوراً' : '🚨 Resolve Issue & Update Now') 
                                  : isDocs 
                                  ? (isAr ? '📄 إرفاق المستندات المطلوبة' : '📄 Attach Required Docs') 
                                  : isOffer 
                                  ? (isAr ? '💰 فحص العرض واتخاذ قرار' : '💰 Review Offer & Decide') 
                                  : (isAr ? 'عرض التفاصيل' : 'View Details')}
                              </span>
                              <ChevronLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center space-y-1.5">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="text-xs font-bold text-slate-600">{t.nav.noNotifications}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Login / Profile Pill */}
            {customerUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition"
                  title={t.common.myAccount}
                >
                  {customerUser.avatarUrl ? (
                    <img src={customerUser.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-brand-green" />
                  )}
                  <span className="max-w-[110px] truncate">{customerUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white rounded-2xl shadow-elevated border border-slate-200 p-1.5 z-50 text-right animate-scaleUp">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-extrabold text-xs text-brand-navy truncate">{customerUser.name}</div>
                      <div className="text-3xs text-slate-400 font-mono truncate">{customerUser.email}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { handleNav('profile'); setUserDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-right text-xs text-brand-green font-bold hover:bg-emerald-50 rounded-xl flex items-center justify-between transition"
                    >
                      <span>{t.common.myAccount}</span>
                      <User className="w-3.5 h-3.5 text-brand-green" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleNav('marketplace'); setUserDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-right text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
                    >
                      <span>{t.nav.marketplace}</span>
                      <CarIcon className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { onCustomerLogout?.(); setUserDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-right text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-between font-bold"
                    >
                      <span>{t.common.logout}</span>
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenCustomerLogin?.('register')}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition text-slate-700 hover:text-brand-navy hover:bg-slate-50"
                  title={t.common.register}
                >
                  <span>{t.common.register}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCustomerLogin?.('login')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm"
                  title={t.common.login}
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.common.login}</span>
                </button>
              </div>
            )}

            {/* Seller Case Tracker */}
            <button
              type="button"
              onClick={() => handleNav('seller-portal')}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                currentView === 'seller-portal'
                  ? 'border-brand-green bg-emerald-50 text-brand-green'
                  : 'border-slate-200 text-slate-700 hover:text-brand-navy hover:bg-slate-50'
              }`}
              title={t.nav.trackRequest}
            >
              <FileText className="w-3.5 h-3.5 text-brand-green" />
              <span>{t.nav.trackRequest}</span>
            </button>

            {/* Primary Action Button: Distressed Car Sale Intake */}
            <button
              type="button"
              onClick={() => handleNav('sell-wizard')}
              className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-brand-green/20 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAr ? 'عايز أبيع عربيتي' : 'Sell My Car'}</span>
            </button>

            {/* Discrete Operations Console Indicator */}
            {(isStaffSessionActive || ['staff', 'owner', 'dashboards'].includes(currentView)) && (
              <button
                onClick={() => handleNav('staff')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-bold text-3xs border border-slate-700 hover:bg-black transition flex items-center gap-1"
                title={t.nav.opsConsole}
              >
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>{t.nav.opsConsole}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy hover:bg-slate-50 flex items-center gap-1.5 transition"
              title={isAr ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-green" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

          </div>

          {/* Mobile Top Action Bar */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            {/* Mobile Language Switcher Button */}
            <button
              type="button"
              onClick={onToggleLang}
              className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-brand-navy hover:bg-slate-50 flex items-center gap-1 transition"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-green" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Mobile Sell Car Button */}
            <button
              onClick={() => handleNav('sell-wizard')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-2xs sm:text-xs shadow-sm flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 hidden xs:inline" />
              <span>{isAr ? 'بيع عربيتك' : 'Sell Car'}</span>
            </button>

            {/* Mobile Notification Bell ("برّه") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(prev => !prev)}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                aria-label={t.nav.notifications}
                title={t.nav.notifications}
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile User Login or Avatar */}
            {!customerUser ? (
              <button
                onClick={() => onOpenCustomerLogin?.('login')}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-3xs flex items-center gap-1"
                title={t.common.login}
              >
                <User className="w-4 h-4 text-slate-600" />
              </button>
            ) : (
              <button
                onClick={() => handleNav('profile')}
                className="p-1 rounded-xl border border-brand-green/40 bg-emerald-50 text-brand-navy flex items-center justify-center"
                title={t.common.myAccount}
              >
                {customerUser.avatarUrl ? (
                  <img src={customerUser.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-brand-green text-white font-black text-2xs flex items-center justify-center">
                    {customerUser.name.charAt(0)}
                  </div>
                )}
              </button>
            )}

            {/* Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-brand-navy hover:bg-slate-100 transition"
              aria-label={isAr ? 'القائمة' : 'Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Notifications Popover ("برّه") */}
      {notifDropdownOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-4 space-y-2 shadow-elevated animate-fadeIn font-cairo">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-black text-xs text-brand-navy">
              <Bell className="w-4 h-4 text-brand-green" />
              <span>الإشعارات والتنبيهات المباشرة</span>
            </div>
            <div className="flex items-center gap-2">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onMarkAllNotificationsRead?.()}
                  className="text-3xs text-brand-green hover:underline font-bold"
                >
                  تعيين الكل كمقروء
                </button>
              )}
              <button 
                type="button"
                onClick={() => setNotifDropdownOpen(false)}
                className="text-slate-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1 space-y-2">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => {
                const isProblem = notif.title.includes('تعديل') || notif.type === 'listing_status_changed';
                const isDocs = notif.title.includes('مستندات') || notif.title.includes('أوراق');
                const isOffer = notif.type === 'new_offer' || notif.title.includes('عرض');

                return (
                  <div 
                    key={notif.id}
                    className={`p-3 rounded-2xl transition space-y-2 ${
                      !notif.isRead ? 'bg-amber-50/70 border border-amber-200' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isProblem ? (
                          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : isDocs ? (
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                            <UploadCloud className="w-3.5 h-3.5" />
                          </div>
                        ) : isOffer ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-xs text-brand-navy leading-tight">{notif.title}</div>
                          <div className="text-3xs text-slate-400 mt-0.5">
                            {new Date(notif.createdAt).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-2xs text-slate-600 leading-relaxed bg-white/80 p-2 rounded-xl border border-slate-100">
                      {notif.message}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        onNotificationClick?.(notif);
                      }}
                      className={`w-full py-2 px-3 rounded-xl font-black text-2xs flex items-center justify-center gap-1.5 transition shadow-sm ${
                        isProblem 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : isDocs
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : isOffer
                          ? 'bg-brand-green hover:bg-emerald-600 text-white'
                          : 'bg-brand-navy hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>
                        {isProblem 
                          ? '🚨 حل المشكلة وتعديل الإعلان فوراً' 
                          : isDocs 
                          ? '📄 إرفاق المستندات المطلوبة' 
                          : isOffer 
                          ? '💰 فحص العرض واتخاذ قرار' 
                          : 'عرض التفاصيل'}
                      </span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center space-y-1">
                <Bell className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-600">لا توجد إشعارات جديدة حالياً</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          
          {/* Dedicated Language Selector Row */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Globe className="w-4 h-4 text-brand-green" />
              <span>{isAr ? 'لغة المنصة:' : 'Platform Language:'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { if (!isAr) onToggleLang(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  isAr 
                    ? 'bg-brand-navy text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'
                }`}
              >
                العربية 🇪🇬
              </button>
              <button
                type="button"
                onClick={() => { if (isAr) onToggleLang(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  !isAr 
                    ? 'bg-brand-navy text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'
                }`}
              >
                English 🌐
              </button>
            </div>
          </div>

          {/* Customer Profile Mobile Header */}
          {customerUser ? (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div 
                  onClick={() => handleNav('profile')}
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
                >
                  {customerUser.avatarUrl ? (
                    <img src={customerUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center font-bold text-xs">
                      {customerUser.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-extrabold text-xs text-brand-navy flex items-center gap-1">
                      <span>{customerUser.name}</span>
                      <span className="text-3xs text-brand-green bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">{t.common.myAccount}</span>
                    </div>
                    <div className="text-3xs text-slate-400 font-mono">{customerUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => { onCustomerLogout?.(); setMobileMenuOpen(false); }}
                  className="text-3xs text-rose-600 font-bold px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100"
                >
                  {t.common.logout}
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => handleNav('profile')}
                  className="w-full py-2 px-3 rounded-xl bg-brand-green/10 text-brand-green font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t.common.myAccount}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { onOpenCustomerLogin?.('login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>{t.common.login}</span>
              </button>

              <button
                onClick={() => { onOpenCustomerLogin?.('register'); setMobileMenuOpen(false); }}
                className="py-2.5 px-4 rounded-xl border border-brand-green/30 bg-emerald-50 hover:bg-emerald-100 text-brand-green font-bold text-xs"
              >
                {t.common.register}
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full px-3 py-2.5 rounded-lg font-bold text-xs flex items-center justify-between text-right ${
                  currentView === item.id ? 'text-brand-green bg-emerald-50' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{isAr ? item.labelAr : item.labelEn}</span>
                {currentView === item.id && <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => { handleNav('seller-portal'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl border border-brand-green/30 bg-emerald-50 text-brand-green font-bold text-xs text-center flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>{t.nav.trackRequest}</span>
            </button>

            <button
              onClick={() => { handleNav('sell-wizard'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl bg-brand-green text-white font-extrabold text-xs shadow-md text-center"
            >
              {isAr ? 'عايز أبيع عربيتي مع مخلصة' : 'Sell Your Car with Mokhalasa'}
            </button>

            <button
              onClick={() => { handleNav('marketplace'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl bg-brand-navy text-white font-bold text-xs text-center"
            >
              {t.nav.marketplace}
            </button>

            <button
              onClick={() => { 
                if (onOpenConsultation) {
                  onOpenConsultation();
                } else {
                  handleNav('faq');
                }
                setMobileMenuOpen(false); 
              }}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs text-center"
            >
              {isAr ? 'اسأل فريق مخلصة عن الإجراءات' : 'Ask Mokhalasa Team About Bank Procedures'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
