'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { 
  MapPin, Bed, CheckCircle2, User, Phone, Share2, 
  ChevronDown, ChevronUp, Mail 
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import ImageSlider from "@/components/ui/ImageSlider";
import InquiryForm from "@/components/InquiryForm";
import WishlistButton from "@/components/WishlistButton";
import { Room } from "@/types";
import { createClient } from "@/lib/supabase/client";

const CollapsibleContent = ({ content, isList = false }: { content: string, isList?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!content) return null;

  const contentItems = isList ? content.split('\n').filter(Boolean) : [];
  const shouldCollapse = isList ? contentItems.length > 4 : content.length > 300;

  return (
    <div className="relative">
      <div 
        className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
          !isExpanded && shouldCollapse ? 'max-h-32' : 'max-h-none'
        }`}
      >
        {isList ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {contentItems.map((item, idx) => {
               const [label, value] = item.includes(':') ? item.split(':') : [item, ''];
               return (
                 <div key={idx} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 flex justify-between items-center group hover:border-blue-100 transition-colors">
                    <span className="text-gray-600 font-medium text-sm">{label.trim()}</span>
                    {value && <span className="text-gray-900 font-bold text-sm">{value.trim()}</span>}
                 </div>
               );
             })}
          </div>
        ) : (
          <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
            {content}
          </div>
        )}
        
        {!isExpanded && shouldCollapse && (
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white via-white/90 to-transparent" />
        )}
      </div>
      
      {shouldCollapse && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-1.5 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors group mx-auto md:mx-0"
        >
          {isExpanded ? (
            <>Read Less <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /></>
          ) : (
            <>Read More <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /></>
          )}
        </button>
      )}
    </div>
  );
};

interface PropertyDetailsClientProps {
  property: any; // Using any to avoid strict type issues with the complex property object
  imageUrls: string[];
}

export default function PropertyDetailsClient({ property, imageUrls }: PropertyDetailsClientProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<{id: string, name: string} | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, [supabase]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const displayedAmenities = showAllAmenities 
    ? property.amenities 
    : property.amenities?.slice(0, 5) || [];

  const hasMoreAmenities = property.amenities && property.amenities.length > 5;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column: Images & Details */}
      <motion.div 
        className="lg:col-span-2 space-y-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        
        {/* Image Slider */}
        <motion.div 
          variants={fadeInUp}
          className="bg-white rounded-2xl overflow-hidden shadow-sm h-[200px] md:h-[300px]"
        >
          <ImageSlider images={imageUrls} alt={property.name} className="h-full w-full" />
        </motion.div>

        {/* Title & Address */}
        <motion.div 
          variants={fadeInUp}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
        >
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
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors border border-gray-200">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <WishlistButton propertyId={property.id} className="border border-gray-200" />
                </div>
              </div>
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

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities</h3>
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {displayedAmenities.map((amenity: string, idx: number) => (
                  <motion.div 
                    key={`${amenity}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{amenity}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            
            {hasMoreAmenities && (
              <motion.button
                layout
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                className="mt-4 flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                {showAllAmenities ? (
                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show More ({property.amenities.length - 5} more) <ChevronDown className="w-4 h-4" /></>
                )}
              </motion.button>
            )}

            {!property.amenities || property.amenities.length === 0 && (
               <p className="text-gray-500">No specific amenities listed.</p>
            )}
          </div>
        </motion.div>

        {/* About Property */}
        <motion.div 
          variants={fadeInUp}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">About this property</h3>
          <CollapsibleContent content={property.description || "No description available for this property."} />
        </motion.div>

        {/* Rooms Section */}
        <motion.div 
          variants={fadeInUp}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
        >
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
                          {property.type !== 'Flat' ? (
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(room.monthly_rent)}
                              <span className="text-sm font-normal text-gray-500">/mo</span>
                            </p>
                          ) : (
                            <p className="text-lg font-bold text-green-600">
                              Included
                            </p>
                          )}
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
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <a 
                          href={`https://wa.me/${property.contact_number?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Hi, I'm interested in room ${room.name} at ${property.name}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-green-600 font-medium hover:text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors border border-green-200"
                        >
                          <Phone className="w-4 h-4" /> Contact Owner for this Room
                        </a>
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
        </motion.div>

        {/* Rules */}
        {property.rules && (
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">House Rules</h3>
            <CollapsibleContent content={property.rules} isList={true} />
          </motion.div>
        )}

        {/* Location Map */}
        <motion.div 
          id="location" 
          variants={fadeInUp}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
        >
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
        </motion.div>

      </motion.div>

      {/* Right Column: Sticky Inquiry Form */}
      <motion.div 
        className="lg:col-span-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="sticky top-24 space-y-6">
          <div id="inquiry-form">
            <InquiryForm 
              propertyId={property.id} 
              propertyName={property.name} 
              roomId={selectedRoom?.id}
              roomName={selectedRoom?.name}
            />
          </div>
          
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
            <a 
              href={user 
                ? `https://wa.me/${property.contact_number?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Hi, I'm interested in your property ${property.name}.`)}`
                : `https://wa.me/9135893002?text=${encodeURIComponent(`Hi, I'm interested in property ${property.name}.`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-gray-200 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors flex justify-center items-center gap-2"
            >
              <Phone className="w-4 h-4" /> View Contact / WhatsApp
            </a>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
