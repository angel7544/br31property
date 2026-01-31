import { getSupabaseClient } from "@/lib/supabaseClient";

export type ServiceItem = {
  id: string;
  name: string;
  type: string;
  description: string;
  image_url?: string;
  images?: string[];
  price?: number;
  status?: string;
};

// This is a Server Component that fetches data
async function getServices() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("status", "Active");
  
  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }
  return data as ServiceItem[];
}

import CatalogClient from "./CatalogClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Catalog | Hotel Sakura",
  description: "Explore our premium lodging, dining, travel, and event services across multiple locations.",
};

export const revalidate = 0; // Ensure fresh data on every request (ASAP updates)

export default async function CatalogPage() {
  const services = await getServices();
  
  // If no DB data, fallback to mock for demo if env is missing, or just pass empty
  const initialData = services && services.length > 0 ? services : [
    { id: "mock1", name: "Deluxe Ocean View (Demo)", type: "lodging", price: 150, description: "Spacious room with a beautiful view of the ocean.", status: "Active" },
    { id: "mock2", name: "Sushi Platter (Demo)", type: "fooding", price: 45, description: "Freshly prepared sushi platter with premium ingredients.", status: "Active" },
  ];

  return <CatalogClient initialItems={initialData} />;
}
