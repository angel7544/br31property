"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import ImageSlider from "@/components/ui/ImageSlider";
import SocialShare from "@/components/ui/SocialShare";
import { getSupabaseClient } from "@/lib/supabaseClient";

// Define the full blog post type
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image?: string | null;
  gallery_images?: string[] | null;
  tags?: string[] | null;
  author?: string | null;
  author_avatar?: string | null;
  author_bio?: string | null;
  created_at: string;
  is_published: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
};

export default function BlogPostClient({ initialBlog }: { initialBlog: BlogPost }) {
  const [blog, setBlog] = useState<BlogPost>(initialBlog);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const fetchBlog = async () => {
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", initialBlog.id)
        .single();
      
      if (data) {
        setBlog(data as BlogPost);
      }
    };

    // Initial fetch to ensure we have latest data
    fetchBlog();

    const channel = supabase
      .channel(`realtime-blog-${initialBlog.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blogs",
          filter: `id=eq.${initialBlog.id}`,
        },
        () => {
          fetchBlog();
        }
      )
      .subscribe();

    // Polling as requested to match BlogClient behavior
    const interval = setInterval(() => {
      fetchBlog();
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [initialBlog.id]);

  const galleryImages = blog.gallery_images || [];
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hotelsakura.in'}/blog/${blog.slug}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[350px] w-full bg-gray-900">
        {blog.cover_image ? (
          <Image
            src={blog.cover_image}
            alt={blog.title}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-16">
          <div className="container mx-auto max-w-4xl">
            <Link 
              href="/blog"
              className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>

            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags && blog.tags.map((tag: string) => (
                <span key={tag} className="text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full bg-blue-600 text-white">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center text-white/90 gap-6 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {blog.author && (
                <div className="flex items-center gap-2">
                  {blog.author_avatar ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden relative border-2 border-white/20">
                      <Image 
                        src={blog.author_avatar} 
                        alt={blog.author} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>By {blog.author}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-16">
        
        {/* Social Share (Top) */}
        <SocialShare url={shareUrl} title={blog.title} />

        {/* Content */}
        <div className="prose pblue-lg max-w-none pblue-headings:font-bold pblue-headings:text-gray-900 pblue-p:text-gray-700 pblue-a:text-blue-600 hover:pblue-a:text-blue-700 pblue-img:rounded-xl">
           <div dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br/>') }} />
        </div>

        {/* Author Bio Section */}
        {blog.author && blog.author_bio && (
          <div className="mt-12 p-8 bg-gray-50 rounded-2xl flex flex-col md:flex-row gap-6 items-start border border-gray-100">
            <div className="shrink-0">
              {blog.author_avatar ? (
                <div className="w-20 h-20 rounded-full overflow-hidden relative border-4 border-white shadow-sm">
                  <Image 
                    src={blog.author_avatar} 
                    alt={blog.author} 
                    fill 
                    className="object-cover" 
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-white shadow-sm">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">About {blog.author}</h3>
              <p className="text-gray-600 leading-relaxed">{blog.author_bio}</p>
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-100">
            {/* <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Photo Gallery</h2> */}
            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xl">
               <ImageSlider images={galleryImages} alt={`${blog.title} gallery`} className="h-full w-full" />
            </div>
          </div>
        )}

      </article>
    </div>
  );
}
