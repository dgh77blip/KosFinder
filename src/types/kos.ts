export type UserRole = 'pencari' | 'pemilik';

export type KosArea = 'Sekitar UPN' | 'Rungkut' | 'Medokan Ayu' | 'Gunung Anyar';

export type KosType = 'putra' | 'putri' | 'campur';

export type AvailabilityStatus = 'tersedia' | 'penuh' | 'perlu_konfirmasi';

export type RoomStatus = 'tersedia' | 'terisi' | 'perlu_perbaikan';

export type FacilityKey =
  | 'ac'
  | 'wifi'
  | 'kamar_mandi_dalam'
  | 'parkir'
  | 'dapur'
  | 'furnitur';

export type SurveyStatus = 'menunggu' | 'disetujui' | 'selesai' | 'dibatalkan';

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  whatsapp: string;
  updatedAt?: Date | null;
}

export interface KosRoom {
  id: string;
  kosId: string;
  ownerUid: string;
  roomNumber: string;
  floor: string;
  priceMonthly: number;
  status: RoomStatus;
  notes: string;
  updatedAt: Date;
}

export interface KosProperty {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerWhatsapp: string;
  name: string;
  area: KosArea;
  address: string;
  description: string;
  kosType: KosType;
  priceMonthly: number;
  facilities: FacilityKey[];
  photos: string[];
  latitude: number;
  longitude: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  availabilityStatus: AvailabilityStatus;
  isDemo: boolean;
  isPromoted: boolean;
  lastStatusUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  demoRooms?: KosRoom[];
}

export interface StatusHistoryItem {
  id: string;
  kosId: string;
  ownerUid: string;
  action: string;
  roomNumber: string;
  previousStatus: string;
  newStatus: string;
  createdAt: Date;
}

export interface SurveyRequest {
  id: string;
  kosId: string;
  kosName: string;
  ownerUid: string;
  seekerUid: string;
  seekerName: string;
  seekerWhatsapp: string;
  visitDate: string;
  visitTime: string;
  notes: string;
  status: SurveyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteKos {
  id: string;
  uid: string;
  kosId: string;
  kosName: string;
  kosArea: string;
  kosPrice: number;
  kosPhoto: string;
  createdAt: Date;
}

export interface SearchFilters {
  query: string;
  area: KosArea | 'Semua';
  minPrice: number | '';
  maxPrice: number | '';
  kosType: KosType | 'semua';
  facilities: FacilityKey[];
  status: AvailabilityStatus | 'semua';
  sortBy: 'terbaru' | 'termurah' | 'tertinggi';
}

export const FIELD_LIMITS = {
  DISPLAY_NAME_MAX: 100,
  WHATSAPP_MAX: 25,
  KOS_NAME_MAX: 120,
  ADDRESS_MAX: 300,
  DESCRIPTION_MAX: 2000,
  ROOM_NUMBER_MAX: 40,
  FLOOR_MAX: 40,
  NOTES_MAX: 200,
  SURVEY_NOTES_MAX: 300,
} as const;
