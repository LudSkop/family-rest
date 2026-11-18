import type { Metadata } from "next";
import { Suspense } from "react";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/Header";
import TanStackProvider from "@/components/TanStackProvider/TanStackProvider";
import AuthModals from "@/components/AuthModals/AuthModals";
import AuthErrorHandler from "@/components/AuthErrorHandler/AuthErrorHandler";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import { PreOrderProvider } from "@/components/PreOrder/PreOrderProvider";
import { CartProvider } from "@/components/PreOrder/CartProvider";
import PreOrderStrip from "@/components/PreOrderStrip/PreOrderStrip";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Лише для кнопки "Sign in with Google" — так вимагають гайдлайни Google
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const SITE_TITLE = "Family Rest | Food for the Whole Family";
const SITE_DESCRIPTION =
  "Discover delicious meals for the whole family. Choose your favorite food and enjoy a great dining experience together.";

export const metadata: Metadata = {
  // Месенджерам потрібна повна адреса картинки прев'ю
  metadataBase: new URL("https://family-rest.vercel.app"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // Прев'ю посилання (Telegram, Viber, Facebook…).
  // Картинку бере з app/opengraph-image.jpg (1200×630) автоматично
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Family Rest",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${roboto.variable}`}>
      <body>
        <TanStackProvider>
          <ToastProvider>
            <PreOrderProvider>
              <CartProvider>
                <Header />
                <PreOrderStrip />
                <main>{children}</main>
                <Suspense fallback={null}>
                  <AuthModals />
                  <AuthErrorHandler />
                </Suspense>
              </CartProvider>
            </PreOrderProvider>
          </ToastProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
