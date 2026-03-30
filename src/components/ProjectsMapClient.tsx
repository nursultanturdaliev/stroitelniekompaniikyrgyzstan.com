"use client";

import { useEffect, useRef } from "react";
import type { ElitkaProjectListItem } from "@/data/elitkaProjectsFromMerge";
import "leaflet/dist/leaflet.css";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ProjectsMapClient({ points }: { points: ElitkaProjectListItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const valid = points.filter(
      (p) => p.lat != null && p.lng != null && Number.isFinite(p.lat) && Number.isFinite(p.lng),
    );
    if (valid.length === 0) return;

    let cancelled = false;

    void import("leaflet").then((LeafletModule) => {
      if (cancelled || !containerRef.current) return;
      const L = LeafletModule.default;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([42.87, 74.59], 11);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds = L.latLngBounds([] as [number, number][]);

      for (const p of valid) {
        const latlng: [number, number] = [p.lat!, p.lng!];
        bounds.extend(latlng);
        const marker = L.circleMarker(latlng, {
          radius: 7,
          fillColor: "var(--steel-blue, #3b6fb6)",
          color: "#1e3a5f",
          weight: 1,
          fillOpacity: 0.9,
        });
        const href = `/projects/${p.projectId}/`;
        marker.bindPopup(
          `<div class="text-sm" style="min-width:10rem"><strong>${escapeHtml(p.title)}</strong><br/><span style="color:#64748b;font-size:11px">${escapeHtml(p.builderName)}</span><br/><a href="${href}">Страница объекта</a></div>`,
        );
        marker.addTo(map);
      }

      if (valid.length === 1) {
        map.setView([valid[0].lat!, valid[0].lng!], 14);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    });

    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [points]);

  const withCoords = points.filter(
    (p) => p.lat != null && p.lng != null && Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );

  if (withCoords.length === 0) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-8 text-center text-sm text-[var(--slate-blue)]">
        В текущей выгрузке нет координат для объектов на карте. После обновления данных elitka с полями lat/lon карта появится автоматически.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--slate-blue)]">
        На карте: <strong className="text-[var(--charcoal)]">{withCoords.length}</strong> из {points.length} объектов с координатами в каталоге. Точность — по данным elitka.kg.
      </p>
      <div
        ref={containerRef}
        className="w-full h-[min(70vh,560px)] rounded-xl border border-gray-200 overflow-hidden bg-[var(--warm-beige)] z-0"
      />
    </div>
  );
}
