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
  title: "ovi - Free Online Teleprompter for Indian Creators",
  description:
    "A smooth India-first online teleprompter for creators, teachers, and speakers to prompt, rehearse, test pace, and record in English, Hindi, and Marathi.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
