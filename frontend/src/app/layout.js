import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "TripWise - AI Travel Planner",
  description: "Plan your perfect trip with AI",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${outfit.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans bg-[#1A1A1E] text-gray-200" suppressHydrationWarning>
          <div className="flex-1 flex flex-col relative z-10">
            {children}
          </div>
          {/* Global Footer */}
          <footer className="w-full relative z-50 border-t border-white/5 bg-[#141517]/80 backdrop-blur-xl py-8 px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6 mt-auto">
            <div className="font-heading font-black text-2xl tracking-tighter text-white">TripWise</div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
              © {new Date().getFullYear()} TripWise. Built for travelers.
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
