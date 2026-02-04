import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Clarity from "@/components/Clarity";

const sora = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PIXORA AI",
  description:
    "Generate stunning images using PIXORA AI. Powered by SDXL, Flux Schnell, and Lucid Origin models.",
  metadataBase: new URL("https://img-gen7.netlify.app/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {process.env.NODE_ENV === "production" ? <Clarity /> : null}
      <body className={sora.className}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
