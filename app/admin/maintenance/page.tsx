"use client";
import { useState, useEffect } from "react";
import { Wrench, CheckCircle, Clock, AlertTriangle, Filter, Eye, Plus, X } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string; property_id: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Low",
    property_id: "",
    room_id: ""
  });
  
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
    
    // Fetch properties and rooms for dropdowns
    const fetchMetadata = async () => {
      const { data: props } = await supabase.from("properties").select("id, name");
      setProperties(props || []);
      
      const { data: rms } = await supabase.from("rooms").select("id, name, property_id");
      setRooms(rms || []);
    };
    fetchMetadata();

    const channel = supabase
      .channel("maintenance_requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_requests" }, () => {
        fetchRequests(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_id || !formData.title) {
      addToast("Please fill required fields", "error");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("maintenance_requests").insert([
      {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        property_id: formData.property_id,
        room_id: formData.room_id || null,
        user_id: user?.id,
        status: "Open"
      }
    ]);

    if (error) {
      console.error(error);
      addToast("Failed to create request", "error");
    } else {
      addToast("Request created successfully", "success");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "Low",
        property_id: "",
        room_id: ""
      });
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

  const filteredRooms = rooms.filter(r => r.property_id === formData.property_id);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Maintenance Requests
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
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
                  <span className="font-medium text-gray-900">{req.profiles?.full_name || "Unknown"}</span>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Maintenance Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <select
                  required
                  className="w-full p-2 border rounded-lg"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value, room_id: "" })}
                >
                  <option value="">Select Property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  disabled={!formData.property_id}
                >
                  <option value="">Select Room</option>
                  {filteredRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-lg"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AC Not Working"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  className="w-full p-2 border rounded-lg h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
