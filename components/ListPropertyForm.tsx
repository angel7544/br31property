"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckSquare, Loader2, Square, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getUserRoles } from "@/lib/auth";
const AMENITIES_LIST = [
  "Wi-Fi", "AC", "Power Backup", "Room Cleaning", "Parking",
  "Security", "Geyser", "Laundry", "TV", "Lift", "Gym", "Food/Mess",
  "CCTV", "Water Purifier", "Refrigerator"
];

export default function ListPropertyForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"PG" | "Flat">("PG");
  const [formData, setFormData] = useState({
    location: "",
    name: "",
    contact: "",
    email: ""
  });

  const [mainImage, setMainImage] = useState<string>("");
  const [otherImages, setOtherImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [canPost, setCanPost] = useState(false);

  useEffect(() => {
    getUserRoles(supabase).then((roles) => {
      if (roles.includes("admin") || roles.includes("owner")) {
        setCanPost(true);
      }
    });
  }, [supabase]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 7);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large (max 5MB)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      
      if (isMain) {
        setMainImage(data.url);
      } else {
        if (otherImages.length >= 5) {
          toast.error("Maximum 5 additional images allowed");
          return;
        }
        setOtherImages([...otherImages, data.url]);
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeOtherImage = (index: number) => {
    setOtherImages(otherImages.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!canPost) {
      setError("Only Admins and Owners can post properties.");
      setLoading(false);
      return;
    }

    setError(null);

    if (!mainImage) {
      setError("Main image is required");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Property Entry
      const slug = generateSlug(formData.name);
      
      const { data, error: insertError } = await supabase
        .from("properties")
        .insert({
          owner_id: userId,
          name: formData.name,
          slug: slug,
          type: type,
          city: formData.location, // Assuming location input is City for MVP
          address: formData.location,
          status: "Active", // Auto-activate for owners/admins
          description: "Newly listed property",
          gender_preference: "Unisex", // Default
          contact_number: formData.contact,
          email: formData.email,
          image_url: mainImage,
          images: otherImages,
          amenities: amenities
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Redirect to Owner Dashboard or Success Page
      // For now, redirect to the property page (even if empty) or back home
      alert("Property listed successfully! You can now manage it from your dashboard.");
      router.push("/dashboard"); 
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to list property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Property Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Property Type</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="PG"
              checked={type === "PG"}
              onChange={() => setType("PG")}
              className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
            />
            <span className="text-gray-700">PG /Hostel</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="Flat"
              checked={type === "Flat"}
              onChange={() => setType("Flat")}
              className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
            />
            <span className="text-gray-700">Flat</span>
          </label>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Select Location *</label>
        <input
          type="text"
          required
          placeholder="Search Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">PG Name /Flat Name *</label>
        <input
          type="text"
          required
          placeholder="PG Name / Flat Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
        />
      </div>

      {/* Contact */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Property Contact No. (Optional)</label>
        <input
          type="tel"
          placeholder="Property contact number"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Property Email (Optional)</label>
        <input
          type="email"
          placeholder="Property Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
        />
      </div>

      {/* Main Image */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Main Property Image *</label>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group hover:border-orange-500 transition-colors">
            {mainImage ? (
              <>
                <Image src={mainImage} alt="Main" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setMainImage("")}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-orange-500">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <p>Upload a high quality main image.</p>
            <p>This will be the cover image of your property.</p>
          </div>
        </div>
      </div>

      {/* Other Images */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Images (Max 5)</label>
        <div className="flex flex-wrap gap-4">
          {otherImages.map((img, index) => (
            <div key={index} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={img} alt={`Other ${index}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeOtherImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {otherImages.length < 5 && (
            <div className="w-24 h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-orange-500">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span className="text-xs mt-1">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Amenities</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES_LIST.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                amenities.includes(amenity)
                  ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {amenities.includes(amenity) ? (
                <CheckSquare className="w-4 h-4 text-orange-500" />
              ) : (
                <Square className="w-4 h-4 text-gray-300" />
              )}
              {amenity}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Post your property
      </button>

    </form>
  );
}
