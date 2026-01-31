import { getSupabaseClient } from "@/lib/supabaseClient";

export type PackageItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  items: string[];
  status?: string;
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

async function getPackages() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*");
    // .eq("status", "Active");
  
  if (error) {
    console.error("Error fetching packages:", error);
    return [];
  }
  return data as PackageItem[];
}

import PackagesClient from "./PackagesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Special Packages | Hotel Sakura",
  description: "Exclusive all-inclusive packages for romantic getaways, family vacations, and business trips.",
};

export const revalidate = 0;

export default async function PackagesPage() {
  const packages = await getPackages();
  
  const initialData = packages && packages.length > 0 ? packages : [
    { id: "mock1", name: "Romantic Getaway (Demo)", price: 399, items: ["2 Nights Stay", "Candlelight Dinner", "Spa Access"], description: "Perfect for couples.", status: "Active" },
    { id: "mock2", name: "Family Fun (Demo)", price: 599, items: ["3 Nights Stay", "City Tour Tickets", "Breakfast"], description: "Great for families.", status: "Active" },
  ];

  return <PackagesClient initialItems={initialData} />;
}
