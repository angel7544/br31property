export type Profile = {
  id: string;
  role: 'admin' | 'owner' | 'tenant';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Property = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string | null;
  type: 'PG' | 'Flat';
  gender_preference: 'Male' | 'Female' | 'Unisex' | 'Family';
  amenities: string[] | null;
  rules: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  image_url: string | null;
  status: 'Active' | 'Maintenance' | 'Closed';
  created_at: string;
  // Relations
  rooms?: Room[];
  images?: PropertyImage[];
};

export type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  caption: string | null;
  is_featured: boolean;
  created_at: string;
};

export type Room = {
  id: string;
  property_id: string;
  name: string;
  type: string; // 'Single', 'Double', '1BHK', etc.
  monthly_rent: number;
  security_deposit: number | null;
  total_beds: number;
  available_beds: number;
  amenities: string[] | null;
  image_url: string | null;
  status: 'Available' | 'Full' | 'Maintenance';
  created_at: string;
};

export type Enquiry = {
  id: string;
  user_id: string | null;
  property_id: string;
  room_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  move_in_date: string | null;
  message: string | null;
  status: 'New' | 'Contacted' | 'Viewed' | 'Booked' | 'Closed';
  created_at: string;
  // Relations
  property?: { name: string; address: string | null };
  room?: { name: string; type: string; monthly_rent: number };
};
