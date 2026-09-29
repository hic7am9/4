import { I18nProvider } from '@/context/I18nContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar, BottomNav } from '@/components/Navigation';
import { Dashboard } from '@/pages/Dashboard';
import { WorkSchedule } from '@/pages/WorkSchedule';
import { CheckOut } from '@/pages/CheckOut';
import { CalendarView } from '@/pages/CalendarView';
import { GuestsArchive } from '@/pages/GuestsArchive';
import { useLocations, useApartments, useBookings, useGuestArchive } from '@/hooks/useData';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { view, refreshKey } = useApp();
  const { locations, loading: locLoading } = useLocations(refreshKey);
  const { apartments, loading: aptLoading } = useApartments(refreshKey);
  const { bookings, loading: bookLoading } = useBookings(refreshKey);
  const { archive, loading: archLoading } = useGuestArchive(refreshKey);

  const loading = locLoading || aptLoading || bookLoading || archLoading;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <Loader2 size={32} className="animate-spin text-slate-400" />
              <p className="text-sm text-slate-400 font-semibold">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              {view === 'dashboard' && <Dashboard apartments={apartments} locations={locations} bookings={bookings} />}
              {view === 'schedule' && <WorkSchedule apartments={apartments} locations={locations} bookings={bookings} />}
              {view === 'checkout' && <CheckOut apartments={apartments} locations={locations} bookings={bookings} />}
              {view === 'calendar' && <CalendarView apartments={apartments} locations={locations} bookings={bookings} />}
              {view === 'archive' && <GuestsArchive archive={archive} />}
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </I18nProvider>
  );
}

export default App;
