import React, { useState } from 'react';
import { Building2, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AppRoute =
  | { page: 'home' }
  | { page: 'catalog' }
  | { page: 'detail'; kosId: string }
  | { page: 'owner-dashboard' }
  | { page: 'seeker-dashboard' };

interface NavbarProps {
  route: AppRoute;
  onNavigate: (next: AppRoute) => void;
  onScrollToSection: (sectionId: string) => void;
}

export function Navbar({ route, onNavigate, onScrollToSection }: NavbarProps) {
  const { firebaseUser, profile, openAuthModal, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLink = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element clean Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLink(() => onNavigate({ page: 'home' }))}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] rounded-lg py-1"
        >
          <span className="w-8 h-8 rounded-lg bg-[#14532D] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-[#14532D]">
            KosFinder
          </span>
        </button>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'home' })}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              route.page === 'home'
                ? 'border-[#14532D] text-[#14532D] font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'catalog' })}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              route.page === 'catalog' || route.page === 'detail'
                ? 'border-[#14532D] text-[#14532D] font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Cari Kos
          </button>
          <button
            type="button"
            onClick={() => {
              if (firebaseUser && profile?.role === 'pemilik') {
                onNavigate({ page: 'owner-dashboard' });
              } else {
                onScrollToSection('untuk-pemilik');
              }
            }}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              route.page === 'owner-dashboard'
                ? 'border-[#14532D] text-[#14532D] font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Untuk Pemilik Kos
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('tentang-kami')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            Tentang Kami
          </button>
        </nav>

        {/* Zone 3: Auth / Account Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {firebaseUser && profile ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onNavigate({
                    page: profile.role === 'pemilik' ? 'owner-dashboard' : 'seeker-dashboard',
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4" />
                <span>
                  {profile.role === 'pemilik' ? 'Dashboard Pemilik' : 'Akun Saya'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                title="Keluar dari akun"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuthModal('login', 'pencari')}
                className="px-4 py-2 text-sm font-semibold text-[#14532D] hover:bg-[#14532D]/5 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register', 'pencari')}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#14532D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Daftar
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Buka menu navigasi"
          className="md:hidden p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleLink(() => onNavigate({ page: 'home' }))}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => handleLink(() => onNavigate({ page: 'catalog' }))}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cari Kos
          </button>
          <button
            type="button"
            onClick={() =>
              handleLink(() => {
                if (firebaseUser && profile?.role === 'pemilik') {
                  onNavigate({ page: 'owner-dashboard' });
                } else {
                  onScrollToSection('untuk-pemilik');
                }
              })
            }
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Untuk Pemilik Kos
          </button>
          <button
            type="button"
            onClick={() => handleLink(() => onScrollToSection('tentang-kami'))}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tentang Kami
          </button>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {firebaseUser && profile ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleLink(() =>
                      onNavigate({
                        page: profile.role === 'pemilik' ? 'owner-dashboard' : 'seeker-dashboard',
                      })
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] text-white text-sm font-semibold text-center"
                >
                  {profile.role === 'pemilik' ? 'Dashboard Pemilik' : 'Dashboard Pencari'}
                </button>
                <button
                  type="button"
                  onClick={() => handleLink(() => void signOut())}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium text-center"
                >
                  Keluar ({profile.displayName})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLink(() => openAuthModal('login', 'pencari'))}
                  className="py-2.5 px-4 rounded-lg border border-[#14532D] text-[#14532D] text-sm font-semibold"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => handleLink(() => openAuthModal('register', 'pencari'))}
                  className="py-2.5 px-4 rounded-lg bg-[#14532D] text-white text-sm font-semibold"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
