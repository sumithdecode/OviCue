import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptSrc =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC ?? "https://cloud.umami.is/script.js";

export const metadata: Metadata = {
  metadataBase: new URL("https://promptflow-teleprompter.csumeety.chatgpt.site"),
  title: "OviCue - Pace-Aware Teleprompter for Indian Creators",
  description:
    "Paste your script, find your speaking speed, and read smoothly on camera. OviCue is a free pace-aware teleprompter for creators, teachers, students, and speakers.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OviCue - Pace-Aware Teleprompter",
    description:
      "A smooth browser teleprompter with speech speed testing, mirror mode, camera preview, recording, and local scripts.",
    url: "/",
    siteName: "OviCue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OviCue - Pace-Aware Teleprompter",
    description:
      "Find your speaking speed, paste your script, and read smoothly while you record.",
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
  themeColor: "black",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=IBM+Plex+Mono:wght@500&family=Mukta:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
