"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ServiceItem } from "./page";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ImageSlider from "@/components/ui/ImageSlider";

export default function CatalogClient({ initialItems }: { initialItems: ServiceItem[] }) {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const { currencySymbol } = useSettings();
  const router = useRouter();
  
  const [items, setItems] = useState<ServiceItem[]>(initialItems);
  const [activeFilter, setActiveFilter] = useState<string>(filterParam || "all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (filterParam) setActiveFilter(filterParam);
  }, [filterParam]);

  useEffect(() => {
    const fetchServices = async () => {
        const supabase = getSupabaseClient();
        const { data } = await supabase.from("services").select("*").eq("status", "Active");
        if (data) setItems(data as ServiceItem[]);
    };
    const interval = setInterval(fetchServices, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInquire = (item: ServiceItem) => {
    const params = new URLSearchParams();
    params.set("interest", item.name);
    params.set("type", item.type);
    
    const details = `Type: ${item.type}\nPrice: ${item.price ? `₹${item.price}` : 'On Request'}\nDescription: ${item.description || 'N/A'}`;
    params.set("details", details);

    router.push(`/contact?${params.toString()}`);
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = activeFilter === "all" || item.type.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = ["all", "lodging", "fooding", "travel", "sightseeing", "party"];

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-serif font-bold text-gray-900">Service Catalog</h1>
        <div className="relative w-full md:w-80 group">
           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Search services..." 
             className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none text-gray-900 placeholder-gray-400"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap capitalize transition-all duration-300 ${
              activeFilter === f 
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105" 
                : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const images = item.images && item.images.length > 0 
                ? item.images 
                : (item.image_url ? [item.image_url] : []);
                
            return (
            <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col h-full hover:-translate-y-1">
              <div className="h-40 bg-gray-200 relative overflow-hidden">
                 <ImageSlider 
                    images={images} 
                    alt={item.name} 
                    className="w-full h-full"
                 />
                 <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10 pointer-events-none" />
                 
                 <div className="absolute top-4 right-4 z-20">
                   <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-900 shadow-lg">
                     {item.type}
                   </span>
                 </div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight group-hover:text-pink-600 transition-colors">{item.name}</h3>
                </div>
                
                <p className="text-gray-600 mb-4 text-xs leading-relaxed line-clamp-3 flex-grow">{item.description}</p>
                
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  {item.price !== undefined ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Starting at</span>
                      <span className="font-serif font-bold text-lg text-gray-900">{currencySymbol}{item.price}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-[10px] italic">Price on request</span>
                  )}
                  
                  <button 
                    onClick={() => handleInquire(item)}
                    className="px-4 py-2 bg-gray-50 text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95"
                  >
                    Inquire Now
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No services found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
