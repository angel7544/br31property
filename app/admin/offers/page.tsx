"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, Image as ImageIcon, Calendar } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";

type Offer = {
  id: string;
  title: string;
  description: string;
  discount_code: string;
  discount_value: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
};

export default function OffersAdminPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_code: "",
    discount_value: "",
    image_url: "",
    start_date: "",
    end_date: "",
    is_active: true
  });
  const [file, setFile] = useState<File | null>(null);
  const supabase = getSupabaseClient();

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (error) {
        addToast("Failed to fetch offers", "error");
    } else {
        setOffers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let uploadedUrl = formData.image_url;
    
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "sakura/offers");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.ok) uploadedUrl = json.url;
      }
    } catch {}

    const payload = {
        title: formData.title,
        description: formData.description,
        discount_code: formData.discount_code,
        discount_value: formData.discount_value,
        image_url: uploadedUrl,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active
    };

    if (editingOffer) {
        const { error } = await supabase.from("offers").update(payload).eq("id", editingOffer.id);
        if (error) addToast("Failed to update offer", "error");
        else {
            addToast("Offer updated", "success");
            setIsModalOpen(false);
            fetchOffers();
        }
    } else {
        const { error } = await supabase.from("offers").insert([payload]);
        if (error) addToast("Failed to create offer", "error");
        else {
            addToast("Offer created", "success");
            setIsModalOpen(false);
            fetchOffers();
        }
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this offer?")) return;
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) addToast("Failed to delete", "error");
      else {
          addToast("Offer deleted", "success");
          fetchOffers();
      }
  };

  const openModal = (offer?: Offer) => {
      if (offer) {
          setEditingOffer(offer);
          setFormData({
              title: offer.title,
              description: offer.description || "",
              discount_code: offer.discount_code || "",
              discount_value: offer.discount_value || "",
              image_url: offer.image_url || "",
              start_date: offer.start_date ? new Date(offer.start_date).toISOString().split('T')[0] : "",
              end_date: offer.end_date ? new Date(offer.end_date).toISOString().split('T')[0] : "",
              is_active: offer.is_active
          });
      } else {
          setEditingOffer(null);
          setFormData({
              title: "",
              description: "",
              discount_code: "",
              discount_value: "",
              image_url: "",
              start_date: "",
              end_date: "",
              is_active: true
          });
      }
      setFile(null);
      setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Offers Management</h1>
        <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 mr-2" /> Create Offer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             <div className="col-span-full text-center py-12 text-gray-500">Loading offers...</div>
        ) : offers.length === 0 ? (
             <div className="col-span-full text-center py-12 text-gray-500">No offers found.</div>
        ) : (
            offers.map(offer => (
                <div key={offer.id} className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden ${!offer.is_active ? 'opacity-60' : ''}`}>
                    <div className="relative h-40 bg-gray-200">
                        {offer.image_url ? (
                            <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex space-x-2">
                             <button onClick={() => openModal(offer)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(offer.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                         <div className="absolute bottom-2 left-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                offer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {offer.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900">{offer.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{offer.description}</p>
                        
                        <div className="mt-4 flex justify-between items-center">
                             <div className="text-sm font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded">
                                 {offer.discount_value}
                             </div>
                             {offer.discount_code && (
                                 <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                     Code: {offer.discount_code}
                                 </div>
                             )}
                        </div>
                        
                        {(offer.start_date || offer.end_date) && (
                            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {offer.start_date ? new Date(offer.start_date).toLocaleDateString() : 'Now'} 
                                    {' - '} 
                                    {offer.end_date ? new Date(offer.end_date).toLocaleDateString() : 'Forever'}
                                </span>
                            </div>
                        )}
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
                 <h3 className="text-lg font-medium text-gray-900 mb-4">{editingOffer ? "Edit Offer" : "Create Offer"}</h3>
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Discount Value</label>
                            <input required type="text" placeholder="e.g. 20% OFF" value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Code (Optional)</label>
                            <input type="text" placeholder="e.g. SUMMER20" value={formData.discount_code} onChange={(e) => setFormData({...formData, discount_code: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                         {formData.image_url && (
                            <img src={formData.image_url} alt="Preview" className="mt-2 h-20 w-auto rounded" />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input id="is_active" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
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
