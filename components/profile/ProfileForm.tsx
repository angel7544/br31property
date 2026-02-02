"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProfileFormProps {
  user: any;
  profile: any;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const data = new FormData();
    data.append("file", file);
    data.append("folder", "profiles");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Upload failed");
      
      setFormData(prev => ({ ...prev, avatar_url: json.url }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {(profile?.role === "owner" || profile?.role === "staff" || profile?.role === "admin") && (
          <Link 
            href="/list-property" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            List Your Property
          </Link>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-6 mb-6"
        >
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 98765 43210"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">City</label>
            <div className="relative">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New York"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">State</label>
            <div className="relative">
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NY"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-gray-700">Address</label>
          <div className="relative">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, Apt 4B"
            />
            <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex justify-end pt-4"
        >
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
