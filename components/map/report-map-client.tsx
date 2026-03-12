"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { SidewalkCondition } from "@/lib/domain/sidewalk";
import type { PublicMapReportItem } from "@/lib/reports/list-published-types";

import { ReportDetailCard } from "./report-detail-card";
import { ReportFilters } from "./report-filters";
import { ReportList } from "./report-list";

type ReportMapClientProps = {
  initialItems: PublicMapReportItem[];
};

type MapLibreModule = typeof import("maplibre-gl");
type MarkerInstance = import("maplibre-gl").Marker;
type MapInstance = import("maplibre-gl").Map;

const DEFAULT_CENTER: [number, number] = [-44.1, -22.52];
const DEFAULT_ZOOM = 10;

function markerColor(condition: SidewalkCondition): string {
  if (condition === "good") {
    return "#2a8f7b";
  }
  if (condition === "blocked") {
    return "#b2452f";
  }
  return "#b98900";
}

export function ReportMapClient({ initialItems }: ReportMapClientProps) {
  const [condition, setCondition] = useState<"all" | SidewalkCondition>("all");
  const [neighborhood, setNeighborhood] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<Map<string, MarkerInstance>>(new Map());

  const neighborhoodOptions = useMemo(() => {
    const unique = new Set(
      initialItems.map((item) => item.neighborhood?.trim()).filter((value): value is string => !!value)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const byCondition = condition === "all" ? true : item.condition === condition;
      const byNeighborhood = neighborhood.trim()
        ? (item.neighborhood || "").toLowerCase().includes(neighborhood.trim().toLowerCase())
        : true;
      const byVerified = verifiedOnly ? item.is_verified : true;
      const byBlocked = blockedOnly ? item.condition === "blocked" : true;
      return byCondition && byNeighborhood && byVerified && byBlocked;
    });
  }, [blockedOnly, condition, initialItems, neighborhood, verifiedOnly]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) ?? null;
  }, [filteredItems, selectedId]);

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const maplibre = await import("maplibre-gl");
      if (!mounted || !mapContainerRef.current) {
        return;
      }

      maplibreRef.current = maplibre;

      const map = new maplibre.Map({
        container: mapContainerRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: {}
      });

      mapRef.current = map;
    }

    initMap();

    const markers = markersRef.current;

    return () => {
      mounted = false;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !maplibreRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    filteredItems.forEach((item) => {
      const markerEl = document.createElement("div");
      const size = item.condition === "blocked" ? 18 : item.is_verified ? 15 : 12;
      markerEl.style.width = `${size}px`;
      markerEl.style.height = `${size}px`;
      markerEl.style.borderRadius = "9999px";
      markerEl.style.background = markerColor(item.condition);
      markerEl.style.border = item.is_verified ? "2px solid #111111" : "1px solid #ffffff";
      markerEl.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.35)";

      const marker = new maplibreRef.current!.Marker({ element: markerEl })
        .setLngLat([item.lng, item.lat])
        .addTo(mapRef.current!);

      marker.getElement().addEventListener("click", () => {
        setSelectedId(item.id);
      });

      markersRef.current.set(item.id, marker);
    });
  }, [filteredItems]);

  useEffect(() => {
    if (!mapRef.current || !selectedItem) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedItem.lng, selectedItem.lat],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      duration: 600
    });
  }, [selectedItem]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-3">
        <ReportFilters
          condition={condition}
          neighborhood={neighborhood}
          verifiedOnly={verifiedOnly}
          blockedOnly={blockedOnly}
          neighborhoodOptions={neighborhoodOptions}
          onConditionChange={setCondition}
          onNeighborhoodChange={setNeighborhood}
          onVerifiedOnlyChange={setVerifiedOnly}
          onBlockedOnlyChange={setBlockedOnly}
          onClear={() => {
            setCondition("all");
            setNeighborhood("");
            setVerifiedOnly(false);
            setBlockedOnly(false);
          }}
        />
        <ReportList items={filteredItems} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <div className="space-y-3">
        <div className="relative h-[360px] overflow-hidden border-2 border-[var(--ink)] bg-[var(--paper)] md:h-[520px]">
          <div ref={mapContainerRef} className="h-full w-full" />
          {filteredItems.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(245,243,235,0.85)] p-4 text-center text-sm font-semibold">
              Nenhum registro publicado para exibir neste recorte.
            </div>
          ) : null}
        </div>
        <ReportDetailCard item={selectedItem} />
      </div>
    </div>
  );
}
