"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, User } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";

type Staff = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  image_url?: string;
  hotel_id?: string;
  hotels?: { name: string };
};

export default function StaffAdminPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    role: "Receptionist",
    email: "",
    phone: "",
    status: "Active",
    image_url: "",
    hotel_id: "",
    password: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const supabase = getSupabaseClient();

  const fetchStaff = async (silent = false) => {
    if (!silent) setLoading(true);
    // Try to fetch with hotel name if relation exists
    const { data, error } = await supabase
      .from("staff")
      .select("*, hotels(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      // Fallback if relation or table issues
      const { data: simpleData } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
      setStaffList(simpleData || []);
    } else {
      setStaffList(data || []);
    }
    if (!silent) setLoading(false);
  };

  const fetchHotels = async () => {
    const { data } = await supabase.from("hotels").select("id, name");
    setHotels(data || []);
  };

  useEffect(() => {
    fetchStaff();
    fetchHotels();
    const interval = setInterval(() => {
      fetchStaff(true);
      fetchHotels();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let uploadedUrl = formData.image_url;
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "sakura/staff");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.ok) uploadedUrl = json.url;
      }
    } catch {}

    if (editingStaff) {
      // For updates, we use direct DB update (ignoring password)
      const { error } = await supabase
        .from("staff")
        .update({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          image_url: uploadedUrl,
          hotel_id: formData.hotel_id || null,
        })
        .eq("id", editingStaff.id);

      if (error) {
        console.error(error);
        addToast("Failed to update staff (DB error)", "error");
      } else {
        addToast("Staff updated", "success");
        setIsModalOpen(false);
        fetchStaff();
      }
    } else {
      // For creation, use the API to create Auth user + DB record
      try {
        const res = await fetch("/api/admin/create-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            image_url: uploadedUrl,
          }),
        });
        const json = await res.json();
        
        if (!res.ok) {
          addToast(json.error || "Failed to create staff", "error");
        } else {
          addToast("Staff created successfully", "success");
          setIsModalOpen(false);
          fetchStaff();
        }
      } catch (err) {
        addToast("An error occurred", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will not delete the login account, only the staff record.")) return;
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) {
      addToast("Failed to delete (DB error)", "error");
    } else {
      addToast("Staff deleted", "success");
      fetchStaff();
    }
  };

  const openModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        role: staff.role,
        email: staff.email,
        phone: staff.phone,
        status: staff.status,
        image_url: staff.image_url || "",
        hotel_id: staff.hotel_id || "",
        password: "", // Password not editable here
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        role: "Receptionist",
        email: "",
        phone: "",
        status: "Active",
        image_url: "",
        hotel_id: "",
        password: "",
      });
    }
    setFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading staff...</div>
        ) : staffList.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No staff found.</div>
        ) : (
          staffList.map((staff) => (
            <div key={staff.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
              <div className="relative h-48 bg-gray-200">
                {staff.image_url ? (
                  <img src={staff.image_url} alt={staff.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                   <button onClick={() => openModal(staff)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                      <Edit className="h-4 w-4" />
                   </button>
                   <button onClick={() => handleDelete(staff.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                      <Trash className="h-4 w-4" />
                   </button>
                </div>
                <div className="absolute bottom-2 left-2">
                   <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        staff.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {staff.status}
                    </span>
                </div>
              </div>
              <div className="px-4 py-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{staff.name}</h3>
                  <p className="text-sm text-gray-500">{staff.role}</p>
                  <div className="mt-2 text-sm text-gray-600">
                     <p className="flex items-center"><span className="font-medium mr-2">Email:</span> {staff.email}</p>
                     <p className="flex items-center"><span className="font-medium mr-2">Phone:</span> {staff.phone}</p>
                     <p className="flex items-center"><span className="font-medium mr-2">Hotel:</span> {staff.hotels?.name || "All / None"}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingStaff ? "Edit Staff" : "Add Staff"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                        >
                            <option value="Manager">Manager</option>
                            <option value="Receptionist">Receptionist</option>
                            <option value="Chef">Chef</option>
                            <option value="Housekeeping">Housekeeping</option>
                            <option value="Security">Security</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Hotel</label>
                        <select
                            value={formData.hotel_id}
                            onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                        >
                            <option value="">-- No Hotel --</option>
                            {hotels.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                  />
                </div>
                
                {!editingStaff && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            required
                            type="password"
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                            placeholder="Min 6 characters"
                        />
                    </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                  {formData.image_url && (
                    <img src={formData.image_url} className="mt-2 h-20 w-20 rounded object-cover" />
                  )}
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:text-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
