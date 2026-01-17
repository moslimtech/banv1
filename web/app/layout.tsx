import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConversationsSidebar from "@/components/ConversationsSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "دليل المحلات والصيدليات",
  description: "دليل شامل للمحلات والصيدليات والأماكن التجارية والخدمات",
  icons: {
    icon: [
      { url: "/logo.webp", sizes: "any" },
      { url: "/logo.webp", type: "image/webp" },
    ],
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/webp" href="/logo.webp" />
        <link rel="shortcut icon" type="image/webp" href="/logo.webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: "'Cairo', sans-serif" }}
        suppressHydrationWarning
      >
        <NavBar />
        <Breadcrumbs />
        {children}
        <ConversationsSidebar />
        <Script
          src="https://cdn.jsdelivr.net/npm/sweetalert2@11"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
