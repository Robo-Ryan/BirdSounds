import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's broken default icon paths when bundled with Vite
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type LatLon = { lat: number; lon: number };

interface MapPickerProps {
  onConfirm: (pos: LatLon) => void;
  loading: boolean;
}

export default function MapPicker({ onConfirm, loading }: MapPickerProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [pinned, setPinned] = useState<LatLon | null>(null);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [20, 0],
      zoom: 2,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: DefaultIcon }).addTo(map);
      }

      setPinned({ lat, lon: lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return (
    <div className="map-section">
      <p className="map-hint">Click anywhere on the map to drop a pin</p>
      <div ref={mapDivRef} className="map-container" />
      {pinned && (
        <div className="map-footer">
          <span className="pin-coords">
            {pinned.lat.toFixed(3)}, {pinned.lon.toFixed(3)}
          </span>
          <button
            className="fetch-btn"
            onClick={() => onConfirm(pinned)}
            disabled={loading}
          >
            {loading ? "Finding birds..." : "Find Birds Here"}
          </button>
        </div>
      )}
    </div>
  );
}
