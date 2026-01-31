"use client";
import { useState, useEffect } from "react";
import { Check, Heart, Star, Package, Clock, Users, Briefcase, PartyPopper } from "lucide-react";
import { PackageItem } from "./page";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ImageSlider from "@/components/ui/ImageSlider";

export default function PackagesClient({ initialItems }: { initialItems: PackageItem[] }) {
  const [packages, setPackages] = useState<PackageItem[]>(initialItems);
  const { currencySymbol } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const fetchPackages = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("packages").select("*").eq("status", "Active");
      if (data) setPackages(data as PackageItem[]);
    };
    // fetchPackages(); // Optional if we trust initialItems, but let's sync up.
    const interval = setInterval(fetchPackages, 3000);
    return () => clearInterval(interval);
  }, []);

  function handleBookNow(pkg: PackageItem): void {
    const params = new URLSearchParams();
    params.set("interest", pkg.name);
    params.set("type", "package");
    
    const details = `Package: ${pkg.name}\nPrice: ${pkg.price ? `₹${pkg.price}` : 'On Request'}\nDescription: ${pkg.description || 'N/A'}\nIncludes: ${pkg.items?.join(', ') || 'N/A'}\nDuration: ${pkg.number_of_days || 0} Days / ${pkg.number_of_nights || 0} Nights`;
    params.set("details", details);
    
    router.push(`/contact?${params.toString()}`);
  }

  return (
    <div className="space-y-12 py-10">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-5xl font-serif font-extrabold text-gray-900 tracking-tight">Curated Packages</h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Experience the best of what we offer with our carefully designed all-inclusive stays.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {packages.map((pkg) => {
            const images = pkg.images && pkg.images.length > 0 
                ? pkg.images 
                : (pkg.image_url ? [pkg.image_url] : []);
            
            return (
          <div key={pkg.id} className="flex flex-col md:flex-row bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group h-full">
            {/* Left Section: Image & Key Info */}
            <div className="md:w-72 flex-shrink-0 flex flex-col border-r border-gray-100">
              <div className="relative h-56 md:h-64 overflow-hidden">
                <ImageSlider 
                    images={images} 
                    alt={pkg.name} 
                    className="w-full h-full"
                />
                <div className="absolute top-4 right-4 z-20">
                   <Heart className="h-6 w-6 text-white drop-shadow-md hover:text-red-500 hover:fill-red-500 transition-colors cursor-pointer" />
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-4 bg-white flex-grow justify-between">
                 <div className="flex justify-between items-end">
                    <div>
                       <span className="text-xs text-gray-400 uppercase tracking-widest font-medium mt-1">PACKAGE</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <span className="text-2xl font-bold text-gray-900">{currencySymbol}{pkg.price}</span>
                       <span className="text-xs text-gray-400 font-medium block">/ stay</span>
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => handleBookNow(pkg)}
                   className="w-full bg-gray-900 text-white py-3 rounded-lg uppercase font-bold text-xs tracking-widest hover:bg-gray-800 transition-colors"
                 >
                   Inquire Now
                 </button>
              </div>
            </div>

            {/* Right Section: Details */}
            <div className="p-6 md:p-8 flex-grow flex flex-col justify-center">
               <div className="mb-6">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2 leading-tight">{pkg.name}</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{useSettings().settings.siteName || "Hotel Sakura"}</p>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-4">
                    {pkg.description || "An exclusive package designed to provide you with an unforgettable experience."}
                  </p>
                  
                  {/* Meta Details */}
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500 border-t border-b border-gray-100 py-3 mb-4">
                      {(pkg.number_of_days || pkg.number_of_nights) && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-pink-500" />
                            <span>{pkg.number_of_days || 1} Days / {pkg.number_of_nights || 1} Nights</span>
                        </div>
                      )}
                      {pkg.room_capacity && (
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-pink-500" />
                            <span>Up to {pkg.room_capacity} Guests</span>
                        </div>
                      )}
                      {pkg.is_corporate && (
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Briefcase className="h-3.5 w-3.5" />
                            <span>Corporate</span>
                        </div>
                      )}
                      {pkg.is_wedding && (
                        <div className="flex items-center gap-1.5 text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                            <PartyPopper className="h-3.5 w-3.5" />
                            <span>Wedding</span>
                        </div>
                      )}
                  </div>
               </div>

               <div className="flex-grow">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Package Includes</h4>
                  {pkg.items && pkg.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {pkg.items.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-2 text-gray-700">
                            <div className="h-6 w-6 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 flex-shrink-0">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium leading-snug">{item}</span>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No specific items listed.</p>
                  )}
               </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
