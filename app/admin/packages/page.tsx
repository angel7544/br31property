"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, Image as ImageIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/context/SettingsContext";

type Package = {
  id: string;
  name: string;
  items: string[];
  price: number;
  status: string;
  description: string;
  image_url?: string;
  images?: string[];
  number_of_days?: number;
  number_of_nights?: number;
  room_capacity?: number;
  is_corporate?: boolean;
  is_wedding?: boolean;
  is_featured?: boolean;
  bed_count?: number;
};

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const { addToast } = useToast();
  const { currencySymbol } = useSettings();

  const [formData, setFormData] = useState({
    name: "",
    items: "",
    price: 0,
    status: "Active",
    description: "",
    image_url: "",
    images: [] as string[],
    number_of_days: 1,
    number_of_nights: 1,
    room_capacity: 2,
    is_corporate: false,
    is_wedding: false,
    is_featured: false,
    bed_count: 1
  });
  const [files, setFiles] = useState<File[]>([]);
  const supabase = getSupabaseClient();

  const fetchPackages = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      addToast("Failed to fetch packages", "error");
    } else {
      setPackages(data || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
    const interval = setInterval(() => {
      fetchPackages(true);
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
            fd.append("folder", "sakura/packages");
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const json = await res.json();
            if (json.ok) uploadedUrls.push(json.url);
        }
      }
    } catch {}

    const itemsArray = formData.items.split(",").map(i => i.trim()).filter(i => i !== "");
    
    const finalImages = [...formData.images, ...uploadedUrls];
    const finalImageUrl = finalImages.length > 0 ? finalImages[0] : "";

    const payload = {
      name: formData.name,
      items: itemsArray,
      price: formData.price,
      status: formData.status,
      description: formData.description,
      image_url: finalImageUrl,
      images: finalImages,
      number_of_days: formData.number_of_days,
      number_of_nights: formData.number_of_nights,
      room_capacity: formData.room_capacity,
      is_corporate: formData.is_corporate,
      is_wedding: formData.is_wedding,
      is_featured: formData.is_featured,
      bed_count: formData.bed_count
    };

    if (editingPackage) {
      const { error } = await supabase.from("packages").update(payload).eq("id", editingPackage.id);
      if (error) addToast("Failed to update package", "error");
      else {
        addToast("Package updated", "success");
        setIsModalOpen(false);
        fetchPackages();
      }
    } else {
      const { error } = await supabase.from("packages").insert([payload]);
      if (error) addToast("Failed to create package", "error");
      else {
        addToast("Package created", "success");
        setIsModalOpen(false);
        fetchPackages();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) addToast("Failed to delete", "error");
    else {
      addToast("Package deleted", "success");
      fetchPackages();
    }
  };

  const openModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({ 
        name: pkg.name, 
        items: pkg.items ? pkg.items.join(", ") : "", 
        price: pkg.price, 
        status: pkg.status,
        description: pkg.description || "",
        image_url: pkg.image_url || "",
        images: pkg.images || (pkg.image_url ? [pkg.image_url] : []),
        number_of_days: pkg.number_of_days || 1,
        number_of_nights: pkg.number_of_nights || 1,
        room_capacity: pkg.room_capacity || 2,
        is_corporate: pkg.is_corporate || false,
        is_wedding: pkg.is_wedding || false,
        is_featured: pkg.is_featured || false,
        bed_count: pkg.bed_count || 1
      });
    } else {
      setEditingPackage(null);
      setFormData({ 
        name: "", 
        items: "", 
        price: 0, 
        status: "Active", 
        description: "", 
        image_url: "",
        images: [],
        number_of_days: 1,
        number_of_nights: 1,
        room_capacity: 2,
        is_corporate: false,
        is_wedding: false,
        is_featured: false,
        bed_count: 1
      });
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
        <h1 className="text-2xl font-bold text-gray-900">Packages Management</h1>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 mr-2" /> Create Package
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No packages found.</div>
        ) : (
            packages.map((pkg) => (
            <div key={pkg.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
                <div className="relative h-48 bg-gray-200">
                    {pkg.image_url ? (
                        <img src={pkg.image_url} alt={pkg.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                        <button onClick={() => openModal(pkg)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                            <Trash className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pkg.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {pkg.status}
                        </span>
                    </div>
                    {pkg.is_featured && (
                      <div className="absolute top-2 left-2">
                         <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Featured</span>
                      </div>
                    )}
                </div>
                <div className="px-4 py-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">{pkg.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                             <div><span className="font-medium">Includes:</span> {pkg.items?.join(", ")}</div>
                             <div><span className="font-medium">Duration:</span> {pkg.number_of_days} Days / {pkg.number_of_nights} Nights</div>
                             <div><span className="font-medium">Capacity:</span> {pkg.room_capacity} Person(s)</div>
                             {pkg.is_corporate && <div className="text-blue-600 text-xs font-semibold">Corporate Event Friendly</div>}
                             {pkg.is_wedding && <div className="text-pink-600 text-xs font-semibold">Wedding Friendly</div>}
                        </div>
                        <p className="mt-2 text-lg font-bold text-pink-600">{currencySymbol}{pkg.price}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingPackage ? "Edit Package" : "Add Package"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Name</label>
                   <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
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
                             <img src={url} alt={`Package ${index}`} className="h-20 w-20 object-cover rounded" />
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
                   <label className="block text-sm font-medium text-gray-700">Description</label>
                   <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Days</label>
                    <input required type="number" min="1" value={formData.number_of_days} onChange={(e) => setFormData({...formData, number_of_days: parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nights</label>
                    <input required type="number" min="0" value={formData.number_of_nights} onChange={(e) => setFormData({...formData, number_of_nights: parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Capacity</label>
                    <input required type="number" min="1" value={formData.room_capacity} onChange={(e) => setFormData({...formData, room_capacity: parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Beds</label>
                    <input required type="number" min="1" value={formData.bed_count} onChange={(e) => setFormData({...formData, bed_count: parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                  </div>
                </div>

                <div className="flex space-x-4">
                   <div className="flex items-center">
                     <input id="is_corporate" type="checkbox" checked={formData.is_corporate} onChange={(e) => setFormData({...formData, is_corporate: e.target.checked})} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                     <label htmlFor="is_corporate" className="ml-2 block text-sm text-gray-900">Corporate Event</label>
                   </div>
                   <div className="flex items-center">
                     <input id="is_wedding" type="checkbox" checked={formData.is_wedding} onChange={(e) => setFormData({...formData, is_wedding: e.target.checked})} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                     <label htmlFor="is_wedding" className="ml-2 block text-sm text-gray-900">Wedding</label>
                   </div>
                   <div className="flex items-center">
                     <input id="is_featured" type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                     <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">Featured</label>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700">Included Items (comma separated)</label>
                   <input type="text" value={formData.items} onChange={(e) => setFormData({...formData, items: e.target.value})} placeholder="Dinner, Spa, Tickets..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
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
