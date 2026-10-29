import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { enforceHttpsProtocol, logInternalError } from './utils/securityGuard';

// Enforce HTTPS / SSL on startup
enforceHttpsProtocol();

// Global Window Unhandled Error & Rejection Interceptor (Silent Internal Logging)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logInternalError('GlobalWindowError', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    logInternalError('UnhandledPromiseRejection', event.reason);
  });
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SecurityErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    logInternalError('ReactErrorBoundary', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans"
        >
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-2xl font-black">
              ✓
            </div>
            <h1 className="text-xl font-black mb-2">حماية المنصة نشطة</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              حدث خطأ تقني عارض وتم تسجيله تلقائياً في سجل الأمان الداخلي دون عرض أي تفاصيل حساسة. يرجى تحديث الصفحة للمتابعة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all"
            >
              إعادة تحميل الصفحة بأمان
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityErrorBoundary>
      <App />
    </SecurityErrorBoundary>
  </StrictMode>
);
