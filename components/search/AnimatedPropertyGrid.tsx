"use client";

import { motion, Variants } from "framer-motion";
import PropertyCard from "@/components/search/PropertyCard";
import { Property, Room } from "@/types";

type PropertyWithRelations = Property & {
  rooms: Room[];
  images: { url: string }[];
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AnimatedPropertyGrid({ properties }: { properties: any[] }) {
  if (!properties || properties.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-20 bg-white rounded-xl border border-gray-100"
      >
        <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {properties.map((property) => (
        <motion.div key={property.id} variants={fadeInUp}>
          <PropertyCard property={property} />
        </motion.div>
      ))}
    </motion.div>
  );
}
