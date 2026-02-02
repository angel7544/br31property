"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Users, Target, ShieldCheck, Heart } from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
            alt="Team working together"
            fill
            className="object-cover"
          />
        </div>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About BR31 PROPERTY MANAGEMENT SYSTEM</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-300">
            Revolutionizing the way you find and book PG accommodations and flats across India.
          </p>
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              To provide a seamless, transparent, and hassle-free experience for students and professionals looking for comfortable living spaces. We aim to bridge the gap between property owners and tenants through technology and trust.
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Target className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-900">Goal Oriented</span>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-900">Secure & Safe</span>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                <Heart className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-gray-900">Customer First</span>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="relative h-[240px] rounded-2xl overflow-hidden shadow-xl"
          >
            <Image
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgbW8sYFtbnvc7KlT6Xw_I8h5-P4CczGySDA&s"
              alt="Our Mission"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { label: "Happy Tenants", value: "10,000+" },
              { label: "Verified Properties", value: "500+" },
              { label: "Cities Covered", value: "20+" },
              { label: "Support", value: "24/7" },
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Who We Are</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            A dedicated team of professionals passionate about making your stay comfortable and memorable.
          </p>
        </motion.div>
        <div className="flex justify-center">
           <motion.div 
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             variants={fadeInUp}
             className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full border border-gray-100"
           >
             <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden relative">
                <Image 
                    src="/logo.png"
                    alt="Team"
                    fill
                    className="object-contain p-2"
                />
             </div>
             <h3 className="text-xl font-bold text-gray-900">Team BR31</h3>
             <p className="text-blue-600 font-medium mb-4">Property Management Experts</p>
             <p className="text-gray-500 text-sm">
               We are a group of tech enthusiasts and real estate experts working together to solve your accommodation needs.
             </p>
           </motion.div>
        </div>
      </section>
    </div>
  );
}
