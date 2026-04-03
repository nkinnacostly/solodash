import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paidly",
  description: "Admin tools for freelancers",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0f0f0f] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
