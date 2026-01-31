"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LocationMap() {
  const [showMap, setShowMap] = useState(false);

  // Gangtok coordinates for the "zoom" target (approximate on the SVG)
  // On a standard equirectangular map, India is roughly at 70% X, 40% Y.
  // We'll just animate to a scale and position that centers roughly on India.

  return (
    <section className="w-full py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Find Us on the Map</h2>
        <p className="text-gray-500 mt-2">Located in the heart of Gangtok, Sikkim</p>
      </div>

      <div className="relative w-full h-[350px] md:h-[500px] bg-blue-50 rounded-3xl overflow-hidden shadow-xl border border-blue-100 mx-auto max-w-6xl">
        
        {/* Animated World Map Layer */}
        <AnimatePresence>
          {!showMap && (
            <motion.div
              initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
              whileInView={{ 
                scale: 8, 
                x: "-180%", // Shift towards India (Right side of map)
                y: "60%",   // Shift towards North (Top hemisphere)
                opacity: 0 
              }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              onAnimationComplete={() => setShowMap(true)}
              className="absolute inset-0 flex items-center justify-center bg-[#e0f2fe]"
            >
              {/* Simple World Map SVG */}
              <svg
                viewBox="0 0 1000 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-blue-200 fill-current"
              >
                 {/* Simplified World Continents Paths */}
                 <path d="M250,150 Q200,100 150,150 T50,200 T150,350 T250,300 T300,200 Z" fill="#cbd5e1" /> {/* Americas */}
                 <path d="M450,100 Q400,50 500,50 T600,100 T650,200 T550,250 T450,200 Z" fill="#cbd5e1" /> {/* Europe/Africa */}
                 <path d="M650,100 Q700,50 800,100 T900,200 T850,350 T750,300 T650,200 Z" fill="#cbd5e1" /> {/* Asia/Aus */}
                 {/* Google Style Pin */}
                 <g transform="translate(708, 159)"> 
                   <circle cx="12" cy="21" r="8" className="text-red-500 fill-current animate-ping opacity-75" />
                   <path 
                     d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z" 
                     fill="#EA4335" 
                     stroke="#B31412" 
                     strokeWidth="1"
                   />
                   <circle cx="12" cy="8" r="3.5" fill="#750E0E" />
                 </g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Maps Iframe */}
        <motion.div 
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: showMap ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3544.7097782302317!2d88.6109802!3d27.3222701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e6a5f058ac28e5%3A0x267242c080f2ee2b!2sHotel%20Sakura!5e0!3m2!1sen!2sin!4v1766409909621!5m2!1sen!2sin"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </motion.div>

        {/* Overlay Text when Map is active */}
        {showMap && (
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs"
           >
              <h4 className="font-bold text-gray-900">Hotel Sakura</h4>
              <p className="text-sm text-gray-600">MG Marg Area, Gangtok, Sikkim</p>
              <a 
                href="https://maps.app.goo.gl/9RFtydCm1TzC9QK99" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-pink-600 font-semibold mt-2 inline-block hover:underline"
              >
                Open in Google Maps &rarr;
              </a>
           </motion.div>
        )}
      </div>
    </section>
  );
}
