"use client";

import { Mail, Phone, MapPin, Send } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { useSettings } from "@/context/SettingsContext";

export default function ContactPage() {
  const { settings } = useSettings();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact & Inquiry</h1>
        <p className="text-gray-500">
          Have questions or ready to book? Fill out the form below or reach us directly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left Column: Inquiry Form */}
        <div>
          <InquiryForm />
        </div>

        {/* Right Column: Contact Info & Map */}
        <div className="space-y-10">
          <div>
            {/* <h3 className="text-lg font-semibold text-gray-900 mb-6">Get in Touch</h3> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600 shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone & WhatsApp</p>
                  <a href={`tel:${settings.contactPhone || "+1 (555) 123-4567"}`} className="text-gray-500 hover:text-pink-600 transition-colors text-sm">
                    {settings.contactPhone || "+1 (555) 123-4567"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Main Office</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || "123 Blossom Ave, Kyoto, Japan")}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-pink-600 transition-colors text-sm"
                  >
                    {settings.address || "123 Blossom Ave, Kyoto, Japan"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600 shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a href={`mailto:${settings.contactEmail || "bookings@sakurahotels.com"}`} className="text-gray-500 hover:text-pink-600 transition-colors text-sm">
                    {settings.contactEmail || "bookings@sakurahotels.com"}
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Office Hours</h4>
            <p className="text-sm text-gray-500">Monday - Sunday: 9:00 AM - 9:00 PM</p>
            <p className="text-sm text-gray-500 mt-1">Support available 24/7 for urgent inquiries.</p>
          </div> */}

          <div className="space-y-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900">Find Us on the Map</h2>
              <p className="text-gray-500 mt-1 text-sm">Located in the heart of Gangtok, Sikkim</p>
            </div>
            <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200">
               <iframe 
                 src="https://maps.google.com/maps?q=Hotel+Sakura+Lower+M.G.Marg+Nam+Nang+Rd+Gangtok+Sikkim+737101&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                 width="100%" 
                 height="100%" 
                 style={{border:0}} 
                 allowFullScreen 
                 loading="lazy" 
                 referrerPolicy="no-referrer-when-downgrade"
                 title="Hotel Sakura Location"
               ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
