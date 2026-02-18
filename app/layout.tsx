import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Harmony — Admin Songbook",
  description: "Admin-only songbook (ChordPro)",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("harmony-theme")?.value ?? "dark";
  return (
    <html lang="fr" className={theme === "dark" ? "dark" : ""} suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-50 dark:bg-[#030712]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
