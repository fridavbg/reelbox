import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reelbox",
  description: "Tag, filter and find the reels you save.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
