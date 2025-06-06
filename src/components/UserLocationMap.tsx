import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Route, Clock } from "lucide-react";

// Fix default marker icon issue in Leaflet with Webpack
const iconUrl = require("leaflet/dist/images/marker-icon.png");
const iconShadow = require("leaflet/dist/images/marker-shadow.png");

const userIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl: iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Add a red marker icon for destination
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  display_name: string;
}

export default function UserLocationMap({
  pickup,
  destination,
}: {
  pickup?: LocationPoint | null;
  destination?: LocationPoint | null;
}) {
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [roadDuration, setRoadDuration] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Haversine formula
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Fetch route from OpenRouteService
  useEffect(() => {
    setRoadDistance(null);
    setRoadDuration(null);
    setRouteCoords([]);
    setRouteError(null);
    if (pickup && destination) {
      const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
      if (!apiKey) {
        setRouteError("OpenRouteService API key not set.");
        return;
      }
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${pickup.lng},${pickup.lat}&end=${destination.lng},${destination.lat}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (
            data &&
            data.features &&
            data.features[0] &&
            data.features[0].properties &&
            data.features[0].geometry
          ) {
            setRoadDistance(data.features[0].properties.summary.distance / 1000); // km
            setRoadDuration(data.features[0].properties.summary.duration / 60); // min
            // decode polyline
            const coords = data.features[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            setRouteCoords(coords);
          } else {
            setRouteError("No route found.");
          }
        })
        .catch(() => setRouteError("Failed to fetch route."));
    }
  }, [pickup, destination]);

  if (!pickup && !destination) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-emerald-400 animate-pulse">
        Please select pickup and/or destination.
      </div>
    );
  }

  const center = pickup
    ? [pickup.lat, pickup.lng]
    : destination
    ? [destination.lat, destination.lng]
    : [0, 0];

  const straightDistance = pickup && destination
    ? getDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
    : null;

  return (
    <div>
      {/* Modern info card */}
      {(pickup || destination) && (
        <div className="mb-4 rounded-xl bg-gradient-to-br from-emerald-900/60 to-cyan-900/40 border border-emerald-700/40 shadow-lg p-4 flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-md">
          {pickup && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                <MapPin size={16} /> Pickup
              </div>
              <div className="text-emerald-100 truncate text-xs md:text-sm font-medium">{pickup.display_name}</div>
              <div className="text-xs text-emerald-300 mt-1">Lat: {pickup.lat}, Lng: {pickup.lng}</div>
            </div>
          )}
          {destination && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1">
                <MapPin size={16} /> Destination
              </div>
              <div className="text-red-100 truncate text-xs md:text-sm font-medium">{destination.display_name}</div>
              <div className="text-xs text-red-300 mt-1">Lat: {destination.lat}, Lng: {destination.lng}</div>
            </div>
          )}
          {pickup && destination && (
            <div className="flex flex-col items-start md:items-end justify-center min-w-[160px]">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
                <Route size={16} />
                {roadDistance !== null ? (
                  <span className="text-cyan-200">{roadDistance.toFixed(2)} km</span>
                ) : routeError ? (
                  <span className="text-red-400">{routeError}</span>
                ) : straightDistance !== null ? (
                  <span className="text-cyan-200">{straightDistance.toFixed(2)} km</span>
                ) : null}
              </div>
              {roadDuration !== null && (
                <div className="flex items-center gap-1 text-cyan-400 text-xs">
                  <Clock size={14} /> Est. {roadDuration.toFixed(0)} min
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Map */}
      <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-700 shadow-lg">
        <MapContainer
          center={center as [number, number]}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pickup && (
            <Marker position={[pickup.lat, pickup.lng]} icon={userIcon}>
              <Popup>Pickup</Popup>
            </Marker>
          )}
          {destination && (
            <Marker position={[destination.lat, destination.lng]} icon={redIcon}>
              <Popup>Destination</Popup>
            </Marker>
          )}
          {routeCoords.length > 1 && (
            <Polyline positions={routeCoords} color="#10b981" weight={5} opacity={0.7} />
          )}
          <RecenterMap lat={center[0]} lng={center[1]} />
        </MapContainer>
      </div>
    </div>
  );
} 