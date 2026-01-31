"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, Image as ImageIcon, BadgeIndianRupee } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/context/SettingsContext";

type Service = {
  id: string;
  name: string;
  type: string;
  price: number;
  status: string;
  description: string;
  image_url?: string;
  images?: string[];
};

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ name: "", type: "lodging", price: 0, status: "Active", description: "", image_url: "", images: [] as string[] });
  const [files, setFiles] = useState<File[]>([]);
  const supabase = getSupabaseClient();

  const fetchServices = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      addToast("Failed to fetch services", "error");
    } else {
      setServices(data || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(() => {
      fetchServices(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let uploadedUrls: string[] = [];
    
    try {
      if (files.length > 0) {
        for (const file of files) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", "sakura/services");
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const json = await res.json();
            if (json.ok) uploadedUrls.push(json.url);
        }
      }
    } catch {}

    const finalImages = [...formData.images, ...uploadedUrls];
    const finalImageUrl = finalImages.length > 0 ? finalImages[0] : "";

    const payload = { ...formData, image_url: finalImageUrl, images: finalImages };

    if (editingService) {
      const { error } = await supabase.from("services").update(payload).eq("id", editingService.id);
      if (error) addToast("Failed to update service", "error");
      else {
        addToast("Service updated", "success");
        setIsModalOpen(false);
        fetchServices();
      }
    } else {
      const { error } = await supabase.from("services").insert([payload]);
      if (error) addToast("Failed to create service", "error");
      else {
        addToast("Service created", "success");
        setIsModalOpen(false);
        fetchServices();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) addToast("Failed to delete", "error");
    else {
      addToast("Service deleted", "success");
      fetchServices();
    }
  };

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({ 
          name: service.name, 
          type: service.type, 
          price: service.price, 
          status: service.status, 
          description: service.description || "", 
          image_url: service.image_url || "",
          images: service.images || (service.image_url ? [service.image_url] : [])
      });
    } else {
      setEditingService(null);
      setFormData({ name: "", type: "lodging", price: 0, status: "Active", description: "", image_url: "", images: [] });
    }
    setFiles([]);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        if (formData.images.length + files.length + newFiles.length > 4) {
             addToast("Maximum 4 images allowed", "error");
             return;
        }
        setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({...formData, images: newImages});
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No services found.</div>
        ) : (
            services.map((service) => (
            <div key={service.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
                <div className="relative h-48 bg-gray-200">
                    {service.image_url ? (
                        <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                        <button onClick={() => openModal(service)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                            <Trash className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            service.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {service.status}
                        </span>
                    </div>
                </div>
                <div className="px-4 py-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                             <span className="text-sm font-medium text-gray-500 capitalize">{service.type}</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-pink-600"><BadgeIndianRupee className="inline-block h-5 w-5 mr-1" />{service.price}</p>
                    </div>
                </div>
            </div>
            ))
        )}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
               <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
               <div className="absolute top-0 right-0 pt-4 pr-4">
                <button onClick={() => setIsModalOpen(false)} className="bg-white rounded-md text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingService ? "Edit Service" : "Add Service"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Name</label>
                   <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Description</label>
                   <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Images (Max 4)</label>
                   <input 
                       type="file" 
                       accept="image/*" 
                       multiple
                       onChange={handleFileChange} 
                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm"
                       disabled={formData.images.length + files.length >= 4}
                    />
                   
                   <div className="mt-4 grid grid-cols-4 gap-2">
                     {/* Existing Images */}
                     {formData.images.map((url, index) => (
                         <div key={url} className="relative group">
                             <img src={url} alt={`Service ${index}`} className="h-20 w-20 object-cover rounded" />
                             <button 
                                 type="button"
                                 onClick={() => removeImage(index)}
                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={12} />
                             </button>
                         </div>
                     ))}
                     
                     {/* New Files */}
                     {files.map((file, index) => (
                          <div key={index} className="relative group">
                             <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded text-xs text-center p-1 overflow-hidden">
                                 {file.name}
                             </div>
                             <button 
                                 type="button"
                                 onClick={() => removeFile(index)}
                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={12} />
                             </button>
                         </div>
                     ))}
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Type</label>
                   <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm">
                      <option value="lodging">Lodging</option>
                      <option value="fooding">Fooding</option>
                      <option value="travel">Travel</option>
                      <option value="sightseeing">Sightseeing</option>
                      <option value="party">Party</option>
                      <option value="other">Other</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Price</label>
                   <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Status</label>
                   <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm">
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                   </select>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 mt-6 -mx-6 -mb-4">
                  <button type="submit" className="inline-flex w-full justify-center rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 sm:ml-3 sm:w-auto">Save</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
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


