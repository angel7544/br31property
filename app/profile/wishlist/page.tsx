import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  // Placeholder for wishlist functionality
  // In a real app, we would fetch this from a 'wishlists' table in Supabase
  const wishlistItems: any[] = []; 

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist Properties</h1>
      
      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wishlist items would go here */}
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Save properties you like to your wishlist so you can easily find them later.
          </p>
          <Link 
            href="/pgs" 
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Explore Properties
          </Link>
        </div>
      )}
    </div>
  );
}
