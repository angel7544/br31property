"use client";
import { useState, useEffect } from "react";
import { Plus, Filter, MoreHorizontal, X, Edit, Trash2, Image as ImageIcon, BedDouble, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Room, Property } from "@/types";

type RoomWithProperty = Room & {
  properties: { name: string } | null;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    property_id: "",
    type: "Double",
    monthly_rent: 5000,
    security_deposit: 5000,
    total_beds: 2,
    available_beds: 2,
    amenities: "",
    status: "Available" as "Available" | "Full" | "Maintenance",
    image_url: "",
  });
  
  const [file, setFile] = useState<File | null>(null);
  
  const { addToast } = useToast();
  const supabase = createClient();

  const fetchRooms = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("*, properties(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      addToast("Failed to fetch rooms", "error");
    } else {
      setRooms(data as any);
    }
    if (!silent) setLoading(false);
  };

  const fetchProperties = async () => {
    const { data } = await supabase
      .from("properties")
      .select("id, name")
      .eq("status", "Active");
      
    if (data) setProperties(data as any);
  };

  useEffect(() => {
    fetchRooms();
    fetchProperties();

    const channel = supabase
      .channel('realtime-rooms-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          fetchRooms(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        property_id: room.property_id,
        type: room.type,
        monthly_rent: room.monthly_rent,
        security_deposit: room.security_deposit || room.monthly_rent,
        total_beds: room.total_beds,
        available_beds: room.available_beds,
        amenities: room.amenities ? room.amenities.join(", ") : "",
        status: room.status,
        image_url: room.image_url || "",
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: "",
        property_id: properties.length > 0 ? properties[0].id : "",
        type: "Double",
        monthly_rent: 5000,
        security_deposit: 5000,
        total_beds: 2,
        available_beds: 2,
        amenities: "WiFi, Cupboard",
        status: "Available",
        image_url: "",
      });
    }
    setIsModalOpen(true);
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_id) {
        addToast("Please select a property", "error");
        return;
    }
    
    let uploadedUrl = formData.image_url;
    
    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `rooms/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);
            
        uploadedUrl = publicUrl;
      }
    } catch (error) {
        console.error("Upload error:", error);
        addToast("Failed to upload image", "error");
        // Proceed without image update if it fails?
    }

    const amenitiesArray = formData.amenities.split(",").map(i => i.trim()).filter(i => i !== "");

    const payload = {
      name: formData.name,
      property_id: formData.property_id,
      type: formData.type,
      monthly_rent: formData.monthly_rent,
      security_deposit: formData.security_deposit,
      total_beds: formData.total_beds,
      available_beds: formData.available_beds,
      amenities: amenitiesArray,
      status: formData.status,
      image_url: uploadedUrl,
    };

    if (editingRoom) {
      const { error } = await supabase.from("rooms").update(payload).eq("id", editingRoom.id);
      if (error) {
         addToast("Failed to update room: " + error.message, "error");
      } else {
         addToast("Room updated successfully", "success");
         setIsModalOpen(false);
         fetchRooms();
      }
    } else {
      const { error } = await supabase.from("rooms").insert([payload]);
      if (error) {
         addToast("Failed to create room: " + error.message, "error");
      } else {
         addToast("Room created successfully", "success");
         setIsModalOpen(false);
         fetchRooms();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    // Check for enquiries first
    const { count, error: countError } = await supabase
        .from("enquiries")
        .select("*", { count: 'exact', head: true })
        .eq("room_id", id);
        
    if (count && count > 0) {
        if (!confirm(`This room has ${count} enquiries. Deleting it will also remove or unlink these enquiries. Continue?`)) {
            return;
        }
    }

    const { error } = await supabase.from("rooms").delete().eq("id", id);
    
    if (error) {
      addToast("Failed to delete room: " + error.message, "error");
    } else {
      addToast("Room deleted successfully", "success");
      fetchRooms(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Rooms & Beds</h1>
            <p className="text-sm text-gray-500">Manage rooms, bed capacity, and pricing for your PGs/Flats</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Add Room
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
            <BedDouble className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No rooms found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
            <div key={room.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
                <div className="relative h-48 bg-gray-200">
                    {room.image_url ? (
                        <img src={room.image_url} alt={room.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                        <button onClick={() => handleOpenModal(room)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(room.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            room.status === "Available" ? "bg-green-100 text-green-800" :
                            room.status === "Full" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                        }`}>
                        {room.status}
                        </span>
                    </div>
                </div>
                <div className="px-4 py-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
                             <span className="text-sm font-medium text-gray-500">{room.type}</span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center">
                            <Home className="h-3 w-3 mr-1" />
                            {room.properties?.name || "Unknown Property"}
                        </p>
                        <div className="mt-3 text-xs text-gray-600 grid grid-cols-2 gap-y-2">
                             <div className="font-medium">Total Beds: {room.total_beds}</div>
                             <div className="font-medium text-green-600">Available: {room.available_beds}</div>
                        </div>
                        <p className="mt-3 text-lg font-bold text-blue-600">₹ {room.monthly_rent}<span className="text-xs text-gray-400 font-normal">/month</span></p>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold leading-6 text-gray-900">
                        {editingRoom ? "Edit Room" : "Add New Room"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property (PG/Flat)</label>
                    <select 
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                      value={formData.property_id}
                      onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                    >
                      <option value="">Select a property</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Room Name/No.</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. 101 or Master Bedroom"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                        <option value="Single">Single Room</option>
                        <option value="Double">Double Sharing</option>
                        <option value="Triple">Triple Sharing</option>
                        <option value="Four">Four Sharing</option>
                        <option value="1BHK">1BHK</option>
                        <option value="2BHK">2BHK</option>
                        <option value="3BHK">3BHK</option>
                        </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Monthly Rent (₹)</label>
                        <input 
                        required
                        type="number" 
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                        value={formData.monthly_rent}
                        onChange={(e) => setFormData({...formData, monthly_rent: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
                        <input 
                        type="number" 
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                        value={formData.security_deposit}
                        onChange={(e) => setFormData({...formData, security_deposit: Number(e.target.value)})}
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Beds</label>
                        <input 
                        required
                        type="number"
                        min="1" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                        value={formData.total_beds}
                        onChange={(e) => setFormData({...formData, total_beds: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Available Beds</label>
                        <input 
                        required
                        type="number"
                        min="0" 
                        max={formData.total_beds}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                        value={formData.available_beds}
                        onChange={(e) => setFormData({...formData, available_beds: Number(e.target.value)})}
                        />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amenities (comma separated)</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                      value={formData.amenities}
                      onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                      placeholder="WiFi, AC, Attached Bathroom, Balcony..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="Available">Available</option>
                      <option value="Full">Full</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Image</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm" 
                    />
                    {formData.image_url && (
                        <div className="mt-2">
                             <p className="text-xs text-gray-500 mb-1">Current Image:</p>
                             <img src={formData.image_url} alt="Room" className="h-20 w-20 object-cover rounded" />
                        </div>
                    )}
                  </div>

                  <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
                    >
                      {editingRoom ? "Update Room" : "Create Room"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
