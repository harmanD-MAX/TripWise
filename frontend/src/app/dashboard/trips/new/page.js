"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/axios";
import { Sparkles, Loader2, MapPin } from "lucide-react";
import SearchBar from "@/components/SearchBar";

export default function NewTripPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "Moderate",
    travelers: 2,
    travelStyle: "Adventure"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await api.post('/api/trips', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newTrip = response.data;
      router.push(`/dashboard/trips/${newTrip.id}?autoGenerate=true`);
    } catch (err) {
      console.error(err);
      setError("Failed to create trip. Please ensure the backend is running.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-[#1CFEBA]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mb-12 text-center relative z-10">
        <h1 className="text-5xl font-heading font-black text-white mb-4 tracking-tighter">Architect Your Journey</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">Provide the foundational parameters. Our intelligence engine will synthesize the perfect itinerary.</p>
      </div>

      <div className="glass-panel rounded-[2rem] p-8 sm:p-12 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-3 animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Destination Canvas</label>
              {formData.destination ? (
                <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-[#1CFEBA]/30 bg-[#1CFEBA]/5 shadow-[0_0_15px_rgba(28,254,186,0.1)]">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-[#1CFEBA] mr-3" />
                    <span className="text-white font-semibold text-lg">{formData.destination}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, destination: "" }))}
                    className="text-gray-400 hover:text-white transition-colors text-sm font-semibold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
                  >
                    Modify
                  </button>
                </div>
              ) : (
                <div className="relative z-50">
                  <SearchBar 
                    onSelectLocation={(loc) => setFormData(prev => ({ ...prev, destination: loc.name }))} 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Embarkation</label>
                <input 
                  required
                  type="date" 
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-black/20 text-white focus:outline-none focus:border-[#1CFEBA]/50 focus:bg-white/5 transition-all outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Return</label>
                <input 
                  required
                  type="date" 
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-black/20 text-white focus:outline-none focus:border-[#1CFEBA]/50 focus:bg-white/5 transition-all outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Resource Allocation</label>
                <div className="relative">
                  <select 
                    name="budget" 
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-black/20 text-white focus:outline-none focus:border-[#1CFEBA]/50 focus:bg-white/5 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="Budget" className="bg-[#1A1A1E]">Budget ($)</option>
                    <option value="Moderate" className="bg-[#1A1A1E]">Moderate ($$)</option>
                    <option value="Luxury" className="bg-[#1A1A1E]">Luxury ($$$)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Party Size</label>
                <input 
                  required
                  type="number" 
                  name="travelers"
                  min="1"
                  max="20"
                  value={formData.travelers}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-black/20 text-white focus:outline-none focus:border-[#1CFEBA]/50 focus:bg-white/5 transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Modus Operandi</label>
                <div className="relative">
                  <select 
                    name="travelStyle" 
                    value={formData.travelStyle}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-black/20 text-white focus:outline-none focus:border-[#1CFEBA]/50 focus:bg-white/5 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="Adventure" className="bg-[#1A1A1E]">Adventure</option>
                    <option value="Relaxation" className="bg-[#1A1A1E]">Relaxation</option>
                    <option value="Culture" className="bg-[#1A1A1E]">Culture</option>
                    <option value="Foodie" className="bg-[#1A1A1E]">Foodie</option>
                    <option value="Nightlife" className="bg-[#1A1A1E]">Nightlife</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-5 px-8 rounded-2xl text-black font-bold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center">
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Synthesizing Itinerary...</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-3" /> Initialize Generation</>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
