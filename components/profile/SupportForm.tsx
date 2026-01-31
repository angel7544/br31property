"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function SupportForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userType: "",
    issueType: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userType || !formData.issueType || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Ticket raised successfully! We will contact you shortly.");
    setFormData({ userType: "", issueType: "", description: "" });
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raise an issue</h1>
          <p className="text-sm text-gray-500">We are here to help you</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">View Tickets</button>
           <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">Request A call Back</button>
        </div>
      </div>

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
              {/* Simple textarea simulating rich text editor area */}
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
    </div>
  );
}
