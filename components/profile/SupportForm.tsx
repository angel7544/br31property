"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send, FileText, Clock, CheckCircle, AlertCircle, Phone } from "lucide-react";
import Link from "next/link";

export default function SupportForm() {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'tickets'>('form');
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    userType: "",
    issueType: "",
    description: ""
  });
  const supabase = createClient();

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'tickets') {
      fetchTickets();
    }
  }, [viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userType || !formData.issueType || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to raise a ticket");
        return;
      }

      const { error } = await supabase.from("complaints").insert({
        user_id: user.id,
        user_type: formData.userType,
        issue_type: formData.issueType,
        description: formData.description,
        subject: `${formData.issueType} - ${formData.userType}`,
        title: `${formData.issueType} Issue`,
        status: 'New',
        priority: 'Medium'
      });

      if (error) throw error;
      
      toast.success("Ticket raised successfully! We will contact you shortly.");
      setFormData({ userType: "", issueType: "", description: "" });
      // Optional: Switch to tickets view after submission
      setViewMode('tickets');
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast.error(error.message || "Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{viewMode === 'form' ? 'Raise an issue' : 'My Tickets'}</h1>
          <p className="text-sm text-gray-500">We are here to help you</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setViewMode(viewMode === 'form' ? 'tickets' : 'form')}
             className={`px-4 py-2 text-sm border rounded-lg transition-colors ${viewMode === 'tickets' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
           >
             {viewMode === 'form' ? 'View Tickets' : 'Raise New Ticket'}
           </button>
           <Link href="/profile/callback" className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 inline-flex items-center gap-2">
             <Phone className="w-4 h-4" />
             Request A Call Back
           </Link>
        </div>
      </div>

      {viewMode === 'tickets' ? (
        <div className="space-y-4">
          {ticketsLoading ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
               <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
               Loading your tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
              <p className="text-gray-500 mb-6">You haven't raised any support tickets yet.</p>
              <button 
                onClick={() => setViewMode('form')}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Raise your first ticket
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {ticket.subject || ticket.title || "Support Request"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border
                      ${(ticket.status === 'Resolved' || ticket.status === 'Closed') ? 'bg-green-50 text-green-700 border-green-100' : 
                        ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                        'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                      {(ticket.status === 'Resolved' || ticket.status === 'Closed') ? <CheckCircle className="w-3.5 h-3.5" /> :
                       ticket.status === 'In Progress' ? <Clock className="w-3.5 h-3.5" /> :
                       <AlertCircle className="w-3.5 h-3.5" />}
                      {ticket.status || 'Open'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 pl-4 border-l-2 border-gray-100 italic">
                    {ticket.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-50">
                    <span className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">ID: {ticket.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      {ticket.issue_type || "General"}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                       {ticket.priority && (
                         <span className={`capitalize ${
                            ticket.priority === 'High' ? 'text-red-600 font-medium' : 
                            ticket.priority === 'Medium' ? 'text-orange-600' : 'text-gray-600'
                         }`}>
                           {ticket.priority} Priority
                         </span>
                       )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">You are a *</label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({...formData, userType: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              <option value="tenant">Tenant</option>
              <option value="owner">Property Owner</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select issue you are facing from list*</label>
            <select
              value={formData.issueType}
              onChange={(e) => setFormData({...formData, issueType: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={!formData.userType}
            >
              <option value="">{formData.userType ? "Select issue type" : "Select user type first"}</option>
              <option value="login">Login/Account Issue</option>
              <option value="booking">Booking/Enquiry Issue</option>
              <option value="payment">Payment Issue</option>
              <option value="technical">Technical Bug</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-medium text-gray-700">Description</label>
           <div className="border rounded-lg p-2 min-h-[200px]">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-full min-h-[180px] focus:outline-none resize-none"
                placeholder="Describe your issue here..."
              />
           </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center gap-2"
          >
            {loading ? "Submitting..." : (
               <>
                 Raise Ticket
               </>
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
