import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  Clock,
  Edit3,
  Eye,
  History,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { getStatusBadgeConfig } from '../components/KosCard';
import {
  buildDefaultRoomsForCount,
  KosFormModal,
  KosFormSubmitValues,
} from '../components/KosFormModal';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatTimestampId } from '../data/demoKos';
import {
  addRoomToKos,
  createKosWithRooms,
  deleteKosWithRooms,
  deleteRoomFromKos,
  markKosManualStatus,
  seedOwnerTemplateKos,
  subscribeKosHistory,
  subscribeKosRooms,
  subscribeSurveysForUser,
  updateKosDetails,
  updateRoomStatusBatch,
  updateSurveyStatus,
} from '../lib/kosService';
import {
  KosProperty,
  KosRoom,
  RoomStatus,
  StatusHistoryItem,
  SurveyRequest,
} from '../types/kos';

interface OwnerDashboardPageProps {
  allKos: KosProperty[];
  onViewPublicKos: (kosId: string) => void;
}

export function OwnerDashboardPage({
  allKos,
  onViewPublicKos,
}: OwnerDashboardPageProps) {
  const { firebaseUser, profile, privateInfo, openAuthModal, switchRole } = useAuth();

  const myKos = useMemo(
    () =>
      firebaseUser
        ? allKos.filter((k) => !k.isDemo && k.ownerUid === firebaseUser.uid)
        : [],
    [allKos, firebaseUser]
  );

  const [selectedKosId, setSelectedKosId] = useState<string>('');
  const [rooms, setRooms] = useState<KosRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [surveys, setSurveys] = useState<SurveyRequest[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingKos, setEditingKos] = useState<KosProperty | null>(null);
  const [deletingKosId, setDeletingKosId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Add single room inline state
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('Lantai 1');
  const [newRoomPrice, setNewRoomPrice] = useState('');

  useEffect(() => {
    if (myKos.length > 0 && !myKos.some((k) => k.id === selectedKosId)) {
      setSelectedKosId(myKos[0].id);
    } else if (myKos.length === 0) {
      setSelectedKosId('');
    }
  }, [myKos, selectedKosId]);

  const selectedKos = myKos.find((k) => k.id === selectedKosId) || null;

  useEffect(() => {
    if (!selectedKos || !firebaseUser) {
      setRooms([]);
      setHistory([]);
      return;
    }

    setRoomsLoading(true);
    setNewRoomPrice(String(selectedKos.priceMonthly));

    const unsubRooms = subscribeKosRooms(
      selectedKos.id,
      (loaded) => {
        setRooms(loaded);
        setRoomsLoading(false);
      },
      () => setRoomsLoading(false)
    );

    const unsubHist = subscribeKosHistory(
      selectedKos.id,
      firebaseUser.uid,
      (items) => setHistory(items),
      () => {}
    );

    return () => {
      unsubRooms();
      unsubHist();
    };
  }, [selectedKos?.id, firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser || profile?.role !== 'pemilik') {
      setSurveys([]);
      return;
    }
    const unsub = subscribeSurveysForUser(
      firebaseUser.uid,
      'pemilik',
      (items) => setSurveys(items),
      () => {}
    );
    return () => unsub();
  }, [firebaseUser?.uid, profile?.role]);

  if (!firebaseUser || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <Building2 className="w-10 h-10 text-[#14532D] mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Dashboard Pemilik Kos
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Silakan masuk atau daftar sebagai Pemilik Kos untuk mengelola properti dan memperbarui status kamar Anda.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('login', 'pemilik')}
            className="px-5 py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
          >
            Masuk sebagai Pemilik Kos
          </button>
        </div>
      </div>
    );
  }

  if (profile.role !== 'pemilik') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <Building2 className="w-10 h-10 text-[#14532D] mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Akun Anda Saat Ini Sebagai Pencari Kos
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Ingin mendaftarkan dan mengelola properti kos Anda di KosFinder? Aktifkan mode Pemilik Kos pada akun Anda.
          </p>
          <button
            type="button"
            onClick={() => void switchRole('pemilik')}
            className="px-5 py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
          >
            Aktifkan Dashboard Pemilik Kos
          </button>
        </div>
      </div>
    );
  }

  const totalRoomsAll = myKos.reduce((sum, k) => sum + k.totalRooms, 0);
  const availableRoomsAll = myKos.reduce((sum, k) => sum + k.availableRooms, 0);
  const occupiedRoomsAll = myKos.reduce((sum, k) => sum + k.occupiedRooms, 0);

  const handleCreateOrEditKos = async (values: KosFormSubmitValues) => {
    setFeedbackMsg(null);
    if (editingKos) {
      await updateKosDetails(editingKos.id, firebaseUser.uid, {
        ownerName: values.ownerName,
        ownerWhatsapp: values.ownerWhatsapp,
        name: values.name,
        area: values.area,
        address: values.address,
        description: values.description,
        kosType: values.kosType,
        priceMonthly: values.priceMonthly,
        facilities: values.facilities,
        photos: values.photos,
        latitude: values.latitude,
        longitude: values.longitude,
        isPromoted: values.isPromoted,
      });
      setFeedbackMsg({ type: 'ok', text: `Data "${values.name}" berhasil diperbarui.` });
    } else {
      const createdId = await createKosWithRooms({
        ownerUid: firebaseUser.uid,
        ownerName: values.ownerName,
        ownerWhatsapp: values.ownerWhatsapp,
        name: values.name,
        area: values.area,
        address: values.address,
        description: values.description,
        kosType: values.kosType,
        priceMonthly: values.priceMonthly,
        facilities: values.facilities,
        photos: values.photos,
        latitude: values.latitude,
        longitude: values.longitude,
        isPromoted: values.isPromoted,
        initialRooms: buildDefaultRoomsForCount(values.initialRoomCount, values.priceMonthly),
      });
      setSelectedKosId(createdId);
      setFeedbackMsg({ type: 'ok', text: `Kos "${values.name}" berhasil dipublikasikan ke katalog!` });
    }
  };

  const handleSeedSampleKos = async () => {
    setActionBusy('seed');
    setFeedbackMsg(null);
    try {
      const newId = await seedOwnerTemplateKos(
        firebaseUser.uid,
        profile.displayName,
        privateInfo?.whatsapp || '6281234567890'
      );
      setSelectedKosId(newId);
      setFeedbackMsg({
        type: 'ok',
        text: 'Contoh properti "Kos Melati Harmoni UPN" (10 kamar) berhasil dibuat. Anda bisa langsung mengubah status tiap kamar.',
      });
    } catch {
      setFeedbackMsg({ type: 'err', text: 'Gagal membuat contoh properti kos.' });
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeleteKos = async (kosId: string) => {
    setActionBusy(kosId);
    try {
      await deleteKosWithRooms(kosId);
      setDeletingKosId(null);
      setFeedbackMsg({ type: 'ok', text: 'Properti kos telah dihapus.' });
    } catch {
      setFeedbackMsg({ type: 'err', text: 'Gagal menghapus properti kos.' });
    } finally {
      setActionBusy(null);
    }
  };

  const handleRoomStatusChange = async (room: KosRoom, nextStatus: RoomStatus) => {
    if (!selectedKos || room.status === nextStatus) return;
    setActionBusy(room.id);
    setFeedbackMsg(null);
    try {
      await updateRoomStatusBatch(selectedKos.id, firebaseUser.uid, room, nextStatus, rooms);
      setFeedbackMsg({
        type: 'ok',
        text: `Status Kamar ${room.roomNumber} diperbarui & langsung tersinkron ke halaman pencarian.`,
      });
    } catch {
      setFeedbackMsg({ type: 'err', text: 'Gagal memperbarui status kamar.' });
    } finally {
      setActionBusy(null);
    }
  };

  const handleAddSingleRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKos || !newRoomNum.trim()) return;
    setActionBusy('add-room');
    try {
      await addRoomToKos(
        selectedKos.id,
        firebaseUser.uid,
        {
          roomNumber: newRoomNum.trim(),
          floor: newRoomFloor.trim() || 'Lantai 1',
          priceMonthly: Number(newRoomPrice) || selectedKos.priceMonthly,
          status: 'tersedia',
          notes: 'Kamar baru siap huni',
        },
        rooms
      );
      setNewRoomNum('');
      setFeedbackMsg({ type: 'ok', text: `Kamar ${newRoomNum.trim()} ditambahkan.` });
    } catch {
      setFeedbackMsg({ type: 'err', text: 'Gagal menambahkan kamar.' });
    } finally {
      setActionBusy(null);
    }
  };

  const handleRemoveRoom = async (room: KosRoom) => {
    if (!selectedKos) return;
    setActionBusy(room.id);
    try {
      await deleteRoomFromKos(selectedKos.id, firebaseUser.uid, room, rooms);
      setFeedbackMsg({ type: 'ok', text: `Kamar ${room.roomNumber} dihapus.` });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus kamar.',
      });
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#14532D] mb-1">
            Panel Pengelola Kos · {profile.displayName}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Pemilik Kos
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void switchRole('pencari')}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Mode Pencari Kos
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingKos(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kos Baru</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-semibold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* A. Ringkasan Dashboard */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Properti Kos</div>
          <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {myKos.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Kamar</div>
          <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {totalRoomsAll}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-emerald-700 font-medium">Kamar Tersedia</div>
          <div className="font-display text-2xl font-bold text-[#14532D] tabular-nums mt-1">
            {availableRoomsAll}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Kamar Terisi</div>
          <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {occupiedRoomsAll}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#14532D]" />
            <span>Calon Penyewa / Survei</span>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {surveys.length}
          </div>
        </div>
      </section>

      {/* B. Kelola Data Kos */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Properti Kos Saya
            </h2>
            <p className="text-xs text-slate-500">
              Pilih properti untuk mengelola status kamar, mengedit data, atau memantau riwayat pembaruan.
            </p>
          </div>
        </div>

        {myKos.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#F8FAF9] border border-slate-200 text-center space-y-4">
            <Building2 className="w-10 h-10 text-[#14532D]/60 mx-auto" />
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Belum Ada Properti Kos Terdaftar
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
                Tambahkan properti kos pertama Anda atau buat contoh properti 10 kamar untuk mencoba fitur pengelolaan kamar secara instan.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingKos(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kos Baru</span>
              </button>
              <button
                type="button"
                disabled={actionBusy === 'seed'}
                onClick={() => void handleSeedSampleKos()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#14532D] text-[#14532D] text-sm font-semibold hover:bg-[#14532D]/5 disabled:opacity-60"
              >
                {actionBusy === 'seed' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Buat Kos Melati (10 Kamar)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myKos.map((kos) => {
              const badge = getStatusBadgeConfig(kos.availabilityStatus);
              const isSelected = kos.id === selectedKosId;

              return (
                <div
                  key={kos.id}
                  onClick={() => setSelectedKosId(kos.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-[#14532D] bg-[#14532D]/[0.03]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={kos.photos[0]}
                      alt={kos.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-16 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                          {kos.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{kos.area} · {kos.address}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="font-bold text-[#14532D] tabular-nums">
                          {formatRupiah(kos.priceMonthly)}/bln
                        </span>
                        <span className="text-slate-500 tabular-nums">
                          {kos.availableRooms}/{kos.totalRooms} tersedia
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewPublicKos(kos.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKos(kos);
                          setFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void markKosManualStatus(kos.id, firebaseUser.uid, 'perlu_konfirmasi')
                        }
                        className="px-2.5 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-xs font-medium text-amber-800 hover:bg-amber-100"
                      >
                        Perlu Konfirmasi
                      </button>
                    </div>

                    {deletingKosId === kos.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={actionBusy === kos.id}
                          onClick={() => void handleDeleteKos(kos.id)}
                          className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingKosId(null)}
                          className="px-2 py-1.5 rounded-md text-xs text-slate-500"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingKosId(kos.id)}
                        aria-label={`Hapus ${kos.name}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
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

      {/* C. Kelola Kamar & D. Riwayat Pembaruan */}
      {selectedKos && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kelola Kamar */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Kelola Kamar: {selectedKos.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Ubah status setiap kamar. Perubahan langsung muncul di pencarian & halaman detail kos.
                </p>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#14532D]" />
                <span>Update: {formatTimestampId(selectedKos.lastStatusUpdatedAt)}</span>
              </span>
            </div>

            {roomsLoading ? (
              <div className="h-40 rounded-lg bg-slate-100 animate-pulse" />
            ) : (
              <div className="space-y-2.5">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-[#F8FAF9]/60"
                  >
                    <div>
                      <div className="font-display text-sm font-bold text-slate-900">
                        Kamar {room.roomNumber}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {room.floor} · {formatRupiah(room.priceMonthly)}/bln
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                        {(
                          [
                            { val: 'tersedia', label: 'Tersedia', activeClass: 'bg-[#14532D] text-white' },
                            { val: 'terisi', label: 'Terisi', activeClass: 'bg-red-600 text-white' },
                            { val: 'perlu_perbaikan', label: 'Perbaikan', activeClass: 'bg-amber-500 text-white' },
                          ] as { val: RoomStatus; label: string; activeClass: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={actionBusy === room.id}
                            onClick={() => void handleRoomStatusChange(room, opt.val)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                              room.status === opt.val
                                ? opt.activeClass
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {rooms.length > 1 && (
                        <button
                          type="button"
                          disabled={actionBusy === room.id}
                          onClick={() => void handleRemoveRoom(room)}
                          aria-label={`Hapus kamar ${room.roomNumber}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add single room */}
            <form
              onSubmit={handleAddSingleRoom}
              className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
            >
              <input
                type="text"
                required
                maxLength={40}
                value={newRoomNum}
                onChange={(e) => setNewRoomNum(e.target.value)}
                placeholder="No. Kamar (misal: B6)"
                className="sm:col-span-4 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#14532D]"
              />
              <input
                type="text"
                maxLength={40}
                value={newRoomFloor}
                onChange={(e) => setNewRoomFloor(e.target.value)}
                placeholder="Lantai"
                className="sm:col-span-3 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#14532D]"
              />
              <input
                type="number"
                min={100000}
                step={50000}
                value={newRoomPrice}
                onChange={(e) => setNewRoomPrice(e.target.value)}
                placeholder="Harga"
                className="sm:col-span-3 px-3 py-2 text-xs border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#14532D]"
              />
              <button
                type="submit"
                disabled={actionBusy === 'add-room'}
                className="sm:col-span-2 py-2 px-3 rounded-lg bg-[#14532D] text-white text-xs font-semibold hover:bg-[#166534] whitespace-nowrap"
              >
                + Kamar
              </button>
            </form>
          </section>

          {/* D. Riwayat Pembaruan & Survei Masuk */}
          <div className="lg:col-span-5 space-y-6">
            {/* Riwayat Pembaruan */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#14532D]" />
                <h2 className="font-display text-base font-bold text-slate-900">
                  Riwayat Pembaruan Status
                </h2>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Belum ada riwayat perubahan status untuk properti ini.
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {history.slice(0, 15).map((item) => (
                    <div
                      key={item.id}
                      className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                    >
                      <p className="text-xs font-medium text-slate-800">{item.action}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        {formatTimestampId(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Incoming Survey Requests */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#14532D]" />
                <h2 className="font-display text-base font-bold text-slate-900">
                  Permintaan Survei Masuk ({surveys.length})
                </h2>
              </div>

              {surveys.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Belum ada calon penyewa yang menjadwalkan survei untuk kos Anda.
                </p>
              ) : (
                <div className="space-y-3">
                  {surveys.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-[#F8FAF9] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {srv.seekerName}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 capitalize">
                          {srv.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {srv.kosName} · {srv.visitDate} ({srv.visitTime})
                      </div>
                      <div className="text-xs text-slate-500">WA: {srv.seekerWhatsapp}</div>
                      {srv.notes && (
                        <p className="text-xs text-slate-500 italic">“{srv.notes}”</p>
                      )}

                      {srv.status === 'menunggu' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => void updateSurveyStatus(srv.id, 'disetujui')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#14532D] text-white text-xs font-semibold"
                          >
                            <Check className="w-3 h-3" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateSurveyStatus(srv.id, 'dibatalkan')}
                            className="px-2.5 py-1 rounded border border-slate-200 bg-white text-xs text-slate-600"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                      {srv.status === 'disetujui' && (
                        <button
                          type="button"
                          onClick={() => void updateSurveyStatus(srv.id, 'selesai')}
                          className="px-2.5 py-1 rounded bg-emerald-700 text-white text-xs font-semibold"
                        >
                          Tandai Survei Selesai
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <KosFormModal
        open={formOpen}
        editingKos={editingKos}
        defaultOwnerName={profile.displayName}
        defaultOwnerWhatsapp={privateInfo?.whatsapp || ''}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateOrEditKos}
      />
    </div>
  );
}
