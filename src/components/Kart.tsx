"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KARTLAG } from "@/lib/kartlag";
import type { KartlagId } from "@/types";

interface Props {
  lat?: number;
  lon?: number;
  grense?: GeoJSON.Feature | null;
  synligeKartlag?: Record<KartlagId, boolean>;
  onKlikkKart?: (lat: number, lon: number) => void;
  onMapReady?: (map: L.Map, container: HTMLDivElement) => void;
}

// Fix default marker icon issue in Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function Kart({ lat, lon, grense, synligeKartlag, onKlikkKart, onMapReady }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.GeoJSON | null>(null);
  const wmsLayersRef = useRef<Record<string, L.TileLayer.WMS>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const clickRef = useRef(onKlikkKart);
  clickRef.current = onKlikkKart;
  const mapReadyRef = useRef(onMapReady);
  mapReadyRef.current = onMapReady;

  // Initialize map — runs once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [65.0, 13.0],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      clickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    if (containerRef.current) {
      mapReadyRef.current?.(map, containerRef.current);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker and fly to coordinates
  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    markerRef.current = L.marker([lat, lon], { icon: markerIcon }).addTo(
      mapRef.current
    );

    mapRef.current.flyTo([lat, lon], 15, { duration: 1.5 });
  }, [lat, lon]);

  // Render property boundary polygon
  useEffect(() => {
    if (!mapRef.current) return;

    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    if (!grense) return;

    const layer = L.geoJSON(grense, {
      style: {
        color: "#2563eb",
        weight: 3,
        fillColor: "#f97316",
        fillOpacity: 0.2,
        dashArray: "6 4",
      },
    }).addTo(mapRef.current);

    polygonRef.current = layer;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    }
  }, [grense]);

  // Manage WMS kartlag based on synligeKartlag
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const lag of KARTLAG) {
      const shouldShow = synligeKartlag?.[lag.id] ?? false;
      const existing = wmsLayersRef.current[lag.id];

      if (shouldShow && !existing) {
        const wmsLayer = L.tileLayer.wms(lag.baseUrl, {
          layers: lag.layers,
          format: "image/png",
          transparent: true,
          opacity: lag.opacity,
          minZoom: lag.minZoom,
          maxZoom: 19,
        });

        const updateVisibility = () => {
          const z = map.getZoom();
          if (z >= lag.minZoom && !map.hasLayer(wmsLayer)) {
            wmsLayer.addTo(map);
          } else if (z < lag.minZoom && map.hasLayer(wmsLayer)) {
            map.removeLayer(wmsLayer);
          }
        };

        map.on("zoomend", updateVisibility);
        updateVisibility();
        wmsLayersRef.current[lag.id] = wmsLayer;
        // Store the cleanup handler on the layer object
        (wmsLayer as any)._cleanupZoom = () => map.off("zoomend", updateVisibility);
      } else if (!shouldShow && existing) {
        (existing as any)._cleanupZoom?.();
        if (map.hasLayer(existing)) {
          map.removeLayer(existing);
        }
        delete wmsLayersRef.current[lag.id];
      }
    }
  }, [synligeKartlag]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
