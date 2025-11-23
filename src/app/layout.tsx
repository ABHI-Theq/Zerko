import { Analytics } from "@vercel/analytics/react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { InterviewProvider } from "@/context/InterviewContext";
import { Suspense } from "react";
import { InterviewAllProvider } from "@/context/InterviewAllContext";
import {SpeedInsights} from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: "%s | Zerko",
    default: "Zerko - Modern Web Application",
  },
  description: "A modern web application built with Next.js",
  metadataBase: new URL("https://your-domain.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <Suspense>
          <div className="min-h-screen w-full bg-[#e2e2e2] relative text-gray-800">
            <div
              className="absolute inset-0 z-0 pointer-events-none grid-bg"
             
            />
            <SessionProvider>
              <InterviewAllProvider>
                <InterviewProvider>
                  <main className="z-10">
                  {children}
                  </main>
                  <Toaster position="bottom-right" />
                </InterviewProvider>
              </InterviewAllProvider>
            </SessionProvider>
          </div>
        </Suspense>
        <SpeedInsights/>

      </body>
    </html>
  );
}
