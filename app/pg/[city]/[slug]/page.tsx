import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Wifi, Bed, Home, CheckCircle2, Shield, Calendar, User, Phone, Mail, ArrowLeft } from "lucide-react";
import ImageSlider from "@/components/ui/ImageSlider";
import InquiryForm from "@/components/InquiryForm";
import { Room } from "@/types";

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
    title: `${property.name} in ${property.city} | PG Dekho`,
    description: property.description || `Book ${property.name} in ${property.city}. Affordable and comfortable stays.`,
  };
}

export default async function PropertyPage({ params }: { params: { city: string; slug: string } }) {
  const supabase = createClient();
  
  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      rooms (*),
      images: property_images (url)
    `)
    .eq("slug", params.slug)
    .eq("status", "Active")
    .single();

  if (error || !property) {
    notFound();
  }

  // Images
  const imageUrls = property.images && property.images.length > 0 
    ? property.images.map((img: any) => img.url) 
    : [property.image_url || "https://images.unsplash.com/photo-1522771753033-6a98d08722aa?auto=format&fit=crop&q=80"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-24">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/pgs" className="hover:text-blue-600">PGs in {property.city}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{property.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Image Slider */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-[400px] md:h-[500px]">
              <ImageSlider images={imageUrls} alt={property.name} className="h-full w-full" />
            </div>

            {/* Title & Address */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      {property.type}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      {property.gender_preference}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-1 text-gray-400" />
                    <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                    <a href="#location" className="text-blue-600 font-medium ml-2 hover:underline text-sm">(View on map)</a>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Starts from</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(property.price_range_min || 0)}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </p>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">About this property</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {property.description || "No description available for this property."}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities && property.amenities.length > 0 ? (
                    property.amenities.map((amenity: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700 font-medium">{amenity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No specific amenities listed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rooms Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h3>
              
              <div className="space-y-6">
                {property.rooms && property.rooms.length > 0 ? (
                  property.rooms.map((room: Room) => (
                    <div key={room.id} className="border border-gray-200 rounded-xl p-6 hover:border-blue-200 transition-colors">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Room Image Placeholder or Real Image */}
                        <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                           {room.image_url ? (
                             <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-400">
                               <Bed className="w-8 h-8" />
                             </div>
                           )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xl font-bold text-gray-900">{room.name}</h4>
                            <div className="text-right">
                              <p className="text-xl font-bold text-blue-600">
                                {formatCurrency(room.monthly_rent)}
                                <span className="text-sm font-normal text-gray-500">/mo</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" /> {room.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4" /> {room.total_beds} Beds
                            </span>
                            <span className={`flex items-center gap-1 font-medium ${room.available_beds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <CheckCircle2 className="w-4 h-4" /> {room.available_beds} Available
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {room.amenities?.map((am, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No rooms listed for this property yet.
                  </div>
                )}
              </div>
            </div>

            {/* Rules */}
            {property.rules && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">House Rules</h3>
                <div className="prose pblue-blue max-w-none text-gray-600 whitespace-pre-wrap">
                  {property.rules}
                </div>
              </div>
            )}

            {/* Location Map */}
            <div id="location" className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
              <div className="w-full h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                 <iframe 
                   width="100%" 
                   height="100%" 
                   frameBorder="0" 
                   scrolling="no" 
                   src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                   title="Property Location"
                 ></iframe>
                 <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md text-sm font-semibold text-gray-700">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600">
                       <MapPin className="w-4 h-4 text-blue-500" />
                       View on Google Maps
                    </a>
                 </div>
              </div>
              <p className="mt-4 text-gray-600 flex items-start gap-2">
                 <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                 {property.address}, {property.city}, {property.state} {property.zip_code}
              </p>
            </div>

          </div>

          {/* Right Column: Sticky Inquiry Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <InquiryForm 
                propertyId={property.id} 
                propertyName={property.name} 
              />
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Managed by</p>
                    <p className="font-bold text-gray-900">Property Owner</p>
                  </div>
                </div>
                <button className="w-full border border-gray-200 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                  <Phone className="w-4 h-4" /> View Contact
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
