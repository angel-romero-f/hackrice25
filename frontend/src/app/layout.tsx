import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ChatBot from "../components/ChatBot";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Care Compass - Find Affordable Healthcare Near You",
  description: "Connect with free and low-cost clinics in your area. No insurance required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        {children}
        {/* Persistent ChatBot floating bubble */}
        <ChatBot />
      </body>
    </html>
  );
}
