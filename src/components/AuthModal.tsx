import React, { useEffect, useState } from 'react';
import { Building2, Check, Loader2, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/kos';

interface AuthModalProps {
  onSuccessRedirect?: (role: UserRole) => void;
}

export function AuthModal({ onSuccessRedirect }: AuthModalProps) {
  const {
    authModalOpen,
    authModalMode,
    authDefaultRole,
    closeAuthModal,
    loginOrRegisterWithGoogle,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(authModalMode);
  const [role, setRole] = useState<UserRole>(authDefaultRole);
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalMode);
      setRole(authDefaultRole);
      setErrorMsg(null);
    }
  }, [authModalOpen, authModalMode, authDefaultRole]);

  if (!authModalOpen) return null;

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (tab === 'register' && role === 'pemilik' && whatsapp.trim().length > 0 && whatsapp.trim().length < 8) {
      setErrorMsg('Nomor WhatsApp minimal 8 digit (contoh: 081234567890).');
      return;
    }

    setSubmitting(true);
    try {
      const profile = await loginOrRegisterWithGoogle({
        mode: tab,
        role,
        displayName,
        whatsapp,
      });
      if (onSuccessRedirect) {
        onSuccessRedirect(profile.role);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Jendela login ditutup sebelum selesai. Silakan coba lagi.');
      } else {
        setErrorMsg('Autentikasi gagal. Pastikan popup browser diizinkan lalu coba kembali.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 id="auth-modal-title" className="font-display text-lg font-bold text-slate-900">
              {tab === 'login' ? 'Masuk ke KosFinder' : 'Daftar Akun KosFinder'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih jenis akun sesuai kebutuhan Anda
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Tutup modal autentikasi"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                tab === 'login'
                  ? 'bg-white text-[#14532D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                tab === 'register'
                  ? 'bg-white text-[#14532D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Baru
            </button>
          </div>
        </div>

        <form onSubmit={handleGoogleSubmit} className="p-6 space-y-4">
          {/* Account Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {tab === 'login' ? 'Jenis Akun (untuk pendaftar baru)' : 'Daftar Sebagai'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('pencari')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  role === 'pencari'
                    ? 'border-[#14532D] bg-[#14532D]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Search className={`w-4 h-4 ${role === 'pencari' ? 'text-[#14532D]' : 'text-slate-500'}`} />
                  {role === 'pencari' && <Check className="w-4 h-4 text-[#14532D]" />}
                </div>
                <div className="text-sm font-bold text-slate-900">Pencari Kos</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Simpan kos & jadwalkan survei
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('pemilik')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  role === 'pemilik'
                    ? 'border-[#14532D] bg-[#14532D]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Building2 className={`w-4 h-4 ${role === 'pemilik' ? 'text-[#14532D]' : 'text-slate-500'}`} />
                  {role === 'pemilik' && <Check className="w-4 h-4 text-[#14532D]" />}
                </div>
                <div className="text-sm font-bold text-slate-900">Pemilik Kos</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Kelola properti & status kamar
                </div>
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap / Nama Usaha Kos (opsional)
                </label>
                <input
                  id="auth-name"
                  type="text"
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Ibu Sari Wijaya"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
                />
              </div>

              <div>
                <label htmlFor="auth-wa" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor WhatsApp {role === 'pemilik' ? '(untuk kontak penyewa)' : '(opsional)'}
                </label>
                <input
                  id="auth-wa"
                  type="tel"
                  maxLength={25}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
                />
              </div>
            </>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Akun...</span>
              </>
            ) : (
              <span>
                {tab === 'login' ? 'Masuk dengan Google' : 'Daftar & Masuk dengan Google'}
              </span>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Dengan masuk, akun Anda terhubung ke database KosFinder untuk sinkronisasi kamar dan jadwal survei. Anda juga dapat beralih peran kapan saja di halaman akun.
          </p>
        </form>
      </div>
    </div>
  );
}
