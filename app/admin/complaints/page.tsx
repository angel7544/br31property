"use client";
import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle, Clock, AlertCircle, Filter, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type Complaint = {
  id: string;
  subject: string;
  description: string;
  status: "New" | "Investigating" | "Resolved" | "Dismissed";
  created_at: string;
  profiles?: { full_name: string; email: string };
  properties?: { name: string };
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchComplaints = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        profiles(full_name, email),
        properties(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
      toast.error(`Failed to fetch complaints: ${error.message}`);
    } else {
      setComplaints(data as any || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(() => fetchComplaints(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated");
      fetchComplaints(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "New": "bg-red-100 text-red-800",
      "Investigating": "bg-yellow-100 text-yellow-800",
      "Resolved": "bg-green-100 text-green-800",
      "Dismissed": "bg-gray-100 text-gray-800"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Complaints
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && complaints.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">No complaints found</div>
        ) : (
          complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                  {complaint.status}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(complaint.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{complaint.subject}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{complaint.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex justify-between">
                  <span>Property:</span>
                  <span className="font-medium text-gray-900">{complaint.properties?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>From:</span>
                  <span className="font-medium text-gray-900">{complaint.profiles?.full_name}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <select 
                  className="flex-1 text-sm border rounded-lg px-2 py-1"
                  value={complaint.status}
                  onChange={(e) => updateStatus(complaint.id, e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
