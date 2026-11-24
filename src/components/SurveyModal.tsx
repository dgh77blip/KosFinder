import React, { useState } from 'react';
import { Calendar, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createSurveyRequest } from '../lib/kosService';
import { KosProperty } from '../types/kos';

interface SurveyModalProps {
  kos: KosProperty;
  open: boolean;
  onClose: () => void;
}

export function SurveyModal({ kos, open, onClose }: SurveyModalProps) {
  const { firebaseUser, profile, privateInfo } = useAuth();
  const [seekerName, setSeekerName] = useState(profile?.displayName || '');
  const [seekerWhatsapp, setSeekerWhatsapp] = useState(privateInfo?.whatsapp || '');
  const [visitDate, setVisitDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [visitTime, setVisitTime] = useState('10:00 WIB');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setErrorMsg(null);

    if (seekerName.trim().length < 2) {
      setErrorMsg('Mohon isi nama lengkap Anda.');
      return;
    }
    if (seekerWhatsapp.trim().length < 8) {
      setErrorMsg('Mohon masukkan nomor WhatsApp yang valid (minimal 8 digit).');
      return;
    }
    if (!visitDate) {
      setErrorMsg('Pilih tanggal survei.');
      return;
    }

    setSubmitting(true);
    try {
      await createSurveyRequest({
        kosId: kos.id,
        kosName: kos.name,
        ownerUid: kos.ownerUid,
        seekerUid: firebaseUser.uid,
        seekerName: seekerName.trim(),
        seekerWhatsapp: seekerWhatsapp.trim(),
        visitDate,
        visitTime,
        notes,
      });
      setSubmitted(true);
    } catch {
      setErrorMsg('Gagal mengirim jadwal survei. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Jadwalkan Survei Kos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{kos.name}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            aria-label="Tutup modal survei"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#14532D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-slate-900">
                Permintaan Survei Terkirim
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Jadwal kunjungan pada <strong>{visitDate}</strong> pukul{' '}
                <strong>{visitTime}</strong> telah tercatat di akun Anda. Anda juga dapat menghubungi pemilik langsung melalui WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] text-white text-sm font-semibold hover:bg-[#166534]"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={seekerName}
                onChange={(e) => setSeekerName(e.target.value)}
                placeholder="Nama calon penghuni"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor WhatsApp Aktif
              </label>
              <input
                type="tel"
                required
                maxLength={25}
                value={seekerWhatsapp}
                onChange={(e) => setSeekerWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Survei
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jam Kunjungan
                </label>
                <select
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
                >
                  <option value="09:00 WIB">09:00 WIB</option>
                  <option value="10:00 WIB">10:00 WIB</option>
                  <option value="13:00 WIB">13:00 WIB</option>
                  <option value="15:00 WIB">15:00 WIB</option>
                  <option value="17:00 WIB">17:00 WIB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan untuk Pemilik (opsional)
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Ingin melihat kamar lantai 1 yang tersedia bulan depan"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Jadwal...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Konfirmasi Jadwal Survei</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
