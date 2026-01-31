"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon, Star, Quote } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  message: string;
  rating: number;
  rooms_rating?: number;
  service_rating?: number;
  location_rating?: number;
  hotel_highlights?: string;
  walkability?: string;
  food_and_drinks?: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    message: "",
    rating: 5,
    rooms_rating: 5.0,
    service_rating: 5.0,
    location_rating: 5.0,
    hotel_highlights: "",
    walkability: "",
    food_and_drinks: "",
    status: "Active",
    image_url: ""
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { addToast } = useToast();
  const supabase = getSupabaseClient();

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      addToast("Failed to fetch testimonials", "error");
    } else {
      setTestimonials(data as Testimonial[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
    
    const channel = supabase
      .channel('realtime-testimonials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => {
        fetchTestimonials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenModal = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingId(testimonial.id);
      setFormData({
        name: testimonial.name,
        role: testimonial.role || "",
        message: testimonial.message,
        rating: testimonial.rating,
        rooms_rating: testimonial.rooms_rating || 5.0,
        service_rating: testimonial.service_rating || 5.0,
        location_rating: testimonial.location_rating || 5.0,
        hotel_highlights: testimonial.hotel_highlights || "",
        walkability: testimonial.walkability || "",
        food_and_drinks: testimonial.food_and_drinks || "",
        status: testimonial.status,
        image_url: testimonial.image_url || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        role: "",
        message: "",
        rating: 5,
        rooms_rating: 5.0,
        service_rating: 5.0,
        location_rating: 5.0,
        hotel_highlights: "",
        walkability: "",
        food_and_drinks: "",
        status: "Active",
        image_url: ""
      });
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = formData.image_url;

    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "sakura/testimonials");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error || "Upload failed");
        
        imageUrl = json.url;
      }

      const payload = {
        name: formData.name,
        role: formData.role,
        message: formData.message,
        rating: formData.rating,
        rooms_rating: formData.rooms_rating,
        service_rating: formData.service_rating,
        location_rating: formData.location_rating,
        hotel_highlights: formData.hotel_highlights,
        walkability: formData.walkability,
        food_and_drinks: formData.food_and_drinks,
        status: formData.status,
        image_url: imageUrl
      };

      if (editingId) {
        const { error } = await supabase
          .from("testimonials")
          .update(payload)
          .eq("id", editingId);
          
        if (error) throw error;
        addToast("Testimonial updated", "success");
      } else {
        const { error } = await supabase
          .from("testimonials")
          .insert([payload]);
          
        if (error) throw error;
        addToast("Testimonial created", "success");
      }

      setIsModalOpen(false);
      fetchTestimonials();
    } catch (error: any) {
      console.error("Error:", error);
      addToast(error.message || "Something went wrong", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      addToast("Failed to delete", "error");
    } else {
      addToast("Testimonial deleted", "success");
      fetchTestimonials();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-gray-500 mt-1">Manage customer reviews and feedback</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(t)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                  {t.image_url ? (
                    <Image src={t.image_url} alt={t.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>

              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={`${i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>

              {(t.rooms_rating || t.service_rating || t.location_rating) && (
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                  {t.rooms_rating && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Rooms: {t.rooms_rating}</span>}
                  {t.service_rating && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Service: {t.service_rating}</span>}
                  {t.location_rating && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">Loc: {t.location_rating}</span>}
                </div>
              )}

              <p className="text-gray-600 text-sm line-clamp-4 relative pl-4">
                <Quote size={12} className="absolute top-0 left-0 text-pink-300 transform -scale-x-100" />
                {t.message}
              </p>

              <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs">
                <span className={`px-2 py-1 rounded-full ${t.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {t.status}
                </span>
                <span className="text-gray-400">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Testimonial" : "New Testimonial"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="John Doe"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="CEO, Tech Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Share the experience..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rooms (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rooms_rating}
                    onChange={(e) => setFormData({...formData, rooms_rating: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.service_rating}
                    onChange={(e) => setFormData({...formData, service_rating: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.location_rating}
                    onChange={(e) => setFormData({...formData, location_rating: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Highlights</label>
                    <input
                      type="text"
                      value={formData.hotel_highlights}
                      onChange={(e) => setFormData({...formData, hotel_highlights: e.target.value})}
                      className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="e.g. Quiet, Great View, Luxury"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Walkability</label>
                    <input
                      type="text"
                      value={formData.walkability}
                      onChange={(e) => setFormData({...formData, walkability: e.target.value})}
                      className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="e.g. Near Gandhi Marg"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food and Drinks</label>
                    <textarea
                      rows={2}
                      value={formData.food_and_drinks}
                      onChange={(e) => setFormData({...formData, food_and_drinks: e.target.value})}
                      className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="e.g. Tea is good, fresh milk available..."
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {[5, 4, 3, 2, 1].map(r => (
                      <option key={r} value={r}>{r} Stars</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <div className="flex items-center gap-4">
                  {(file || formData.image_url) && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border">
                      <Image 
                        src={file ? URL.createObjectURL(file) : formData.image_url} 
                        alt="Preview" 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Save Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
