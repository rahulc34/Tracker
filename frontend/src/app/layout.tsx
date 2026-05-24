import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Pulse — Plan. Learn. Grow.",
  description: "Personal learning and skill tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1120",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
