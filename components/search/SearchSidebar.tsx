"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export default function SearchSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  
  // Parse array params
  const getArrayParam = (key: string) => {
    const val = searchParams.get(key);
    return val ? val.split(",") : [];
  };

  const [selectedOccupancy, setSelectedOccupancy] = useState<string[]>(getArrayParam("occupancy"));
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(getArrayParam("amenities"));
  const [propertyType, setPropertyType] = useState<string[]>(getArrayParam("type"));

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setSelectedOccupancy(getArrayParam("occupancy"));
    setSelectedAmenities(getArrayParam("amenities"));
    setPropertyType(getArrayParam("type"));
  }, [searchParams]);

  const updateParam = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
      else params.delete(key);
    } else {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/pgs?${params.toString()}`);
  };

  const toggleSelection = (
    item: string, 
    current: string[], 
    setter: (val: string[]) => void, 
    paramKey: string
  ) => {
    const newSelection = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    
    setter(newSelection);
    updateParam(paramKey, newSelection);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Search by Name */}
      <div className="mb-8">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">Search by property name</label>
        <div className="relative">
          <input
            type="text"
            placeholder="search by pg name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Debounce update
              const val = e.target.value;
              setTimeout(() => updateParam("q", val), 500);
            }}
            className="w-full pl-9 pr-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-400" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Property Type */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Filter by</h3>
          <div className="space-y-2">
            {['PG', 'Flat'].map((type) => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyType.includes(type)}
                  onChange={() => toggleSelection(type, propertyType, setPropertyType, "type")}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-600 text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Occupancy */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Occupancy</h3>
          <div className="space-y-2">
            {['Single Room', 'Double Sharing', 'Triple Sharing'].map((occ) => (
              <label key={occ} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOccupancy.includes(occ)}
                  onChange={() => toggleSelection(occ, selectedOccupancy, setSelectedOccupancy, "occupancy")}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-600 text-sm">{occ}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Amenities</h3>
          <div className="space-y-2">
            {['Wifi', 'AC', 'Food', 'Power Backup', 'TV', 'Cleaning'].map((am) => (
              <label key={am} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(am)}
                  onChange={() => toggleSelection(am, selectedAmenities, setSelectedAmenities, "amenities")}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-600 text-sm">{am}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
