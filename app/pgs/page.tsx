import { createClient } from "@/lib/supabase/server";
import SearchHeader from "@/components/search/SearchHeader";
import SearchSidebar from "@/components/search/SearchSidebar";
import PropertyCard from "@/components/search/PropertyCard";
import { Property, Room } from "@/types";

export const metadata = {
  title: "Search PGs & Flats | PG Dekho",
  description: "Find the best PGs and Flats with food, wifi, and amenities.",
};

// Define the type for property with relations
type PropertyWithRelations = Property & {
  rooms: Room[];
  images: { url: string }[];
};

export default async function PGsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = createClient();
  
  // Extract params
  const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : undefined;
  const gender = typeof searchParams.gender === 'string' ? searchParams.gender : undefined;
  
  // Handle array params (comma separated)
  const types = typeof searchParams.type === 'string' ? searchParams.type.split(',') : [];
  const occupancy = typeof searchParams.occupancy === 'string' ? searchParams.occupancy.split(',') : [];
  const amenities = typeof searchParams.amenities === 'string' ? searchParams.amenities.split(',') : [];

  // 1. Fetch Cities for Dropdown
  const { data: citiesData } = await supabase.from("properties").select("city").eq("status", "Active");
  // distinct cities
  const cities = Array.from(new Set(citiesData?.map(p => p.city) || [])).sort();

  // 2. Build Main Query
  let query = supabase
    .from("properties")
    .select(`
      *,
      rooms (*),
      images: property_images (url)
    `)
    .eq("status", "Active");

  // Apply filters
  if (city) query = query.ilike("city", `%${city}%`);
  if (q) query = query.ilike("name", `%${q}%`);
  if (types.length > 0) query = query.in("type", types);
  if (maxPrice) query = query.lte("price_range_min", parseInt(maxPrice));
  
  if (gender) {
    if (gender === 'Boys') query = query.eq("gender_preference", 'Male');
    else if (gender === 'Girls') query = query.eq("gender_preference", 'Female');
    else if (gender === 'Co-Living') query = query.eq("gender_preference", 'Unisex');
  }

  if (amenities.length > 0) {
    // Supabase array contains
    query = query.contains("amenities", amenities);
  }

  const { data: properties, error } = await query;

  if (error) {
    console.error("Error fetching properties:", error);
  }

  // Client-side filtering for complex relations (Occupancy)
  let filteredProperties = (properties as any[]) || [];

  if (occupancy.length > 0) {
     filteredProperties = filteredProperties.filter(p => {
        return p.rooms?.some((r: any) => {
           // Map 'Single Room' -> 'Single', 'Double Sharing' -> 'Double'
           const type = r.type || "";
           return occupancy.some(occ => {
             if (occ === 'Single Room') return type.includes('Single');
             if (occ === 'Double Sharing') return type.includes('Double');
             if (occ === 'Triple Sharing') return type.includes('Triple');
             return false;
           });
        });
     });
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
       <SearchHeader cities={cities} />
       
       <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
             {/* Sidebar */}
             <div className="w-full lg:w-1/4 flex-shrink-0 hidden lg:block">
                <SearchSidebar />
             </div>

             {/* Results */}
             <div className="w-full lg:w-3/4">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">
                     PG : {filteredProperties.length} search results found
                   </h2>
                   
                   {/* Mobile Filter Toggle (Visible only on mobile) */}
                   <div className="lg:hidden">
                      {/* You could add a Sheet/Modal trigger here for mobile sidebar */}
                      <span className="text-sm text-pink-600 font-medium">Filters</span>
                   </div>
                </div>

                <div className="space-y-6">
                   {filteredProperties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                   ))}
                   
                   {filteredProperties.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                         <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
                         <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
