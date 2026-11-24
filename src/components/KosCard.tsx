import React, { useState } from 'react';
import { ArrowRight, Bookmark, Building2, Clock, MapPin } from 'lucide-react';
import { FACILITY_OPTIONS, formatRelativeUpdate, formatRupiah } from '../data/demoKos';
import { AvailabilityStatus, KosProperty } from '../types/kos';

interface KosCardProps {
  kos: KosProperty;
  onSelect: (kosId: string) => void;
  isSaved?: boolean;
  onToggleSave?: (kos: KosProperty) => void;
}

export function getStatusBadgeConfig(status: AvailabilityStatus) {
  switch (status) {
    case 'tersedia':
      return {
        label: 'Tersedia',
        classes: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      };
    case 'penuh':
      return {
        label: 'Penuh',
        classes: 'bg-red-50 text-red-700 border border-red-200',
      };
    case 'perlu_konfirmasi':
    default:
      return {
        label: 'Perlu konfirmasi',
        classes: 'bg-amber-50 text-amber-800 border border-amber-200',
      };
  }
}

export function getKosTypeLabel(type: KosProperty['kosType']) {
  if (type === 'putra') return 'Kos Putra';
  if (type === 'putri') return 'Kos Putri';
  return 'Kos Campur';
}

export function KosCard({ kos, onSelect, isSaved, onToggleSave }: KosCardProps) {
  const [imgError, setImgError] = useState(false);
  const statusBadge = getStatusBadgeConfig(kos.availabilityStatus);

  const facilityLabels = kos.facilities
    .slice(0, 4)
    .map((key) => FACILITY_OPTIONS.find((f) => f.key === key)?.label || key);

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-colors hover:border-[#14532D]/40">
      {/* Media Frame */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        {!imgError && kos.photos[0] ? (
          <img
            src={kos.photos[0]}
            alt={`Foto kamar ${kos.name}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#14532D]/10 to-emerald-50 flex flex-col items-center justify-center p-4 text-center">
            <Building2 className="w-8 h-8 text-[#14532D]/60 mb-2" />
            <span className="text-xs font-semibold text-[#14532D]/80">{kos.name}</span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2 bg-gradient-to-b from-black/50 via-black/20 to-transparent">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusBadge.classes}`}
            >
              {statusBadge.label}
            </span>
            {kos.isDemo && (
              <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-900/80 text-white">
                Data Demo
              </span>
            )}
            {!kos.isDemo && kos.isPromoted && (
              <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#14532D] text-white">
                Rekomendasi
              </span>
            )}
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(kos);
              }}
              aria-label={isSaved ? 'Hapus dari tersimpan' : 'Simpan kos'}
              className={`p-2 rounded-lg transition-colors ${
                isSaved
                  ? 'bg-[#14532D] text-white'
                  : 'bg-white/90 text-slate-700 hover:bg-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Unboxed metadata row */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
          <span className="font-medium text-[#14532D]">{getKosTypeLabel(kos.kosType)}</span>
          <span aria-hidden="true">·</span>
          <span>{kos.area}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-medium text-slate-700">
            {kos.availableRooms}/{kos.totalRooms} kamar kosong
          </span>
        </div>

        <h3 className="font-display text-lg font-bold text-slate-900 leading-snug mb-1.5 line-clamp-1">
          {kos.name}
        </h3>

        <p className="flex items-start gap-1.5 text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2rem]">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{kos.address}</span>
        </p>

        {/* Clean inline facility summary */}
        <p className="text-xs text-slate-600 mb-4 line-clamp-1">
          {facilityLabels.join(' · ')}
          {kos.facilities.length > 4 ? ` · +${kos.facilities.length - 4} lainnya` : ''}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3" />
              <span>Diperbarui {formatRelativeUpdate(kos.lastStatusUpdatedAt)}</span>
            </div>
            <div className="font-display text-lg font-bold text-[#14532D] tabular-nums">
              {formatRupiah(kos.priceMonthly)}
              <span className="text-xs font-normal text-slate-500"> / bulan</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect(kos.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Lihat Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
