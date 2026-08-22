import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

export type MapPoint = {
  id: string;
  slug: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  price_per_night: number;
  currency: string;
  main_image_url: string | null;
};

const ARMENIA_CENTER: [number, number] = [40.15, 44.9];

export default function SearchMap({
  points,
  lang,
  onSelect,
}: {
  points: MapPoint[];
  lang: Lang;
  onSelect: (slug: string) => void;
}) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView(ARMENIA_CENTER, 7);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    setTimeout(() => m.invalidateSize(), 200);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const lg = layer.current;
    if (!m || !lg) return;
    lg.clearLayers();
    const coords: [number, number][] = [];
    for (const p of points) {
      if (p.latitude == null || p.longitude == null) continue;
      const pos: [number, number] = [p.latitude, p.longitude];
      coords.push(pos);
      const marker = L.marker(pos, {
        icon: L.divIcon({
          className: "",
          html: `<span class="map-price-pin">${formatPrice(Number(p.price_per_night), p.currency || "AMD", lang)}</span>`,
          iconSize: [0, 0],
        }),
      });
      marker.bindTooltip(p.name, { direction: "top", offset: [0, -14] });
      marker.on("click", () => onSelect(p.slug));
      marker.addTo(lg);
    }
    if (coords.length) {
      const bounds = L.latLngBounds(coords).pad(0.25);
      m.invalidateSize();
      m.fitBounds(bounds, { maxZoom: 12 });
      setTimeout(() => {
        m.invalidateSize();
        m.fitBounds(bounds, { maxZoom: 12 });
      }, 250);
    } else m.setView(ARMENIA_CENTER, 7);
  }, [points, lang, onSelect]);

  return <div ref={el} className="size-full min-h-[420px] rounded-3xl" />;
}
