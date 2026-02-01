"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LifeBuoy, Phone, Clock, Ticket, MessageSquare, User, Send } from "lucide-react";
import Link from "next/link";

export default function SupportSection({ userEmail }: { userEmail?: string }) {
  const supabase = createClient();
  
  const [ticketLoading, setTicketLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    userType: "",
    issueType: "",
    description: "",
  });

  const [callForm, setCallForm] = useState({
    phone: "",
    preferredTime: "",
  });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.userType || !ticketForm.issueType || !ticketForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setTicketLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("complaints").insert({
        user_id: user?.id,
        user_type: ticketForm.userType,
        issue_type: ticketForm.issueType,
        title: `${ticketForm.issueType} - ${ticketForm.userType}`,
        subject: `${ticketForm.issueType} - ${ticketForm.userType}`, // Sync subject for compatibility
        description: ticketForm.description,
        status: 'Open',
        priority: 'Medium'
      });

      if (error) throw error;

      toast.success("Ticket raised successfully! We'll get back to you soon.");
      setTicketForm({ userType: "", issueType: "", description: "" });
    } catch (error: any) {
      console.error("Ticket Error:", error);
      toast.error(error.message || "Failed to raise ticket");
    } finally {
      setTicketLoading(false);
    }
  };

  const handleCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.phone || !callForm.preferredTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (callForm.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setCallLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("call_requests").insert({
        user_id: user?.id,
        phone: callForm.phone,
        preferred_time: callForm.preferredTime,
        status: 'Pending'
      });

      if (error) throw error;

      toast.success("Call back requested! Our team will contact you within 24 hours.");
      setCallForm({ phone: "", preferredTime: "" });
    } catch (error: any) {
      console.error("Call Request Error:", error);
      toast.error(error.message || "Failed to request call back");
    } finally {
      setCallLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Raise an Issue Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" />
              Raise an Issue
            </h3>
            <p className="text-sm text-gray-500 mt-1">We are here to help you</p>
          </div>
          <Link 
            href="/admin/complaints" 
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <Ticket className="w-4 h-4" />
            View Tickets
          </Link>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  You are a <span className="text-red-500">*</span>
                </label>
                <select
                  value={ticketForm.userType}
                  onChange={(e) => setTicketForm({ ...ticketForm, userType: e.target.value })}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Select</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                  <option value="Staff">Staff</option>
                  <option value="Tenant">Tenant</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  Select issue <span className="text-red-500">*</span>
                </label>
                <select
                  value={ticketForm.issueType}
                  onChange={(e) => setTicketForm({ ...ticketForm, issueType: e.target.value })}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Select issue you are facing</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Billing & Payments">Billing & Payments</option>
                  <option value="Account Management">Account Management</option>
                  <option value="Property Listing">Property Listing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
              <textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Describe your issue here..."
                rows={4}
                className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={ticketLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {ticketLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Raise Ticket
            </button>
          </form>
        </div>
      </div>

      {/* Request Call Back Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-green-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            Request A Call Back
          </h3>
          <p className="text-sm text-gray-500 mt-1">Leave your number and our support team will call you within 24 hours.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleCallSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">+91</span>
                <input
                  type="tel"
                  value={callForm.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) setCallForm({ ...callForm, phone: val });
                  }}
                  placeholder="98765 43210"
                  className="w-full rounded-lg border-gray-200 border pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Preferred Time <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "Morning (9 AM - 12 PM)",
                  "Afternoon (12 PM - 4 PM)",
                  "Evening (4 PM - 8 PM)"
                ].map((time) => (
                  <label 
                    key={time}
                    className={`
                      relative flex items-center p-3 rounded-lg border cursor-pointer transition-all
                      ${callForm.preferredTime === time 
                        ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                        : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="preferredTime"
                      value={time}
                      checked={callForm.preferredTime === time}
                      onChange={(e) => setCallForm({ ...callForm, preferredTime: e.target.value })}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-medium ${callForm.preferredTime === time ? 'text-green-700' : 'text-gray-700'}`}>
                        {time}
                      </span>
                      {callForm.preferredTime === time && (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={callLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {callLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              Request Call
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
