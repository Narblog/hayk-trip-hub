import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ARMENIA_CENTER: [number, number] = [40.15, 44.9];

export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!el.current || map.current) return;
    const hasPos = lat != null && lng != null;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(
      hasPos ? [lat!, lng!] : ARMENIA_CENTER,
      hasPos ? 14 : 7,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(m);

    const icon = L.divIcon({
      className: "",
      html: `<span class="map-pin-dot"></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const place = (ll: L.LatLng) => {
      if (marker.current) marker.current.setLatLng(ll);
      else {
        marker.current = L.marker(ll, { icon, draggable: true }).addTo(m);
        marker.current.on("dragend", () => {
          const p = marker.current!.getLatLng();
          cb.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
        });
      }
      cb.current(Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6)));
    };

    if (hasPos) {
      marker.current = L.marker([lat!, lng!], { icon, draggable: true }).addTo(m);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLatLng();
        cb.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
      });
    }

    m.on("click", (e: L.LeafletMouseEvent) => place(e.latlng));
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    setTimeout(() => m.invalidateSize(), 200);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={el} className="h-[320px] w-full rounded-2xl border border-border" />;
}
