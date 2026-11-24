import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  MessageCircle,
  User,
} from 'lucide-react';
import { getKosTypeLabel, getStatusBadgeConfig } from '../components/KosCard';
import { KosMap } from '../components/KosMap';
import { SurveyModal } from '../components/SurveyModal';
import { useAuth } from '../context/AuthContext';
import { FACILITY_OPTIONS, formatRupiah, formatTimestampId } from '../data/demoKos';
import { subscribeKosRooms } from '../lib/kosService';
import { KosProperty, KosRoom, RoomStatus } from '../types/kos';

interface KosDetailPageProps {
  kos: KosProperty;
  isSaved: boolean;
  onToggleSave: (kos: KosProperty) => void;
  onBack: () => void;
}

function getRoomStatusBadge(status: RoomStatus) {
  if (status === 'tersedia') {
    return { label: 'Tersedia', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  if (status === 'terisi') {
    return { label: 'Terisi', classes: 'bg-red-50 text-red-700 border-red-200' };
  }
  return { label: 'Perlu perbaikan', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
}

function formatWhatsappHref(rawNumber: string, kosName: string) {
  let digits = rawNumber.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (!digits.startsWith('62')) {
    digits = `62${digits}`;
  }
  const text = encodeURIComponent(
    `Halo, saya tertarik dengan ${kosName} yang ada di KosFinder. Apakah masih ada kamar tersedia untuk survei?`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function KosDetailPage({ kos, isSaved, onToggleSave, onBack }: KosDetailPageProps) {
  const { firebaseUser, openAuthModal } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [rooms, setRooms] = useState<KosRoom[]>(kos.demoRooms || []);
  const [roomsLoading, setRoomsLoading] = useState(!kos.isDemo);
  const [surveyOpen, setSurveyOpen] = useState(false);

  useEffect(() => {
    setActivePhotoIndex(0);
    if (kos.isDemo) {
      setRooms(kos.demoRooms || []);
      setRoomsLoading(false);
      return;
    }

    setRoomsLoading(true);
    const unsub = subscribeKosRooms(
      kos.id,
      (loaded) => {
        setRooms(loaded);
        setRoomsLoading(false);
      },
      () => {
        setRoomsLoading(false);
      }
    );
    return () => unsub();
  }, [kos.id, kos.isDemo, kos.demoRooms]);

  const statusBadge = getStatusBadgeConfig(kos.availabilityStatus);
  const photos = kos.photos.length > 0 ? kos.photos : [];
  const activePhoto = photos[activePhotoIndex] || photos[0] || '';

  const handleScheduleSurveyClick = () => {
    if (!firebaseUser) {
      openAuthModal('login', 'pencari');
      return;
    }
    setSurveyOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#14532D] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Kos</span>
      </button>

      {kos.isDemo && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900">
            <strong>Data Demo:</strong> Properti ini merupakan contoh data katalog awal Surabaya Timur untuk simulasi KosFinder, bukan listing kos komersial aktif.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery, Overview, Facilities, Rooms, Map */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              {activePhoto ? (
                <img
                  src={activePhoto}
                  alt={`${kos.name} foto ${activePhotoIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Building2 className="w-10 h-10 mb-2" />
                  <span className="text-sm">Foto belum tersedia</span>
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {photos.map((src, idx) => (
                  <button
                    key={`${idx}-${src.slice(0, 20)}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activePhotoIndex
                        ? 'border-[#14532D]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-md text-xs font-semibold ${statusBadge.classes}`}>
                  {statusBadge.label}
                </span>
                <span className="text-xs font-semibold text-[#14532D]">
                  {getKosTypeLabel(kos.kosType)}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-xs font-medium text-slate-600">{kos.area}</span>
              </div>

              <button
                type="button"
                onClick={() => onToggleSave(kos)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'border-[#14532D] bg-[#14532D]/5 text-[#14532D]'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Tersimpan' : 'Simpan Kos'}</span>
              </button>
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                {kos.name}
              </h1>
              <p className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-[#14532D] shrink-0 mt-0.5" />
                <span>{kos.address}</span>
              </p>
            </div>

            {/* Honesty Timestamp Notice */}
            <div className="p-3.5 rounded-lg bg-[#F8FAF9] border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-[#14532D] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">
                  Terakhir diperbarui oleh pemilik: {formatTimestampId(kos.lastStatusUpdatedAt)}
                </span>
                <p className="mt-0.5 text-slate-500">
                  Status kamar ditampilkan sesuai pembaruan terakhir dari pemilik kos. Hubungi pemilik melalui WhatsApp untuk konfirmasi akhir sebelum survei.
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 mb-2">
                Deskripsi Kos
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {kos.description}
              </p>
            </div>

            {/* Facilities */}
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 mb-3">
                Fasilitas Tersedia
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FACILITY_OPTIONS.map((fac) => {
                  const available = kos.facilities.includes(fac.key);
                  return (
                    <div
                      key={fac.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs sm:text-sm ${
                        available
                          ? 'border-emerald-200 bg-emerald-50/50 text-slate-800 font-medium'
                          : 'border-slate-100 bg-slate-50 text-slate-400 line-through'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          available ? 'text-[#14532D]' : 'text-slate-300'
                        }`}
                      />
                      <span>{fac.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Room Availability Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Rincian Ketersediaan Kamar
                </h2>
                <p className="text-xs text-slate-500">
                  Status setiap kamar dikelola langsung melalui dashboard pemilik kos.
                </p>
              </div>
            </div>

            {/* Summary KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[#F8FAF9] border border-slate-200">
                <div className="text-xs text-slate-500">Total Kamar</div>
                <div className="font-display text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {kos.totalRooms}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div className="text-xs text-emerald-800">Tersedia</div>
                <div className="font-display text-xl font-bold text-emerald-900 tabular-nums mt-0.5">
                  {kos.availableRooms}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-red-50/60 border border-red-200">
                <div className="text-xs text-red-700">Terisi</div>
                <div className="font-display text-xl font-bold text-red-900 tabular-nums mt-0.5">
                  {kos.occupiedRooms}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200">
                <div className="text-xs text-amber-800">Perlu Perbaikan</div>
                <div className="font-display text-xl font-bold text-amber-900 tabular-nums mt-0.5">
                  {kos.maintenanceRooms}
                </div>
              </div>
            </div>

            {/* Room list */}
            {roomsLoading ? (
              <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
            ) : rooms.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Rincian nomor kamar belum ditambahkan oleh pemilik.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rooms.map((room) => {
                  const badge = getRoomStatusBadge(room.status);
                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Kamar {room.roomNumber}
                        </div>
                        <div className="text-xs text-slate-500">
                          {room.floor} · {formatRupiah(room.priceMonthly)}/bln
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Lokasi Kos pada Peta
            </h2>
            <KosMap
              mode="view"
              latitude={kos.latitude}
              longitude={kos.longitude}
              title={kos.name}
              address={kos.address}
              heightClass="h-80"
            />
          </div>
        </div>

        {/* Right Sticky Action Card */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <div className="text-xs text-slate-500 mb-1">Harga Sewa Bulanan</div>
              <div className="font-display text-3xl font-extrabold text-[#14532D] tabular-nums">
                {formatRupiah(kos.priceMonthly)}
                <span className="text-sm font-normal text-slate-500"> / bulan</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#14532D] text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs text-slate-500">Pemilik / Pengelola</div>
                  <div className="text-sm font-bold text-slate-900">{kos.ownerName}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={formatWhatsappHref(kos.ownerWhatsapp, kos.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleScheduleSurveyClick}
                className="w-full py-3 px-4 rounded-lg border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Jadwalkan Survei</span>
              </button>
            </div>

            {!firebaseUser && (
              <p className="text-xs text-slate-500 text-center">
                Masuk terlebih dahulu untuk menjadwalkan survei dan memantau status pengajuan Anda.
              </p>
            )}
          </div>
        </aside>
      </div>

      <SurveyModal
        kos={kos}
        open={surveyOpen}
        onClose={() => setSurveyOpen(false)}
      />
    </div>
  );
}
