import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

interface KosMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  mode?: 'view' | 'picker';
  onChangeLocation?: (lat: number, lng: number) => void;
  heightClass?: string;
}

const UPN_COORDS: [number, number] = [-7.3333, 112.7883];

function createCustomPinIcon(color: string, label?: string) {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
      ${
        label
          ? `<div style="background:#14532D;color:#ffffff;font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);margin-bottom:4px;">${label}</div>`
          : ''
      }
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill="${color}"/>
        <circle cx="14" cy="14" r="5.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    className: 'custom-kos-marker',
    html,
    iconSize: [28, 36],
    iconAnchor: [0, 0],
  });
}

export function KosMap({
  latitude,
  longitude,
  title = 'Lokasi Kos',
  address,
  mode = 'view',
  onChangeLocation,
  heightClass = 'h-72',
}: KosMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: mode === 'picker',
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Campus reference pin (UPN Veteran Jatim)
    const upnIcon = L.divIcon({
      className: 'upn-ref-marker',
      html: `<div style="background:#ffffff;color:#14532D;border:1.5px solid #14532D;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,0.12);">UPN Veteran Jatim</div>`,
      iconSize: [120, 22],
      iconAnchor: [0, 0],
    });
    L.marker(UPN_COORDS, { icon: upnIcon, interactive: false }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: createCustomPinIcon('#14532D', mode === 'view' ? title : 'Titik Kos'),
      draggable: mode === 'picker',
    }).addTo(map);

    if (mode === 'picker' && onChangeLocation) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const nextLat = Number(e.latlng.lat.toFixed(6));
        const nextLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([nextLat, nextLng]);
        onChangeLocation(nextLat, nextLng);
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeLocation(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });
    }

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initialize map once per mode/container mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 bg-slate-100`}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#14532D] shrink-0" />
          <span>{address || 'Surabaya Timur (Area Sekitar UPN & Rungkut)'}</span>
        </div>
        <span className="font-mono tabular-nums text-[11px] text-slate-400">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
