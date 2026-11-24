import React, { useEffect, useState } from 'react';
import { Bookmark, Building2, Calendar, Check, Loader2, Search, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../data/demoKos';
import {
  subscribeFavorites,
  subscribeSurveysForUser,
  toggleFavoriteKos,
  updateSurveyStatus,
} from '../lib/kosService';
import { FavoriteKos, KosProperty, SurveyRequest } from '../types/kos';

interface SeekerDashboardPageProps {
  allKos: KosProperty[];
  onSelectKos: (kosId: string) => void;
  onBrowseCatalog: () => void;
  onSwitchToOwner: () => void;
}

export function SeekerDashboardPage({
  allKos,
  onSelectKos,
  onBrowseCatalog,
  onSwitchToOwner,
}: SeekerDashboardPageProps) {
  const { firebaseUser, profile, privateInfo, updateContactWhatsapp, switchRole, openAuthModal } =
    useAuth();
  const [favorites, setFavorites] = useState<FavoriteKos[]>([]);
  const [surveys, setSurveys] = useState<SurveyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameInput, setNameInput] = useState(profile?.displayName || '');
  const [waInput, setWaInput] = useState(privateInfo?.whatsapp || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setNameInput(profile?.displayName || '');
    setWaInput(privateInfo?.whatsapp || '');
  }, [profile?.displayName, privateInfo?.whatsapp]);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubFav = subscribeFavorites(
      firebaseUser.uid,
      (items) => {
        setFavorites(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubSrv = subscribeSurveysForUser(
      firebaseUser.uid,
      'pencari',
      (items) => setSurveys(items),
      () => {}
    );

    return () => {
      unsubFav();
      unsubSrv();
    };
  }, [firebaseUser?.uid]);

  if (!firebaseUser || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <User className="w-10 h-10 text-[#14532D] mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Akun Pencari Kos
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Masuk untuk melihat daftar kos tersimpan dan memantau jadwal survei Anda.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('login', 'pencari')}
            className="px-5 py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
          >
            Masuk dengan Google
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSavedNotice(false);
    try {
      await updateContactWhatsapp(waInput, nameInput);
      setSavedNotice(true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleActivateOwner = async () => {
    await switchRole('pemilik');
    onSwitchToOwner();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#14532D] mb-1">
            Akun Pencari Kos · {privateInfo?.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Halo, {profile.displayName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
          >
            <Search className="w-4 h-4" />
            <span>Cari Kos</span>
          </button>
          <button
            type="button"
            onClick={() => void handleActivateOwner()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Building2 className="w-4 h-4 text-[#14532D]" />
            <span>Beralih ke Mode Pemilik Kos</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Saved Kos */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#14532D]" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Kos Tersimpan ({favorites.length})
            </h2>
          </div>

          {loading ? (
            <div className="h-28 rounded-lg bg-slate-100 animate-pulse" />
          ) : favorites.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#F8FAF9] border border-slate-200 text-center">
              <p className="text-sm text-slate-600 mb-3">
                Anda belum menyimpan kos favorit. Tandai kos yang Anda minati agar mudah dibandingkan nanti.
              </p>
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="text-sm font-semibold text-[#14532D] hover:underline"
              >
                Jelajahi Katalog Kos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const matchedKos = allKos.find((k) => k.id === fav.kosId);
                return (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={fav.kosPhoto}
                        alt={fav.kosName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectKos(fav.kosId)}
                          className="font-display text-sm font-bold text-slate-900 hover:text-[#14532D] truncate block text-left"
                        >
                          {fav.kosName}
                        </button>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {fav.kosArea} · {formatRupiah(fav.kosPrice)}/bln
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectKos(fav.kosId)}
                        className="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-semibold"
                      >
                        Detail
                      </button>
                      {matchedKos && (
                        <button
                          type="button"
                          onClick={() =>
                            void toggleFavoriteKos(firebaseUser.uid, matchedKos, true)
                          }
                          aria-label="Hapus simpanan"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Surveys & Contact Profile */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#14532D]" />
              <h2 className="font-display text-base font-bold text-slate-900">
                Jadwal Survei Saya ({surveys.length})
              </h2>
            </div>

            {surveys.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada jadwal survei. Buka detail kos lalu klik “Jadwalkan Survei”.
              </p>
            ) : (
              <div className="space-y-3">
                {surveys.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-[#F8FAF9] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectKos(srv.kosId)}
                        className="text-xs font-bold text-slate-900 hover:text-[#14532D] text-left"
                      >
                        {srv.kosName}
                      </button>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 capitalize">
                        {srv.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 tabular-nums">
                      {srv.visitDate} · {srv.visitTime}
                    </div>
                    {(srv.status === 'menunggu' || srv.status === 'disetujui') && (
                      <button
                        type="button"
                        onClick={() => void updateSurveyStatus(srv.id, 'dibatalkan')}
                        className="text-xs font-medium text-red-600 hover:underline pt-1"
                      >
                        Batalkan Survei
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-base font-bold text-slate-900 mb-3">
              Informasi Kontak Akun
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#14532D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  maxLength={25}
                  value={waInput}
                  onChange={(e) => setWaInput(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#14532D]"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold hover:bg-[#166534] disabled:opacity-60"
              >
                {savingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedNotice ? (
                  <Check className="w-3.5 h-3.5" />
                ) : null}
                <span>{savedNotice ? 'Tersimpan' : 'Simpan Profil'}</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
