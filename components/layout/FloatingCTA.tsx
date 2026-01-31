"use client";

import { useSettings } from "@/context/SettingsContext";
import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa6";
import { useState } from "react";

export default function FloatingCTA() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show on admin pages
  if (pathname.startsWith("/admin")) return null;

  // Clean phone number for links (remove non-digits)
  const phoneNumber = settings.contactPhone?.replace(/\D/g, "") || "";

  if (!phoneNumber) return null;

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div className="fixed bottom-16 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded buttons */}
      {isOpen && (
        <div className="flex flex-col items-end gap-3 animate-fade-in">
          {/* Call Button */}
          <a
            href={`tel:${phoneNumber}`}
            aria-label="Call us"
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-red-500 to-blue-600 text-white shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <Phone className="h-6 w-6" />
          </a>

          {/* WhatsApp Button */}
          <a
            href={`https://wa.me/${phoneNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            <FaWhatsapp className="h-6 w-6" />
          </a>
        </div>
      )}

      {/* Main toggle button */}
      <button
        onClick={toggle}
        aria-label="Contact us"
        className="grid padding-10 h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-yellow-300"
      >
        <Phone className="h-6 w-6 " />
      </button>
    </div>
  );
}
