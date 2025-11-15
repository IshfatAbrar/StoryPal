import { Geist_Mono, DynaPuff, Shadows_Into_Light } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";

const dynaPuff = DynaPuff({
  variable: "--font-dyna-puff",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shadows = Shadows_Into_Light({
  variable: "--font-shadows-into-light",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Story Pal",
  description: "A friendly place to begin your story.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${shadows.className} ${shadows.variable} antialiased`} suppressHydrationWarning>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
