"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Sparkles, Loader2, ArrowRight, MapPin, Search, Compass } from "lucide-react";
import Link from "next/link";
import { addDays, format } from "date-fns";

export default function RecommendationsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [creatingIdx, setCreatingIdx] = useState(null);

  const handleRecommend = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await api.post('/api/assistant/recommend', { prompt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (typeof res.data === 'object') {
        setRecommendations(res.data);
      } else {
        let rawContent = res.data;
        const startIdx = rawContent.indexOf('[');
        const endIdx = rawContent.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
          rawContent = rawContent.substring(startIdx, endIdx + 1);
        }
        setRecommendations(JSON.parse(rawContent));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async (rec, index) => {
    setCreatingIdx(index);
    try {
      const token = await getToken();
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30); 
      const endDate = addDays(startDate, rec.suggested_duration_days || 5);
      
      const tripData = {
        destination: rec.destination,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        budget: rec.estimated_budget,
        travelers: 2,
        travelStyle: "Discovery"
      };

      const res = await api.post('/api/trips', tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      router.push(`/dashboard/trips/${res.data.id}?autoGenerate=true`);
    } catch (err) {
      console.error(err);
      alert("Failed to create trip.");
      setCreatingIdx(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center space-y-6 relative z-10 pt-8">
        <div className="inline-flex items-center justify-center p-5 bg-white/5 border border-white/10 text-indigo-400 rounded-3xl mb-4 shadow-2xl backdrop-blur-md">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter text-white">Curated by AI</h1>
        <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg">
          Not sure where to go? Describe your perfect escape, and our intelligence engine will surface the ideal destinations.
        </p>
      </div>

      <form onSubmit={handleRecommend} className="relative max-w-4xl mx-auto z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="glass-panel p-2 rounded-3xl flex items-center group focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all duration-300 flex-1">
            <div className="pl-6 pr-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'I want a 5-day budget trip in Europe with beaches and nightlife'"
              className="flex-1 bg-transparent text-white border-none py-6 focus:ring-0 outline-none text-lg placeholder:text-gray-600"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-white hover:bg-gray-200 text-black px-10 py-6 rounded-3xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Discover"}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-center font-semibold max-w-2xl mx-auto backdrop-blur-md">
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-8 relative z-10 mt-20">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Compass className="w-6 h-6 text-indigo-400" />
            <h2 className="text-3xl font-heading font-black text-white">Intelligent Matches</h2>
          </div>
          
          <div className="grid gap-6">
            {recommendations.map((rec, i) => (
              <div key={i} className="glass-panel glass-panel-hover rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center group">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-4xl font-heading font-black text-white">{rec.destination}</h3>
                  </div>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-3xl">{rec.short_explanation}</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-black/20 border border-white/5 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center">
                      <span className="text-indigo-400 mr-3 text-xs uppercase tracking-widest">Season</span> {rec.best_season}
                    </div>
                    <div className="bg-black/20 border border-white/5 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center">
                      <span className="text-[#1CFEBA] mr-3 text-xs uppercase tracking-widest">Budget</span> {rec.estimated_budget}
                    </div>
                    <div className="bg-black/20 border border-white/5 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center">
                      <span className="text-[#FF3366] mr-3 text-xs uppercase tracking-widest">Duration</span> {rec.suggested_duration_days} days
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-auto shrink-0 mt-6 md:mt-0">
                  <button
                    onClick={() => handleCreateTrip(rec, i)}
                    disabled={creatingIdx !== null}
                    className="w-full md:w-auto bg-white hover:bg-gray-200 text-black font-bold px-8 py-5 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shadow-xl"
                  >
                    {creatingIdx === i ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : null}
                    {creatingIdx === i ? "Synthesizing..." : "Architect Trip"} <ArrowRight className="w-5 h-5 ml-3 opacity-70" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
