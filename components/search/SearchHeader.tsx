"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MapPin, User, Search } from "lucide-react";

export default function SearchHeader({ cities }: { cities: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("maxPrice") || "50000");

  useEffect(() => {
    // Sync state with URL params if they change externally
    setCity(searchParams.get("city") || "");
    setGender(searchParams.get("gender") || "");
    setPriceMax(searchParams.get("maxPrice") || "50000");
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/pgs?${params.toString()}`);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-[-64px] z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          
          {/* City Dropdown */}
          <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-orange-500" />
            </div>
            <select
              value={city}
              onChange={(e) => updateFilter("city", e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-0 focus:border-transparent bg-transparent rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="hidden md:block w-px h-8 bg-gray-200"></div>

          {/* Search Location Input */}
          <div className="relative flex-[2] w-full md:w-auto">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-orange-500" />
            </div>
            <input
              type="text"
              placeholder="Search Location (e.g. Sector V)"
              className="block w-full pl-10 pr-3 py-2.5 text-base border-none focus:ring-0 bg-transparent placeholder-gray-400"
              onChange={(e) => {
                // Debounce could be added here
              }}
            />
          </div>

          <div className="hidden md:block w-px h-8 bg-gray-200"></div>

          {/* Gender Dropdown */}
          <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-orange-500" />
            </div>
            <select
              value={gender}
              onChange={(e) => updateFilter("gender", e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-0 focus:border-transparent bg-transparent rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <option value="">Any Gender</option>
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Co-Living">Co-Living</option>
            </select>
          </div>

          <div className="hidden md:block w-px h-8 bg-gray-200"></div>

          {/* Price Range */}
          <div className="flex-1 w-full md:w-auto px-4 min-w-[200px]">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Rent Range</span>
              <span className="font-semibold text-orange-600">Up to ₹{priceMax}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={priceMax}
              onChange={(e) => {
                setPriceMax(e.target.value);
              }}
              onMouseUp={() => updateFilter("maxPrice", priceMax)}
              onTouchEnd={() => updateFilter("maxPrice", priceMax)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1k</span>
              <span>₹50k</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
