import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bratara Shop - Moderan online butik",
  description: "Kupite bratarice online - visoke kvalitete po najboljim cijenama",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Header/>
        <main>{children}</main>
      </body>
    </html>
  );
}
