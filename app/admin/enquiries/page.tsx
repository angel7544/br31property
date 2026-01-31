"use client";
import { useState, useEffect } from "react";
import { Calendar, Search, CheckCircle, XCircle, Clock, FileText, Plus, X, Phone, Mail, MessageCircle, BedDouble, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Enquiry, Property, Room } from "@/types";

// Extended types for UI
type EnquiryWithDetails = Enquiry & {
  properties: { name: string; address: string } | null;
  rooms: { name: string; type: string; monthly_rent: number } | null;
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { addToast } = useToast();
  const supabase = createClient();
  
  // Create Enquiry Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [createFormData, setCreateFormData] = useState({
      name: "",
      phone: "",
      email: "",
      move_in_date: "",
      property_id: "",
      message: ""
  });

  // Assign Room Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryWithDetails | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");

  const fetchEnquiries = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("enquiries")
      .select(`
        *,
        properties (name, address),
        rooms (name, type, monthly_rent)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching enquiries:", error);
      addToast("Failed to fetch enquiries", "error");
    } else {
      setEnquiries(data as any);
    }
    if (!silent) setLoading(false);
  };

  const fetchProperties = async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("status", "Active");
      if (data) setProperties(data as any);
  };

  const fetchAvailableRooms = async (propertyId?: string) => {
      let query = supabase
        .from("rooms")
        .select("*")
        .gt("available_beds", 0)
        .eq("status", "Available");
      
      if (propertyId) {
          query = query.eq("property_id", propertyId);
      }

      const { data } = await query;
      if (data) setAvailableRooms(data as any);
  };

  useEffect(() => {
    fetchEnquiries();
    fetchProperties();

    const channel = supabase
      .channel('realtime-enquiries-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries' },
        () => {
          fetchEnquiries(true);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("enquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      addToast("Failed to update status", "error");
    } else {
      addToast(`Status updated to ${newStatus}`, "success");
      fetchEnquiries();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!createFormData.name || !createFormData.property_id) {
          addToast("Name and Property are required", "error");
          return;
      }

      const { error } = await supabase.from("enquiries").insert([{
          name: createFormData.name,
          phone: createFormData.phone,
          email: createFormData.email,
          move_in_date: createFormData.move_in_date || null,
          property_id: createFormData.property_id,
          message: createFormData.message,
          status: "New"
      }]);

      if (error) {
          console.error(error);
          addToast("Failed to create enquiry", "error");
      } else {
          addToast("Enquiry created successfully", "success");
          setIsCreateModalOpen(false);
          setCreateFormData({
            name: "",
            phone: "",
            email: "",
            move_in_date: "",
            property_id: "",
            message: ""
          });
          fetchEnquiries();
      }
  };

  const openAssignModal = (enquiry: EnquiryWithDetails) => {
    setSelectedEnquiry(enquiry);
    fetchAvailableRooms(enquiry.property_id);
    setIsAssignModalOpen(true);
  };

  const handleAssignRoom = async (room: Room) => {
      if (!selectedEnquiry) return;

      const { error } = await supabase
        .from("enquiries")
        .update({ 
            room_id: room.id,
            status: "Booked" // Auto mark as Booked/Contacted? Let's say Booked implies room assignment here
        })
        .eq("id", selectedEnquiry.id);

      if (error) {
          console.error(error);
          addToast("Failed to assign room", "error");
      } else {
          // Decrement available beds in the room
          await supabase.rpc('decrement_available_beds', { row_id: room.id });

          addToast(`Assigned Room ${room.name} to ${selectedEnquiry.name}`, "success");
          setIsAssignModalOpen(false);
          setSelectedEnquiry(null);
          fetchEnquiries();
      }
  };

  const getWhatsAppLink = (enquiry: EnquiryWithDetails) => {
      if (!enquiry.phone) return "#";
      
      let message = "";
      const phone = enquiry.phone.replace(/\D/g, ""); 
      
      if (enquiry.status === "Booked" && enquiry.rooms) {
          message = `Hello ${enquiry.name}, your booking at ${enquiry.properties?.name} for Room ${enquiry.rooms.name} is confirmed.`;
      } else {
          message = `Hello ${enquiry.name}, thank you for your enquiry at ${enquiry.properties?.name}. Are you still looking for a PG?`;
      }
      
      return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const filteredEnquiries = enquiries.filter(
    (req) =>
      req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Enquiries & Bookings</h1>
            <p className="text-sm text-gray-500">Manage leads, viewings, and tenant bookings</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
           <div className="relative flex-grow sm:flex-grow-0">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search guest..." 
               className="pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
           >
             <Plus className="h-4 w-4 mr-2" /> New Enquiry
           </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading enquiries...</div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            No enquiries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="bg-white rounded-lg shadow border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{enquiry.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    enquiry.status === "Booked" ? "bg-green-100 text-green-800" :
                                    enquiry.status === "New" ? "bg-blue-100 text-blue-800" :
                                    enquiry.status === "Closed" ? "bg-gray-100 text-gray-800" :
                                    "bg-yellow-100 text-yellow-800"
                                }`}>
                                    {enquiry.status}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">ID: {enquiry.id.substring(0,6)}</span>
                            </div>
                        </div>
                        {enquiry.rooms ? (
                            <div className="text-right">
                                <div className="text-sm font-bold text-blue-600">{enquiry.rooms.name}</div>
                                <div className="text-xs text-gray-500">{enquiry.rooms.type}</div>
                            </div>
                        ) : (
                            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">No Room</div>
                        )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-grow space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Move-in: {enquiry.move_in_date ? new Date(enquiry.move_in_date).toLocaleDateString() : "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Home className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{enquiry.properties?.name || "Unknown Property"}</span>
                        </div>
                         {enquiry.message && (
                            <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded line-clamp-3">
                                "{enquiry.message}"
                            </div>
                        )}
                    </div>

                    {/* Contact Actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-around">
                        {enquiry.phone && (
                            <a 
                                href={`tel:${enquiry.phone}`} 
                                className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                <span className="text-[10px] font-medium">Call</span>
                            </a>
                        )}
                        {enquiry.email && (
                            <a 
                                href={`mailto:${enquiry.email}`} 
                                className="flex flex-col items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                            >
                                <Mail className="h-4 w-4" />
                                <span className="text-[10px] font-medium">Email</span>
                            </a>
                        )}
                        {enquiry.phone && (
                            <a 
                                href={getWhatsAppLink(enquiry)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
                            >
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-[10px] font-medium">WhatsApp</span>
                            </a>
                        )}
                    </div>

                    {/* Primary Actions */}
                    <div className="p-4 border-t border-gray-200 flex flex-wrap gap-2">
                         {/* Assign Room */}
                        {(!enquiry.rooms) && enquiry.status !== "Closed" && (
                             <button 
                                onClick={() => openAssignModal(enquiry)}
                                className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                             >
                                <BedDouble className="h-4 w-4" />
                                Assign Room
                             </button>
                        )}

                        {/* Status Toggle */}
                         {enquiry.status === "New" && (
                             <button 
                                onClick={() => handleStatusChange(enquiry.id, "Contacted")}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 text-sm py-2 rounded hover:bg-gray-50 transition-colors"
                             >
                                Mark Contacted
                             </button>
                         )}
                         
                         {enquiry.status !== "Closed" && (
                             <button 
                                onClick={() => {
                                    if(confirm("Mark as Closed/Lost?")) handleStatusChange(enquiry.id, "Closed");
                                }}
                                className="px-3 py-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Close Enquiry"
                             >
                                <XCircle className="h-5 w-5" />
                             </button>
                         )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">New Enquiry</h3>
                    <button onClick={() => setIsCreateModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
                        <input type="text" required className="mt-1 block w-full border rounded-md p-2" 
                            value={createFormData.name} onChange={e => setCreateFormData({...createFormData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="tel" className="mt-1 block w-full border rounded-md p-2" 
                            value={createFormData.phone} onChange={e => setCreateFormData({...createFormData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" className="mt-1 block w-full border rounded-md p-2" 
                            value={createFormData.email} onChange={e => setCreateFormData({...createFormData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Property</label>
                        <select required className="mt-1 block w-full border rounded-md p-2"
                            value={createFormData.property_id} onChange={e => setCreateFormData({...createFormData, property_id: e.target.value})}>
                            <option value="">Select Property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
                        <input type="date" className="mt-1 block w-full border rounded-md p-2" 
                            value={createFormData.move_in_date} onChange={e => setCreateFormData({...createFormData, move_in_date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea className="mt-1 block w-full border rounded-md p-2" 
                            value={createFormData.message} onChange={e => setCreateFormData({...createFormData, message: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Create Enquiry</button>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Room Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Assign Room</h3>
                    <button onClick={() => setIsAssignModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                </div>
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="Search rooms..." 
                        className="w-full border rounded-md p-2"
                        value={assignSearchTerm}
                        onChange={e => setAssignSearchTerm(e.target.value)}
                    />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableRooms
                        .filter(r => r.name.toLowerCase().includes(assignSearchTerm.toLowerCase()))
                        .map(room => (
                        <div key={room.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                            <div>
                                <div className="font-medium">{room.name}</div>
                                <div className="text-xs text-gray-500">{room.type} • ₹{room.monthly_rent}</div>
                                <div className="text-xs text-green-600">{room.available_beds} beds available</div>
                            </div>
                            <button 
                                onClick={() => handleAssignRoom(room)}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                            >
                                Assign
                            </button>
                        </div>
                    ))}
                    {availableRooms.length === 0 && <div className="text-center text-gray-500">No available rooms found for this property.</div>}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
