import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import RegisterSw from "@/components/RegisterSw";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#a3e635",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "Circlo",
  description: "Bagikan lokasi realtime dengan teman",
  applicationName: "Circlo",
  appleWebApp: { capable: true, title: "Circlo", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${jakarta.className} antialiased`}>{children}</body>
    </html>
  );
}
