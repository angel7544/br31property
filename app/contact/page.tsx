"use client";

import { Mail, Phone, MapPin, Send } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { useSettings } from "@/context/SettingsContext";

export default function ContactPage() {
  const { settings } = useSettings();

  return (
    <div className="max-w-5xl mx-auto px-2 py-2 space-y-12">
      <div className="text-center max-w-1xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Contact & Inquiry</h1>
        <p className="text-gray-500">
          Have questions or ready to book? Fill out the form below or reach us directly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Left Column: Inquiry Form */}
        <div>
          <InquiryForm />
        </div>

        {/* Right Column: Contact Info & Map */}
        <div className="space-y-6">
          <div>
            {/* <h3 className="text-lg font-semibold text-gray-900 mb-6">Get in Touch</h3> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone & WhatsApp</p>
                  <a href={`tel:${settings.contactPhone || "+91 9135893002"}`} className="text-gray-500 hover:text-blue-600 transition-colors text-sm">
                    {settings.contactPhone || "+91 9135893002"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Main Office</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || "BR31 Technologies, Hajipur, Vaishali, Bihar, India")}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 transition-colors text-sm"
                  >
                    {settings.address || "Hajipur, Vaishali, Bihar, India"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a href={`mailto:${settings.contactEmail || "info@br31tech.live"}`} className="text-gray-500 hover:text-blue-600 transition-colors text-sm">
                    {settings.contactEmail || "info@br31tech.live"}
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
              <p className="text-gray-500 mt-1 text-sm">Located in Hajipur, Bihar</p>
            </div>
            <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200">
               <iframe 
                 src="https://maps.google.com/maps?q=Hajipur+Vaishali+Bihar&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                 width="100%" 
                 height="100%" 
                 style={{border:0}} 
                 allowFullScreen 
                 loading="lazy" 
                 referrerPolicy="no-referrer-when-downgrade"
                 title="BR31 Technologies Location"
               ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
