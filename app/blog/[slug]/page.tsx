import { getSupabaseClient } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import BlogPostClient, { BlogPost } from "./BlogPostClient";

export const dynamic = "force-dynamic";

async function getBlog(slug: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  if (!blog) return {};
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://br31rentals.in';
  const postUrl = `${siteUrl}/blog/${params.slug}`;

  return {
    title: `${blog.seo_title || blog.title} | BR31 Rentals Blog`,
    description: blog.seo_description || blog.excerpt,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      url: postUrl,
      siteName: 'BR31 Rentals',
      images: blog.cover_image ? [
        {
          url: blog.cover_image,
          width: 1200,
          height: 630,
          alt: blog.title,
        }
      ] : [],
      type: 'article',
      authors: blog.author ? [blog.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt,
      images: blog.cover_image ? [blog.cover_image] : [],
    }
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = await getBlog(params.slug);

  if (!blog) {
    notFound();
  }

  return <BlogPostClient initialBlog={blog as BlogPost} />;
}
