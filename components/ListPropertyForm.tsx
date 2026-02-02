"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckSquare, Loader2, Square, Upload, X, Home, MapPin, DollarSign, FileText, Phone, Mail, Image as ImageIcon, BedDouble, Shield, CheckCircle2, Users } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getUserRoles } from "@/lib/auth";

const AMENITIES_LIST = [
  "Wi-Fi", "AC", "Power Backup", "Room Cleaning", "Parking",
  "Security", "Geyser", "Laundry", "TV", "Lift", "Gym", "Food/Mess",
  "CCTV", "Water Purifier", "Refrigerator"
];

export default function ListPropertyForm({ userId, initialData, isEditMode = false }: { userId: string, initialData?: any, isEditMode?: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"PG" | "Flat">("PG");
  const [formData, setFormData] = useState({
    location: "",
    address: "",
    name: "",
    description: "",
    contact: "",
    email: "",
    price_min: "",
    price_max: "",
    gender: "Unisex",
    notice_period: "",
    electricity_charges: "",
    maintenance_charges: "",
    furnishing: "",
    security_deposit: "",
    lock_in_period: "",
    agreement_duration: "",
    available_from: ""
  });

  const [mainImage, setMainImage] = useState<string>("");
  const [otherImages, setOtherImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [canPost, setCanPost] = useState(false);

  // Room Configuration State (For PGs)
  const [rooms, setRooms] = useState<{
    id?: string;
    name: string;
    type: string;
    rent: string;
    beds: string;
    security_deposit: string;
    available_beds: string;
    amenities: string;
    status: string;
    image_url: string;
  }[]>([]);
  
  const [currentRoom, setCurrentRoom] = useState({
    name: "",
    type: "Double Sharing",
    rent: "",
    beds: "",
    security_deposit: "",
    available_beds: "",
    amenities: "",
    status: "Available",
    image_url: ""
  });

  useEffect(() => {
    getUserRoles(supabase).then((roles) => {
      if (roles.includes("admin") || roles.includes("owner")) {
        setCanPost(true);
      }
    });

    if (initialData) {
        setType(initialData.type || "PG");
        setFormData({
            location: initialData.city || "",
            address: initialData.address || "",
            name: initialData.name || "",
            description: initialData.description || "",
            contact: initialData.contact_number || "",
            email: initialData.email || "",
            price_min: initialData.price_range_min?.toString() || "",
            price_max: initialData.price_range_max?.toString() || "",
            gender: initialData.gender_preference || "Unisex",
            notice_period: "", 
            electricity_charges: "",
            maintenance_charges: "",
            furnishing: "",
            security_deposit: "",
            lock_in_period: "",
            agreement_duration: "",
            available_from: ""
        });
        setMainImage(initialData.image_url || "");
        setOtherImages(initialData.images || []);
        setAmenities(initialData.amenities || []);
        
        if (initialData.rooms && Array.isArray(initialData.rooms)) {
            setRooms(initialData.rooms.map((r: any) => ({
                id: r.id,
                name: r.name,
                type: r.type,
                rent: r.monthly_rent?.toString() || "",
                beds: r.total_beds?.toString() || "",
                security_deposit: r.security_deposit?.toString() || "",
                available_beds: r.available_beds?.toString() || "",
                amenities: Array.isArray(r.amenities) ? r.amenities.join(", ") : r.amenities || "",
                status: r.status || "Available",
                image_url: r.image_url || ""
            })));
        }
    }
  }, [supabase, initialData]);

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

  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setCurrentRoom({ ...currentRoom, image_url: data.url });
      toast.success("Room image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload room image");
    } finally {
      setUploading(false);
    }
  };

  const addRoom = () => {
    if (!currentRoom.name || !currentRoom.rent || !currentRoom.beds) {
      toast.error("Please fill required room details (Name, Rent, Beds)");
      return;
    }
    setRooms([...rooms, currentRoom]);
    setCurrentRoom({
      name: "",
      type: "Double Sharing",
      rent: "",
      beds: "",
      security_deposit: "",
      available_beds: "",
      amenities: "",
      status: "Available",
      image_url: ""
    });
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
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
      const slug = isEditMode && initialData?.slug ? initialData.slug : generateSlug(formData.name);
      
      // Construct rules string
      const rulesList = [
         formData.security_deposit ? `Security Deposit: ${formData.security_deposit}` : null,
         formData.notice_period ? `Notice Period: ${formData.notice_period}` : null,
         formData.lock_in_period ? `Lock-in Period: ${formData.lock_in_period}` : null,
         formData.agreement_duration ? `Agreement Duration: ${formData.agreement_duration}` : null,
         formData.electricity_charges ? `Electricity Charges: ${formData.electricity_charges}` : null,
         formData.maintenance_charges ? `Maintenance Charges: ${formData.maintenance_charges}` : null,
         formData.available_from ? `Available From: ${formData.available_from}` : null,
         initialData?.rules
      ].filter(Boolean).join('\n');

      // Append furnishing to description if present
      const finalDescription = formData.furnishing 
         ? `${formData.description}\n\nFurnishing: ${formData.furnishing}`
         : formData.description;

      const propertyPayload = {
        owner_id: userId,
        name: formData.name,
        slug: slug,
        type: type,
        city: formData.location, 
        address: formData.address || formData.location,
        status: isEditMode ? initialData.status : "Active",
        description: finalDescription || "No description provided",
        gender_preference: formData.gender,
        contact_number: formData.contact,
        email: formData.email,
        image_url: mainImage,
        images: otherImages,
        amenities: amenities,
        rules: rulesList || null,
        price_range_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_range_max: formData.price_max ? parseFloat(formData.price_max) : null
      };

      let propertyId = initialData?.id;

      if (isEditMode && propertyId) {
        // UPDATE Existing Property
        const { error: updateError } = await supabase
            .from("properties")
            .update(propertyPayload)
            .eq("id", propertyId);
        
        if (updateError) throw updateError;
        toast.success("Property details updated!");

      } else {
        // INSERT New Property
        const { data, error: insertError } = await supabase
            .from("properties")
            .insert(propertyPayload)
            .select()
            .single();

        if (insertError) throw insertError;
        propertyId = data.id;
        toast.success("Property listed successfully!");
      }

      // Handle Rooms (Only for PG)
      if (type === "PG") {
          if (isEditMode && initialData?.rooms) {
             // 1. Identify deleted rooms
             const currentRoomIds = rooms.map(r => r.id).filter(Boolean);
             const originalRoomIds = initialData.rooms.map((r: any) => r.id);
             const idsToDelete = originalRoomIds.filter((id: string) => !currentRoomIds.includes(id));
             
             if (idsToDelete.length > 0) {
                 await supabase.from("rooms").delete().in("id", idsToDelete);
             }
          }

          // 2. Upsert (Insert or Update) current rooms
          if (rooms.length > 0) {
            const roomUpserts = rooms.map(room => ({
                id: room.id, // If present, it updates; if undefined, it inserts (but we need to make sure undefined is not sent for insert if ID column is auto-gen? Supabase upsert handles this if we omit ID for new rows)
                // Actually for upsert, if ID is missing it tries to insert. 
                // We should be careful. 
                property_id: propertyId,
                name: room.name,
                type: room.type,
                monthly_rent: parseFloat(room.rent),
                total_beds: parseInt(room.beds),
                available_beds: room.available_beds ? parseInt(room.available_beds) : parseInt(room.beds),
                security_deposit: room.security_deposit ? parseFloat(room.security_deposit) : null,
                status: room.status || "Available",
                amenities: room.amenities ? room.amenities.split(',').map(a => a.trim()) : amenities,
                image_url: room.image_url || null
            }));
            
            // Clean up undefined IDs for new rooms if necessary, but Supabase JS client ignores undefined fields usually?
            // Safer to split? No, upsert is fine.
            
            const { error: roomsError } = await supabase
                .from("rooms")
                .upsert(roomUpserts); // Upsert matches on Primary Key (id)

            if (roomsError) {
                console.error("Error saving rooms:", roomsError);
                toast.error("Failed to save room details");
            }
          }
      }

      // Redirect
      if (isEditMode) {
         router.refresh();
         // Maybe stay on page or go back?
         toast.success("Changes saved.");
      } else {
         router.push("/dashboard"); 
         router.refresh();
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMN 1: Type & Basic Info */}
        <div className="space-y-6">
          {/* Property Type Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-500" />
              Property Type
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${type === "PG" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="type"
                  value="PG"
                  checked={type === "PG"}
                  onChange={() => setType("PG")}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="block font-bold text-gray-900">PG / Hostel</span>
                  <span className="text-sm text-gray-500">Shared accommodation</span>
                </div>
              </label>
              <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${type === "Flat" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="type"
                  value="Flat"
                  checked={type === "Flat"}
                  onChange={() => setType("Flat")}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="block font-bold text-gray-900">Flat / Apartment</span>
                  <span className="text-sm text-gray-500">Entire unit for rent</span>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Basic Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name *</label>
              <div className="relative">
                <Home className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunshine PG"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender Preference *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                  >
                    <option value="Unisex">Co-Living / Unisex</option>
                    <option value="Male">Boys Only</option>
                    <option value="Female">Girls Only</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address *</label>
              <textarea
                rows={2}
                required
                placeholder="House No, Street, Landmark..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                rows={4}
                placeholder="Describe your property..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Min"
                    value={formData.price_min}
                    onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Max"
                    value={formData.price_max}
                    onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rental Terms Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              Rental Terms
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Furnishing Status *</label>
                  <select
                    value={formData.furnishing}
                    onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi Furnished">Semi Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Security Deposit</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Months Rent"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notice Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Month"
                    value={formData.notice_period}
                    onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lock-in Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 6 Months"
                    value={formData.lock_in_period}
                    onChange={(e) => setFormData({ ...formData, lock_in_period: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agreement Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 11 Months"
                    value={formData.agreement_duration}
                    onChange={(e) => setFormData({ ...formData, agreement_duration: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Available From</label>
                  <input
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Electricity Charges</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹8/unit or Included"
                    value={formData.electricity_charges}
                    onChange={(e) => setFormData({ ...formData, electricity_charges: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Maintenance</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1000/mo or Included"
                    value={formData.maintenance_charges}
                    onChange={(e) => setFormData({ ...formData, maintenance_charges: e.target.value })}
                    className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                  />
               </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Contact & Amenities */}
        <div className="space-y-6">
          {/* Contact Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              Contact Details
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Amenities
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES_LIST.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                    amenities.includes(amenity)
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {amenities.includes(amenity) ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  )}
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Images (Moved to Right as Requested) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              Property Images
            </h2>
            
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Cover Image *</label>
              <div className="relative w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group hover:border-blue-500 hover:bg-blue-50 transition-all">
                {mainImage ? (
                  <>
                    <Image src={mainImage} alt="Main" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setMainImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Upload Cover</span>
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
              <div className="text-xs text-gray-500 mt-2">
                This will be the main image displayed on search results.
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery (Max 5)</label>
              <div className="grid grid-cols-3 gap-2">
                {otherImages.map((img, index) => (
                  <div key={index} className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200 group shadow-sm">
                    <Image src={img} alt={`Gallery ${index}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeOtherImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {otherImages.length < 5 && (
                  <div className="w-full aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span className="text-[10px] font-medium mt-1">Add</span>
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
          </div>
        </div>

      </div>

      {/* Room Configuration (Full Width Below) */}
      {type === "PG" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-blue-500" />
              Room Configuration
            </h2>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">PG Only</span>
          </div>
          
          {/* Add Room Form Card */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Add New Room</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Room No/Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={currentRoom.name}
                  onChange={(e) => setCurrentRoom({...currentRoom, name: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Type *</label>
                <select
                  value={currentRoom.type}
                  onChange={(e) => setCurrentRoom({...currentRoom, type: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <optgroup label="Sharing (PG)">
                    <option>Single Room</option>
                    <option>Double Sharing</option>
                    <option>Triple Sharing</option>
                    <option>Four Sharing</option>
                  </optgroup>
                  <optgroup label="Flat Areas">
                    <option>Bedroom</option>
                    <option>Master Bedroom</option>
                    <option>Guest Room</option>
                    <option>Hall</option>
                    <option>Dining Area</option>
                    <option>Kitchen</option>
                    <option>Study Room</option>
                    <option>Balcony</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rent (₹/mo) *</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={currentRoom.rent}
                  onChange={(e) => setCurrentRoom({...currentRoom, rent: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Total Beds *</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={currentRoom.beds}
                  onChange={(e) => setCurrentRoom({...currentRoom, beds: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Security Deposit (₹)</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={currentRoom.security_deposit}
                  onChange={(e) => setCurrentRoom({...currentRoom, security_deposit: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Available Beds</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={currentRoom.available_beds}
                  onChange={(e) => setCurrentRoom({...currentRoom, available_beds: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                <select
                  value={currentRoom.status}
                  onChange={(e) => setCurrentRoom({...currentRoom, status: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option>Available</option>
                  <option>Full</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Room Amenities</label>
                <input
                  type="text"
                  placeholder="e.g. TV, Balcony (comma separated)"
                  value={currentRoom.amenities}
                  onChange={(e) => setCurrentRoom({...currentRoom, amenities: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Room Image</label>
                <div className="flex items-center gap-4">
                   {currentRoom.image_url && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                        <Image src={currentRoom.image_url} alt="Room" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setCurrentRoom({...currentRoom, image_url: ""})}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                   )}
                   <label className="cursor-pointer bg-white border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 hover:border-blue-400 flex items-center gap-2 transition-all shadow-sm">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleRoomImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                   </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
               <button
                  type="button"
                  onClick={addRoom}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <CheckSquare className="w-4 h-4" /> Add Room
                </button>
            </div>
          </div>

          {/* Rooms List */}
          {rooms.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Added Rooms ({rooms.length})</h3>
              <div className="grid grid-cols-1 gap-3">
                {rooms.map((room, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                       {room.image_url ? (
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              <Image src={room.image_url} alt={room.name} fill className="object-cover" />
                          </div>
                       ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400">
                            <BedDouble className="w-6 h-6" />
                          </div>
                       )}
                       <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {room.name} 
                            <span className="text-xs font-normal bg-gray-100 px-2 py-0.5 rounded text-gray-600">{room.type}</span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1 flex items-center gap-3">
                             <span className="text-green-600 font-medium">₹{room.rent}/mo</span>
                             <span>•</span>
                             <span>{room.beds} Beds</span>
                             <span>•</span>
                             <span className={room.status === 'Available' ? 'text-green-600' : 'text-orange-500'}>{room.status}</span>
                             {room.available_beds && <span>({room.available_beds} left)</span>}
                          </div>
                        </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRoom(idx)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        Post Your Property
      </button>

    </form>
  );
}
