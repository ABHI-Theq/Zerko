import { Analytics } from "@vercel/analytics/react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { InterviewProvider } from "@/context/InterviewContext";
import { Suspense } from "react";
import { InterviewAllProvider } from "@/context/InterviewAllContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(75, 85, 99, 0.08) 20px, rgba(75, 85, 99, 0.08) 21px),
        repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(107, 114, 128, 0.06) 30px, rgba(107, 114, 128, 0.06) 31px),
        repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(55, 65, 81, 0.05) 40px, rgba(55, 65, 81, 0.05) 41px),
        repeating-linear-gradient(150deg, transparent, transparent 35px, rgba(31, 41, 55, 0.04) 35px, rgba(31, 41, 55, 0.04) 36px)
      `,
              }}
            />
            <SessionProvider>
              <InterviewAllProvider>
                <InterviewProvider>
                  <ErrorBoundary>{children}</ErrorBoundary>
                  <Toaster position="bottom-right" />
                </InterviewProvider>
              </InterviewAllProvider>
            </SessionProvider>
          </div>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
