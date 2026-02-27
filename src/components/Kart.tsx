"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat?: number;
  lon?: number;
  onKlikkKart?: (lat: number, lon: number) => void;
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

export function Kart({ lat, lon, onKlikkKart }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [65.0, 13.0], // Center of Norway
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (onKlikkKart) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onKlikkKart(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onKlikkKart]);

  // Update marker and view when coordinates change
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
