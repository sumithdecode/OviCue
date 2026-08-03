import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptSrc =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC ?? "https://cloud.umami.is/script.js";

export const metadata: Metadata = {
  metadataBase: new URL("https://promptflow-teleprompter.csumeety.chatgpt.site"),
  title: "OviCue - Free Online Teleprompter for Indian Creators",
  description:
    "Paste your script and read smoothly on camera. OviCue is a free online teleprompter for Indian creators, teachers, students, and speakers.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OviCue - Free Online Teleprompter",
    description:
      "A smooth browser teleprompter with pace testing, mirror mode, camera preview, and local scripts.",
    url: "/",
    siteName: "OviCue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OviCue - Free Online Teleprompter",
    description:
      "Paste your script, choose a speed, and read smoothly while you record.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2f8dc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {umamiWebsiteId ? (
          <Script
            src={umamiScriptSrc}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
