"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { MapPin, Bed, User, Home } from "lucide-react";

type RoomWithProperty = {
  id: string;
  name: string;
  type: string;
  monthly_rent: number;
  image_url: string | null;
  available_beds: number;
  total_beds: number;
  property: {
    name: string;
    city: string;
    slug: string;
    address: string | null;
  } | null;
};

export default function RoomCarousel() {
  const [rooms, setRooms] = useState<RoomWithProperty[]>([]);
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchRooms();
    
    const channel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (carousel.current) {
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, [rooms]);

  // Auto-slide effect
  useEffect(() => {
    if (width === 0) return;
    
    const controls = animate(x, -width, {
      duration: 30,
      ease: "linear",
      repeat: Infinity,
      repeatType: "mirror",
      repeatDelay: 0
    });

    return () => controls.stop();
  }, [width, x]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id, 
          name, 
          type, 
          monthly_rent, 
          image_url,
          available_beds,
          total_beds,
          property: properties (
            name,
            city,
            slug,
            address
          )
        `)
        .eq('status', 'Available')
        .limit(10);

      if (error) throw error;
      
      // Filter out rooms where property is null (e.g. deleted property)
      const validRooms = (data as any[]).filter(r => r.property) || [];
      setRooms(validRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  if (rooms.length === 0) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="py-12 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Featured Rooms</h2>
        <p className="text-gray-500 mt-2">Explore our top-rated rooms available for immediate move-in.</p>
      </div>

      <motion.div ref={carousel} className="cursor-grab active:cursor-grabbing overflow-hidden">
        <motion.div 
          drag="x" 
          dragConstraints={{ right: 0, left: -width }} 
          style={{ x }}
          className="flex gap-6 px-4 w-max"
        >
          {rooms.map((room) => (
            <Link 
              href={`/pg/${room.property!.city.toLowerCase()}/${room.property!.slug}`} 
              key={room.id}
              className="min-w-[300px] md:min-w-[350px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={room.image_url || "https://images.unsplash.com/photo-1522771753033-6a98d08722aa?auto=format&fit=crop&q=80"} 
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-pink-600 shadow-sm">
                  {formatCurrency(room.monthly_rent)}/mo
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{room.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{room.property!.name}</p>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <User className="w-3 h-3" /> {room.type}
                  </span>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="truncate max-w-[200px]">{room.property!.address}, {room.property!.city}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {room.total_beds} Beds
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${room.available_beds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {room.available_beds} Available
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
