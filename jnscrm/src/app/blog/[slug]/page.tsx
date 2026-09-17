import React, { cache as reactCache } from 'react';
import pool from '@/lib/db';
import { notFound } from 'next/navigation';
import SingleBlogLayout from '@/components/SingleBlogLayout';
import { Metadata } from 'next';

export const revalidate = 60;

// 🚀 Performance Optimization: React cache to prevent double database queries
const getBlog = reactCache(async (slug: string) => {
  const [rows]: any = await pool.query('SELECT * FROM blogs WHERE slug = ?', [slug]);
  return rows[0] || null;
});

// 🚀 Approach 2: Dynamic Open Graph Metadata for Social Media Previews
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = await getBlog(resolvedParams.slug);

  if (!blog) {
    return { title: 'Blog Not Found' };
  }

  // HTML tags remove karke clean description generate karna
  const cleanDescription = blog.content 
    ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' 
    : '';

  return {
    title: blog.title,
    description: cleanDescription,
    openGraph: {
      title: blog.title,
      description: cleanDescription,
      url: `https://yourdomain.com/blog/${blog.slug}`, // Apni real domain yahan update kar dein
      images: [
        {
          url: blog.cover_image || 'https://yourdomain.com/default-banner.jpg',
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: cleanDescription,
      images: [blog.cover_image || 'https://yourdomain.com/default-banner.jpg'],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const blog = await getBlog(resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  return <SingleBlogLayout blog={blog} />;
}