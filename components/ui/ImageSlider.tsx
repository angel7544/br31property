"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

interface ImageSliderProps {
  images: string[];
  alt: string;
  autoPlayInterval?: number;
  className?: string;
}

export default function ImageSlider({ images, alt, autoPlayInterval = 5000, className = "" }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      nextImage();
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [currentIndex, images.length, autoPlayInterval]);

  const nextImage = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  if (!images || images.length === 0) {
      return (
        <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
             <ImageIcon className="h-10 w-10 text-gray-400" />
        </div>
      );
  }
  
  if (images.length === 1) {
      return (
        <div className={`relative overflow-hidden ${className}`}>
             <img src={images[0]} alt={alt} className="absolute w-full h-full object-cover" />
        </div>
      );
  }

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              nextImage();
            } else if (swipe > swipeConfidenceThreshold) {
              prevImage();
            }
          }}
          className="absolute w-full h-full object-cover"
          alt={`${alt} - ${currentIndex + 1}`}
        />
      </AnimatePresence>
      
      {/* Navigation Buttons */}
      <div className="absolute inset-0 flex items-center justify-between p-2 pointer-events-none">
          <button 
            className="p-1 bg-black/30 text-white rounded-full hover:bg-black/50 pointer-events-auto transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
              <ChevronLeft size={24} />
          </button>
          <button 
            className="p-1 bg-black/30 text-white rounded-full hover:bg-black/50 pointer-events-auto transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
             onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
              <ChevronRight size={24} />
          </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 pointer-events-none z-10">
          {images.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full shadow-sm border border-black/10 transition-colors duration-200 ${index === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              />
          ))}
      </div>
    </div>
  );
}
