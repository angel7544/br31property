import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Home, MapPin } from "lucide-react";

export default async function MyListingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch properties owned by this user
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link 
          href="/list-property" 
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          List New Property
        </Link>
      </div>
      
      <div className="space-y-4">
        {properties?.map((property) => (
          <div key={property.id} className="border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
             <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {property.images?.[0] ? (
                   <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Home className="w-8 h-8" />
                   </div>
                )}
             </div>
             <div className="flex-1">
                <h3 className="font-bold text-gray-900">{property.name}</h3>
                <div className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                   <MapPin className="w-3.5 h-3.5" />
                   {property.address}, {property.city}
                </div>
                <div className="flex gap-2">
                   <span className={`text-xs px-2 py-0.5 rounded-full ${
                      property.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                   }`}>
                      {property.status}
                   </span>
                   <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                      {property.type}
                   </span>
                </div>
             </div>
             <div className="flex flex-col justify-center">
                <Link 
                   href={`/pg/${property.city.toLowerCase()}/${property.slug}`}
                   className="text-sm text-blue-600 hover:underline font-medium"
                >
                   View
                </Link>
             </div>
          </div>
        ))}

        {(!properties || properties.length === 0) && (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <div className="text-4xl">☹️</div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">NO DATA</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              You haven't listed any properties yet. Become a host and start earning!
            </p>
            <Link 
              href="/list-property" 
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-200"
            >
              List Your Property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
