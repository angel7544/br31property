"use client";
import { useState, useEffect } from "react";
import { X, Copy, Check, MessageCircle, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useSettings } from "@/context/SettingsContext";

type Offer = {
  id: string;
  title: string;
  description: string;
  discount_code: string;
  discount_value: string;
  image_url?: string;
  is_active?: boolean;
};

export default function OfferPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Subscribe to new offers
    const channel = supabase
      .channel('realtime-offers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
        },
        (payload) => {
          const newOffer = payload.new as any;
          
          // Check if offer is active and within date range
          const today = new Date();
          const startDate = newOffer.start_date ? new Date(newOffer.start_date) : null;
          const endDate = newOffer.end_date ? new Date(newOffer.end_date) : null;
          
          const isStarted = !startDate || startDate <= today;
          const isEnded = endDate && endDate < today;

          if (newOffer.is_active !== false && isStarted && !isEnded) {
             setOffer({
                 id: newOffer.id,
                 title: newOffer.title,
                 description: newOffer.description,
                 discount_code: newOffer.discount_code,
                 discount_value: newOffer.discount_value,
                 image_url: newOffer.image_url,
                 is_active: newOffer.is_active
             });
             setIsOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Check session storage to prevent showing too often if desired, or show every time as requested "when user open website"
    // For now, let's show it after a short delay
    const timer = setTimeout(async () => {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString();
      
      const { data: offers } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`);

      if (offers && offers.length > 0) {
        // Pick random offer
        const randomOffer = offers[Math.floor(Math.random() * offers.length)];
        setOffer(randomOffer);
        setIsOpen(true);
      }
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const { settings } = useSettings();

  // Auto-close timer with countdown
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(10);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
             setIsOpen(false);
             clearInterval(timer);
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (offer?.discount_code) {
      navigator.clipboard.writeText(offer.discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Redirect to WhatsApp or Call after copy if needed, 
      // but user asked for button click redirection. 
      // We will add separate buttons below.
    }
  };

  const handleContact = (type: 'whatsapp' | 'call') => {
      const phone = settings.contactPhone || "";
      if (!phone) return;
      
      const cleanPhone = phone.replace(/\D/g, '');
      const message = `Hi, I want to redeem offer ${offer?.discount_code || offer?.title}`;
      
      if (type === 'whatsapp') {
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
          window.location.href = `tel:${cleanPhone}`;
      }
  };

  return (
    <AnimatePresence>
      {isOpen && offer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Popup Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-white w-full max-w-md md:max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          >
             <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
             >
                <X size={20} />
             </button>

             <div className="flex flex-col">
                {offer.image_url ? (
                   <div className="h-48 sm:h-56 relative">
                      <img 
                        src={offer.image_url} 
                        alt={offer.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                         <div className="text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block px-3 py-1 bg-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                    Limited Time Offer
                                </span>
                                <span className="inline-block px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg border border-white/20">
                                    Expires in {timeLeft}s
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold leading-tight">{offer.title}</h3>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-8 text-white text-center">
                       <div className="flex items-center justify-center gap-2 mb-4">
                           <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                               Special Offer
                           </span>
                           <span className="inline-block px-3 py-1 bg-black/20 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                               {timeLeft}s Left
                           </span>
                       </div>
                       <h3 className="text-3xl font-bold mb-2">{offer.title}</h3>
                   </div>
                )}

                <div className="p-6 sm:p-8 bg-white text-center">
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        {offer.description}
                    </p>
                    
                    <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 mb-6">
                        <p className="text-sm text-pink-600 font-medium uppercase tracking-wide mb-1">Your Exclusive Deal</p>
                        <p className="text-3xl font-bold text-gray-900">{offer.discount_value}</p>
                    </div>

                    {offer.discount_code && (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-gray-500">Use code at checkout</p>
                            <button 
                                onClick={handleCopy}
                                className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-mono text-lg rounded-lg hover:bg-gray-800 transition-all active:scale-95"
                            >
                                <span className="tracking-widest font-bold">{offer.discount_code}</span>
                                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400 group-hover:text-white" />}
                            </button>
                            {copied && <span className="text-xs text-green-600 font-medium">Copied to clipboard!</span>}
                        </div>
                    )}
                    
                    <div className="mt-6 flex gap-3 justify-center">
                        <button 
                            onClick={() => handleContact('whatsapp')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <MessageCircle size={18} />
                            <span className="text-sm font-medium">Redeem on WhatsApp</span>
                        </button>
                         <button 
                            onClick={() => handleContact('call')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Phone size={18} />
                            <span className="text-sm font-medium">Call to Book</span>
                        </button>
                    </div>

                    <div className="mt-4">
                         <button 
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-gray-400 hover:text-gray-600 underline"
                         >
                            No thanks, I'll pay full price
                         </button>
                    </div>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
