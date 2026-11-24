import React, { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { KosCard } from '../components/KosCard';
import { AREA_OPTIONS, FACILITY_OPTIONS } from '../data/demoKos';
import {
  AvailabilityStatus,
  FacilityKey,
  KosArea,
  KosProperty,
  KosType,
  SearchFilters,
} from '../types/kos';

interface SearchCatalogPageProps {
  kosList: KosProperty[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  onChangeFilters: (next: SearchFilters) => void;
  onResetFilters: () => void;
  onSelectKos: (kosId: string) => void;
  savedKosIds: Set<string>;
  onToggleSave: (kos: KosProperty) => void;
}

export function SearchCatalogPage({
  kosList,
  loading,
  error,
  filters,
  onChangeFilters,
  onResetFilters,
  onSelectKos,
  savedKosIds,
  onToggleSave,
}: SearchCatalogPageProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const toggleFacility = (key: FacilityKey) => {
    const exists = filters.facilities.includes(key);
    onChangeFilters({
      ...filters,
      facilities: exists
        ? filters.facilities.filter((f) => f !== key)
        : [...filters.facilities, key],
    });
  };

  const filteredKos = useMemo(() => {
    const q = filters.query.trim().toLowerCase();

    const matched = kosList.filter((item) => {
      if (q) {
        const hay = `${item.name} ${item.address} ${item.area} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.area !== 'Semua' && item.area !== filters.area) return false;
      if (filters.kosType !== 'semua' && item.kosType !== filters.kosType) return false;
      if (filters.status !== 'semua' && item.availabilityStatus !== filters.status) return false;
      if (filters.minPrice !== '' && item.priceMonthly < Number(filters.minPrice)) return false;
      if (filters.maxPrice !== '' && item.priceMonthly > Number(filters.maxPrice)) return false;
      if (filters.facilities.length > 0) {
        const hasAll = filters.facilities.every((f) => item.facilities.includes(f));
        if (!hasAll) return false;
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      if (filters.sortBy === 'termurah') return a.priceMonthly - b.priceMonthly;
      if (filters.sortBy === 'tertinggi') return b.priceMonthly - a.priceMonthly;
      // terbaru: real non-demo + promoted first or newest updated
      if (a.isDemo !== b.isDemo) return a.isDemo ? 1 : -1;
      return b.lastStatusUpdatedAt.getTime() - a.lastStatusUpdatedAt.getTime();
    });
  }, [kosList, filters]);

  const filterPanelContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#14532D]" />
          <span>Filter Pencarian</span>
        </h2>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D] hover:underline"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Lokasi / Kecamatan */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Lokasi / Kecamatan
        </label>
        <select
          value={filters.area}
          onChange={(e) =>
            onChangeFilters({ ...filters, area: e.target.value as KosArea | 'Semua' })
          }
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#14532D]"
        >
          <option value="Semua">Semua Lokasi Surabaya Timur</option>
          {AREA_OPTIONS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Rentang Harga */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Kisaran Harga / Bulan (Rp)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step={50000}
            value={filters.minPrice}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                minPrice: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            placeholder="Minimum"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#14532D]"
          />
          <input
            type="number"
            min={0}
            step={50000}
            value={filters.maxPrice}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                maxPrice: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            placeholder="Maksimum"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#14532D]"
          />
        </div>
      </div>

      {/* Jenis Kos */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Jenis Kos
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { val: 'semua', label: 'Semua' },
              { val: 'putra', label: 'Putra' },
              { val: 'putri', label: 'Putri' },
              { val: 'campur', label: 'Campur' },
            ] as { val: KosType | 'semua'; label: string }[]
          ).map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChangeFilters({ ...filters, kosType: opt.val })}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                filters.kosType === opt.val
                  ? 'border-[#14532D] bg-[#14532D] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Kamar */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Status Ketersediaan Kamar
        </label>
        <select
          value={filters.status}
          onChange={(e) =>
            onChangeFilters({
              ...filters,
              status: e.target.value as AvailabilityStatus | 'semua',
            })
          }
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#14532D]"
        >
          <option value="semua">Semua Status</option>
          <option value="tersedia">Tersedia (Kamar Kosong)</option>
          <option value="perlu_konfirmasi">Perlu konfirmasi</option>
          <option value="penuh">Penuh</option>
        </select>
      </div>

      {/* Fasilitas */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Fasilitas
        </label>
        <div className="space-y-2">
          {FACILITY_OPTIONS.map((fac) => {
            const checked = filters.facilities.includes(fac.key);
            return (
              <label
                key={fac.key}
                className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFacility(fac.key)}
                  className="accent-[#14532D] w-4 h-4"
                />
                <span>{fac.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      {/* Header & Top Search/Sort Bar */}
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Katalog Pencarian Kos Surabaya Timur
        </h1>
        <p className="text-sm text-slate-600">
          Bandingkan harga, fasilitas, dan status kamar terbaru di sekitar UPN Veteran Jawa Timur, Rungkut, Medokan Ayu, dan Gunung Anyar.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
            placeholder="Cari nama kos, jalan, atau deskripsi..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#14532D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>

          <select
            aria-label="Urutkan kos"
            value={filters.sortBy}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                sortBy: e.target.value as SearchFilters['sortBy'],
              })
            }
            className="px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:border-[#14532D]"
          >
            <option value="terbaru">Urutkan: Kos Terbaru</option>
            <option value="termurah">Urutkan: Harga Termurah</option>
            <option value="tertinggi">Urutkan: Harga Tertinggi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sticky top-24">
          {filterPanelContent}
        </aside>

        {/* Catalog Grid */}
        <div className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-slate-600">
            <span className="tabular-nums font-medium">
              Menampilkan <strong>{filteredKos.length}</strong> properti kos
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  Tersedia
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  Perlu konfirmasi
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                  Penuh
                </span>
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : filteredKos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
                Belum ada kos yang sesuai filter
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-5">
                Coba ubah rentang harga, pilih lokasi lain, atau reset filter fasilitas untuk melihat lebih banyak pilihan kamar kos.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Semua Filter</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredKos.map((kos) => (
                <KosCard
                  key={kos.id}
                  kos={kos}
                  onSelect={onSelectKos}
                  isSaved={savedKosIds.has(kos.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-slate-900/50">
          <div className="w-full max-w-xs bg-white h-full p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-display font-bold text-slate-900">Filter Kos</span>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Tutup filter"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {filterPanelContent}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold"
            >
              Terapkan ({filteredKos.length} Hasil)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
