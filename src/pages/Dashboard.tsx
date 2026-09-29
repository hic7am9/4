import { useState, useEffect, useMemo } from 'react';
import { Home, TrendingUp, LogOut, Wrench, Copy, Plus, Settings, MapPin } from 'lucide-react';
import type { Apartment, Location, Booking } from '@/types';
import { STATUS_LABELS, isDepartureToday, isDepartureActive, getHijriDate, getGregorianDate } from '@/lib/utils';
import { ManageModal } from '@/components/ManageModal';
import { BookingModal } from '@/components/BookingModal';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { buildDailyReportMultiCity, buildDailyReportSingleNeighborhood, copyToClipboard } from '@/lib/whatsapp';

interface DashboardProps {
  apartments: Apartment[];
  locations: Location[];
  bookings: Booking[];
}

function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const isAM = time.getHours() < 12;
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40 sm:w-48 sm:h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="95" fill="white" stroke="#E2E8F0" strokeWidth="2" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="#F1F5F9" strokeWidth="1" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 100 + 78 * Math.cos(angle);
            const y1 = 100 + 78 * Math.sin(angle);
            const x2 = 100 + 88 * Math.cos(angle);
            const y2 = 100 + 88 * Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth={i % 3 === 0 ? 3 : 1.5} />
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const num = i === 0 ? 12 : i;
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 100 + 65 * Math.cos(angle);
            const y = 100 + 65 * Math.sin(angle);
            return (
              <text key={i} x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0F172A">
                {num}
              </text>
            );
          })}
          <line
            x1="100" y1="100" x2={100 + 45 * Math.cos((hourDeg - 90) * (Math.PI / 180))} y2={100 + 45 * Math.sin((hourDeg - 90) * (Math.PI / 180))}
            stroke="#0F172A" strokeWidth="4" strokeLinecap="round"
          />
          <line
            x1="100" y1="100" x2={100 + 65 * Math.cos((minDeg - 90) * (Math.PI / 180))} y2={100 + 65 * Math.sin((minDeg - 90) * (Math.PI / 180))}
            stroke="#334155" strokeWidth="3" strokeLinecap="round"
          />
          <line
            x1="100" y1="100" x2={100 + 75 * Math.cos((secDeg - 90) * (Math.PI / 180))} y2={100 + 75 * Math.sin((secDeg - 90) * (Math.PI / 180))}
            stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="5" fill="#0F172A" />
          <circle cx="100" cy="100" r="2.5" fill="#EF4444" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-900 tabular-nums" dir="ltr">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </p>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">{isAM ? t('am') : t('pm')}</p>
      </div>
    </div>
  );
}

export function Dashboard({ apartments, locations, bookings }: DashboardProps) {
  const { triggerRefresh } = useApp();
  const { t } = useI18n();
  const [manageOpen, setManageOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const occupied = apartments.filter((a) => a.status === 'occupied');
    const ready = apartments.filter((a) => a.status === 'ready');
    const notReady = apartments.filter((a) => a.status === 'not_ready');
    const maintenance = apartments.filter((a) => a.status === 'maintenance');
    const occupancyRate = apartments.length > 0 ? Math.round((occupied.length / apartments.length) * 100) : 0;
    const departuresToday = apartments.filter((a) => a.current_booking && isDepartureToday(a.current_booking.check_out));
    return {
      total: apartments.length,
      occupied: occupied.length,
      ready: ready.length,
      notReady: notReady.length,
      maintenance: maintenance.length,
      occupancyRate,
      departuresToday: departuresToday.length,
    };
  }, [apartments]);

  const groupedByLocation = useMemo(() => {
    const map = new Map<string, { location: Location | null; apartments: Apartment[] }>();
    for (const loc of locations) map.set(loc.id, { location: loc, apartments: [] });
    const noLoc: Apartment[] = [];
    for (const apt of apartments) {
      if (apt.location_id && map.has(apt.location_id)) map.get(apt.location_id)!.apartments.push(apt);
      else noLoc.push(apt);
    }
    const result = Array.from(map.values());
    if (noLoc.length > 0) result.push({ location: null, apartments: noLoc });
    return result;
  }, [apartments, locations]);

  const handleCopyReport = () => {
    const todayDepartures = apartments
      .filter((a) => a.current_booking && isDepartureToday(a.current_booking.check_out))
      .map((a) => ({ apartment: a, booking: a.current_booking!, location: a.location ?? null }));
    const multiCity = todayDepartures.filter((d) => d.location?.name === 'جدة' || d.location?.name === 'الخبر');
    const marwa = todayDepartures.filter((d) => d.location?.name === 'المروة');
    let report = '';
    if (multiCity.length > 0) report += buildDailyReportMultiCity(multiCity) + '\n\n';
    if (marwa.length > 0) report += buildDailyReportSingleNeighborhood('المروة', marwa);
    if (!report) report = 'لا توجد مغادرات اليوم';
    copyToClipboard(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Spiritual Header */}
      <div className="card p-6 sm:p-8 text-center bg-gradient-to-b from-white to-slate-50">
        <p className="text-lg sm:text-xl font-bold text-slate-700 leading-relaxed" style={{ fontFamily: 'Cairo, serif' }}>
          {t('quran_verse')}
        </p>
      </div>

      {/* Clock + Dates */}
      <div className="card p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6">
          <div className="text-center order-2 sm:order-1">
            <p className="text-xs text-slate-400 font-semibold mb-1">{t('hijri_date')}</p>
            <p className="text-sm sm:text-base font-bold text-slate-700">{getHijriDate(now)}</p>
          </div>
          <div className="flex justify-center order-1 sm:order-2">
            <AnalogClock />
          </div>
          <div className="text-center order-3">
            <p className="text-xs text-slate-400 font-semibold mb-1">{t('gregorian_date')}</p>
            <p className="text-sm sm:text-base font-bold text-slate-700">{getGregorianDate(now)}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard icon={Home} label={t('occupied')} value={stats.occupied} subValue={`${stats.total} ${t('total_apartments')}`} rate={stats.occupancyRate} color="emerald" />
        <KPICard icon={LogOut} label={t('departures_today')} value={stats.departuresToday} highlight={stats.departuresToday > 0} color="red" />
        <KPICard icon={Wrench} label={t('not_ready')} value={stats.notReady} color="gray" />
        <KPICard icon={Wrench} label={t('maintenance')} value={stats.maintenance} color="orange" />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCopyReport} className="btn-secondary">
          <Copy size={18} />
          {copied ? t('confirmed') : t('cleaning_report')}
        </button>
        <button onClick={() => setBookingOpen(true)} className="btn-primary">
          <Plus size={18} />
          {t('new_booking')}
        </button>
        <button onClick={() => setManageOpen(true)} className="btn-secondary">
          <Settings size={18} />
          {t('manage')}
        </button>
      </div>

      {/* Property Location Summary */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <MapPin size={20} className="text-slate-400" />
          {t('property_summary')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedByLocation.map(({ location, apartments: apts }) => (
            <div key={location?.id ?? 'no-loc'} className="card p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">{location?.name ?? 'بدون موقع'}</h3>
              <div className="space-y-2">
                <SummaryRow label={t('occupied')} count={apts.filter((a) => a.status === 'occupied').length} dotColor="bg-emerald-500" />
                <SummaryRow label={t('ready')} count={apts.filter((a) => a.status === 'ready').length} dotColor="bg-sky-500" />
                <SummaryRow label={t('not_ready')} count={apts.filter((a) => a.status === 'not_ready').length} dotColor="bg-gray-400" />
                {apts.filter((a) => a.status === 'maintenance').length > 0 && (
                  <SummaryRow label={t('maintenance')} count={apts.filter((a) => a.status === 'maintenance').length} dotColor="bg-orange-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ManageModal isOpen={manageOpen} onClose={() => setManageOpen(false)} apartments={apartments} locations={locations} />
      <BookingModal isOpen={bookingOpen} onClose={() => { setBookingOpen(false); triggerRefresh(); }} apartment={null} apartments={apartments} locations={locations} bookings={bookings} />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subValue, rate, highlight, color }: {
  icon: typeof Home; label: string; value: number; subValue?: string; rate?: number; highlight?: boolean;
  color: 'emerald' | 'red' | 'gray' | 'orange';
}) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-gray-600 bg-gray-100',
    orange: 'text-orange-600 bg-orange-50',
  };
  return (
    <div className={`card p-4 sm:p-5 ${highlight ? 'ring-2 ring-red-400 animate-pulse-red' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      {rate !== undefined && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp size={14} />
            {label === 'مشغولة' || label === 'Occupied' ? 'نسبة الإشغال' : 'Rate'}
          </div>
          <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">{rate}%</p>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, count, dotColor }: { label: string; count: number; dotColor: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-900">{count}</span>
    </div>
  );
}
