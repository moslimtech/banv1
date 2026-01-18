import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
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
    <html 
      lang="ar" 
      dir="rtl" 
      suppressHydrationWarning
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
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
        style={{ 
          fontFamily: "'Cairo', sans-serif",
          height: '100vh',
          overflowX: 'hidden',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          margin: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
        suppressHydrationWarning
      >
        {/* Header - Fixed at top */}
        <header style={{ flexShrink: 0 }}>
          <NavBar />
          <Breadcrumbs />
        </header>

        {/* Main Content - Flexible area */}
        <main 
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            width: '100%',
            minHeight: 0
          }}
        >
          {children}
        </main>

        {/* Bottom Navigation - Optional placeholder for future use */}
        {/* <footer style={{ flexShrink: 0 }}>
          Bottom Navigation placeholder
        </footer> */}

        {/* Sidebar - Fixed overlay */}
        <Suspense fallback={null}>
          <ConversationsSidebar />
        </Suspense>

        <Script
          src="https://cdn.jsdelivr.net/npm/sweetalert2@11"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
