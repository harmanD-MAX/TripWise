import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, Compass } from "lucide-react";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#1A1A1E] text-gray-200 flex flex-col font-sans selection:bg-[#1CFEBA] selection:text-black">
      <header className="w-full z-40 sticky top-0 bg-[#1A1A1E]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-[#1CFEBA]/10 group-hover:border-[#1CFEBA]/30 transition-all duration-300 backdrop-blur-md shadow-lg">
                  <Compass className="h-5 w-5 text-white group-hover:text-[#1CFEBA] transition-colors" />
                </div>
                <span className="font-heading font-black text-2xl tracking-tighter text-white">TripWise</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6 mt-1 font-semibold text-sm">
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">My Trips</Link>
                <div className="h-4 w-px bg-white/10"></div>
                <Link href="/dashboard/recommendations" className="text-[#1CFEBA]/80 hover:text-[#1CFEBA] transition-colors flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5" /> AI Recommendations
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-6">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10 border border-white/10 rounded-xl shadow-lg" } }} />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        {children}
      </main>
    </div>
  );
}
