import { FacilityKey, KosArea, KosProperty, KosRoom, RoomStatus } from '../types/kos';

export const KOS_PHOTOS = {
  hero: '/src/assets/images/hero_kos_room_1795510105661.jpg',
  melati: '/src/assets/images/kos_melati_room_1795510106487.jpg',
  cendana: '/src/assets/images/kos_cendana_room_1795510105831.jpg',
  pinus: '/src/assets/images/kos_pinus_room_1795510106064.jpg',
  anggrek: '/src/assets/images/kos_anggrek_building_1795510106271.jpg',
} as const;

export const PHOTO_PRESETS = [
  { label: 'Kamar Eksklusif Modern', url: KOS_PHOTOS.hero },
  { label: 'Kamar Mahasiswa Minimalis', url: KOS_PHOTOS.melati },
  { label: 'Kamar Coliving & KM Dalam', url: KOS_PHOTOS.cendana },
  { label: 'Kamar Nyaman Jendela Terang', url: KOS_PHOTOS.pinus },
  { label: 'Tampak Depan & Parkir Kos', url: KOS_PHOTOS.anggrek },
];

export const FACILITY_OPTIONS: { key: FacilityKey; label: string }[] = [
  { key: 'ac', label: 'AC' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'kamar_mandi_dalam', label: 'Kamar mandi dalam' },
  { key: 'parkir', label: 'Tempat parkir' },
  { key: 'dapur', label: 'Dapur' },
  { key: 'furnitur', label: 'Furnitur lengkap' },
];

export const AREA_OPTIONS: KosArea[] = [
  'Sekitar UPN',
  'Rungkut',
  'Medokan Ayu',
  'Gunung Anyar',
];

export const AREA_COORDINATES: Record<KosArea, { lat: number; lng: number; label: string }> = {
  'Sekitar UPN': { lat: -7.3333, lng: 112.7883, label: 'Sekitar Kampus UPN Veteran Jawa Timur' },
  'Rungkut': { lat: -7.3267, lng: 112.7735, label: 'Kecamatan Rungkut, Surabaya Timur' },
  'Medokan Ayu': { lat: -7.3302, lng: 112.7965, label: 'Kelurahan Medokan Ayu, Rungkut' },
  'Gunung Anyar': { lat: -7.3408, lng: 112.7924, label: 'Kecamatan Gunung Anyar, Surabaya Timur' },
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimestampId(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' WIB';
}

export function formatRelativeUpdate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatTimestampId(date);
}

function buildDemoRooms(
  kosId: string,
  price: number,
  statuses: RoomStatus[],
  updatedAt: Date
): KosRoom[] {
  return statuses.map((status, idx) => {
    const floorNum = idx < 5 ? 1 : 2;
    const roomNum = idx < 5 ? `A${idx + 1}` : `B${idx - 4}`;
    return {
      id: `${kosId}_room_${roomNum}`,
      kosId,
      ownerUid: 'demo_owner',
      roomNumber: roomNum,
      floor: `Lantai ${floorNum}`,
      priceMonthly: price,
      status,
      notes:
        status === 'tersedia'
          ? 'Siap huni, kasur & meja belajar baru dibersihkan'
          : status === 'perlu_perbaikan'
          ? 'Sedang perbaikan AC & pengecatan ulang'
          : 'Sudah terisi penyewa aktif',
      updatedAt,
    };
  });
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000);

export const DEMO_KOS_LIST: KosProperty[] = [
  {
    id: 'demo-kos-melati-upn',
    ownerUid: 'demo_owner',
    ownerName: 'Ibu Sari Wijaya',
    ownerWhatsapp: '6281234567801',
    name: 'Kos Melati Asri UPN',
    area: 'Sekitar UPN',
    address: 'Jl. Rungkut Madya No. 45, Gunung Anyar (3 menit jalan kaki ke UPN)',
    description:
      'Kos putri bersih dan tenang khusus mahasiswi UPN Veteran Jawa Timur dan sekitarnya. Akses gerbang 24 jam dengan kartu akses, lingkungan aman, dekat minimarket, laundry, dan kuliner Rungkut Madya.',
    kosType: 'putri',
    priceMonthly: 1250000,
    facilities: ['ac', 'wifi', 'kamar_mandi_dalam', 'parkir', 'dapur', 'furnitur'],
    photos: [KOS_PHOTOS.melati, KOS_PHOTOS.anggrek, KOS_PHOTOS.hero],
    latitude: -7.3342,
    longitude: 112.7871,
    totalRooms: 10,
    availableRooms: 3,
    occupiedRooms: 6,
    maintenanceRooms: 1,
    availabilityStatus: 'tersedia',
    isDemo: true,
    isPromoted: true,
    lastStatusUpdatedAt: hoursAgo(2),
    createdAt: hoursAgo(120),
    updatedAt: hoursAgo(2),
    demoRooms: buildDemoRooms(
      'demo-kos-melati-upn',
      1250000,
      [
        'tersedia', 'terisi', 'tersedia', 'terisi', 'terisi',
        'tersedia', 'terisi', 'terisi', 'terisi', 'perlu_perbaikan',
      ],
      hoursAgo(2)
    ),
  },
  {
    id: 'demo-kos-cendana-rungkut',
    ownerUid: 'demo_owner',
    ownerName: 'Bapak Hendra Kusuma',
    ownerWhatsapp: '6281234567802',
    name: 'Griya Cendana Coliving Rungkut',
    area: 'Rungkut',
    address: 'Jl. Rungkut Asri Tengah VII No. 18, Rungkut, Surabaya',
    description:
      'Hunian coliving modern untuk mahasiswa dan pekerja muda area SIER & Rungkut. Setiap kamar dilengkapi kamar mandi dalam air hangat, Wi-Fi fiber 100 Mbps, dan area kerja bersama yang nyaman.',
    kosType: 'campur',
    priceMonthly: 1750000,
    facilities: ['ac', 'wifi', 'kamar_mandi_dalam', 'parkir', 'dapur', 'furnitur'],
    photos: [KOS_PHOTOS.cendana, KOS_PHOTOS.hero, KOS_PHOTOS.anggrek],
    latitude: -7.3264,
    longitude: 112.7758,
    totalRooms: 8,
    availableRooms: 2,
    occupiedRooms: 6,
    maintenanceRooms: 0,
    availabilityStatus: 'tersedia',
    isDemo: true,
    isPromoted: true,
    lastStatusUpdatedAt: hoursAgo(5),
    createdAt: hoursAgo(200),
    updatedAt: hoursAgo(5),
    demoRooms: buildDemoRooms(
      'demo-kos-cendana-rungkut',
      1750000,
      ['tersedia', 'terisi', 'terisi', 'tersedia', 'terisi', 'terisi', 'terisi', 'terisi'],
      hoursAgo(5)
    ),
  },
  {
    id: 'demo-kos-pinus-medokan',
    ownerUid: 'demo_owner',
    ownerName: 'Mas Aditya Pratama',
    ownerWhatsapp: '6281234567803',
    name: 'Kos Pinus Medokan Ayu',
    area: 'Medokan Ayu',
    address: 'Jl. Medokan Asri Utara IV No. 22, Medokan Ayu, Rungkut',
    description:
      'Kos putra ekonomis dan rapi di kawasan Medokan Asri yang tenang. Cocok untuk mahasiswa UPN atau pekerja Surabaya Timur. Parkir motor luas dan teduh, tersedia dapur bersama lengkap dengan kulkas.',
    kosType: 'putra',
    priceMonthly: 850000,
    facilities: ['wifi', 'parkir', 'dapur', 'furnitur'],
    photos: [KOS_PHOTOS.pinus, KOS_PHOTOS.anggrek, KOS_PHOTOS.melati],
    latitude: -7.3296,
    longitude: 112.7952,
    totalRooms: 8,
    availableRooms: 4,
    occupiedRooms: 4,
    maintenanceRooms: 0,
    availabilityStatus: 'tersedia',
    isDemo: true,
    isPromoted: false,
    lastStatusUpdatedAt: hoursAgo(14),
    createdAt: hoursAgo(240),
    updatedAt: hoursAgo(14),
    demoRooms: buildDemoRooms(
      'demo-kos-pinus-medokan',
      850000,
      ['tersedia', 'tersedia', 'terisi', 'terisi', 'tersedia', 'terisi', 'tersedia', 'terisi'],
      hoursAgo(14)
    ),
  },
  {
    id: 'demo-kos-anggrek-gunung-anyar',
    ownerUid: 'demo_owner',
    ownerName: 'Ibu Ratna Dewi',
    ownerWhatsapp: '6281234567804',
    name: 'Griya Mutiara Anggrek Gunung Anyar',
    area: 'Gunung Anyar',
    address: 'Jl. Gunung Anyar Lor No. 52, Gunung Anyar, Surabaya',
    description:
      'Bangunan 2 lantai baru dengan halaman parkir mobil dan motor yang luas. Dekat akses MERR dan kampus UPN Veteran Jawa Timur. Kebersihan koridor dijaga rutin setiap minggu.',
    kosType: 'putri',
    priceMonthly: 1450000,
    facilities: ['ac', 'wifi', 'kamar_mandi_dalam', 'parkir', 'furnitur'],
    photos: [KOS_PHOTOS.anggrek, KOS_PHOTOS.hero, KOS_PHOTOS.cendana],
    latitude: -7.3395,
    longitude: 112.7918,
    totalRooms: 6,
    availableRooms: 0,
    occupiedRooms: 6,
    maintenanceRooms: 0,
    availabilityStatus: 'penuh',
    isDemo: true,
    isPromoted: false,
    lastStatusUpdatedAt: hoursAgo(20),
    createdAt: hoursAgo(300),
    updatedAt: hoursAgo(20),
    demoRooms: buildDemoRooms(
      'demo-kos-anggrek-gunung-anyar',
      1450000,
      ['terisi', 'terisi', 'terisi', 'terisi', 'terisi', 'terisi'],
      hoursAgo(20)
    ),
  },
  {
    id: 'demo-kos-flamboyan-rungkut',
    ownerUid: 'demo_owner',
    ownerName: 'Bapak Bambang Sutrisno',
    ownerWhatsapp: '6281234567805',
    name: 'Kos Flamboyan Rungkut Jaya',
    area: 'Rungkut',
    address: 'Jl. Rungkut Kidul Industri No. 11, Rungkut, Surabaya',
    description:
      'Kos putra dekat kawasan perkantoran dan industri Rungkut SIER. Listrik token masing-masing kamar, akses jalan lebar, dan tersedia fasilitas cuci setrika di dekat gerbang.',
    kosType: 'putra',
    priceMonthly: 1050000,
    facilities: ['ac', 'wifi', 'parkir', 'dapur', 'furnitur'],
    photos: [KOS_PHOTOS.hero, KOS_PHOTOS.pinus, KOS_PHOTOS.anggrek],
    latitude: -7.3238,
    longitude: 112.7689,
    totalRooms: 6,
    availableRooms: 1,
    occupiedRooms: 4,
    maintenanceRooms: 1,
    availabilityStatus: 'perlu_konfirmasi',
    isDemo: true,
    isPromoted: false,
    lastStatusUpdatedAt: hoursAgo(36),
    createdAt: hoursAgo(360),
    updatedAt: hoursAgo(36),
    demoRooms: buildDemoRooms(
      'demo-kos-flamboyan-rungkut',
      1050000,
      ['tersedia', 'terisi', 'terisi', 'terisi', 'terisi', 'perlu_perbaikan'],
      hoursAgo(36)
    ),
  },
  {
    id: 'demo-kos-kenanga-medokan',
    ownerUid: 'demo_owner',
    ownerName: 'Ibu Nurul Hidayati',
    ownerWhatsapp: '6281234567806',
    name: 'Kos Kenanga Eksklusif UPN',
    area: 'Sekitar UPN',
    address: 'Jl. Medokan Asri Barat VIII No. 9, dekat Gerbang Belakang UPN',
    description:
      'Kamar luas dengan pencahayaan alami dan sirkulasi udara baik. Hanya 4 menit naik motor ke kampus UPN Veteran Jawa Timur dan 6 menit ke Jalan Raya MERR.',
    kosType: 'campur',
    priceMonthly: 1550000,
    facilities: ['ac', 'wifi', 'kamar_mandi_dalam', 'parkir', 'dapur', 'furnitur'],
    photos: [KOS_PHOTOS.hero, KOS_PHOTOS.cendana, KOS_PHOTOS.melati],
    latitude: -7.3321,
    longitude: 112.7906,
    totalRooms: 8,
    availableRooms: 2,
    occupiedRooms: 6,
    maintenanceRooms: 0,
    availabilityStatus: 'tersedia',
    isDemo: true,
    isPromoted: true,
    lastStatusUpdatedAt: hoursAgo(4),
    createdAt: hoursAgo(180),
    updatedAt: hoursAgo(4),
    demoRooms: buildDemoRooms(
      'demo-kos-kenanga-medokan',
      1550000,
      ['tersedia', 'terisi', 'terisi', 'terisi', 'tersedia', 'terisi', 'terisi', 'terisi'],
      hoursAgo(4)
    ),
  },
];
