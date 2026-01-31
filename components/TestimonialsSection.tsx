"use client";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";
import { Star, ChevronDown, BedDouble, ConciergeBell, MapPin, Sparkles, Coffee, Footprints } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  message: string;
  rating: number;
  rooms_rating?: number;
  service_rating?: number;
  location_rating?: number;
  hotel_highlights?: string;
  walkability?: string;
  food_and_drinks?: string;
  image_url: string | null;
}

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHoverable, setIsHoverable] = useState(false);

  useEffect(() => {
    setIsHoverable(window.matchMedia("(hover: hover)").matches);
  }, []);

  const handleMouseEnter = () => {
    if (isHoverable) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isHoverable) setIsExpanded(false);
  };

  const handleClick = () => {
    if (!isHoverable) setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 cursor-pointer h-fit relative overflow-hidden group"
    >
      <div>
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={20}
              className={`${
                i < t.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="relative">
          <p className={`text-gray-600 text-lg mb-8 leading-relaxed ${!isExpanded && "line-clamp-4"}`}>
            "{t.message}"
          </p>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-sm text-gray-600 border-t border-gray-100 pt-4 mb-6"
              >
                {(t.rooms_rating || t.service_rating || t.location_rating) && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {t.rooms_rating && (
                      <div className="bg-violet-50 p-3 rounded-2xl text-center border border-violet-100">
                        <div className="text-violet-600 mb-1 flex justify-center"><BedDouble size={18} /></div>
                        <div className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mb-0.5">Rooms</div>
                        <div className="text-violet-700 font-black text-lg">{t.rooms_rating.toFixed(1)}</div>
                      </div>
                    )}
                    {t.service_rating && (
                      <div className="bg-pink-50 p-3 rounded-2xl text-center border border-pink-100">
                        <div className="text-pink-600 mb-1 flex justify-center"><ConciergeBell size={18} /></div>
                        <div className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-0.5">Service</div>
                        <div className="text-pink-700 font-black text-lg">{t.service_rating.toFixed(1)}</div>
                      </div>
                    )}
                    {t.location_rating && (
                      <div className="bg-emerald-50 p-3 rounded-2xl text-center border border-emerald-100">
                        <div className="text-emerald-600 mb-1 flex justify-center"><MapPin size={18} /></div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Location</div>
                        <div className="text-emerald-700 font-black text-lg">{t.location_rating.toFixed(1)}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {t.hotel_highlights && (
                    <div className="flex gap-3 items-start bg-amber-50/50 p-3 rounded-xl">
                      <div className="mt-0.5 bg-amber-100 p-1.5 rounded-full text-amber-600 shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm mb-0.5">Highlights</span>
                        <p className="text-gray-600 text-sm leading-relaxed">{t.hotel_highlights}</p>
                      </div>
                    </div>
                  )}

                  {t.walkability && (
                    <div className="flex gap-3 items-start bg-blue-50/50 p-3 rounded-xl">
                      <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full text-blue-600 shrink-0">
                        <Footprints size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm mb-0.5">Walkability</span>
                        <p className="text-gray-600 text-sm leading-relaxed">{t.walkability}</p>
                      </div>
                    </div>
                  )}

                  {t.food_and_drinks && (
                    <div className="flex gap-3 items-start bg-orange-50/50 p-3 rounded-xl">
                      <div className="mt-0.5 bg-orange-100 p-1.5 rounded-full text-orange-600 shrink-0">
                        <Coffee size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm mb-0.5">Food & Drinks</span>
                        <p className="text-gray-600 text-sm leading-relaxed">{t.food_and_drinks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-6 border-t border-gray-50 mt-auto">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shadow-sm shrink-0">
          {t.image_url ? (
            <Image
              src={t.image_url}
              alt={t.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              {t.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-gray-900 text-base">{t.name}</h4>
          {t.role && (
            <p className="text-sm text-gray-500 font-medium">{t.role}</p>
          )}
        </div>
        <div className={`text-gray-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
           <ChevronDown size={20} />
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "Active")
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (data) setTestimonials(data);
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Loved by Guests</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            See what our customers have to say about their experience with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {testimonials.map((t, index) => (
            <TestimonialCard key={t.id} t={t} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
