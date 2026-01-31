"use client";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="hidden sm:block bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt={`${settings.siteName} logo`} className="h-16 w-auto object-contain" />
              <h3 className="text-xl font-bold text-yellow-500">{settings.siteName}</h3>
            </div>
            <p className="text-gray-400">
              Experience the finest hospitality with our multi-location premium services. 
              Lodging, dining, travel, and more.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/catalog" className="text-gray-400 hover:text-white">Our Services</Link></li>
              <li><Link href="/packages" className="text-gray-400 hover:text-white">Packages</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>{settings.contactPhone || "+91 9708403070"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>{settings.contactEmail || "hotelsakuragntok@gmail.com"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{settings.address || "Hotel Sakura, Lower M.G.Marg, Nam Nang Rd, Gangtok, Sikkim 737101"}</span>
              </div>
            </div>
            {/* <div className="mt-6">
              <Link href="/contact" className="inline-block w-full md:w-auto text-center px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 font-semibold">
                Contact Us
              </Link>
            </div> */}
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
          <div className="flex space-x-3 mt-4 md:mt-0">
            {[Facebook, Instagram, Twitter].map((Icon, idx) => (
              <span key={idx} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer">
                <Icon className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
