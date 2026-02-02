"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckSquare, Loader2, Square, Upload, X, Home, MapPin, DollarSign, FileText, Phone, Mail, Image as ImageIcon, BedDouble, Shield, CheckCircle2, Users, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRoles } from "@/lib/auth";

const FormSection = ({ 
  title, 
  icon, 
  children, 
  defaultExpanded = false,
  className = ""
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  defaultExpanded?: boolean;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
          {title}
        </h2>
        <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-5 pt-0 border-t border-gray-50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
                id: room.id, 
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
            
            const { error: roomsError } = await supabase
                .from("rooms")
                .upsert(roomUpserts);

            if (roomsError) {
                console.error("Error saving rooms:", roomsError);
                toast.error("Failed to save room details");
            }
          }
      }

      // Redirect
      if (isEditMode) {
         router.refresh();
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
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* === LEFT COLUMN (MAIN CONTENT) - Span 8 === */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Property Type Section */}
          <FormSection 
            title="Property Type" 
            icon={<Home className="w-5 h-5" />}
            defaultExpanded={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${type === "PG" ? "border-red-500 bg-red-50/50 ring-1 ring-red-500/20" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="radio"
                  name="type"
                  value="PG"
                  checked={type === "PG"}
                  onChange={() => setType("PG")}
                  className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <div>
                  <span className="block font-bold text-gray-900 text-lg">PG / Hostel</span>
                  <span className="text-sm text-gray-500 font-medium">Shared accommodation</span>
                </div>
              </label>
              <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${type === "Flat" ? "border-red-500 bg-red-50/50 ring-1 ring-red-500/20" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="radio"
                  name="type"
                  value="Flat"
                  checked={type === "Flat"}
                  onChange={() => setType("Flat")}
                  className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <div>
                  <span className="block font-bold text-gray-900 text-lg">Flat / Apartment</span>
                  <span className="text-sm text-gray-500 font-medium">Entire unit for rent</span>
                </div>
              </label>
            </div>
          </FormSection>

          {/* 2. Basic Information */}
          <FormSection
            title="Basic Details"
            icon={<FileText className="w-5 h-5" />}
            defaultExpanded={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Property Name *</label>
                    <div className="relative">
                        <Home className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                        type="text"
                        required
                        placeholder="e.g. Sunshine Premium PG"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Gender Preference *</label>
                    <div className="relative">
                        <Users className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white font-medium appearance-none"
                        >
                            <option value="Unisex">Co-Living / Unisex</option>
                            <option value="Male">Boys Only</option>
                            <option value="Female">Girls Only</option>
                            <option value="Family">Family</option>
                        </select>
                    </div>
                </div>
                
                 <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Furnishing Status *</label>
                    <select
                        value={formData.furnishing}
                        onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white font-medium"
                    >
                        <option value="">Select Option</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                        <option value="Semi Furnished">Semi Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                    </select>
               </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">About this Property</label>
                    <div className="relative">
                        <textarea
                        rows={6}
                        placeholder="Tell us what makes your property unique. Mention nearby landmarks, environment, and key features..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 resize-none text-base leading-relaxed"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium bg-white/80 px-2 py-1 rounded">
                            {formData.description.length} chars
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Contact Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                            <input
                                type="tel"
                                placeholder="Mobile number"
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>
          </FormSection>

          {/* 3. Location Section */}
          <FormSection
            title="Location"
            icon={<MapPin className="w-5 h-5" />}
            defaultExpanded={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">City *</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            required
                            placeholder="e.g. Bangalore"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Full Address *</label>
                    <textarea
                        rows={3}
                        required
                        placeholder="House No, Street, Landmark, Area..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 resize-none font-medium"
                    />
                </div>
            </div>
          </FormSection>

          {/* 4. Amenities Section */}
          <FormSection
            title="Amenities"
            icon={<Shield className="w-5 h-5" />}
            defaultExpanded={false}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES_LIST.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    amenities.includes(amenity)
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {amenities.includes(amenity) ? (
                    <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  {amenity}
                </button>
              ))}
            </div>
          </FormSection>

          {/* 5. Pricing & Rules */}
          <FormSection
            title="Pricing & Terms"
            icon={<DollarSign className="w-5 h-5" />}
            defaultExpanded={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Min Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.price_min}
                      onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Max Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.price_max}
                      onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                    />
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Security Deposit</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Months Rent"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 font-medium"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 mt-6">
               <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Notice Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Month"
                    value={formData.notice_period}
                    onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Lock-in Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 6 Months"
                    value={formData.lock_in_period}
                    onChange={(e) => setFormData({ ...formData, lock_in_period: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Agreement Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 11 Months"
                    value={formData.agreement_duration}
                    onChange={(e) => setFormData({ ...formData, agreement_duration: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Available From</label>
                  <input
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400 text-gray-600"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Electricity Charges</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹8/unit or Included"
                    value={formData.electricity_charges}
                    onChange={(e) => setFormData({ ...formData, electricity_charges: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Maintenance</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1000/mo or Included"
                    value={formData.maintenance_charges}
                    onChange={(e) => setFormData({ ...formData, maintenance_charges: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400"
                  />
               </div>
            </div>
          </FormSection>

          {/* 6. Room Configuration (PG Only) */}
          {type === "PG" && (
            <FormSection
              title="Room Configuration"
              icon={<BedDouble className="w-5 h-5" />}
              defaultExpanded={true}
            >
              <div className="flex justify-between items-center mb-6">
                 <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full uppercase tracking-wide">PG Only</span>
              </div>
              
              {/* Add Room Form Card */}
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Add New Room
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Room No/Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      value={currentRoom.name}
                      onChange={(e) => setCurrentRoom({...currentRoom, name: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Type *</label>
                    <select
                      value={currentRoom.type}
                      onChange={(e) => setCurrentRoom({...currentRoom, type: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white font-medium"
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
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Rent (₹/mo) *</label>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={currentRoom.rent}
                      onChange={(e) => setCurrentRoom({...currentRoom, rent: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Total Beds *</label>
                    <input
                      type="number"
                      placeholder="Count"
                      value={currentRoom.beds}
                      onChange={(e) => setCurrentRoom({...currentRoom, beds: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Security Deposit</label>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={currentRoom.security_deposit}
                      onChange={(e) => setCurrentRoom({...currentRoom, security_deposit: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Available Beds</label>
                    <input
                      type="number"
                      placeholder="Count"
                      value={currentRoom.available_beds}
                      onChange={(e) => setCurrentRoom({...currentRoom, available_beds: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                    <select
                      value={currentRoom.status}
                      onChange={(e) => setCurrentRoom({...currentRoom, status: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white font-medium"
                    >
                      <option>Available</option>
                      <option>Full</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Room Amenities</label>
                    <input
                      type="text"
                      placeholder="e.g. TV, Balcony (comma separated)"
                      value={currentRoom.amenities}
                      onChange={(e) => setCurrentRoom({...currentRoom, amenities: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Room Image</label>
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
                       <label className="cursor-pointer bg-white border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-blue-400 flex items-center gap-2 transition-all shadow-sm">
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
                <div className="space-y-4 mt-8">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">Added Rooms ({rooms.length})</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm group">
                        <div className="flex items-center gap-4">
                           {room.image_url ? (
                              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <Image src={room.image_url} alt={room.name} fill className="object-cover" />
                              </div>
                           ) : (
                              <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400">
                                <BedDouble className="w-8 h-8" />
                              </div>
                           )}
                           <div>
                              <div className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                {room.name} 
                                <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{room.type}</span>
                              </div>
                              <div className="text-gray-500 text-sm mt-1 flex items-center gap-3 font-medium">
                                 <span className="text-green-600">₹{room.rent}/mo</span>
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
                          className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FormSection>
          )}

        </div>

        {/* === RIGHT COLUMN (SIDEBAR - STICKY) - Span 4 === */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          
          {/* 1. Images Section (High Visibility) */}
          <FormSection
            title="Property Images"
            icon={<ImageIcon className="w-5 h-5 text-blue-500" />}
            defaultExpanded={true}
          >
            {/* Main Image */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image *</label>
              <div className="relative w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group hover:border-blue-500 hover:bg-blue-50 transition-all">
                {mainImage ? (
                  <>
                    <Image src={mainImage} alt="Main" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setMainImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
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
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gallery (Max 5)</label>
              <div className="grid grid-cols-3 gap-2">
                {otherImages.map((img, index) => (
                  <div key={index} className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200 group shadow-sm">
                    <Image src={img} alt={`Gallery ${index}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeOtherImage(index)}
                      className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
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
          </FormSection>


          
          {/* 3. Submit Action */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
               {error && (
                <div className="text-red-500 text-sm bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-2">
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg transform active:scale-[0.98]"
              >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Publishing...
                    </>
                ) : (
                    <>
                        Post Property
                        <CheckCircle2 className="w-5 h-5" />
                    </>
                )}
              </button>
              <p className="text-xs text-center text-gray-400">
                By posting, you agree to our Terms & Conditions
              </p>
          </div>

        </div>

      </div>
    </form>
  );
}
