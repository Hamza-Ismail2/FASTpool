import { useState, useRef, useEffect } from "react";

interface NominatimSearchInputProps {
  label: string;
  placeholder?: string;
  onSelect: (location: { lat: number; lng: number; display_name: string }) => void;
  initialValue?: string;
}

// Aliases for popular locations
const ALIAS_MAP: Record<string, { lat: number; lng: number; display_name: string }> = {
  "fast": {
    lat: 24.8571541,
    lng: 67.2645918,
    display_name:
      "FAST National University of Computer and Emerging Sciences, National Highway, Abdullah Goth, Bin Qasim Town, Malir District, Karachi Division, 75030, Pakistan — Karachi Division, Pakistan",
  },
  "fast karachi": {
    lat: 24.8571541,
    lng: 67.2645918,
    display_name:
      "FAST National University of Computer and Emerging Sciences, National Highway, Abdullah Goth, Bin Qasim Town, Malir District, Karachi Division, 75030, Pakistan — Karachi Division, Pakistan",
  },
  "fast nuces": {
    lat: 24.8571541,
    lng: 67.2645918,
    display_name:
      "FAST National University of Computer and Emerging Sciences, National Highway, Abdullah Goth, Bin Qasim Town, Malir District, Karachi Division, 75030, Pakistan — Karachi Division, Pakistan",
  },
  "fast national university": {
    lat: 24.8571541,
    lng: 67.2645918,
    display_name:
      "FAST National University of Computer and Emerging Sciences, National Highway, Abdullah Goth, Bin Qasim Town, Malir District, Karachi Division, 75030, Pakistan — Karachi Division, Pakistan",
  },
  "fast national university of computer and emerging sciences": {
    lat: 24.8571541,
    lng: 67.2645918,
    display_name:
      "FAST National University of Computer and Emerging Sciences, National Highway, Abdullah Goth, Bin Qasim Town, Malir District, Karachi Division, 75030, Pakistan — Karachi Division, Pakistan",
  },
};

function getAliasMatch(input: string) {
  const key = input.trim().toLowerCase();
  return ALIAS_MAP[key] || null;
}

const LOCALSTORAGE_KEY = "fastpool_recent_locations";

function getCachedLocations(): { lat: number; lng: number; display_name: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCachedLocation(loc: { lat: number; lng: number; display_name: string }) {
  if (typeof window === "undefined") return;
  let cached = getCachedLocations();
  // Deduplicate by lat/lng
  cached = cached.filter(
    (c) =>
      Math.abs(c.lat - loc.lat) > 1e-6 || Math.abs(c.lng - loc.lng) > 1e-6
  );
  cached.unshift(loc);
  if (cached.length > 8) cached = cached.slice(0, 8);
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(cached));
}

// Quick-select campus locations
const MAIN_CAMPUS = {
  lat: 24.857025631765683,
  lng: 67.26461942231781,
  display_name: "FAST Main Campus, Karachi",
};
const CITY_CAMPUS = {
  lat: 24.86003974087012,
  lng: 67.0699096511544,
  display_name: "FAST City Campus, Karachi",
};

export default function NominatimSearchInput({ label, placeholder, onSelect, initialValue = "" }: NominatimSearchInputProps) {
  const [search, setSearch] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reverseGeocodeLoading, setReverseGeocodeLoading] = useState(false);
  const [cachedLocations, setCachedLocations] = useState<{ lat: number; lng: number; display_name: string }[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  const [focused, setFocused] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    setCachedLocations(getCachedLocations());
  }, []);

  // Helper to format display name with more context
  function formatDisplayName(result: any) {
    let parts = [result.display_name];
    if (result.address) {
      const { city, town, village, state, country } = result.address;
      const loc = [city || town || village, state, country].filter(Boolean).join(", ");
      if (loc && !result.display_name.includes(loc)) {
        parts.push(loc);
      }
    }
    return parts.join(" — ");
  }

  // Search destination using Nominatim, with location bias if available
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearchLoading(true);
    setLastQuery(search);
    searchTimeout.current = setTimeout(() => {
      const baseUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(search)}`;
      let url = baseUrl;
      if (userLocation) {
        const lat = userLocation.lat;
        const lng = userLocation.lng;
        const delta = 0.1;
        url += `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}&bounded=1`;
      }
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.length === 0 && userLocation) {
            // Retry without bias if no results
            fetch(baseUrl)
              .then((res2) => res2.json())
              .then((data2) => {
                setSearchResults(data2);
                setSearchLoading(false);
              });
          } else {
            setSearchResults(data);
            setSearchLoading(false);
          }
        });
    }, 500);
  }, [search, userLocation]);

  // Handle 'Use my current location' option
  const handleUseCurrentLocation = async () => {
    if (!userLocation) return;
    setReverseGeocodeLoading(true);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&addressdetails=1`;
    const res = await fetch(url);
    const data = await res.json();
    setReverseGeocodeLoading(false);
    if (data && data.display_name) {
      const loc = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        display_name: data.display_name,
      };
      onSelect(loc);
      setSearch(data.display_name);
      setSearchResults([]);
      saveCachedLocation(loc);
      setCachedLocations(getCachedLocations());
      setFocused(false);
    } else {
      alert("Could not determine your address from your location.");
    }
  };

  // Handle selecting a cached or alias location
  const handleSelectLocation = (loc: { lat: number; lng: number; display_name: string }) => {
    onSelect(loc);
    setSearch(loc.display_name);
    setSearchResults([]);
    saveCachedLocation(loc);
    setCachedLocations(getCachedLocations());
    setFocused(false);
  };

  // Filter cached locations by search
  const filteredCached = search
    ? cachedLocations.filter((c) =>
        c.display_name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : cachedLocations;

  // Alias match
  const aliasMatch = getAliasMatch(search);

  return (
    <div className="mb-4 relative">
      <label className="block text-gray-400 text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        className="w-full p-2 rounded border border-gray-700 bg-gray-900 text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
      />
      {focused && (searchLoading || filteredCached.length > 0 || aliasMatch || searchResults.length > 0) && (
        <ul className="bg-gradient-to-br from-gray-900/90 to-cyan-900/70 border border-emerald-700/40 shadow-xl rounded-xl mt-2 p-2 max-h-72 overflow-y-auto backdrop-blur-md space-y-1">
          {userLocation && (
            <li
              className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition hover:bg-emerald-900/60 text-emerald-300 font-semibold text-sm border border-transparent hover:border-emerald-500"
              onClick={handleUseCurrentLocation}
            >
              <span className="text-emerald-400">📍</span>
              {reverseGeocodeLoading ? "Getting your current address..." : "Use my current location"}
            </li>
          )}
          {/* Quick-select campus options */}
          <li
            className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition hover:bg-cyan-900/60 text-cyan-200 font-semibold text-sm border border-transparent hover:border-cyan-400"
            onClick={() => handleSelectLocation(MAIN_CAMPUS)}
          >
            <span className="text-cyan-300">🏫</span>
            <span className="truncate flex-1">FAST Main Campus</span>
          </li>
          <li
            className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition hover:bg-cyan-900/60 text-cyan-200 font-semibold text-sm border border-transparent hover:border-cyan-400"
            onClick={() => handleSelectLocation(CITY_CAMPUS)}
          >
            <span className="text-cyan-300">🏢</span>
            <span className="truncate flex-1">FAST City Campus</span>
          </li>
          {aliasMatch && (
            <li
              className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition hover:bg-cyan-900/60 text-cyan-200 font-semibold text-sm border border-transparent hover:border-cyan-400"
              onClick={() => handleSelectLocation(aliasMatch)}
            >
              <span className="text-cyan-300">⭐</span>
              <span className="truncate flex-1">{aliasMatch.display_name}</span>
              <span className="ml-2 text-xs text-cyan-400">Popular</span>
            </li>
          )}
          {filteredCached.map((loc, i) => (
            <li
              key={loc.lat + "," + loc.lng + i}
              className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition hover:bg-emerald-800/60 text-emerald-100 text-sm border border-transparent hover:border-emerald-400"
              onClick={() => handleSelectLocation(loc)}
            >
              <span className="text-emerald-400">🕑</span>
              <span className="truncate flex-1">{loc.display_name}</span>
              <span className="ml-2 text-xs text-emerald-300">Recent</span>
            </li>
          ))}
          {searchResults.map((result: any) => (
            <li
              key={result.place_id}
              className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition hover:bg-emerald-900/60 text-emerald-100 text-sm border border-transparent hover:border-emerald-400"
              onClick={() => {
                const loc = {
                  lat: parseFloat(result.lat),
                  lng: parseFloat(result.lon),
                  display_name: formatDisplayName(result),
                };
                handleSelectLocation(loc);
              }}
            >
              <span className="text-emerald-300">📍</span>
              <span className="truncate flex-1">{formatDisplayName(result)}</span>
            </li>
          ))}
          {searchLoading && <li className="p-2 text-xs text-gray-400">Searching...</li>}
        </ul>
      )}
    </div>
  );
} 