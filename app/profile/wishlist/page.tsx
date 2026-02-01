import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import PropertyCard from "@/components/search/PropertyCard";

export default async function WishlistPage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: wishlistData, error } = await supabase
    .from("wishlists")
    .select(`
      property_id,
      properties (
        *,
        rooms (*)
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching wishlist:", error);
  }

  // Extract properties from the nested structure
  const wishlistProperties = wishlistData?.map((item: any) => item.properties).filter(Boolean) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist Properties</h1>
      
      {wishlistProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlistProperties.map((property: any) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Save properties you like to your wishlist so you can easily find them later.
          </p>
          <Link 
            href="/pgs" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore Properties
          </Link>
        </div>
      )}
    </div>
  );
}
