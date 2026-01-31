"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight, ImageIcon } from "lucide-react";
import ImageSlider from "@/components/ui/ImageSlider";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { BlogItem } from "./page";

export default function BlogClient({ initialItems }: { initialItems: BlogItem[] }) {
  const [blogs, setBlogs] = useState<BlogItem[]>(initialItems);

  const getFeaturedImages = (blog: BlogItem) => {
    const images: string[] = [];
    if (blog.cover_image) images.push(blog.cover_image as string);
    if (blog.gallery_images && Array.isArray(blog.gallery_images)) {
      images.push(...blog.gallery_images);
    }
    return images;
  };

  useEffect(() => {
    const supabase = getSupabaseClient();

    const fetchLatestBlogs = async () => {
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setBlogs((data || []) as BlogItem[]);
    };

    fetchLatestBlogs();

    const channel = supabase
      .channel("realtime-blogs-client")
      .on("postgres_changes", { event: "*", schema: "public", table: "blogs" }, () => {
        fetchLatestBlogs();
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchLatestBlogs();
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const featuredBlog = blogs[0];
  const remainingBlogs = blogs.slice(1);
  const featuredImages = featuredBlog ? getFeaturedImages(featuredBlog) : [];
  const showFeaturedSlider = featuredImages.length > 1;
  const singleImage = featuredImages.length > 0 ? featuredImages[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gray-900 text-white py-5 px-2 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=60')] bg-cover bg-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <div className="relative container mx-auto text-center max-w-2xl z-10">
          <h1 className="text-3xl md:text-2xl font-bold mb-6 tracking-tight">
            Sakura <span className="text-primary">Journal</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-xl mx-auto">
            Explore our latest stories, travel guides, and behind-the-scenes moments from Hotel Sakura.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 -mt-10 relative z-20">
        {blogs.length > 0 ? (
          <>
            <div className="mb-16">
              <div className="group relative block bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto overflow-hidden bg-gray-200">
                    {showFeaturedSlider ? (
                      <div className="h-full w-full">
                        <ImageSlider images={featuredImages} alt={featuredBlog.title} className="h-full w-full" />
                      </div>
                    ) : (
                      <Link href={`/blog/${featuredBlog.slug}`} className="block h-full w-full relative">
                        {singleImage ? (
                          <Image src={singleImage} alt={featuredBlog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">📰</span>
                          </div>
                        )}
                      </Link>
                    )}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Featured
                      </span>
                      {!featuredBlog.is_published && (
                        <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <Link href={`/blog/${featuredBlog.slug}`} className="block">
                      <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(featuredBlog.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                        {featuredBlog.author && (
                          <div className="flex items-center">
                            {featuredBlog.author_avatar ? (
                              <div className="w-5 h-5 rounded-full overflow-hidden relative mr-2">
                                <Image src={featuredBlog.author_avatar} alt={featuredBlog.author} fill className="object-cover" />
                              </div>
                            ) : (
                              <User className="w-4 h-4 mr-2" />
                            )}
                            {featuredBlog.author}
                          </div>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">{featuredBlog.title}</h2>
                      <p className="text-gray-600 mb-6 line-clamp-3 text-lg">{featuredBlog.excerpt}</p>
                      <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300">
                        Read Article <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {remainingBlogs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {remainingBlogs.map((blog) => {
                  const galleryImages = Array.isArray(blog.gallery_images) ? blog.gallery_images : [];
                  const hasGallery = galleryImages.length > 0;
                  const galleryCount = galleryImages.length;
                  const displayImage = blog.cover_image || (hasGallery ? galleryImages[0] : null);
                  return (
                    <Link
                      href={`/blog/${blog.slug}`}
                      key={blog.id}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden border border-gray-100"
                    >
                      <div className="relative aspect-[3/2] overflow-hidden bg-gray-200">
                        {displayImage ? (
                          <Image src={displayImage} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">📰</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        {!blog.is_published && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">Draft</div>
                        )}
                        {hasGallery && (
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm z-10">
                            <ImageIcon className="w-3 h-3" />
                            <span>+{galleryCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex items-center text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2 space-x-2">
                          {blog.author && <span className="text-primary">{blog.author}</span>}
                          <span>•</span>
                          <span>{new Date(blog.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{blog.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 flex-grow">{blog.excerpt}</p>
                        <div className="pt-3 border-t border-gray-50 flex justify-between items-center mt-auto">
                          <span className="text-xs font-medium text-primary flex items-center group-hover:underline">
                            Read <ArrowRight className="w-3 h-3 ml-1" />
                          </span>
                          {blog.author && blog.author_avatar && (
                            <div className="w-6 h-6 rounded-full overflow-hidden relative border border-gray-100" title={blog.author}>
                              <Image src={blog.author_avatar} alt={blog.author} fill className="object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories yet</h3>
            <p className="text-gray-500">Check back soon for updates from Hotel Sakura.</p>
          </div>
        )}
      </div>
    </div>
  );
}
