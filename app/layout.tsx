import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.scss";

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
});

export const metadata: Metadata = {
  title: "Reelbox",
  description: "Tag, filter and find the reels you save.",
};

// No maximum scale, so people can always zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body>{children}</body>
    </html>
  );
}
