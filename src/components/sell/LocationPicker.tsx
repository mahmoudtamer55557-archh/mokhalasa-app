import React, { useState } from 'react';
import { VehicleLocation } from '../../types';
import { EGYPT_GOVERNORATES, resolveClosestGovernorate } from '../../data/egyptLocations';
import { MapPin, Navigation, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Compass } from 'lucide-react';

interface LocationPickerProps {
  location: VehicleLocation;
  onChangeLocation: (loc: VehicleLocation) => void;
  lang?: 'ar' | 'en';
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onChangeLocation,
  lang: _lang = 'ar'
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'success' | 'denied' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Selected governorate object
  const currentGov = EGYPT_GOVERNORATES.find(
    (g) => g.nameAr === location.governorate
  ) || EGYPT_GOVERNORATES[0];

  // Handle GPS location request on button click
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setStatusMessage('عذراً، خاصية تحديد الموقع الجغرافي غير مدعومة في هذا المتصفح.');
      return;
    }

    setIsLocating(true);
    setGpsStatus('idle');
    setStatusMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          let detectedGov = '';
          let detectedCity = '';

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              detectedGov = addr.state || addr.province || addr.governorate || '';
              detectedCity = addr.city || addr.suburb || addr.town || addr.neighbourhood || '';
            }
          } catch {
            // Fallback if network blocked or aborted
          }

          // If reverse geocoding didn't match directly, resolve closest Egyptian governorate
          const resolvedGov = resolveClosestGovernorate(lat, lng);
          const finalGovName = detectedGov && EGYPT_GOVERNORATES.some(g => g.nameAr.includes(detectedGov))
            ? detectedGov
            : resolvedGov.nameAr;

          const matchedGov = EGYPT_GOVERNORATES.find(g => g.nameAr === finalGovName) || resolvedGov;
          const finalCityName = (detectedCity && matchedGov.cities.find(c => c.includes(detectedCity))) || detectedCity || matchedGov.cities[0] || 'وسط البلد';

          const updatedLoc: VehicleLocation = {
            governorate: matchedGov.nameAr,
            city: finalCityName,
            latitude: lat,
            longitude: lng,
            isGpsLocated: true,
            displayAddress: `${matchedGov.nameAr} - ${finalCityName}`
          };

          onChangeLocation(updatedLoc);
          setGpsStatus('success');
          setStatusMessage(`تم تحديد موقعك بدقة: (${matchedGov.nameAr} - ${finalCityName})`);
        } catch {
          // Offline fallback
          const resolvedGov = resolveClosestGovernorate(lat, lng);
          const updatedLoc: VehicleLocation = {
            governorate: resolvedGov.nameAr,
            city: resolvedGov.cities[0],
            latitude: lat,
            longitude: lng,
            isGpsLocated: true,
            displayAddress: `${resolvedGov.nameAr} - ${resolvedGov.cities[0]}`
          };
          onChangeLocation(updatedLoc);
          setGpsStatus('success');
          setStatusMessage(`تم التقاط الإحداثيات: ${resolvedGov.nameAr}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setStatusMessage('تم رفض إذن الوصول للموقع. يرجى اختيار المحافظة والحي يدوياً من القوائم أدناه.');
        } else {
          setGpsStatus('error');
          setStatusMessage('تعذر الحصول على إشارة GPS الدقيقة. يرجى الاختيار يدوياً من القوائم أدناه.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleGovernorateChange = (govName: string) => {
    const govObj = EGYPT_GOVERNORATES.find((g) => g.nameAr === govName) || EGYPT_GOVERNORATES[0];
    const defaultCity = govObj.cities[0] || '';
    onChangeLocation({
      ...location,
      governorate: govObj.nameAr,
      city: defaultCity,
      displayAddress: `${govObj.nameAr} - ${defaultCity}`,
      isGpsLocated: false
    });
  };

  const handleCityChange = (cityName: string) => {
    onChangeLocation({
      ...location,
      city: cityName,
      displayAddress: `${location.governorate} - ${cityName}`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Privacy Guarantee Header */}
      <div className="bg-emerald-50/70 border border-brand-green/20 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700">
          <div className="font-extrabold text-brand-navy">حماية خصوصية موقع البائع (Location Privacy):</div>
          <p className="leading-relaxed">
            لن يتم إظهار إحداثيات موقعك الدقيقة أو اسم الشارع للمشترين؛ سيظهر في الإعلان فقط النطاق العام (مثلاً: <strong className="text-brand-green">{location.displayAddress || 'القاهرة - التجمع الخامس'}</strong>) لمساعدة المشترين في معرفة وحدة المرور ومنطقة المعاينة.
          </p>
        </div>
      </div>

      {/* GPS Button Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-brand-navy flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-green" />
              <span>تحديد الموقع التلقائي عبر GPS</span>
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              اضغط على الزر ليقوم المتصفح بطلب الإذن وتحديد محافظتك والحي بدقة تلقائياً
            </p>
          </div>

          <button
            type="button"
            onClick={handleRequestGps}
            disabled={isLocating}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              isLocating
                ? 'bg-slate-100 text-slate-400 cursor-wait'
                : 'bg-brand-navy hover:bg-slate-800 text-white shadow-md'
            }`}
          >
            {isLocating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
                <span>جاري قراءة GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-brand-green" />
                <span>حدد موقعي الحالي</span>
              </>
            )}
          </button>
        </div>

        {/* GPS Status Feedback */}
        {gpsStatus === 'success' && (
          <div className="bg-emerald-50 border border-brand-green/30 rounded-xl p-3 flex items-center gap-2 text-xs text-brand-navy font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {(gpsStatus === 'denied' || gpsStatus === 'error') && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Fallback Structured Selectors: Governorate & City */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-green" />
          <span>أو اختر المحافظة والحي يدوياً:</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Governorate Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المحافظة:</label>
            <select
              value={location.governorate}
              onChange={(e) => handleGovernorateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov.id} value={gov.nameAr}>
                  {gov.nameAr} ({gov.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* City / District Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة / الحي / المنطقة:</label>
            <select
              value={location.city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              {currentGov.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Interactive Visual Map Preview with Coordinates */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
              <span className="text-xs font-bold text-brand-navy">العنوان الظاهر للمشترين:</span>
              <span className="text-xs font-black text-brand-green bg-emerald-50 px-2 py-0.5 rounded-md border border-brand-green/20">
                {location.displayAddress}
              </span>
            </div>

            {location.latitude && location.longitude && (
              <div className="text-3xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                إحداثيات سرية: {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E
              </div>
            )}
          </div>

          {/* Graphical Map Pin Canvas Illustration */}
          <div className="h-32 bg-gradient-to-br from-slate-100 to-emerald-50/40 rounded-lg border border-dashed border-slate-300 flex items-center justify-center relative select-none">
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
            
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <div className="w-9 h-9 rounded-full bg-brand-navy text-brand-green flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="w-6 h-2 bg-slate-400/40 rounded-full blur-[2px] mt-1" />
            </div>

            <div className="absolute bottom-2 right-2 text-3xs font-bold text-slate-400 bg-white/80 px-2 py-0.5 rounded">
              خريطة المعاينة المعتمدة (جمهورية مصر العربية)
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LocationPicker;
