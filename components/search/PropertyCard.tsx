"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Share2, User, Wind, Car, Shirt, CheckCircle2 } from "lucide-react";
import { Property, Room } from "@/types";
import WishlistButton from "../WishlistButton";

interface PropertyCardProps {
  property: Property & {
    rooms: Room[];
    images: { url: string }[] | string[];
  };
}

export default function PropertyCard({ property }: PropertyCardProps) {
  // Extract prices for different occupancies
  const getPriceForType = (type: string) => {
    const room = property.rooms?.find((r) => r.type.toLowerCase().includes(type.toLowerCase()));
    return room ? room.monthly_rent : null;
  };

  const singlePrice = getPriceForType("Single");
  const doublePrice = getPriceForType("Double");
  const triplePrice = getPriceForType("Triple");

  // Get main image and thumbnails
  const getImage = (img: any) => {
    if (!img) return null;
    return typeof img === 'string' ? img : img.url;
  };

  const mainImage = getImage(property.images?.[0]) || property.image_url || "https://images.unsplash.com/photo-1522771753033-6a98d08722aa?auto=format&fit=crop&q=80";
  
  const thumbnails = property.images?.slice(1, 4).map(img => getImage(img)).filter(Boolean) as string[] || [];

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow mb-6">
      <div className="flex flex-col lg:flex-row">
        {/* Images Section */}
        <div className="w-full lg:w-2/5 p-3">
          <div className="relative h-64 lg:h-full rounded-lg overflow-hidden group">
            <Image
              src={mainImage}
              alt={property.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Thumbnails Overlay (Desktop) */}
            <div className="hidden lg:flex absolute bottom-2 left-2 right-2 gap-2">
              {thumbnails.map((thumb, idx) => (
                <div key={idx} className="relative w-16 h-12 rounded overflow-hidden border-2 border-white/80">
                  <Image src={thumb} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </div>
              ))}
              {property.images && property.images.length > 4 && (
                <div className="relative w-16 h-12 rounded overflow-hidden bg-black/60 flex items-center justify-center text-white text-xs font-bold border-2 border-white/80">
                  +{property.images.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full lg:w-3/5 p-4 lg:p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{property.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="line-clamp-1">{property.address || property.city}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <WishlistButton propertyId={property.id} />
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {property.amenities?.slice(0, 4).map((amenity, idx) => (
                <span key={idx} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium border border-orange-100">
                  {amenity}
                </span>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-center">
                <User className="w-5 h-5 text-gray-600 mb-1" />
                <span className="text-xs text-gray-500">Tenant</span>
                <span className="text-sm font-semibold text-gray-900">{property.gender_preference}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-center">
                <Wind className="w-5 h-5 text-gray-600 mb-1" />
                <span className="text-xs text-gray-500">AC</span>
                <span className="text-sm font-semibold text-gray-900">
                  {property.amenities?.includes("AC") ? "Available" : "No"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-center">
                <Car className="w-5 h-5 text-gray-600 mb-1" />
                <span className="text-xs text-gray-500">Parking</span>
                <span className="text-sm font-semibold text-gray-900">
                  {property.amenities?.includes("Parking") ? "Available" : "No"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-center">
                <Shirt className="w-5 h-5 text-gray-600 mb-1" />
                <span className="text-xs text-gray-500">Laundry</span>
                <span className="text-sm font-semibold text-gray-900">
                  {property.amenities?.includes("Laundry") ? "Available" : "No"}
                </span>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {singlePrice && (
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(singlePrice)}</div>
                  <div className="text-xs text-gray-500">Single Bed</div>
                </div>
              )}
              {doublePrice && (
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(doublePrice)}</div>
                  <div className="text-xs text-gray-500">Double Bed</div>
                </div>
              )}
              {triplePrice && (
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(triplePrice)}</div>
                  <div className="text-xs text-gray-500">Triple Bed</div>
                </div>
              )}
              {!singlePrice && !doublePrice && !triplePrice && (
                 <div className="border border-gray-100 rounded-lg p-3 text-center col-span-full">
                 <div className="text-lg font-bold text-gray-900">{formatCurrency(property.price_range_min || 0)}</div>
                 <div className="text-xs text-gray-500">Starts From</div>
               </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-auto">
            <Link
              href={property.slug ? `/pg/${property.city?.toLowerCase().replace(/\s+/g, '-') || 'city'}/${property.slug}` : '#'}
              className={`flex-1 bg-white border border-blue-600 text-blue-600 text-center py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors ${!property.slug ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              View Details
            </Link>
            <a 
              href={`https://wa.me/${property.contact_number?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Hi, I'm interested in your property ${property.name} in ${property.city}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center"
            >
              Contact Owner
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
