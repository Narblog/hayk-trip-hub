import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function PropertyMiniMap({ lat, lng, className = "h-44 w-full" }: { lat: number; lng: number; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    }).setView([lat, lng], 13);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      },
    ).addTo(m);

    const icon = L.divIcon({
      className: "",
      html: `<span class="map-pin-dot"></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([lat, lng], { icon }).addTo(m);

    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    setTimeout(() => m.invalidateSize(), 200);

    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, [lat, lng]);

  return <div ref={el} className={`${className} bg-surface`} />;
}
