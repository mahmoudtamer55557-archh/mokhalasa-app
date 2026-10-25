import React, { useState, useRef, useEffect } from 'react';
import { geminiService, ChatMessage } from '../../services/geminiService';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { 
  MessageSquare, Sparkles, X, Send, Bot, User, 
  HelpCircle, ExternalLink, ShieldCheck, PhoneCall 
} from 'lucide-react';

interface CustomerSupportChatbotProps {
  lang?: 'ar' | 'en';
}

const QUICK_QUESTIONS = [
  'كيف تعمل منصة مخلصة للتسوية البنكية؟',
  'ما هي خطوات بيع سيارة عليها حظر بيع؟',
  'كيف يضمن المشتري حقه عند سداد المديونية؟',
  'ما هي الأوراق الرسمية المطلوبة لتوثيق الإعلان؟'
];

export const CustomerSupportChatbot: React.FC<CustomerSupportChatbotProps> = ({
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'أهلاً بك في مخلصة! أنا المساعد الذكي للمنصة. كيف يمكنني مساعدتك اليوم بخصوص بيع أو شراء سيارات التقسيط والتسوية البنكية المباشرة؟'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputText).trim();
    if (!question || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', text: question }
    ];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    const res = await geminiService.askCustomerSupport(question, newMessages);
    setIsLoading(false);

    if (res.success && res.answer) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: res.answer! }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.message || 'عذراً، لم أتمكن من الحصول على إجابة حالياً. يمكنك التواصل المباشر مع مستشاري مخلصة عبر واتساب على 01018898144.'
        }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-brand-navy hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition duration-200 border border-slate-700/60 active:scale-95"
          aria-label="مساعد مخلصة الذكي"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-brand-green" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="text-xs font-black tracking-wide hidden sm:inline">
            اسأل مساعد مخلصة
          </span>
          <span className="px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green text-3xs font-black">
            AI
          </span>
        </button>
      )}

      {/* Chat Dialog Drawer */}
      {isOpen && (
        <div className="bg-white rounded-3xl w-[92vw] sm:w-[380px] h-[520px] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="p-4 bg-brand-navy text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <MokhalasaSvgLogo className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-xs flex items-center gap-1.5">
                  <span>مساعد مخلصة الذكي</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-3xs font-mono font-bold">Gemini AI</span>
                </h4>
                <p className="text-3xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>دعم سياسات وإجراءات المنصة الرسمية</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-brand-green" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap text-2xs ${
                    m.role === 'user'
                      ? 'bg-brand-navy text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-slate-400 text-3xs p-2 animate-pulse">
                <Bot className="w-4 h-4 text-emerald-500" />
                <span>جاري البحث في سياسات وإجراءات مخلصة...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Pills */}
          {messages.length <= 3 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-slate-700 text-3xs font-bold whitespace-nowrap transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Human Support Fallback */}
          <div className="px-3 py-1.5 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-3xs text-emerald-950 font-bold">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-emerald-600" />
              <span>تحتاج تفاوضاً خاصاً أو استشارة؟</span>
            </span>
            <a
              href="https://wa.me/201018898144?text=مرحباً%20مخلصة،%20أحتاج%20استشارة%20بخصوص%20تسوية%20سيارة."
              target="_blank"
              rel="noreferrer"
              className="text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5"
            >
              <span>واتساب المستشارين</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب استفسارك عن بيع أو شراء سيارات التقسيط..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white transition disabled:opacity-50 flex-shrink-0"
              aria-label="إرسال"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerSupportChatbot;
