import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import RootContent from "./RootContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Butik Irna - Moderan Online Butik | Fashion & Moda",
  description: "Otkrijte ekskluzivu kolekciju u Butik Irna. Kvalitetna odela, dodatke i stilske komade sa dostavom na kući.",
  keywords: ["butik", "moda", "online shop", "irna", "fashion"],
  icons: {
    icon: "/brataraLogo.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <CartProvider>
          <Header/>
          <main>
            <RootContent>
              {children}
            </RootContent>
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
