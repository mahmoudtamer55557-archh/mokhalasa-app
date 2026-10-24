import React, { useState, useMemo } from 'react';
import { 
  VEHICLE_MAKES, 
  ALLOWED_MODEL_YEARS, 
  getModelsByMake, 
  getTrimsByModelAndYear 
} from '../../data/vehicleCatalog';
import { Search, ChevronDown, Check, AlertCircle, Sparkles, Shield } from 'lucide-react';

interface VehicleMakeModelPickerProps {
  selectedMakeId: string;
  onSelectMakeId: (makeId: string) => void;
  selectedModelId: string;
  onSelectModelId: (modelId: string) => void;
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
  selectedTrim: string;
  onSelectTrim: (trim: string) => void;
  isCustomTrim: boolean;
  setIsCustomTrim: (custom: boolean) => void;
  customTrimText: string;
  setCustomTrimText: (text: string) => void;
  // Specifications
  transmission: 'أوتوماتيك' | 'مانيوال' | 'CVT' | 'ثنائي التعشيق (Dual Clutch)';
  setTransmission: (trans: 'أوتوماتيك' | 'مانيوال' | 'CVT' | 'ثنائي التعشيق (Dual Clutch)') => void;
  fuelType: 'بنزين' | 'هايبرد (هجين)' | 'كهرباء بالكامل (EV)' | 'غاز طبيعي' | 'ديزل';
  setFuelType: (fuel: 'بنزين' | 'هايبرد (هجين)' | 'كهرباء بالكامل (EV)' | 'غاز طبيعي' | 'ديزل') => void;
  engineSize: string;
  setEngineSize: (size: string) => void;
  mileage: number;
  setMileage: (km: number) => void;
  color: string;
  setColor: (color: string) => void;
  paintCondition: 'فابريكا بالكامل' | 'رش رفرفين نظافة' | 'رش إكصدامات فقط' | 'رش خارجي نظافة' | 'أخرى';
  setPaintCondition: (cond: 'فابريكا بالكامل' | 'رش رفرفين نظافة' | 'رش إكصدامات فقط' | 'رش خارجي نظافة' | 'أخرى') => void;
  chassisVin: string;
  setChassisVin: (vin: string) => void;
  lang?: 'ar' | 'en';
}

const COMMON_COLORS = [
  { name: 'أبيض', hex: '#FFFFFF', border: true },
  { name: 'أسود ميتاليك', hex: '#1E293B', border: false },
  { name: 'فضي ميتاليك', hex: '#E2E8F0', border: true },
  { name: 'رمادي فيراني', hex: '#64748B', border: false },
  { name: 'برونزي ميتاليك', hex: '#92400E', border: false },
  { name: 'أحمر ملوكي', hex: '#DC2626', border: false },
  { name: 'أزرق كحلي', hex: '#1E3A8A', border: false },
  { name: 'ذهبي شامبين', hex: '#D97706', border: false }
];

export const VehicleMakeModelPicker: React.FC<VehicleMakeModelPickerProps> = ({
  selectedMakeId,
  onSelectMakeId,
  selectedModelId,
  onSelectModelId,
  selectedYear,
  onSelectYear,
  selectedTrim,
  onSelectTrim,
  isCustomTrim,
  setIsCustomTrim,
  customTrimText,
  setCustomTrimText,
  transmission,
  setTransmission,
  fuelType,
  setFuelType,
  engineSize,
  setEngineSize,
  mileage,
  setMileage,
  color,
  setColor,
  paintCondition,
  setPaintCondition,
  chassisVin,
  setChassisVin,
  lang: _lang = 'ar'
}) => {

  // Search filter states for dropdowns
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Available models based on selected make
  const availableModels = useMemo(() => {
    if (!selectedMakeId) return [];
    return getModelsByMake(selectedMakeId);
  }, [selectedMakeId]);

  // Available trims based on model and year
  const availableTrims = useMemo(() => {
    if (!selectedModelId) return [];
    return getTrimsByModelAndYear(selectedModelId, selectedYear || undefined);
  }, [selectedModelId, selectedYear]);

  // Filtered makes by search
  const filteredMakes = useMemo(() => {
    const q = makeSearch.trim().toLowerCase();
    if (!q) return VEHICLE_MAKES;
    return VEHICLE_MAKES.filter(
      (m) => m.nameAr.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q)
    );
  }, [makeSearch]);

  // Filtered models by search
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return availableModels;
    return availableModels.filter(
      (m) => m.nameAr.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q)
    );
  }, [modelSearch, availableModels]);

  const selectedMakeObj = VEHICLE_MAKES.find((m) => m.id === selectedMakeId);
  const selectedModelObj = availableModels.find((m) => m.id === selectedModelId);

  // When Make changes, reset Model and Trim
  const handleMakeChange = (makeId: string) => {
    onSelectMakeId(makeId);
    onSelectModelId('');
    onSelectTrim('');
    setIsCustomTrim(false);
    setShowMakeDropdown(false);
    setMakeSearch('');
  };

  // When Model changes, reset Trim
  const handleModelChange = (modelId: string) => {
    onSelectModelId(modelId);
    onSelectTrim('');
    setIsCustomTrim(false);
    setShowModelDropdown(false);
    setModelSearch('');
  };

  // When Trim is picked from catalog, auto-populate transmission & engine if available
  const handleTrimSelect = (trimVal: string) => {
    if (trimVal === 'custom') {
      setIsCustomTrim(true);
      onSelectTrim('الفئة غير مدرجة');
    } else {
      setIsCustomTrim(false);
      onSelectTrim(trimVal);
      const matched = availableTrims.find((t) => t.nameAr === trimVal);
      if (matched) {
        setTransmission(matched.transmission);
        setFuelType(matched.fuelType);
        setEngineSize(matched.engineSize);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Catalog Metadata info note */}
      <div className="bg-emerald-50/60 border border-brand-green/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
        <Sparkles className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-brand-navy">كتالوج المركبات المعتمد للسوق المصري (2018 - 2026): </span>
          <span>
            يتم تحديث الفئات والمواصفات دورياً وفق بيانات الوكلاء ومجلس AMIC. إذا كانت سيارتك فئة خاصة أو مواصفات خليجية، يمكنك اختيار "الفئة غير مدرجة".
          </span>
        </div>
      </div>

      {/* Row 1: Make, Model, Year */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* A. MAKE DROPDOWN */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. الماركة (الشركة المصنعة) <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => setShowMakeDropdown(!showMakeDropdown)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-brand-green focus:ring-2 focus:ring-brand-green"
          >
            <span>
              {selectedMakeObj ? `${selectedMakeObj.nameAr} (${selectedMakeObj.nameEn})` : 'اختر ماركة السيارة...'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {showMakeDropdown && (
            <div className="absolute top-full mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-64 overflow-hidden flex flex-col animate-fadeIn">
              <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالعربية أو English..."
                  value={makeSearch}
                  onChange={(e) => setMakeSearch(e.target.value)}
                  className="w-full text-xs bg-transparent focus:outline-none font-semibold text-slate-800"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto p-1.5 divide-y divide-slate-50">
                {filteredMakes.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">لا توجد ماركة مطابقة</div>
                ) : (
                  filteredMakes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMakeChange(m.id)}
                      className={`w-full px-3 py-2 text-right text-xs rounded-lg flex items-center justify-between hover:bg-emerald-50/50 hover:text-brand-green transition ${
                        selectedMakeId === m.id ? 'bg-emerald-50 text-brand-green font-extrabold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{m.nameAr}</span>
                        <span className="text-2xs text-slate-400 font-mono">({m.nameEn})</span>
                      </div>
                      {selectedMakeId === m.id && <Check className="w-3.5 h-3.5 text-brand-green" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* B. MODEL DROPDOWN (Dependent on Make) */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            2. الموديل (الطراز) <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => {
              if (selectedMakeId) setShowModelDropdown(!showModelDropdown);
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs flex items-center justify-between cursor-pointer transition ${
              !selectedMakeId 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white text-slate-800 hover:border-brand-green'
            }`}
          >
            <span>
              {!selectedMakeId 
                ? 'اختر الماركة أولاً' 
                : selectedModelObj 
                  ? selectedModelObj.nameAr 
                  : 'اختر موديل السيارة...'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {showModelDropdown && selectedMakeId && (
            <div className="absolute top-full mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-64 overflow-hidden flex flex-col animate-fadeIn">
              <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث في موديلات الماركة..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full text-xs bg-transparent focus:outline-none font-semibold text-slate-800"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto p-1.5 divide-y divide-slate-50">
                {filteredModels.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">لا توجد موديلات مطابقة</div>
                ) : (
                  filteredModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModelChange(m.id)}
                      className={`w-full px-3 py-2 text-right text-xs rounded-lg flex items-center justify-between hover:bg-emerald-50/50 hover:text-brand-green transition ${
                        selectedModelId === m.id ? 'bg-emerald-50 text-brand-green font-extrabold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{m.nameAr}</span>
                        <span className="text-3xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                          {m.bodyType}
                        </span>
                      </div>
                      {selectedModelId === m.id && <Check className="w-3.5 h-3.5 text-brand-green" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* C. YEAR DROPDOWN (>= 2018 Only, No Default) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            3. سنة الصنع (الموديل) <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedYear || ''}
            onChange={(e) => onSelectYear(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="">-- اختر سنة الصنع (من 2018 فما بعد) --</option>
            {ALLOWED_MODEL_YEARS.map((y) => (
              <option key={y} value={y}>
                موديل {y}
              </option>
            ))}
          </select>
          <div className="text-3xs text-slate-400 mt-1">
            * المنصة تقبل سيارات موديل 2018 حتى 2026 فقط لضمان سهولة الفحص والتمويل.
          </div>
        </div>

      </div>

      {/* Row 2: Trim / Grade (Dependent on Make, Model, Year) */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">
            4. الفئة والتجهيز (Trim / Grade) <span className="text-red-500">*</span>
          </label>
          {selectedModelId && (
            <span className="text-2xs text-slate-500">
              {availableTrims.length > 0 ? `${availableTrims.length} فئة مسجلة بالكتالوج` : 'فئات عامة'}
            </span>
          )}
        </div>

        {!selectedModelId ? (
          <div className="text-xs text-slate-400 italic p-2 bg-white rounded-xl border border-slate-200 text-center">
            يرجى اختيار الماركة والموديل أولاً لعرض الفئات والتجهيزات المتاحة.
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={isCustomTrim ? 'custom' : selectedTrim}
              onChange={(e) => handleTrimSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="">-- اختر الفئة المطابقة لسيارتك --</option>
              {availableTrims.map((t) => (
                <option key={t.id} value={t.nameAr}>
                  {t.nameAr} ({t.transmission} - {t.engineSize})
                </option>
              ))}
              <option value="custom">الفئة غير مدرجة (إدخال يدوي مخصص)...</option>
            </select>

            {/* Conditional Manual Trim Field if "الفئة غير مدرجة" */}
            {isCustomTrim && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>اكتب اسم الفئة وتجهيزها كما هو مدون في رخصة السيارة أو كتيب الضمان:</span>
                </div>
                <input
                  type="text"
                  placeholder="مثال: خليجي بانوراما جلد، سبورت بلس، فئة خاصة، ليمتد..."
                  value={customTrimText}
                  onChange={(e) => {
                    setCustomTrimText(e.target.value);
                    onSelectTrim(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Additional Vehicle Specifications */}
      <div className="border-t border-slate-100 pt-4 space-y-4">
        <h3 className="text-xs font-black text-brand-navy uppercase tracking-wider">
          المواصفات الفنية وحالة المركبة
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          
          {/* Transmission */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">ناقل الحركة (الفتيس):</label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="أوتوماتيك">أوتوماتيك تقليدي (Automatic)</option>
              <option value="CVT">أوتوماتيك سلس (CVT)</option>
              <option value="ثنائي التعشيق (Dual Clutch)">ثنائي التعشيق (Dual Clutch / DSG)</option>
              <option value="مانيوال">يدوي (Manual M/T)</option>
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">نوع الوقود:</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="بنزين">بنزين 92 / 95</option>
              <option value="هايبرد (هجين)">هايبرد (هجين كهرباء + بنزين)</option>
              <option value="كهرباء بالكامل (EV)">كهرباء بالكامل (EV)</option>
              <option value="غاز طبيعي">غاز طبيعي + بنزين</option>
              <option value="ديزل">ديزل (سولار)</option>
            </select>
          </div>

          {/* Engine Capacity */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">سعة المحرك (CC):</label>
            <input
              type="text"
              value={engineSize}
              onChange={(e) => setEngineSize(e.target.value)}
              placeholder="مثال: 1500 cc أو 1600 cc Turbo"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {/* Mileage */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">قراءة العداد الحالية (كم):</label>
            <input
              type="number"
              value={mileage || ''}
              onChange={(e) => setMileage(Number(e.target.value))}
              placeholder="مثال: 45000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

        </div>

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">لون السيارة الخارجي:</label>
          <div className="flex flex-wrap items-center gap-2">
            {COMMON_COLORS.map((c) => {
              const isSelected = color === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                    isSelected
                      ? 'border-brand-green ring-2 ring-brand-green/30 bg-emerald-50 text-brand-navy'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block"
                    style={{
                      backgroundColor: c.hex,
                      border: c.border ? '1px solid #CBD5E1' : 'none'
                    }}
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}

            {/* Other Color Option with manual text input */}
            <button
              type="button"
              onClick={() => {
                if (COMMON_COLORS.some(c => c.name === color)) {
                  setColor('أخضر بترولي');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                !COMMON_COLORS.some(c => c.name === color)
                  ? 'border-brand-green ring-2 ring-brand-green/30 bg-emerald-50 text-brand-navy'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-400 via-green-400 to-blue-400 inline-block" />
              <span>لون آخر...</span>
            </button>
          </div>

          {!COMMON_COLORS.some(c => c.name === color) && (
            <div className="mt-3 flex items-center gap-2 animate-fadeIn max-w-sm">
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="اكتب لون السيارة بالتحديد (مثلاً: أزرق سماوي، بترولي، موكا...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green/50 text-xs font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green bg-emerald-50/20"
              />
            </div>
          )}
        </div>

        {/* Paint Condition & Optional VIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">حالة الدهان الخارجي (البودي):</label>
            <select
              value={paintCondition}
              onChange={(e) => setPaintCondition(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="فابريكا بالكامل">فابريكا بالكامل (حالة المصنع بدون أي دهانات)</option>
              <option value="رش إكصدامات فقط">رش إكصدامات فقط نظافة (الدواخل والمسطحات فابريكا)</option>
              <option value="رش رفرفين نظافة">رش رفرفين نظافة (الدواخل فابريكا 100%)</option>
              <option value="رش خارجي نظافة">رش خارجي نظافة عدا السقف (دواخل فابريكا)</option>
              <option value="أخرى">حالة أخرى (يتم ذكرها بالملاحظات)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">رقم الشاسيه / VIN (اختياري وآمن):</label>
              <span className="text-3xs text-brand-green font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>محمي ومشفر</span>
              </span>
            </div>
            <input
              type="text"
              value={chassisVin}
              onChange={(e) => setChassisVin(e.target.value)}
              placeholder="مثال: WVWZZZ3CZWE123456"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green uppercase"
            />
            <div className="text-3xs text-slate-400 mt-1">
              * رقم الشاسيه لن يظهر للمشترين علناً؛ يُستخدم فقط لمطابقة سجلات المرور والفحص المعتمد.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default VehicleMakeModelPicker;
