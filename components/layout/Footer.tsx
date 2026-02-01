"use client";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import Image from "next/image";

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <footer className="hidden sm:block bg-black text-white pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Logo & About */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="relative h-12 w-40">
                    <Image 
                        src="/logo.png" 
                        alt="BR31 Rentals" 
                        fill
                        className="object-contain object-left"
                    />
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                BR31 Rentals is an online platform for PGs accommodations , providing , options for working Professionals and students from room to flats across India.
              </p>
              <div className="flex space-x-4">
                {[Linkedin, Facebook, Instagram, Twitter, Youtube].map((Icon, idx) => (
                  <Link 
                    key={idx} 
                    href="#" 
                    className="bg-white text-black p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Icon className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 2: Company */}
            <div>
              <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                {[
                  { name: "About Us", href: "/about" },
                  { name: "Testimonials", href: "/#testimonials" },
                  { name: "Terms & Conditions", href: "/terms" },
                  { name: "Refunds Cancellation Policy", href: "/refund-policy" },
                  { name: "Privacy Policy", href: "/privacy-policy" }
                ].map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Media */}
            <div>
              <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider">Media</h3>
              <ul className="space-y-3">
                {[
                  { name: "FAQs", href: "/contact" },
                  { name: "Blog", href: "/blog" },
                  { name: "Contact Us", href: "/contact" }
                ].map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Download App */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Download App Now</h3>
              <div className="flex gap-2 mb-4">
                <div className="h-10 w-32 bg-gray-800 rounded overflow-hidden relative border border-gray-700">
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">Google Play</div>
                </div>
                <div className="h-10 w-32 bg-gray-800 rounded overflow-hidden relative border border-gray-700">
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">App Store</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-20 w-20 bg-white p-1 rounded">
                   <div className="h-full w-full bg-gray-200 flex items-center justify-center text-[10px] text-black text-center font-bold">QR CODE</div>
                </div>
                <p className="text-sm text-gray-300 max-w-[150px]">
                  Open camera & scan the Qr code to Download the app
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
            <p>Copyright @ {new Date().getFullYear()} | All Rights Reserved by BR31 Rentals.</p>
            <p className="mt-2 md:mt-0">Images are representational purpose only; amenities shown may vary by properties</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919708403070" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110 flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="h-8 w-8" />
      </a>
    </>
  );
}
