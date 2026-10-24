import React, { useState } from 'react';
import { RequiredDocumentMetadata, ListingVehicleStatus } from '../../types';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Clock, 
  HelpCircle, Trash2, FileCheck, Lock 
} from 'lucide-react';

interface DocumentChecklistProps {
  documents: RequiredDocumentMetadata[];
  vehicleStatus?: ListingVehicleStatus;
  onUpdateDocument: (docId: string, file: File) => void;
  onRemoveDocument: (docId: string) => void;
  lang?: 'ar' | 'en';
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  documents,
  vehicleStatus: _vehicleStatus,
  onUpdateDocument,
  onRemoveDocument,
  lang: _lang = 'ar'
}) => {

  const [activeInfoDocId, setActiveInfoDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`الملف "${file.name}" أكبر من الحد الأقصى المسموح (10 ميجابايت).`);
      return;
    }

    // Validate format
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setUploadError('صيغة الملف غير مدعومة. يرجى رفع صورة (JPG, PNG) أو ملف PDF.');
      return;
    }

    setUploadError(null);
    onUpdateDocument(docId, file);
  };

  const getStatusBadge = (doc: RequiredDocumentMetadata) => {
    if (doc.status === 'uploaded') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-brand-green" />
          <span>تم الرفع بنجاح</span>
        </span>
      );
    }
    if (doc.status === 'under_review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-extrabold bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>قيد المراجعة القانونية</span>
        </span>
      );
    }
    if (doc.isRequired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-extrabold bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span>مطلوب</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-extrabold bg-slate-100 text-slate-600">
        <span>اختياري / يُطلب لاحقاً</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Privacy and Security Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 shadow-md flex items-start gap-3">
        <Lock className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-extrabold text-white flex items-center gap-1.5">
            <span>سرية وحماية المستندات (قانون حماية البيانات رقم 151 لسنة 2020):</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-2xs">
            جميع المستندات المرفوعة (بطاقات الرقم القومي، رخص السيارات، وبيانات المديونية البنكية) يتم تخزينها في خوادم مشفرة معزولة. لن تُنشر هذه الوثائق في الإعلان العام بأي شكل، وتُعرض حصرياً على مستشاري المنصة القانونيين لتدقيق المعاملة.
          </p>
        </div>
      </div>

      {/* Global Upload Error Alert */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="font-bold text-red-600 hover:underline">
            إغلاق
          </button>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const isUploaded = doc.status === 'uploaded';
          const isExpanded = activeInfoDocId === doc.id;

          return (
            <div
              key={doc.id}
              className={`rounded-2xl border transition-all p-4 ${
                isUploaded
                  ? 'bg-emerald-50/40 border-brand-green/30'
                  : doc.isRequired
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Doc Name and Badge */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isUploaded ? 'text-brand-green' : 'text-slate-500'}`} />
                    <span className="font-extrabold text-xs text-brand-navy">{doc.nameAr}</span>
                    {getStatusBadge(doc)}
                  </div>
                  <p className="text-2xs text-slate-500 pr-6">{doc.descriptionAr}</p>
                </div>

                {/* Actions: Info toggle and Upload/Delete button */}
                <div className="flex items-center gap-2 pr-6 sm:pr-0">
                  <button
                    type="button"
                    onClick={() => setActiveInfoDocId(isExpanded ? null : doc.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition text-2xs flex items-center gap-1"
                    title="تفاصيل المستند والجهة المصدرة"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>لماذا يُطلب؟</span>
                  </button>

                  {isUploaded ? (
                    <div className="flex items-center gap-1">
                      <div className="text-3xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-mono max-w-[130px] truncate">
                        {doc.uploadedFileName || 'ملف مرفق'}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveDocument(doc.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        title="حذف المستند"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition">
                      <Upload className="w-3.5 h-3.5 text-brand-green" />
                      <span>رفع المستند</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(doc.id, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

              </div>

              {/* Collapsible Info Drawer: Legal Authority and Purpose */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-3xs text-slate-600 animate-fadeIn">
                  <div>
                    <span className="font-bold text-slate-800">الجهة الرسمية المصدرة: </span>
                    <span>{doc.issuedByAr}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">السند القانوني: </span>
                    <span>{doc.source}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-slate-800">سبب الطلب في الصفقة: </span>
                    <span>{doc.purposeAr}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note on initial submission without bank statement */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
        <FileCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>هل يمكن المتابعة إذا لم تكن صورة بيان المديونية جاهزة الآن؟</strong> نعم، يُسمح بإرسال الإعلان الأولي برفع صورة الرخصة والبطاقة، ويقوم فريق الدعم بمساعدتك في توجيه طلب رسمي للبنك لاستخراج بيان السداد المعجل قبل إتمام الصفقة.
        </span>
      </div>

    </div>
  );
};

export default DocumentChecklist;
