"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  propertyId: string;
  className?: string;
  size?: number;
}

export default function WishlistButton({ propertyId, className = "", size = 20 }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkWishlistStatus();
  }, [propertyId]);

  const checkWishlistStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    setUserId(user.id);

    const { data, error } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .single();

    if (data) {
      setIsWishlisted(true);
    }
    setLoading(false);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent parent link clicks
    e.stopPropagation();

    if (!userId) {
      toast.error("Please login to save to wishlist");
      router.push("/login");
      return;
    }

    // Optimistic update
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      if (previousState) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("property_id", propertyId);

        if (error) throw error;
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from("wishlists")
          .insert({
            user_id: userId,
            property_id: propertyId
          });

        if (error) throw error;
        toast.success("Added to wishlist");
      }
      router.refresh(); // Refresh to update any lists
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      setIsWishlisted(previousState); // Revert on error
      toast.error("Failed to update wishlist");
    }
  };

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 rounded-full ${className}`} style={{ width: size + 10, height: size + 10 }} />;
  }

  return (
    <button
      onClick={toggleWishlist}
      className={`p-2 rounded-full transition-colors ${
        isWishlisted 
          ? "bg-red-50 text-red-500 hover:bg-red-100" 
          : "bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500"
      } ${className}`}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        size={size} 
        className={isWishlisted ? "fill-current" : ""} 
        strokeWidth={2.5}
      />
    </button>
  );
}
