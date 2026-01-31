"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, BookOpen, Eye, EyeOff, ImageIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import Image from "next/image";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  is_published: boolean;
  cover_image: string | null;
  gallery_images: string[] | null;
  created_at: string;
  author: string | null;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const supabase = getSupabaseClient();

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        addToast(`Failed to fetch blogs: ${error.message}`, "error");
      } else {
        setBlogs(data as Blog[]);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) {
      addToast("Failed to delete blog", "error");
    } else {
      addToast("Blog deleted successfully", "success");
      setBlogs(blogs.filter(b => b.id !== id));
    }
  };

  const togglePublish = async (blog: Blog) => {
    const { error } = await supabase
      .from("blogs")
      .update({ is_published: !blog.is_published })
      .eq("id", blog.id);
      
    if (error) {
      addToast("Failed to update status", "error");
    } else {
      addToast(`Blog ${!blog.is_published ? "published" : "unpublished"}`, "success");
      setBlogs(blogs.map(b => b.id === blog.id ? { ...b, is_published: !b.is_published } : b));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Blogs
        </h1>
        <Link 
          href="/admin/blogs/new"
          className="bg-primary text-Black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Blog
        </Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="mt-2 text-sm">
            Please make sure you have run the migration SQL in Supabase.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
           <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Cover</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Title</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No blogs found. Create your first blog post!
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden relative">
                        {blog.cover_image ? (
                          <Image 
                            src={blog.cover_image} 
                            alt={blog.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {blog.title}
                        {blog.gallery_images && blog.gallery_images.length > 0 && (
                          <div className="flex items-center text-blue-500" title={`${blog.gallery_images.length} gallery images`}>
                            <ImageIcon className="w-3 h-3" />
                            <span className="text-[10px] ml-0.5">{blog.gallery_images.length}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{blog.excerpt}</div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => togglePublish(blog)}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          blog.is_published 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {blog.is_published ? (
                          <><Eye className="w-3 h-3" /> Published</>
                        ) : (
                          <><EyeOff className="w-3 h-3" /> Draft</>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/admin/blogs/${blog.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => deleteBlog(blog.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
