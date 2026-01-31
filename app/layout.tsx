import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ClientLayout from "@/components/layout/ClientLayout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hotelsakura.in"),
  title: {
    default: "BR31 PROERTYMANAGEMENT SYSTEM",
    template: "%s | BR31 PROERTYMANAGEMENT SYSTEM",
  },
  description:
    "Experience luxury with BR31 PROERTYMANAGEMENT SYSTEM. Book your stay for an unforgettable experience.",
  keywords: [
    "BR31 PROERTYMANAGEMENT SYSTEM",
    "Best Hotels in Gangtok",
    "Best Hotels in Sikkim",
    "Luxury Hotels Gangtok",
    "Hospitality Service Sikkim",
    "Hotel Booking Gangtok",
    "Accommodation in Gangtok",
    "Rooms in Sikkim",
  ],
  authors: [{ name: "BR31 PROERTYMANAGEMENT SYSTEM" }],
  creator: "BR31 PROERTYMANAGEMENT SYSTEM",
  publisher: "BR31 PROERTYMANAGEMENT SYSTEM",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg", // Assuming SVG works or we'll fallback
  },
  openGraph: {
    title: "BR31 PROERTYMANAGEMENT SYSTEM",
    description:
      "Discover the best hospitality with BR31 PROERTYMANAGEMENT SYSTEM.",
    url: "https://hotelsakura.in",
    siteName: "BR31 PROERTYMANAGEMENT SYSTEM",
    images: [
      {
        url: "/opengraph-image", // Next.js will resolve this if we use opengraph-image.tsx
        width: 1200,
        height: 630,
        alt: "BR31 PROERTYMANAGEMENT SYSTEM",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BR31 PROERTYMANAGEMENT SYSTEM",
    description:
      "Stay at BR31 PROERTYMANAGEMENT SYSTEM for the best rooms and hospitality.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
