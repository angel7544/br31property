"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, User, Shield, Key, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Staff = {
  joining_date: string;
  shift_end: string;
  shift_start: string;
  department: string;
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  image_url?: string;
  property_id?: string;
  properties?: { name: string };
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
  email: string; // might need to fetch from auth or if it's in profiles
  phone: string;
  avatar_url?: string;
  created_at: string;
  payments?: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    payment_id: string;
  }[];
};

export default function StaffAdminPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'owners' | 'tenants'>('staff');
  
  // Staff State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  
  // Users State
  const [ownersList, setOwnersList] = useState<Profile[]>([]);
  const [tenantsList, setTenantsList] = useState<Profile[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "Receptionist",
    email: "",
    phone: "",
    status: "Active",
    image_url: "",
    property_id: "",
    password: "",
    department: "Front Desk",
    shift_start: "09:00",
    shift_end: "18:00",
    joining_date: new Date().toISOString().split('T')[0],
  });
  const [file, setFile] = useState<File | null>(null);
  const supabase = createClient();

  const fetchStaff = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("staff")
      .select("*, properties(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      const { data: simpleData } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
      setStaffList(simpleData || []);
    } else {
      setStaffList(data || []);
    }
    if (!silent) setLoading(false);
  };

  const fetchUsers = async (role: 'owner' | 'tenant') => {
    setLoading(true);
    try {
      // Use the API route that bypasses RLS
      const res = await fetch(`/api/admin/users?role=${role}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || `Failed to fetch ${role}s`);
      }
      
      if (role === 'owner') {
        setOwnersList(json.users || []);
      } else {
        setTenantsList(json.users || []);
      }
    } catch (err: any) {
      console.error(`Error fetching ${role}s:`, err);
      toast.error(err.message || `Failed to load ${role}s`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("id, name");
    setProperties(data || []);
  };

  useEffect(() => {
    fetchProperties();
    if (activeTab === 'staff') {
        fetchStaff();
    } else if (activeTab === 'owners') {
        fetchUsers('owner');
    } else {
        fetchUsers('tenant');
    }
  }, [activeTab]);

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
      try {
        const res = await fetch("/api/admin/update-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStaff.id,
            name: formData.name,
            role: formData.role,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            image_url: uploadedUrl,
            property_id: formData.property_id || null,
            department: formData.department,
            shift_start: formData.shift_start,
            shift_end: formData.shift_end,
            joining_date: formData.joining_date
          }),
        });
        
        const json = await res.json();
        
        if (!res.ok) {
           toast.error(json.error || "Failed to update staff");
        } else {
           toast.success("Staff updated successfully");
           setIsModalOpen(false);
           fetchStaff();
        }
      } catch (err) {
        toast.error("An error occurred while updating");
        console.error(err);
      }
    } else {
      try {
        const res = await fetch("/api/admin/create-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            image_url: uploadedUrl,
            property_id: formData.property_id || null,
          }),
        });
        const json = await res.json();
        
        if (!res.ok) {
          toast.error(json.error || "Failed to create staff");
        } else {
          toast.success("Staff created successfully");
          setIsModalOpen(false);
          fetchStaff();
        }
      } catch (err) {
        toast.error("An error occurred");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will not delete the login account, only the staff record.")) return;
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete (DB error)");
    } else {
      toast.success("Staff deleted");
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
        property_id: staff.property_id || "",
        password: "", // Password not editable here
        department: staff.department || "Front Desk",
        shift_start: staff.shift_start || "09:00",
        shift_end: staff.shift_end || "18:00",
        joining_date: staff.joining_date || new Date().toISOString().split('T')[0]
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
        property_id: "",
        password: "",
        department: "Front Desk",
        shift_start: "09:00",
        shift_end: "18:00",
        joining_date: new Date().toISOString().split('T')[0]
      });
    }
    setFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User & Staff Management</h1>
        
        {activeTab === 'staff' && (
            <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
            <Plus className="h-4 w-4 mr-2" /> Add Staff
            </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('staff')}
            className={`${
              activeTab === 'staff'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Shield className="w-4 h-4" />
            Staff Members
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`${
              activeTab === 'owners'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Key className="w-4 h-4" />
            Property Owners
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`${
              activeTab === 'tenants'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <User className="w-4 h-4" />
            Tenants
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        ) : (
            <>
                {/* Staff List */}
                {activeTab === 'staff' && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {staffList.length === 0 ? (
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
                                            <p className="flex items-center"><span className="font-medium mr-2">Property:</span> {staff.properties?.name || "All / None"}</p>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Owners List */}
                {activeTab === 'owners' && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {ownersList.length === 0 ? (
                                <li className="px-4 py-8 text-center text-gray-500">No owners found.</li>
                            ) : (
                                ownersList.map((owner) => (
                                    <li key={owner.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                                    {owner.avatar_url ? (
                                                        <img src={owner.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-purple-600 font-bold text-lg">{owner.full_name?.charAt(0) || "O"}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-purple-600 truncate">{owner.full_name || "Unnamed User"}</p>
                                                    <p className="flex items-center text-sm text-gray-500 gap-2">
                                                        <span>{owner.email}</span>
                                                        <span>•</span>
                                                        <span>{owner.phone || "No phone"}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {owner.payments && owner.payments.length > 0 ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Paid Owner
                                                        </span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Receipt className="w-3 h-3" />
                                                            ₹{owner.payments[0].amount} • {new Date(owner.payments[0].created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        Legacy/Manual
                                                    </span>
                                                )}
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Joined {new Date(owner.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}

                {/* Tenants List */}
                {activeTab === 'tenants' && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {tenantsList.length === 0 ? (
                                <li className="px-4 py-8 text-center text-gray-500">No tenants found.</li>
                            ) : (
                                tenantsList.map((tenant) => (
                                    <li key={tenant.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    {tenant.avatar_url ? (
                                                        <img src={tenant.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 truncate">{tenant.full_name || "Unnamed User"}</p>
                                                    <p className="flex items-center text-sm text-gray-500 gap-2">
                                                        <span>{tenant.email}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Tenant
                                                </span>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Joined {new Date(tenant.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}
            </>
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                        >
                            <option value="Staff">Staff</option>
                            <option value="Manager">Manager</option>
                            <option value="Receptionist">Receptionist</option>
                            <option value="Housekeeper">Housekeeper</option>
                            <option value="Security">Security</option>
                            <option value="Chef">Chef</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Property</label>
                        <select
                            value={formData.property_id}
                            onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                        >
                            <option value="">-- No Property --</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
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
