import Link from 'next/link';
import { UserButton } from "@clerk/nextjs";
import { auth } from '@clerk/nextjs/server';
import { ArrowRight, Compass, Sparkles, MapPin, Calendar, Camera, Wallet, CloudSun, Share2, BrainCircuit } from 'lucide-react';
import Image from 'next/image';

export default async function Home() {
  const { userId } = await auth();

  const features = [
    {
      title: "Smart Itinerary Feed",
      description: "Experience a seamless, auto-scrolling itinerary feed. As you read through your days, the interactive map automatically updates routes and locations without a single click.",
      icon: <Compass className="w-7 h-7 text-indigo-400" />,
      colorClass: "bg-indigo-500/20 border-indigo-500/30",
      image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2948&auto=format&fit=crop",
      alt: "Interactive travel map",
      bullets: ["Intelligent ScrollSpy tracking", "High-res Esri satellite tiles", "Route-flow directional arrows"]
    },
    {
      title: "AI Budget Predictor",
      description: "Don't guess your costs. Our artificial intelligence analyzes your destination, travel style, and duration to predict your exact budget down to the dollar.",
      icon: <BrainCircuit className="w-7 h-7 text-[#1CFEBA]" />,
      colorClass: "bg-[#1CFEBA]/20 border-[#1CFEBA]/30",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2911&auto=format&fit=crop",
      alt: "Calculations and budgeting",
      bullets: ["Machine learning estimations", "One-time API optimization", "Visual expense breakdowns"]
    },
    {
      title: "Meteorological Sync",
      description: "Never pack blindly. Live 5-day weather forecasting integrated directly into your dashboard based on your exact destination coordinates.",
      icon: <CloudSun className="w-7 h-7 text-amber-400" />,
      colorClass: "bg-amber-500/20 border-amber-500/30",
      image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=2865&auto=format&fit=crop",
      alt: "Atmospheric weather view",
      bullets: ["Live API integration", "Hyper-local forecasts", "Condition alerts"]
    },
    {
      title: "Preserve Memories",
      description: "TripWise isn't just for planning. Upload tickets, inspiration photos, and your favorite memories to the integrated gallery to create a beautiful archive of your journey.",
      icon: <Camera className="w-7 h-7 text-pink-400" />,
      colorClass: "bg-pink-500/20 border-pink-500/30",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2842&auto=format&fit=crop",
      alt: "Vintage camera on a map",
      bullets: ["Secure cloud storage", "High-res photo galleries", "Document attachment"]
    },
    {
      title: "Instant Distribution",
      description: "Generate a beautiful, read-only public blueprint of your trip with one click to share with friends, family, or travel companions.",
      icon: <Share2 className="w-7 h-7 text-blue-400" />,
      colorClass: "bg-blue-500/20 border-blue-500/30",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2940&auto=format&fit=crop",
      alt: "Friends sharing moments",
      bullets: ["One-click public links", "Read-only synchronized views", "Mobile-optimized presentation"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1E] text-gray-200 overflow-x-hidden selection:bg-[#1CFEBA] selection:text-black">
      
      {/* Consistent Navbar matching Dashboard */}
      <header className="w-full z-50 sticky top-0 bg-[#1A1A1E]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-[#1CFEBA]/10 group-hover:border-[#1CFEBA]/30 transition-all duration-300 backdrop-blur-md shadow-lg">
                  <img src="/logo.svg" alt="TripWise Logo" className="h-6 w-6 rounded-md shadow-sm" />
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
              {userId ? (
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10 border border-white/10 rounded-xl shadow-lg" } }} />
              ) : (
                <>
                  <Link href="/sign-in" className="text-sm font-semibold text-gray-300 hover:text-white hidden md:block">Log in</Link>
                  <Link href="/sign-up" className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Human-Centered Hero Section with Real Photography */}
        <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2946&auto=format&fit=crop" 
              alt="Beautiful beach travel destination" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1E] via-[#1A1A1E]/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 text-center mt-20">
            <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-heading font-black text-white tracking-tighter leading-[1.1] mb-8 drop-shadow-2xl">
              Travel planning,<br />reimagined.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-medium mb-12 drop-shadow-lg leading-relaxed">
              Ditch the spreadsheets. Experience perfectly crafted itineraries, smart budgets, and beautiful memories in one elegant platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={userId ? "/dashboard/trips/new" : "/sign-up"} className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors shadow-xl flex items-center">
                Start Planning <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Feature Sections */}
        <section className="bg-[#1A1A1E]">
          <div className="max-w-[1400px] mx-auto px-6 py-24 lg:py-32 space-y-32">
            {features.map((feat, idx) => (
              <div key={idx} className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}>
                <div className="flex-1 space-y-8">
                  <div className={`w-14 h-14 ${feat.colorClass} border rounded-2xl flex items-center justify-center`}>
                    {feat.icon}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tight">{feat.title}</h2>
                  <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                    {feat.description}
                  </p>
                  <ul className="space-y-4 pt-4 text-gray-300 font-medium">
                    {feat.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-center">
                        <Sparkles className="w-5 h-5 mr-3 text-gray-500" /> {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full relative">
                  <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative group bg-black/20">
                    <img 
                      src={feat.image} 
                      alt={feat.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
