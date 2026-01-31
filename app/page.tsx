"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bed, Utensils, Wifi, Shield, Home, Search, Zap, Users } from "lucide-react";
import { useState, useEffect } from "react";
import RoomCarousel from "@/components/RoomCarousel";
import HeroSearch from "@/components/HeroSearch";

const heroImages = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop", // Hostel/PG vibe
  "https://images.unsplash.com/photo-1522771753033-6a98d08722aa?q=80&w=2070&auto=format&fit=crop", // Modern Room
  "https://images.unsplash.com/photo-1596276020587-8044fe049813?q=80&w=2039&auto=format&fit=crop", // Living Space
];

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 pb-4 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 text-white h-[600px] flex flex-col items-center justify-center">
        {/* Carousel Background */}
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image 
              src={img} 
              alt={`PG Dekho View ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ))}
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 -mt-20">
          <p className="text-pink-400 font-bold uppercase tracking-widest mb-4">Rent Smarter, Hassle-Free</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg leading-tight">
            Find Your Perfect Accommodation <br/>
            <span className="text-white">Conveniently from Anywhere</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-md max-w-2xl mx-auto">
            Discover affordable, fully furnished PGs and Flats with all the amenities you need.
          </p>
        </div>
      </section>

      {/* Floating Search Bar */}
      <div className="px-4">
        <HeroSearch />
      </div>

      {/* Browse by Category */}
      <section className="container mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-10">
          <span className="text-pink-600 font-bold text-sm uppercase tracking-wider">Paying Guest</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Find PGs based on your need</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Boys PG */}
          <Link href="/pgs?type=PG&gender=Boys" className="group relative rounded-2xl overflow-hidden h-80 shadow-md hover:shadow-2xl transition-all duration-300">
            <Image 
              src="https://images.unsplash.com/photo-1596276020587-8044fe049813?q=80&w=2039&auto=format&fit=crop" 
              alt="PGs for Boys"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-bold mb-1">PGs For Boys</h3>
              <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                Comfortable stays designed for men
              </p>
            </div>
          </Link>

          {/* Girls PG */}
          <Link href="/pgs?type=PG&gender=Girls" className="group relative rounded-2xl overflow-hidden h-80 shadow-md hover:shadow-2xl transition-all duration-300">
            <Image 
              src="https://images.unsplash.com/photo-1522771753033-6a98d08722aa?q=80&w=2070&auto=format&fit=crop" 
              alt="PGs for Girls"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-bold mb-1">PGs For Girls</h3>
              <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                Safe and secure homes for women
              </p>
            </div>
          </Link>

          {/* Co-Living */}
          <Link href="/pgs?type=PG&gender=Co-Living" className="group relative rounded-2xl overflow-hidden h-80 shadow-md hover:shadow-2xl transition-all duration-300">
            <Image 
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2069&auto=format&fit=crop" 
              alt="Co-Living PGs"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-bold mb-1">PGs For Co-Living</h3>
              <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                Vibrant communities for everyone
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Rooms Carousel */}
      <div id="featured-rooms">
        <RoomCarousel />
      </div>

      {/* Services Highlights */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-pink-600 font-bold text-sm uppercase tracking-wider">Our Services</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Why Choose Us</h2>
            <div className="w-20 h-1 bg-pink-500 mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: Home, title: "Zero Brokerage", desc: "Enjoy Free Access to Our Platform. Browse Listings and Contact Property Owners Directly Without Any Fee." },
              { icon: Shield, title: "Search Verified Properties", desc: "Discover Your Ideal Place at Your Own Pace. Experience Immersive Photos and Extensive Listings, All Verified for Your Peace of Mind." },
              { icon: Zap, title: "No Unwanted Calls", desc: "Enjoy a Seamless Search Experience with Complete Control Over Who Contacts You and When." },
              { icon: Utensils, title: "Hygienic Food", desc: "Healthy breakfast, lunch, and dinner options available with flexible meal plans." },
              { icon: Wifi, title: "High-Speed Wifi", desc: "Work from home ready with unlimited fiber internet access included." },
              { icon: Bed, title: "Fully Furnished", desc: "Move-in ready homes with premium furniture and appliances." },
            ].map((service, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group p-6 rounded-2xl hover:bg-pink-50 transition-colors duration-300">
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:bg-pink-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-pink-200 group-hover:shadow-lg transform group-hover:-translate-y-1">
                  <service.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-600/10 rounded-l-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to find your new home?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of happy tenants who found their perfect stay with PG Dekho.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pgs" className="inline-flex items-center justify-center px-8 py-4 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 transition-all shadow-lg hover:shadow-pink-500/30 transform hover:-translate-y-1">
              Browse Listings
            </Link>
            <Link href="/list-property" className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-all shadow-lg transform hover:-translate-y-1">
              List Your Property
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
