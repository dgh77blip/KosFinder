import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Filter,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { KosCard } from '../components/KosCard';
import { AREA_OPTIONS, KOS_PHOTOS } from '../data/demoKos';
import { KosArea, KosProperty, SearchFilters } from '../types/kos';

interface LandingPageProps {
  kosList: KosProperty[];
  loading: boolean;
  savedKosIds: Set<string>;
  onToggleSave: (kos: KosProperty) => void;
  onSearchFromHero: (partial: Partial<SearchFilters>) => void;
  onSelectKos: (kosId: string) => void;
  onOpenCatalog: () => void;
  onOwnerCtaClick: () => void;
}

export function LandingPage({
  kosList,
  loading,
  savedKosIds,
  onToggleSave,
  onSearchFromHero,
  onSelectKos,
  onOpenCatalog,
  onOwnerCtaClick,
}: LandingPageProps) {
  const [heroLocation, setHeroLocation] = useState<KosArea | 'Semua'>('Semua');
  const [heroPriceRange, setHeroPriceRange] = useState<'all' | 'under1' | '1to15' | 'above15'>('all');
  const [heroKeyword, setHeroKeyword] = useState('');
  const [heroImgError, setHeroImgError] = useState(false);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let minPrice: number | '' = '';
    let maxPrice: number | '' = '';
    if (heroPriceRange === 'under1') {
      maxPrice = 1000000;
    } else if (heroPriceRange === '1to15') {
      minPrice = 1000000;
      maxPrice = 1500000;
    } else if (heroPriceRange === 'above15') {
      minPrice = 1500000;
    }
    onSearchFromHero({
      query: heroKeyword.trim(),
      area: heroLocation,
      minPrice,
      maxPrice,
    });
  };

  // Prioritize real owner listings & promoted listings in recommendations (max 6)
  const recommendedKos = [...kosList]
    .sort((a, b) => {
      if (a.isDemo !== b.isDemo) return a.isDemo ? 1 : -1;
      if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
      return b.lastStatusUpdatedAt.getTime() - a.lastStatusUpdatedAt.getTime();
    })
    .slice(0, 6);

  const features = [
    {
      num: '01',
      title: 'Cek Ketersediaan Kamar',
      description:
        'Ketahui kamar mana yang masih kosong, sudah terisi, atau sedang dalam perbaikan berdasarkan pembaruan langsung pemilik kos.',
      icon: CheckCircle2,
    },
    {
      num: '02',
      title: 'Filter Sesuai Kebutuhan',
      description:
        'Saring pilihan kos berdasarkan area Surabaya Timur, rentang harga bulanan, jenis kos, serta fasilitas seperti AC dan kamar mandi dalam.',
      icon: Filter,
    },
    {
      num: '03',
      title: 'Informasi Lengkap & Rapi',
      description:
        'Bandingkan foto asli kamar, deskripsi aturan kos, rincian jumlah kamar, alamat, dan titik peta lokasi tanpa perlu membuka banyak tab.',
      icon: Compass,
    },
    {
      num: '04',
      title: 'Kontak Pemilik Langsung',
      description:
        'Terhubung langsung ke WhatsApp pengelola kos atau ajukan jadwal survei lokasi secara praktis dalam satu langkah.',
      icon: MessageCircle,
    },
  ];

  const steps = [
    {
      step: 'Langkah 01',
      title: 'Cari kos sesuai kebutuhan',
      desc: 'Pilih lokasi dekat UPN Veteran Jawa Timur, Rungkut, Medokan Ayu, atau Gunung Anyar sesuai anggaran bulanan Anda.',
    },
    {
      step: 'Langkah 02',
      title: 'Periksa informasi dan status kamar',
      desc: 'Cek foto kamar, daftar fasilitas, rincian kamar tersedia, dan waktu terakhir pemilik memperbarui status kos.',
    },
    {
      step: 'Langkah 03',
      title: 'Hubungi pemilik dan jadwalkan survei',
      desc: 'Kirim pesan WhatsApp ke pemilik atau buat jadwal kunjungan survei langsung dari halaman detail kos.',
    },
  ];

  return (
    <div>
      {/* B. Hero Section */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Copy & Search */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="text-xs font-semibold tracking-wide text-[#14532D] mb-3">
                Surabaya Timur · Sekitar UPN Veteran Jawa Timur, Rungkut, Medokan Ayu & Gunung Anyar
              </div>

              <h1
                className="font-display font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-4"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Temukan Kos Impianmu dengan Lebih Mudah!
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-2">
                Cari kos berdasarkan lokasi, harga, fasilitas, dan cek ketersediaan kamar secara praktis dalam satu platform.
              </p>
              <p className="text-sm font-medium text-[#14532D] mb-8">
                “Temukan Kos yang Tepat, Tanpa Ribet.”
              </p>

              {/* Main Hero Search Bar */}
              <form
                onSubmit={handleHeroSubmit}
                className="bg-[#F8FAF9] border border-slate-200 rounded-xl p-3 sm:p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label htmlFor="hero-location" className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Lokasi atau Daerah
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#14532D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="hero-location"
                        value={heroLocation}
                        onChange={(e) => setHeroLocation(e.target.value as KosArea | 'Semua')}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#14532D]"
                      >
                        <option value="Semua">Semua Area Surabaya Timur</option>
                        {AREA_OPTIONS.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="hero-price" className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Kisaran Harga / Bulan
                    </label>
                    <select
                      id="hero-price"
                      value={heroPriceRange}
                      onChange={(e) =>
                        setHeroPriceRange(e.target.value as 'all' | 'under1' | '1to15' | 'above15')
                      }
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#14532D]"
                    >
                      <option value="all">Semua Harga</option>
                      <option value="under1">Di bawah Rp 1 jt</option>
                      <option value="1to15">Rp 1 jt – Rp 1,5 jt</option>
                      <option value="above15">Di atas Rp 1,5 jt</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Search className="w-4 h-4" />
                      <span>Cari Kos</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={heroKeyword}
                    onChange={(e) => setHeroKeyword(e.target.value)}
                    placeholder="Atau ketik nama kos / jalan (misal: Medokan Asri)..."
                    className="flex-1 min-w-[200px] bg-transparent text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Populer:</span>
                    {AREA_OPTIONS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => onSearchFromHero({ area })}
                        className="text-xs font-medium text-[#14532D] hover:underline whitespace-nowrap"
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Right Visual */}
            <div className="lg:col-span-5 flex">
              <div className="relative w-full min-h-[280px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                {!heroImgError ? (
                  <img
                    src={KOS_PHOTOS.hero}
                    alt="Ilustrasi kamar kos modern di Surabaya Timur"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#14532D] to-[#166534] flex flex-col items-center justify-center p-8 text-white text-center">
                    <Building2 className="w-12 h-12 mb-3 opacity-80" />
                    <p className="font-display font-bold text-lg">KosFinder Surabaya Timur</p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <div className="text-xs font-medium text-emerald-200 mb-0.5">
                    Fokus Wilayah Awal
                  </div>
                  <div className="font-display font-bold text-base">
                    Sekitar UPN Veteran Jatim, Rungkut & Gunung Anyar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. Fitur Unggulan */}
      <section className="py-14 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold text-[#14532D] mb-1.5">Keunggulan Platform</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Kenapa Mencari Kos di KosFinder?
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Mengatasi informasi kos yang tersebar di media sosial dan ketidakpastian kamar kosong dengan data terstruktur dari pemilik.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold text-[#14532D] tabular-nums">
                      {item.num}
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-[#14532D]/8 text-[#14532D] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* D. Rekomendasi Kos */}
      <section className="py-14 lg:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#14532D] mb-1.5">
                Rekomendasi Pilihan
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Rekomendasi Kos di Surabaya Timur
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Listing bertanda <span className="font-semibold text-slate-800">Data Demo</span> merupakan contoh katalog awal; listing baru dari pemilik akan tampil tanpa label demo.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#14532D] text-[#14532D] text-sm font-semibold hover:bg-[#14532D]/5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>Lihat Semua Kos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedKos.map((kos) => (
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
      </section>

      {/* E. Cara Kerja KosFinder */}
      <section className="py-14 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#14532D] mb-1.5">Alur Penggunaan</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cara Kerja KosFinder
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="text-xs font-mono font-semibold text-[#14532D] mb-3">
                {s.step}
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tentang Kami */}
      <section id="tentang-kami" className="py-14 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold text-[#14532D] mb-1.5">Tentang KosFinder</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-4">
                Transparansi Ketersediaan Kamar untuk Surabaya Timur
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
                KosFinder hadir untuk mahasiswa UPN Veteran Jawa Timur, pekerja kawasan industri Rungkut SIER, dan masyarakat di Medokan Ayu serta Gunung Anyar. Kami membantu calon penyewa membandingkan kos secara terpusat sekaligus membantu pemilik kos mengelola ketersediaan setiap unit kamar.
              </p>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F8FAF9] border border-slate-200">
                <ShieldCheck className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong>Komitmen Kejujuran Data:</strong> Status ketersediaan kamar berasal dari pembaruan yang dilakukan langsung oleh pemilik kos dan selalu menampilkan waktu <em>“Terakhir diperbarui”</em>.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#F8FAF9] border border-slate-200">
                <div className="font-display text-2xl font-bold text-[#14532D] tabular-nums">4 Area</div>
                <div className="text-xs text-slate-600 mt-1">UPN, Rungkut, Medokan Ayu, Gunung Anyar</div>
              </div>
              <div className="p-5 rounded-xl bg-[#F8FAF9] border border-slate-200">
                <div className="font-display text-2xl font-bold text-[#14532D] tabular-nums">Per Kamar</div>
                <div className="text-xs text-slate-600 mt-1">Pelacakan unit A1, A2, A3 secara terpisah</div>
              </div>
              <div className="p-5 rounded-xl bg-[#F8FAF9] border border-slate-200">
                <div className="font-display text-2xl font-bold text-[#14532D] tabular-nums">Langsung</div>
                <div className="text-xs text-slate-600 mt-1">WhatsApp & jadwal survei ke pemilik</div>
              </div>
              <div className="p-5 rounded-xl bg-[#F8FAF9] border border-slate-200">
                <div className="font-display text-2xl font-bold text-[#14532D] tabular-nums">Gratis</div>
                <div className="text-xs text-slate-600 mt-1">Pencarian katalog tanpa biaya perantara</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* F. Call to Action Pemilik Kos */}
      <section id="untuk-pemilik" className="py-14 lg:py-16 bg-[#14532D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              Punya Usaha Kos? Promosikan Kos Anda di KosFinder!
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Jangkau lebih banyak calon penyewa dan kelola informasi kamar kos Anda dengan lebih mudah.
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={onOwnerCtaClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#14532D] text-sm font-bold hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              <Building2 className="w-4 h-4" />
              <span>Daftarkan Kos Saya</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
