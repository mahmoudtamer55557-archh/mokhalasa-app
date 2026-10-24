import React, { useState } from 'react';
import { PhotoSlotItem, PhotoSlotType } from '../../types';
import { 
  Camera, Trash2, Eye, CheckCircle2, 
  Sparkles, AlertTriangle 
} from 'lucide-react';

interface VehiclePhotoUploaderProps {
  photoSlots: PhotoSlotItem[];
  onUploadPhoto: (slotType: PhotoSlotType, file: File) => void;
  onRemovePhoto: (slotId: string) => void;
  lang?: 'ar' | 'en';
}

export const VehiclePhotoUploader: React.FC<VehiclePhotoUploaderProps> = ({
  photoSlots,
  onUploadPhoto,
  onRemovePhoto,
  lang: _lang = 'ar'
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const uploadedCount = photoSlots.filter((p) => !!p.previewUrl).length;
  const minimumRequired = 4;
  const isMinimumMet = uploadedCount >= minimumRequired;

  const handleFileChange = (slotType: PhotoSlotType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`الصورة "${file.name}" أكبر من 10 ميجابايت.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    onUploadPhoto(slotType, file);
  };

  return (
    <div className="space-y-6">
      
      {/* Photo Quality Guidelines Ribbon */}
      <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-green" />
            <span className="font-extrabold text-xs">إرشادات التقاط صور السيارة لجذب المشترين:</span>
          </div>
          <div className="text-2xs font-bold text-slate-300">
            تم رفع <strong className="text-brand-green font-black">{uploadedCount}</strong> من {minimumRequired} كحد أدنى مطلوب
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-3xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span>تصوير نهاري في إضاءة واضحة والسيارة مغسولة</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span>إبراز لوحة العدادات تظهر الكيلومترات بوضوح</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span>تجنب استخدام الفلاتر أو تعديل العيوب بالذكاء الاصطناعي</span>
          </div>
        </div>
      </div>

      {/* Upload Error Alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-red-600 hover:underline">
            إغلاق
          </button>
        </div>
      )}

      {/* Guided Photo Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photoSlots.map((slot) => {
          const hasImage = !!slot.previewUrl;

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border flex flex-col justify-between overflow-hidden relative transition-all group ${
                hasImage
                  ? 'border-brand-green/40 bg-white shadow-sm'
                  : slot.isRequired
                    ? 'border-slate-300 bg-slate-50/70 hover:border-brand-green hover:bg-emerald-50/30'
                    : 'border-dashed border-slate-300 bg-slate-50/40 hover:border-slate-400'
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                {hasImage ? (
                  <>
                    <img
                      src={slot.previewUrl}
                      alt={slot.labelAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(slot.previewUrl || null)}
                        className="p-1.5 rounded-lg bg-white/90 text-brand-navy hover:bg-white shadow transition"
                        title="تكبير الصورة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(slot.id)}
                        className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-600 shadow transition"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer">
                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-brand-green transition mb-1" />
                    <span className="text-3xs font-extrabold text-slate-600 group-hover:text-brand-navy">
                      التقط أو ارفع
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileChange(slot.slotType, e)}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Badge for required */}
                <div className="absolute top-2 right-2">
                  {hasImage ? (
                    <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : slot.isRequired ? (
                    <span className="text-3xs font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded shadow">
                      مطلوب
                    </span>
                  ) : (
                    <span className="text-3xs font-medium bg-slate-200/90 text-slate-600 px-1.5 py-0.5 rounded">
                      اختياري
                    </span>
                  )}
                </div>
              </div>

              {/* Slot Title and Description Footer */}
              <div className="p-2.5 bg-white border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 truncate" title={slot.labelAr}>
                  {slot.labelAr}
                </div>
                <div className="text-3xs text-slate-400 truncate mt-0.5" title={slot.descriptionAr}>
                  {slot.descriptionAr}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress warning if less than 4 */}
      {!isMinimumMet && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            يلزم رفع <strong>{minimumRequired - uploadedCount}</strong> صور إضافية على الأقل (الحد الأدنى 4 صور رئيسية) لتأكيد الإعلان وفحصه.
          </span>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl relative bg-black">
            <img
              src={previewModalUrl}
              alt="معاينة كاملة"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 left-3 bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehiclePhotoUploader;
