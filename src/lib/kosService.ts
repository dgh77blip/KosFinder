import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { KOS_PHOTOS } from '../data/demoKos';
import {
  AvailabilityStatus,
  FacilityKey,
  FavoriteKos,
  KosArea,
  KosProperty,
  KosRoom,
  KosType,
  RoomStatus,
  StatusHistoryItem,
  SurveyRequest,
  SurveyStatus,
} from '../types/kos';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function computeSummaryFromRooms(rooms: { status: RoomStatus }[]): {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  availabilityStatus: AvailabilityStatus;
} {
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === 'tersedia').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'terisi').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'perlu_perbaikan').length;

  let availabilityStatus: AvailabilityStatus = 'penuh';
  if (availableRooms > 0) {
    availabilityStatus = 'tersedia';
  } else if (maintenanceRooms > 0) {
    availabilityStatus = 'perlu_konfirmasi';
  }

  return {
    totalRooms,
    availableRooms,
    occupiedRooms,
    maintenanceRooms,
    availabilityStatus,
  };
}

function mapKosDoc(id: string, data: Record<string, unknown>): KosProperty {
  return {
    id,
    ownerUid: String(data.ownerUid || ''),
    ownerName: String(data.ownerName || ''),
    ownerWhatsapp: String(data.ownerWhatsapp || ''),
    name: String(data.name || ''),
    area: (data.area as KosArea) || 'Sekitar UPN',
    address: String(data.address || ''),
    description: String(data.description || ''),
    kosType: (data.kosType as KosType) || 'campur',
    priceMonthly: Number(data.priceMonthly || 0),
    facilities: Array.isArray(data.facilities) ? (data.facilities as FacilityKey[]) : [],
    photos: Array.isArray(data.photos) ? (data.photos as string[]) : [],
    latitude: Number(data.latitude ?? -7.3333),
    longitude: Number(data.longitude ?? 112.7883),
    totalRooms: Number(data.totalRooms || 0),
    availableRooms: Number(data.availableRooms || 0),
    occupiedRooms: Number(data.occupiedRooms || 0),
    maintenanceRooms: Number(data.maintenanceRooms || 0),
    availabilityStatus: (data.availabilityStatus as AvailabilityStatus) || 'perlu_konfirmasi',
    isDemo: Boolean(data.isDemo),
    isPromoted: Boolean(data.isPromoted),
    lastStatusUpdatedAt: toDate(data.lastStatusUpdatedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeKosCatalog(
  onData: (items: KosProperty[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, 'kos'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapKosDoc(d.id, d.data() as Record<string, unknown>));
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'kos');
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeKosRooms(
  kosId: string,
  onData: (rooms: KosRoom[]) => void,
  onError: (err: Error) => void
) {
  const path = `kos/${kosId}/rooms`;
  const q = query(collection(db, path), orderBy('roomNumber', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const rooms: KosRoom[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          kosId: String(data.kosId || kosId),
          ownerUid: String(data.ownerUid || ''),
          roomNumber: String(data.roomNumber || ''),
          floor: String(data.floor || 'Lantai 1'),
          priceMonthly: Number(data.priceMonthly || 0),
          status: (data.status as RoomStatus) || 'tersedia',
          notes: String(data.notes || ''),
          updatedAt: toDate(data.updatedAt),
        };
      });
      onData(rooms);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeKosHistory(
  kosId: string,
  ownerUid: string,
  onData: (items: StatusHistoryItem[]) => void,
  onError: (err: Error) => void
) {
  const path = `kos/${kosId}/history`;
  const q = query(
    collection(db, path),
    where('ownerUid', '==', ownerUid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: StatusHistoryItem[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            kosId: String(data.kosId || kosId),
            ownerUid: String(data.ownerUid || ''),
            action: String(data.action || ''),
            roomNumber: String(data.roomNumber || ''),
            previousStatus: String(data.previousStatus || ''),
            newStatus: String(data.newStatus || ''),
            createdAt: toDate(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export interface CreateKosInput {
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
  isPromoted: boolean;
  initialRooms: {
    roomNumber: string;
    floor: string;
    priceMonthly: number;
    status: RoomStatus;
    notes: string;
  }[];
}

export async function createKosWithRooms(input: CreateKosInput): Promise<string> {
  const kosId = generateId('kos');
  const roomsInput = input.initialRooms.length > 0
    ? input.initialRooms
    : [
        { roomNumber: 'A1', floor: 'Lantai 1', priceMonthly: input.priceMonthly, status: 'tersedia' as RoomStatus, notes: 'Siap huni' },
        { roomNumber: 'A2', floor: 'Lantai 1', priceMonthly: input.priceMonthly, status: 'terisi' as RoomStatus, notes: 'Terisi' },
      ];

  const summary = computeSummaryFromRooms(roomsInput);
  const batch = writeBatch(db);
  const kosRef = doc(db, 'kos', kosId);

  batch.set(kosRef, {
    ownerUid: input.ownerUid,
    ownerName: input.ownerName.trim().slice(0, 100),
    ownerWhatsapp: input.ownerWhatsapp.trim().slice(0, 25),
    name: input.name.trim().slice(0, 120),
    area: input.area,
    address: input.address.trim().slice(0, 300),
    description: input.description.trim().slice(0, 2000),
    kosType: input.kosType,
    priceMonthly: Math.max(100000, Math.round(input.priceMonthly)),
    facilities: input.facilities.slice(0, 10),
    photos: (input.photos.length > 0 ? input.photos : [KOS_PHOTOS.melati]).slice(0, 6),
    latitude: input.latitude,
    longitude: input.longitude,
    totalRooms: summary.totalRooms,
    availableRooms: summary.availableRooms,
    occupiedRooms: summary.occupiedRooms,
    maintenanceRooms: summary.maintenanceRooms,
    availabilityStatus: summary.availabilityStatus,
    isDemo: false,
    isPromoted: Boolean(input.isPromoted),
    lastStatusUpdatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  roomsInput.forEach((room, idx) => {
    const roomId = generateId(`rm${idx + 1}`);
    const roomRef = doc(db, `kos/${kosId}/rooms`, roomId);
    batch.set(roomRef, {
      kosId,
      ownerUid: input.ownerUid,
      roomNumber: room.roomNumber.trim().slice(0, 40),
      floor: room.floor.trim().slice(0, 40),
      priceMonthly: Math.max(100000, Math.round(room.priceMonthly)),
      status: room.status,
      notes: (room.notes || '').trim().slice(0, 200),
      updatedAt: serverTimestamp(),
    });
  });

  const histId = generateId('hist');
  batch.set(doc(db, `kos/${kosId}/history`, histId), {
    kosId,
    ownerUid: input.ownerUid,
    action: `Mendaftarkan properti ${input.name.trim().slice(0, 80)} (${summary.totalRooms} kamar)`,
    roomNumber: '-',
    previousStatus: '-',
    newStatus: summary.availabilityStatus,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return kosId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `kos/${kosId}`);
  }
}

export async function seedOwnerTemplateKos(
  ownerUid: string,
  ownerName: string,
  ownerWhatsapp: string
): Promise<string> {
  const statuses: RoomStatus[] = [
    'tersedia', 'terisi', 'tersedia', 'terisi', 'tersedia',
    'terisi', 'terisi', 'tersedia', 'terisi', 'perlu_perbaikan',
  ];
  const initialRooms = statuses.map((status, i) => ({
    roomNumber: `A${i + 1}`,
    floor: i < 5 ? 'Lantai 1' : 'Lantai 2',
    priceMonthly: 1200000,
    status,
    notes: status === 'tersedia' ? 'Siap ditempati' : status === 'terisi' ? 'Terisi' : 'Perawatan rutin',
  }));

  return createKosWithRooms({
    ownerUid,
    ownerName: ownerName || 'Pemilik Kos',
    ownerWhatsapp: ownerWhatsapp || '6281234567890',
    name: 'Kos Melati Harmoni UPN',
    area: 'Sekitar UPN',
    address: 'Jl. Rungkut Madya Permai No. 14, Gunung Anyar, Surabaya',
    description:
      'Kos nyaman dan bersih hanya 5 menit dari kampus UPN Veteran Jawa Timur. Dilengkapi AC, Wi-Fi cepat, kamar mandi dalam, dapur bersama, dan area parkir motor berkanopi.',
    kosType: 'putri',
    priceMonthly: 1200000,
    facilities: ['ac', 'wifi', 'kamar_mandi_dalam', 'parkir', 'dapur', 'furnitur'],
    photos: [KOS_PHOTOS.melati, KOS_PHOTOS.hero, KOS_PHOTOS.anggrek],
    latitude: -7.3341,
    longitude: 112.7879,
    isPromoted: true,
    initialRooms,
  });
}

export interface UpdateKosDetailsInput {
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
  isPromoted: boolean;
}

export async function updateKosDetails(
  kosId: string,
  ownerUid: string,
  input: UpdateKosDetailsInput
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'kos', kosId), {
    ownerName: input.ownerName.trim().slice(0, 100),
    ownerWhatsapp: input.ownerWhatsapp.trim().slice(0, 25),
    name: input.name.trim().slice(0, 120),
    area: input.area,
    address: input.address.trim().slice(0, 300),
    description: input.description.trim().slice(0, 2000),
    kosType: input.kosType,
    priceMonthly: Math.max(100000, Math.round(input.priceMonthly)),
    facilities: input.facilities.slice(0, 10),
    photos: input.photos.slice(0, 6),
    latitude: input.latitude,
    longitude: input.longitude,
    isPromoted: Boolean(input.isPromoted),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, `kos/${kosId}/history`, generateId('hist')), {
    kosId,
    ownerUid,
    action: `Memperbarui informasi kos ${input.name.trim().slice(0, 80)}`,
    roomNumber: '-',
    previousStatus: '-',
    newStatus: 'diperbarui',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `kos/${kosId}`);
  }
}

export async function deleteKosWithRooms(kosId: string): Promise<void> {
  try {
    const roomsSnap = await getDocs(collection(db, `kos/${kosId}/rooms`));
    const batch = writeBatch(db);
    roomsSnap.docs.forEach((roomDoc) => {
      batch.delete(roomDoc.ref);
    });
    batch.delete(doc(db, 'kos', kosId));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `kos/${kosId}`);
  }
}

export async function updateRoomStatusBatch(
  kosId: string,
  ownerUid: string,
  room: KosRoom,
  newStatus: RoomStatus,
  allRooms: KosRoom[]
): Promise<void> {
  const updatedRooms = allRooms.map((r) =>
    r.id === room.id ? { ...r, status: newStatus } : r
  );
  const summary = computeSummaryFromRooms(updatedRooms);
  const batch = writeBatch(db);

  batch.update(doc(db, `kos/${kosId}/rooms`, room.id), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'kos', kosId), {
    totalRooms: summary.totalRooms,
    availableRooms: summary.availableRooms,
    occupiedRooms: summary.occupiedRooms,
    maintenanceRooms: summary.maintenanceRooms,
    availabilityStatus: summary.availabilityStatus,
    lastStatusUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const statusLabel = (s: RoomStatus) =>
    s === 'tersedia' ? 'Tersedia' : s === 'terisi' ? 'Terisi' : 'Perlu perbaikan';

  batch.set(doc(db, `kos/${kosId}/history`, generateId('hist')), {
    kosId,
    ownerUid,
    action: `Kamar ${room.roomNumber} diubah dari ${statusLabel(room.status)} menjadi ${statusLabel(newStatus)}`,
    roomNumber: room.roomNumber,
    previousStatus: room.status,
    newStatus,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `kos/${kosId}/rooms/${room.id}`);
  }
}

export async function addRoomToKos(
  kosId: string,
  ownerUid: string,
  roomInput: { roomNumber: string; floor: string; priceMonthly: number; status: RoomStatus; notes: string },
  allRooms: KosRoom[]
): Promise<void> {
  const roomId = generateId('rm');
  const nextRooms = [...allRooms, { status: roomInput.status }];
  const summary = computeSummaryFromRooms(nextRooms);
  const batch = writeBatch(db);

  batch.set(doc(db, `kos/${kosId}/rooms`, roomId), {
    kosId,
    ownerUid,
    roomNumber: roomInput.roomNumber.trim().slice(0, 40),
    floor: roomInput.floor.trim().slice(0, 40),
    priceMonthly: Math.max(100000, Math.round(roomInput.priceMonthly)),
    status: roomInput.status,
    notes: roomInput.notes.trim().slice(0, 200),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'kos', kosId), {
    totalRooms: summary.totalRooms,
    availableRooms: summary.availableRooms,
    occupiedRooms: summary.occupiedRooms,
    maintenanceRooms: summary.maintenanceRooms,
    availabilityStatus: summary.availabilityStatus,
    lastStatusUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, `kos/${kosId}/history`, generateId('hist')), {
    kosId,
    ownerUid,
    action: `Menambahkan Kamar ${roomInput.roomNumber.trim()}`,
    roomNumber: roomInput.roomNumber.trim().slice(0, 40),
    previousStatus: '-',
    newStatus: roomInput.status,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `kos/${kosId}/rooms/${roomId}`);
  }
}

export async function deleteRoomFromKos(
  kosId: string,
  ownerUid: string,
  room: KosRoom,
  allRooms: KosRoom[]
): Promise<void> {
  if (allRooms.length <= 1) {
    throw new Error('Minimal harus ada 1 kamar pada setiap properti kos.');
  }
  const remaining = allRooms.filter((r) => r.id !== room.id);
  const summary = computeSummaryFromRooms(remaining);
  const batch = writeBatch(db);

  batch.delete(doc(db, `kos/${kosId}/rooms`, room.id));
  batch.update(doc(db, 'kos', kosId), {
    totalRooms: summary.totalRooms,
    availableRooms: summary.availableRooms,
    occupiedRooms: summary.occupiedRooms,
    maintenanceRooms: summary.maintenanceRooms,
    availabilityStatus: summary.availabilityStatus,
    lastStatusUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, `kos/${kosId}/history`, generateId('hist')), {
    kosId,
    ownerUid,
    action: `Menghapus Kamar ${room.roomNumber}`,
    roomNumber: room.roomNumber,
    previousStatus: room.status,
    newStatus: 'dihapus',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `kos/${kosId}/rooms/${room.id}`);
  }
}

export async function markKosManualStatus(
  kosId: string,
  ownerUid: string,
  status: AvailabilityStatus
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'kos', kosId), {
    availabilityStatus: status,
    lastStatusUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, `kos/${kosId}/history`, generateId('hist')), {
    kosId,
    ownerUid,
    action: `Status ketersediaan kos diatur ke "${status === 'perlu_konfirmasi' ? 'Perlu konfirmasi' : status === 'tersedia' ? 'Tersedia' : 'Penuh'}"`,
    roomNumber: '-',
    previousStatus: '-',
    newStatus: status,
    createdAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `kos/${kosId}`);
  }
}

export async function createSurveyRequest(input: {
  kosId: string;
  kosName: string;
  ownerUid: string;
  seekerUid: string;
  seekerName: string;
  seekerWhatsapp: string;
  visitDate: string;
  visitTime: string;
  notes: string;
}): Promise<string> {
  const surveyId = generateId('srv');
  try {
    await setDoc(doc(db, 'surveys', surveyId), {
      kosId: input.kosId,
      kosName: input.kosName.trim().slice(0, 120),
      ownerUid: input.ownerUid,
      seekerUid: input.seekerUid,
      seekerName: input.seekerName.trim().slice(0, 100),
      seekerWhatsapp: input.seekerWhatsapp.trim().slice(0, 25),
      visitDate: input.visitDate,
      visitTime: input.visitTime,
      notes: input.notes.trim().slice(0, 300),
      status: 'menunggu',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return surveyId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `surveys/${surveyId}`);
  }
}

export function subscribeSurveysForUser(
  uid: string,
  role: 'pencari' | 'pemilik',
  onData: (items: SurveyRequest[]) => void,
  onError: (err: Error) => void
) {
  const field = role === 'pemilik' ? 'ownerUid' : 'seekerUid';
  const q = query(collection(db, 'surveys'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SurveyRequest[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            kosId: String(data.kosId || ''),
            kosName: String(data.kosName || ''),
            ownerUid: String(data.ownerUid || ''),
            seekerUid: String(data.seekerUid || ''),
            seekerName: String(data.seekerName || ''),
            seekerWhatsapp: String(data.seekerWhatsapp || ''),
            visitDate: String(data.visitDate || ''),
            visitTime: String(data.visitTime || ''),
            notes: String(data.notes || ''),
            status: (data.status as SurveyStatus) || 'menunggu',
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'surveys');
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function updateSurveyStatus(surveyId: string, status: SurveyStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'surveys', surveyId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `surveys/${surveyId}`);
  }
}

export function subscribeFavorites(
  uid: string,
  onData: (items: FavoriteKos[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, 'favorites'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FavoriteKos[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: String(data.uid || ''),
            kosId: String(data.kosId || ''),
            kosName: String(data.kosName || ''),
            kosArea: String(data.kosArea || ''),
            kosPrice: Number(data.kosPrice || 0),
            kosPhoto: String(data.kosPhoto || ''),
            createdAt: toDate(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'favorites');
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function toggleFavoriteKos(
  uid: string,
  kos: KosProperty,
  isCurrentlySaved: boolean
): Promise<void> {
  const favId = `${uid}_${kos.id}`;
  try {
    if (isCurrentlySaved) {
      await deleteDoc(doc(db, 'favorites', favId));
    } else {
      await setDoc(doc(db, 'favorites', favId), {
        uid,
        kosId: kos.id,
        kosName: kos.name.slice(0, 120),
        kosArea: kos.area,
        kosPrice: kos.priceMonthly,
        kosPhoto: (kos.photos[0] || '').slice(0, 150000),
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(
      err,
      isCurrentlySaved ? OperationType.DELETE : OperationType.CREATE,
      `favorites/${favId}`
    );
  }
}
