"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X, Plus, User } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";
import Link from "next/link";

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  gallery_images: string[];
  author: string;
  author_avatar: string;
  author_bio: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
}

export default function BlogEditorPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const router = useRouter();
  const { addToast } = useToast();
  const supabase = getSupabaseClient();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    gallery_images: [],
    author: "",
    author_avatar: "",
    author_bio: "",
    tags: "",
    seo_title: "",
    seo_description: "",
    is_published: false,
  });

  useEffect(() => {
    if (!isNew) {
      fetchBlog(params.id);
    }
  }, [params.id]);

  const fetchBlog = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      addToast("Failed to fetch blog", "error");
      router.push("/admin/blogs");
    } else {
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content,
        cover_image: data.cover_image || "",
        gallery_images: data.gallery_images || [],
        author: data.author || "",
        author_avatar: data.author_avatar || "",
        author_bio: data.author_bio || "",
        tags: data.tags ? data.tags.join(", ") : "",
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        is_published: data.is_published,
      });
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: isNew ? generateSlug(title) : prev.slug // Only auto-update slug if new
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery' | 'avatar' = 'cover') => {
    if (!e.target.files || !e.target.files[0]) return;
    
    if (type === 'gallery') setGalleryUploading(true);
    else setUploading(true);

    const file = e.target.files[0];
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("folder", "blogs");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      
      const data = await res.json();
      if (data.ok) {
        if (type === 'gallery') {
            setFormData(prev => ({ 
                ...prev, 
                gallery_images: [...prev.gallery_images, data.url] 
            }));
        } else if (type === 'avatar') {
            setFormData(prev => ({ ...prev, author_avatar: data.url }));
        } else {
            setFormData(prev => ({ ...prev, cover_image: data.url }));
        }
        addToast("Image uploaded successfully", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      addToast(error.message || "Upload failed", "error");
    } finally {
      if (type === 'gallery') setGalleryUploading(false);
      else setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
        ...prev,
        gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
    };

    if (isNew) {
      const { error } = await supabase.from("blogs").insert([dataToSave]);
      if (error) {
        addToast("Failed to create blog", "error");
      } else {
        addToast("Blog created successfully", "success");
        router.push("/admin/blogs");
      }
    } else {
      const { error } = await supabase
        .from("blogs")
        .update(dataToSave)
        .eq("id", params.id);
      if (error) {
        addToast("Failed to update blog", "error");
      } else {
        addToast("Blog updated successfully", "success");
        router.push("/admin/blogs");
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blogs" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNew ? "Create New Blog" : "Edit Blog"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Content</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Enter blog title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-sm"
                  placeholder="url-friendly-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Short summary for preview cards..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown/HTML)</label>
                <textarea
                  rows={15}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-sm"
                  placeholder="Write your blog content here..."
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
               <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Gallery Images</h2>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {galleryUploading ? "Uploading..." : "Add Image"}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'gallery')}
                            disabled={galleryUploading}
                        />
                    </label>
               </div>

               {formData.gallery_images.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-100 rounded-lg">
                        No gallery images added yet.
                    </div>
               ) : (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.gallery_images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-100">
                                <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeGalleryImage(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                   </div>
               )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Title for search engines (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea
                  rows={2}
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Description for search engines (optional)"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Publishing</h2>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Published</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formData.is_published ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData.is_published ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Blog</>}
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cover Image</h2>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-primary/50 transition-colors relative group">
                {formData.cover_image ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image 
                      src={formData.cover_image} 
                      alt="Cover" 
                      fill 
                      className="object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image: "" })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block p-4">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">
                      {uploading ? "Uploading..." : "Click to upload image"}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, 'cover')}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tags</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative border border-gray-200">
                    {formData.author_avatar ? (
                      <Image 
                        src={formData.author_avatar} 
                        alt="Author" 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    {uploading ? "Uploading..." : "Change Avatar"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Bio</label>
                <textarea
                  rows={3}
                  value={formData.author_bio}
                  onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Short biography about the author..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="seo, travel, tips"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
