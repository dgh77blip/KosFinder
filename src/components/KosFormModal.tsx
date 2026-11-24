import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react';
import {
  AREA_COORDINATES,
  AREA_OPTIONS,
  FACILITY_OPTIONS,
  KOS_PHOTOS,
  PHOTO_PRESETS,
} from '../data/demoKos';
import { FacilityKey, KosArea, KosProperty, KosType, RoomStatus } from '../types/kos';
import { KosMap } from './KosMap';

export interface KosFormSubmitValues {
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
  initialRoomCount: number;
}

interface KosFormModalProps {
  open: boolean;
  editingKos: KosProperty | null;
  defaultOwnerName: string;
  defaultOwnerWhatsapp: string;
  onClose: () => void;
  onSubmit: (values: KosFormSubmitValues) => Promise<void>;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 640;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.68));
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

export function KosFormModal({
  open,
  editingKos,
  defaultOwnerName,
  defaultOwnerWhatsapp,
  onClose,
  onSubmit,
}: KosFormModalProps) {
  const [name, setName] = useState('');
  const [area, setArea] = useState<KosArea>('Sekitar UPN');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [kosType, setKosType] = useState<KosType>('campur');
  const [priceMonthly, setPriceMonthly] = useState('1200000');
  const [ownerName, setOwnerName] = useState(defaultOwnerName);
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(defaultOwnerWhatsapp);
  const [facilities, setFacilities] = useState<FacilityKey[]>(['wifi', 'parkir', 'furnitur']);
  const [photos, setPhotos] = useState<string[]>([KOS_PHOTOS.melati]);
  const [latitude, setLatitude] = useState(AREA_COORDINATES['Sekitar UPN'].lat);
  const [longitude, setLongitude] = useState(AREA_COORDINATES['Sekitar UPN'].lng);
  const [isPromoted, setIsPromoted] = useState(false);
  const [initialRoomCount, setInitialRoomCount] = useState('6');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingKos) {
      setName(editingKos.name);
      setArea(editingKos.area);
      setAddress(editingKos.address);
      setDescription(editingKos.description);
      setKosType(editingKos.kosType);
      setPriceMonthly(String(editingKos.priceMonthly));
      setOwnerName(editingKos.ownerName);
      setOwnerWhatsapp(editingKos.ownerWhatsapp);
      setFacilities(editingKos.facilities);
      setPhotos(editingKos.photos.length > 0 ? editingKos.photos : [KOS_PHOTOS.melati]);
      setLatitude(editingKos.latitude);
      setLongitude(editingKos.longitude);
      setIsPromoted(editingKos.isPromoted);
    } else {
      setName('');
      setArea('Sekitar UPN');
      setAddress('');
      setDescription('');
      setKosType('campur');
      setPriceMonthly('1200000');
      setOwnerName(defaultOwnerName);
      setOwnerWhatsapp(defaultOwnerWhatsapp);
      setFacilities(['ac', 'wifi', 'kamar_mandi_dalam', 'parkir', 'furnitur']);
      setPhotos([KOS_PHOTOS.melati]);
      setLatitude(AREA_COORDINATES['Sekitar UPN'].lat);
      setLongitude(AREA_COORDINATES['Sekitar UPN'].lng);
      setIsPromoted(false);
      setInitialRoomCount('6');
    }
  }, [open, editingKos, defaultOwnerName, defaultOwnerWhatsapp]);

  if (!open) return null;

  const toggleFacility = (key: FacilityKey) => {
    setFacilities((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleAreaChange = (nextArea: KosArea) => {
    setArea(nextArea);
    if (!editingKos) {
      setLatitude(AREA_COORDINATES[nextArea].lat);
      setLongitude(AREA_COORDINATES[nextArea].lng);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    try {
      const remainingSlots = Math.max(0, 6 - photos.length);
      const selected = Array.from(files).slice(0, remainingSlots);
      const compressed = await Promise.all(selected.map(compressImageFile));
      setPhotos((prev) => [...prev, ...compressed].slice(0, 6));
    } catch {
      setErrorMsg('Gagal memproses file foto. Gunakan gambar JPG/PNG yang valid.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('/src/assets/')) {
      setErrorMsg('URL foto harus diawali dengan https://');
      return;
    }
    if (photos.length >= 6) {
      setErrorMsg('Maksimal 6 foto per kos.');
      return;
    }
    setPhotos((prev) => [...prev, trimmed]);
    setPhotoUrlInput('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedPrice = Number(priceMonthly);
    if (name.trim().length < 3) {
      setErrorMsg('Nama kos minimal 3 karakter.');
      return;
    }
    if (address.trim().length < 5) {
      setErrorMsg('Alamat lengkap minimal 5 karakter.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMsg('Deskripsi kos minimal 10 karakter.');
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 100000) {
      setErrorMsg('Harga sewa bulanan minimal Rp 100.000.');
      return;
    }
    if (ownerWhatsapp.trim().length < 8) {
      setErrorMsg('Nomor WhatsApp pemilik minimal 8 digit.');
      return;
    }
    if (photos.length === 0) {
      setErrorMsg('Minimal unggah atau pilih 1 foto kos.');
      return;
    }

    const roomCount = Math.min(30, Math.max(1, Number(initialRoomCount) || 4));

    setSubmitting(true);
    try {
      await onSubmit({
        ownerName: ownerName.trim() || 'Pemilik Kos',
        ownerWhatsapp: ownerWhatsapp.trim(),
        name: name.trim(),
        area,
        address: address.trim(),
        description: description.trim(),
        kosType,
        priceMonthly: parsedPrice,
        facilities,
        photos,
        latitude,
        longitude,
        isPromoted,
        initialRoomCount: roomCount,
      });
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyimpan data kos. Coba periksa kembali isian Anda.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {editingKos ? 'Edit Informasi Kos' : 'Tambah Properti Kos Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lengkapi informasi kos, foto, fasilitas, dan titik lokasi pada peta Surabaya Timur.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form kos"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Kos *
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kos Melati UPN"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Wilayah / Area Surabaya Timur *
              </label>
              <select
                value={area}
                onChange={(e) => handleAreaChange(e.target.value as KosArea)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              >
                {AREA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Kos *
              </label>
              <select
                value={kosType}
                onChange={(e) => setKosType(e.target.value as KosType)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              >
                <option value="putra">Kos Putra</option>
                <option value="putri">Kos Putri</option>
                <option value="campur">Kos Campur</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Harga per Bulan (Rp) *
              </label>
              <input
                type="number"
                required
                min={100000}
                max={50000000}
                step={50000}
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>

            {!editingKos && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jumlah Kamar Awal *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={initialRoomCount}
                  onChange={(e) => setInitialRoomCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Lengkap *
            </label>
            <input
              type="text"
              required
              maxLength={300}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Medokan Asri Utara IV No. 12, Rungkut, Surabaya"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Kos *
            </label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi kamar, peraturan kos, akses gerbang, jarak ke kampus UPN / Rungkut, dan keunggulan lainnya."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Pemilik / Pengelola *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                No. WhatsApp Pemilik *
              </label>
              <input
                type="tel"
                required
                maxLength={25}
                value={ownerWhatsapp}
                onChange={(e) => setOwnerWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>
          </div>

          {/* Facilities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Fasilitas Tersedia
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FACILITY_OPTIONS.map((fac) => {
                const active = facilities.includes(fac.key);
                return (
                  <label
                    key={fac.key}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      active
                        ? 'border-[#14532D] bg-[#14532D]/5 text-[#14532D] font-medium'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleFacility(fac.key)}
                      className="accent-[#14532D] w-4 h-4"
                    />
                    <span>{fac.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Photos Upload & Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Foto Kos ({photos.length}/6) *
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#14532D] text-[#14532D] text-xs font-semibold cursor-pointer hover:bg-[#14532D]/5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {photos.map((src, idx) => (
                <div
                  key={`${idx}-${src.slice(0, 24)}`}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                >
                  <img
                    src={src}
                    alt={`Preview foto ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Hapus foto"
                      className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/75 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-slate-500">Tambah contoh foto cepat:</span>
              {PHOTO_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  disabled={photos.length >= 6 || photos.includes(preset.url)}
                  onClick={() => setPhotos((prev) => [...prev, preset.url].slice(0, 6))}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:border-[#14532D] hover:text-[#14532D] disabled:opacity-40"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="Atau tempel URL foto https://..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#14532D]"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Tambah URL</span>
              </button>
            </div>
          </div>

          {/* Map Location Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Titik Lokasi Kos pada Peta (klik atau geser pin)
              </label>
              <button
                type="button"
                onClick={() => {
                  setLatitude(AREA_COORDINATES[area].lat);
                  setLongitude(AREA_COORDINATES[area].lng);
                }}
                className="text-xs font-medium text-[#14532D] hover:underline"
              >
                Pusatkan ke {area}
              </button>
            </div>
            <KosMap
              mode="picker"
              latitude={latitude}
              longitude={longitude}
              address={address || AREA_COORDINATES[area].label}
              heightClass="h-56"
              onChangeLocation={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>

          {/* Listing Promotion Option */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
            <input
              type="checkbox"
              checked={isPromoted}
              onChange={(e) => setIsPromoted(e.target.checked)}
              className="mt-0.5 accent-[#14532D] w-4 h-4"
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Promosikan sebagai Kos Rekomendasi
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Tampilkan label Rekomendasi dan prioritaskan posisi kos Anda di katalog pencarian KosFinder.
              </div>
            </div>
          </label>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingKos ? 'Simpan Perubahan' : 'Publikasikan Kos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function buildDefaultRoomsForCount(count: number, price: number) {
  return Array.from({ length: count }, (_, idx) => {
    const floor = idx < 5 ? 'Lantai 1' : 'Lantai 2';
    const roomNumber = idx < 5 ? `A${idx + 1}` : `B${idx - 4}`;
    const status: RoomStatus = idx % 2 === 0 ? 'tersedia' : 'terisi';
    return {
      roomNumber,
      floor,
      priceMonthly: price,
      status,
      notes: status === 'tersedia' ? 'Siap huni' : 'Sudah terisi',
    };
  });
}
