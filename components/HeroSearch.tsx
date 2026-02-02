"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Home, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HeroSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PG" | "Flat">("PG");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [maxPrice, setMaxPrice] = useState(20000);

  useEffect(() => {
    const fetchCities = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("properties").select("city").eq("status", "Active");
      if (data) {
        const uniqueCities = Array.from(new Set(data.map((p: any) => p.city))).sort();
        setCities(uniqueCities);
      }
    };
    fetchCities();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (location) params.append("q", location);
    if (activeTab) params.append("type", activeTab);
    if (gender && activeTab === "PG") params.append("gender", gender);
    if (maxPrice) params.append("maxPrice", maxPrice.toString());
    
    router.push(`/pgs?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden -mt-20 relative z-20 border border-gray-100">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("PG")}
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === "PG"
              ? "bg-white text-blue-600 border-b-4 border-blue-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Home className="w-5 h-5" /> PG / Hostel
        </button>
        <button
          onClick={() => setActiveTab("Flat")}
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === "Flat"
              ? "bg-white text-blue-600 border-b-4 border-blue-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Users className="w-5 h-5" /> Flat / House
        </button>
      </div>

      {/* Search Form */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          
          {/* City Selection */}
          <div className="relative group">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">City</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 group-focus-within:bg-white group-focus-within:border-blue-500 transition-colors relative">
              <MapPin className="w-5 h-5 text-blue-500 mr-3 z-10" />
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-700 font-medium appearance-none cursor-pointer relative z-20"
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                 <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Location Search */}
          <div className="relative group">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Location</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 group-focus-within:bg-white group-focus-within:border-blue-500 transition-colors">
              <Search className="w-5 h-5 text-blue-500 mr-3" />
              <input
                type="text"
                placeholder="Search Locality..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-700 font-medium placeholder-gray-400"
              />
            </div>
          </div>

          {/* Gender / Rent Filter */}
          {activeTab === "PG" ? (
            <div className="relative group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tenant Type</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 group-focus-within:bg-white group-focus-within:border-blue-500 transition-colors">
                <Users className="w-5 h-5 text-blue-500 mr-3" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                >
                  <option value="">Any Gender</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-Living">Co-Living</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="relative group">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Max Rent: ₹{maxPrice}</label>
               <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                 <input 
                   type="range" 
                   min="5000" 
                   max="100000" 
                   step="1000"
                   value={maxPrice}
                   onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                   className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
               </div>
            </div>
          )}

          {/* Search Button */}
          <div className="flex items-end h-full pt-6 md:pt-0">
            <button 
              onClick={handleSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              Search {activeTab} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
