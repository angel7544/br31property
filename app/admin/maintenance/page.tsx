"use client";
import { useState, useEffect } from "react";
import { Wrench, CheckCircle, Clock, AlertTriangle, Filter, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  created_at: string;
  profiles?: { full_name: string; email: string };
  properties?: { name: string };
  rooms?: { name: string };
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const supabase = createClient();

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("maintenance_requests")
      .select(`
        *,
        profiles(full_name, email),
        properties(name),
        rooms(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRequests(data as any || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      addToast("Failed to update status", "error");
    } else {
      addToast("Status updated", "success");
      fetchRequests(true);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "text-red-600 font-bold";
      case "High": return "text-orange-600 font-semibold";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "Open": "bg-red-100 text-red-800",
      "In Progress": "bg-yellow-100 text-yellow-800",
      "Resolved": "bg-green-100 text-green-800",
      "Closed": "bg-gray-100 text-gray-800"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Maintenance Requests
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && requests.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">No maintenance requests found</div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(req.status)}`}>
                  {req.status}
                </span>
                <span className={`text-sm ${getPriorityColor(req.priority)} flex items-center gap-1`}>
                  <AlertTriangle className="w-3 h-3" />
                  {req.priority}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{req.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{req.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex justify-between">
                  <span>Property:</span>
                  <span className="font-medium text-gray-900">{req.properties?.name}</span>
                </div>
                {req.rooms && (
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span className="font-medium text-gray-900">{req.rooms.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Reported by:</span>
                  <span className="font-medium text-gray-900">{req.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{format(new Date(req.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <select 
                  className="flex-1 text-sm border rounded-lg px-2 py-1"
                  value={req.status}
                  onChange={(e) => updateStatus(req.id, e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
