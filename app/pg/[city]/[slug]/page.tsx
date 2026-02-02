import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PropertyDetailsClient from "@/components/property/PropertyDetailsClient";

// Force dynamic rendering to ensure availability is always up to date
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { city: string; slug: string } }) {
  const supabase = createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("name, description, city")
    .eq("slug", params.slug)
    .single();

  if (!property) return { title: "Property Not Found" };

  return {
    title: `${property.name} in ${property.city} | BR31 Rentals`,
    description: property.description || `Book ${property.name} in ${property.city}. Affordable and comfortable stays.`,
  };
}

export default async function PropertyPage({ params }: { params: { city: string; slug: string } }) {
  const supabase = createClient();
  
  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      rooms (*)
    `)
    .eq("slug", params.slug)
    .eq("status", "Active")
    .single();

  if (error || !property) {
    console.error("Error fetching property:", error);
    notFound();
  }

  // Images
  // Handle both relational structure (if it existed) and array column
  let imageUrls: string[] = [];
  
  if (property.images && Array.isArray(property.images)) {
      // Check if it's an array of strings (from column) or objects (from relation)
      if (typeof property.images[0] === 'string') {
          imageUrls = property.images;
      } else if (typeof property.images[0] === 'object' && property.images[0]?.url) {
          imageUrls = property.images.map((img: any) => img.url);
      }
  }
  
  // Fallback to main image
  if (imageUrls.length === 0) {
      imageUrls = [property.image_url || "https://images.unsplash.com/photo-1522771753033-6a98d08722aa?auto=format&fit=crop&q=80"];
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-1 pt-1">
      <div className="container mx-auto px-2 md:px-1">
        
        {/* Breadcrumb */}
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/pgs" className="hover:text-blue-600">PGs in {property.city}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[100px]">{property.name}</span>
        </div>

        <PropertyDetailsClient property={property} imageUrls={imageUrls} />
      </div>
    </div>
  );
}
