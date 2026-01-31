"use client";
import { useState, useEffect } from "react";
import { Users, Bed, Check, Heart, Wifi, Tv, Wind, Car, Waves, Dumbbell, Coffee, Utensils, Star, Flame, Home } from "lucide-react";
import { RoomItem } from "./page";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ImageSlider from "@/components/ui/ImageSlider";

export default function RoomsClient({ initialItems }: { initialItems: RoomItem[] }) {
  const [rooms, setRooms] = useState<RoomItem[]>(initialItems);
  const { currencySymbol } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const fetchLatestRooms = async () => {
        const supabase = getSupabaseClient();
        const { data: roomsData } = await supabase.from("rooms").select("*");
        
        // Fetch active reservations to cross-check availability
        const { data: resData } = await supabase
            .from("reservations")
            .select("room_id")
            .in("status", ["Confirmed", "Checked In","Booked","Maintainance"]);
            
        const bookedRoomIds = new Set(resData?.map(r => r.room_id).filter(Boolean));

        if (roomsData) {
            const updatedRooms = roomsData.map((room) => ({
                ...room,
                // If room is assigned in a valid reservation, mark it as Booked/Unavailable
                status: bookedRoomIds.has(room.id) ? "Booked" : room.status
            }));
            setRooms(updatedRooms as RoomItem[]);
        }
    };
    fetchLatestRooms();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('realtime-rooms-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
          fetchLatestRooms();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
          fetchLatestRooms();
      })
      .subscribe();

    // Polling every second as fallback/ensure updates
    const interval = setInterval(() => {
        fetchLatestRooms();
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleBookNow = (room: RoomItem) => {
    const params = new URLSearchParams();
    params.set("interest", `${room.type} (Room ${room.room_number})`);
    params.set("type", "room");
    
    const details = `Room: ${room.type} #${room.room_number}\nPrice: ${room.price ? `₹${room.price}` : 'On Request'}\nDescription: ${room.description || 'N/A'}\nCapacity: ${room.capacity} Guests\nBed: ${room.bed_count} ${room.bed_type}\nAmenities: ${room.amenities?.join(', ') || 'N/A'}`;
    params.set("details", details);
    
    router.push(`/contact?${params.toString()}`);
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi className="h-4 w-4" />;
    if (lower.includes("tv")) return <Tv className="h-4 w-4" />;
    if (lower.includes("ac") || lower.includes("air")) return <Wind className="h-4 w-4" />;
    if (lower.includes("park")) return <Car className="h-4 w-4" />;
    if (lower.includes("pool")) return <Waves className="h-4 w-4" />;
    if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell className="h-4 w-4" />;
    if (lower.includes("breakfast") || lower.includes("coffee")) return <Coffee className="h-4 w-4" />;
    if (lower.includes("dining") || lower.includes("food")) return <Utensils className="h-4 w-4" />;
    if (lower.includes("heat") || lower.includes("fire")) return <Flame className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  return (
    <div className="space-y-12 py-8">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Our Rooms & Suites</h1>
        <p className="text-xl text-gray-500">
          Find your perfect sanctuary. Each room is designed with your comfort in mind.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            <p>No rooms currently available. Please contact us directly.</p>
          </div>
        ) : (
          rooms.map((room) => {
            const isAvailable = room.status?.toLowerCase() === "available";
            const images = room.images && room.images.length > 0 
                ? room.images 
                : (room.image_url ? [room.image_url] : []);
                
            return (
            <div key={room.id} className="flex flex-col md:flex-row bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group h-full">
              {/* Left Section: Image & Key Info */}
              <div className="md:w-72 flex-shrink-0 flex flex-col border-r border-gray-100">
                <div className="relative h-56 md:h-64 overflow-hidden">
                  <ImageSlider 
                      images={images} 
                      alt={room.type} 
                      className={`w-full h-full ${!isAvailable ? 'grayscale' : ''}`}
                  />
                  {!isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <span className="text-white font-bold text-lg uppercase tracking-widest border-2 border-white px-3 py-1 transform -rotate-12 shadow-lg">
                              {room.status === 'Booked' ? 'Booked' : 'Unavailable'}
                          </span>
                      </div>
                  )}
                  <div className="absolute top-4 right-4 z-20">
                     <Heart className="h-6 w-6 text-red-600 drop-shadow-md cursor-pointer animate-bounce" />
                  </div>
                </div>
                
                <div className="p-5 flex flex-col gap-4 bg-white flex-grow justify-between">
                   <div className="flex justify-between items-end">
                      <div>
                         <h3 className="text-pink-600 font-bold text-xl font-serif">{room.type}</h3>
                         <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mt-1">ROOM {room.room_number}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-bold text-gray-900">{currencySymbol}{room.price}</span>
                         <span className="text-xs text-gray-400 font-medium block">/ night</span>
                      </div>
                   </div>
                   
                   <button 
                     onClick={() => isAvailable && handleBookNow(room)}
                     disabled={!isAvailable}
                     className={`w-full py-3 rounded-lg uppercase font-bold text-sm tracking-widest transition-colors ${
                        isAvailable 
                        ? "bg-gray-900 text-white hover:bg-gray-800" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                     }`}
                   >
                     {isAvailable ? "Inquire Now" : "Unavailable"}
                   </button>
                </div>
              </div>

              {/* Right Section: Details */}
              <div className="p-6 md:p-8 flex-grow flex flex-col justify-center">
                 <div className="mb-6">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-3">{useSettings().settings.siteName || "Sakura Hotel"}</h2>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                      {room.description || "Experience luxury and comfort in our carefully designed rooms. Perfect for relaxation after a long day of travel or work."}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-pink-50 rounded-full text-pink-600">
                         <Users className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Up to {room.capacity} Guests</p>
                          <p className="text-xs text-gray-500">Occupancy</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-pink-50 rounded-full text-pink-600">
                         <Bed className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">{room.bed_count} {room.bed_type}</p>
                          <p className="text-xs text-gray-500">Bedding</p>
                       </div>
                    </div>
                 </div>

                 {room.amenities && room.amenities.length > 0 && (
                   <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Amenities</h4>
                      <div className="flex flex-wrap gap-3">
                         {room.amenities.map((amenity, idx) => (
                           <div key={idx} className="flex flex-col items-center gap-2 group/icon cursor-default">
                              <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover/icon:bg-pink-50 group-hover/icon:text-pink-600 group-hover/icon:border-pink-100 transition-all">
                                {getAmenityIcon(amenity)}
                              </div>
                              {/* Optional tooltip or text if needed, sticking to minimal icons per design, or maybe just text chips if icons are ambiguous. 
                                  The image shows just icons. I'll add a title attribute for hover. */}
                              <span className="text-[10px] text-gray-400 font-medium uppercase hidden group-hover/icon:block absolute mt-12 bg-gray-800 text-white px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                                {amenity}
                              </span>
                           </div>
                         ))}
                         {/* Fallback to text if icons are confusing? 
                             Let's actually show text chips nicely like the image might imply if they are just circles.
                             The image has text "wifi", "+20" etc inside or next to circles?
                             Actually the image has circles with icons inside. I will stick to icons.
                         */}
                      </div>
                   </div>
                 )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
