import React, { useEffect, useMemo, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppRoute, Navbar } from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DEMO_KOS_LIST } from './data/demoKos';
import {
  subscribeFavorites,
  subscribeKosCatalog,
  toggleFavoriteKos,
} from './lib/kosService';
import { KosDetailPage } from './pages/KosDetailPage';
import { LandingPage } from './pages/LandingPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { SearchCatalogPage } from './pages/SearchCatalogPage';
import { SeekerDashboardPage } from './pages/SeekerDashboardPage';
import { FavoriteKos, KosProperty, SearchFilters } from './types/kos';

const INITIAL_FILTERS: SearchFilters = {
  query: '',
  area: 'Semua',
  minPrice: '',
  maxPrice: '',
  kosType: 'semua',
  facilities: [],
  status: 'semua',
  sortBy: 'terbaru',
};

function KosFinderApp() {
  const { firebaseUser, profile, openAuthModal } = useAuth();
  const [route, setRoute] = useState<AppRoute>({ page: 'home' });
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);

  const [firestoreKos, setFirestoreKos] = useState<KosProperty[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteKos[]>([]);

  useEffect(() => {
    const unsub = subscribeKosCatalog(
      (items) => {
        setFirestoreKos(items);
        setCatalogLoading(false);
        setCatalogError(null);
      },
      () => {
        setCatalogLoading(false);
        setCatalogError(
          'Gagal memuat data kos terbaru dari server. Menampilkan data demo yang tersedia.'
        );
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setFavorites([]);
      return;
    }
    const unsub = subscribeFavorites(
      firebaseUser.uid,
      (items) => setFavorites(items),
      () => {}
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  // Merge real Firestore listings with clearly-labeled Demo Kos listings
  const combinedKos = useMemo(() => {
    return [...firestoreKos, ...DEMO_KOS_LIST];
  }, [firestoreKos]);

  const savedKosIds = useMemo(
    () => new Set(favorites.map((f) => f.kosId)),
    [favorites]
  );

  const navigate = (next: AppRoute) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (sectionId: string) => {
    if (route.page !== 'home') {
      setRoute({ page: 'home' });
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchFromHero = (partial: Partial<SearchFilters>) => {
    setFilters({ ...INITIAL_FILTERS, ...partial });
    navigate({ page: 'catalog' });
  };

  const handleToggleSave = async (kos: KosProperty) => {
    if (!firebaseUser) {
      openAuthModal('login', 'pencari');
      return;
    }
    await toggleFavoriteKos(firebaseUser.uid, kos, savedKosIds.has(kos.id));
  };

  const handleOwnerCtaClick = () => {
    if (firebaseUser && profile?.role === 'pemilik') {
      navigate({ page: 'owner-dashboard' });
    } else if (firebaseUser) {
      navigate({ page: 'owner-dashboard' });
    } else {
      openAuthModal('register', 'pemilik');
    }
  };

  const selectedKos =
    route.page === 'detail'
      ? combinedKos.find((k) => k.id === route.kosId) || null
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-[#111C16]">
      <Navbar
        route={route}
        onNavigate={navigate}
        onScrollToSection={handleScrollToSection}
      />

      <main className="flex-1">
        {route.page === 'home' && (
          <LandingPage
            kosList={combinedKos}
            loading={catalogLoading}
            savedKosIds={savedKosIds}
            onToggleSave={(k) => void handleToggleSave(k)}
            onSearchFromHero={handleSearchFromHero}
            onSelectKos={(kosId) => navigate({ page: 'detail', kosId })}
            onOpenCatalog={() => navigate({ page: 'catalog' })}
            onOwnerCtaClick={handleOwnerCtaClick}
          />
        )}

        {route.page === 'catalog' && (
          <SearchCatalogPage
            kosList={combinedKos}
            loading={catalogLoading}
            error={catalogError}
            filters={filters}
            onChangeFilters={setFilters}
            onResetFilters={() => setFilters(INITIAL_FILTERS)}
            onSelectKos={(kosId) => navigate({ page: 'detail', kosId })}
            savedKosIds={savedKosIds}
            onToggleSave={(k) => void handleToggleSave(k)}
          />
        )}

        {route.page === 'detail' && selectedKos && (
          <KosDetailPage
            kos={selectedKos}
            isSaved={savedKosIds.has(selectedKos.id)}
            onToggleSave={(k) => void handleToggleSave(k)}
            onBack={() => navigate({ page: 'catalog' })}
          />
        )}

        {route.page === 'detail' && !selectedKos && (
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-8">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                Properti Kos Tidak Ditemukan
              </h2>
              <p className="text-sm text-slate-600 mb-5">
                Properti mungkin telah dihapus oleh pemiliknya atau tautan tidak valid.
              </p>
              <button
                type="button"
                onClick={() => navigate({ page: 'catalog' })}
                className="px-5 py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold"
              >
                Kembali ke Katalog Kos
              </button>
            </div>
          </div>
        )}

        {route.page === 'owner-dashboard' && (
          <OwnerDashboardPage
            allKos={combinedKos}
            onViewPublicKos={(kosId) => navigate({ page: 'detail', kosId })}
          />
        )}

        {route.page === 'seeker-dashboard' && (
          <SeekerDashboardPage
            allKos={combinedKos}
            onSelectKos={(kosId) => navigate({ page: 'detail', kosId })}
            onBrowseCatalog={() => navigate({ page: 'catalog' })}
            onSwitchToOwner={() => navigate({ page: 'owner-dashboard' })}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-display text-base font-bold text-[#14532D]">
              KosFinder
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Temukan Kos yang Tepat, Tanpa Ribet. · Wilayah Surabaya Timur (UPN Veteran Jatim, Rungkut, Medokan Ayu, Gunung Anyar).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="hover:text-[#14532D]"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'catalog' })}
              className="hover:text-[#14532D]"
            >
              Cari Kos
            </button>
            <button
              type="button"
              onClick={handleOwnerCtaClick}
              className="hover:text-[#14532D]"
            >
              Untuk Pemilik Kos
            </button>
            <span className="text-slate-400">
              &copy; {new Date().getFullYear()} KosFinder
            </span>
          </div>
        </div>
      </footer>

      <AuthModal
        onSuccessRedirect={(role) => {
          navigate({
            page: role === 'pemilik' ? 'owner-dashboard' : 'seeker-dashboard',
          });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <KosFinderApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
