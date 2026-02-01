"use client";

import { useState } from "react";
import { PhoneCall, Clock, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    preferred_time: "Morning (9 AM - 12 PM)"
  });
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to request a callback");
        router.push("/login");
        return;
      }

      const { error } = await supabase.from("call_requests").insert([
        {
          user_id: user.id,
          phone: formData.phone,
          preferred_time: formData.preferred_time,
          status: 'Pending'
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      toast.success("Callback request submitted successfully!");
      setFormData({ phone: "", preferred_time: "Morning (9 AM - 12 PM)" });
      
    } catch (error: any) {
      console.error("Error submitting callback request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 text-center max-w-lg mx-auto mt-10">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h2>
        <p className="text-gray-600 mb-8">
          Our support team has received your request. We will call you at your preferred time.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request Another Call
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request a Call Back</h1>
            <p className="text-gray-500 text-sm">
              Leave your number and our support team will call you within 24 hours.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Phone Number <span className="text-red-500">*</span>
             </label>
             <input 
               type="tel" 
               placeholder="Enter your phone number" 
               required
               value={formData.phone}
               onChange={(e) => setFormData({...formData, phone: e.target.value})}
               className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
             />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Preferred Time <span className="text-red-500">*</span>
             </label>
             <div className="relative">
               <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
               <select 
                 value={formData.preferred_time}
                 onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                 className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all appearance-none"
               >
                  <option>Morning (9 AM - 12 PM)</option>
                  <option>Afternoon (12 PM - 4 PM)</option>
                  <option>Evening (4 PM - 8 PM)</option>
                  <option>Anytime</option>
               </select>
             </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <PhoneCall className="w-5 h-5" />
                  Request Call
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
