import { getSupabaseClient } from "@/lib/supabaseClient";
import { Metadata } from "next";
import BlogClient from "./BlogClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | Hotel Sakura",
  description: "Latest news, updates, and travel tips from Hotel Sakura.",
};

export type BlogItem = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  cover_image?: string | null;
  gallery_images?: string[] | null;
  author?: string | null;
  author_avatar?: string | null;
  created_at: string;
  excerpt?: string | null;
};

async function getBlogs() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }
  return (data || []) as BlogItem[];
}

export default async function BlogPage() {
  const blogs = await getBlogs();
  return <BlogClient initialItems={blogs} />;
}
