import { getSupabaseClient } from "@/lib/supabaseClient";
import RoomsClient from "./RoomsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms & Suites | Hotel Sakura",
  description: "Explore our luxurious rooms and suites designed for comfort and elegance.",
};

export const revalidate = 0;

export type RoomItem = {
  id: string;
  room_number: string;
  type: string;
  price: number;
  description: string;
  image_url?: string;
  images?: string[];
  capacity: number;
  bed_type: string;
  bed_count: number;
  amenities: string[];
  view_type: string;
  status: string;
};

async function getRooms() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*");
  
  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
  return data as RoomItem[];
}

export default async function RoomsPage() {
  const rooms = await getRooms();
  return <RoomsClient initialItems={rooms} />;
}
