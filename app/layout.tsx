import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Harmony",
  description: "Songbook ChordPro",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Harmony",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("harmony-theme")?.value ?? "dark";
  const accentColor = cookieStore.get("harmony-accent")?.value ?? "#FA7A5F";
  return (
    <html
      lang="fr"
      className={theme === "dark" ? "dark" : ""}
      style={{ ["--color-accent" as string]: accentColor }}
      suppressHydrationWarning
    >
      <body className={`${inter.className} ${lora.variable} bg-zinc-50 dark:bg-[#030712]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
