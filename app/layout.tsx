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

export const metadata: Metadata = {
  title: "Family Rest | Food for the Whole Family",
  description:
    "Discover delicious meals for the whole family. Choose your favorite food and enjoy a great dining experience together.",
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
              <Header />
              <PreOrderStrip />
              <main>{children}</main>
              <Suspense fallback={null}>
                <AuthModals />
                <AuthErrorHandler />
              </Suspense>
            </PreOrderProvider>
          </ToastProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
