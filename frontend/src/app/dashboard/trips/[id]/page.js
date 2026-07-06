"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/axios";
import { ArrowLeft, MapPin, Calendar, Users, Wallet, Sparkles, Loader2, Clock, Map as MapIcon, Trash2, Share2, Check, Copy } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import BudgetPlanner from "@/components/BudgetPlanner";
import WeatherWidget from "@/components/WeatherWidget";
import MediaGallery from "@/components/MediaGallery";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

export default function TripDetailsPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [defaultCenter, setDefaultCenter] = useState([35.6764, 139.6500]);
  const [optimizingDayId, setOptimizingDayId] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isOptimizingTrip, setIsOptimizingTrip] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState(null);

  useEffect(() => {
    async function fetchTrip() {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await api.get(`/api/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setTrip(response.data);

        if (response.data.destination) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(response.data.destination)}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setDefaultCenter([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
            }
          } catch (e) {
            console.error("Geocoding failed", e);
          }
        }

        if (response.data.itineraryDays && response.data.itineraryDays.length > 0) {
          const uniqueDaysMap = new Map();
          response.data.itineraryDays.forEach(day => {
            const dNum = day.dayNumber || day.day_number;
            if (!uniqueDaysMap.has(dNum) || (day.activities?.length || 0) > (uniqueDaysMap.get(dNum).activities?.length || 0)) {
              uniqueDaysMap.set(dNum, day);
            }
          });
          const uniqueDays = Array.from(uniqueDaysMap.values())
            .sort((a, b) => (a.dayNumber || a.day_number) - (b.dayNumber || b.day_number));
          setItinerary(uniqueDays);
        } else {
          if (searchParams.get('autoGenerate') === 'true') {
            window.history.replaceState({}, '', `/dashboard/trips/${id}`);
            generateAIItinerary(response.data);
          }
        }
      } catch (err) {
        console.error("Error fetching trip:", err);
        setError("Failed to load trip details.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrip();
  }, [id, getToken, searchParams]);

  async function generateAIItinerary(tripData = trip) {
    setIsGenerating(true);
    try {
      const token = await getToken();
      const response = await api.post('/api/assistant/generate-itinerary', tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let parsedItinerary;
      try {
        let rawContent = response.data;
        const startIdx = rawContent.indexOf('[');
        const endIdx = rawContent.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
          rawContent = rawContent.substring(startIdx, endIdx + 1);
        }
        parsedItinerary = JSON.parse(rawContent);
        setItinerary(parsedItinerary);

        await api.put(`/api/trips/${id}/itinerary`, parsedItinerary, {
          headers: { Authorization: `Bearer ${token}` }
        });

      } catch (e) {
        console.error("Failed to parse or save AI response:", response.data, e);
        setError("AI generated an invalid format or save failed. Please try again.");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to generate itinerary. Ensure API keys are valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  if (error || !trip) {
    return <div className="p-6 rounded-2xl glass-panel border-red-500/20 text-red-400 font-semibold">{error || "Trip not found"}</div>;
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  const mapPlaces = itinerary ? itinerary.flatMap(day => day.activities || []).map((act, i) => {
    let coords = null;
    if (act.coordinates && typeof act.coordinates === 'string') {
      const parts = act.coordinates.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          coords = [lat, lng];
        }
      }
    }
    return {
      name: act.name,
      type: act.type,
      coordinates: coords
    };
  }) : [];

  const handleOptimizeDay = async (dayId) => {
    setOptimizingDayId(dayId);
    try {
      const token = await getToken();
      const response = await api.post(`/api/trips/${id}/days/${dayId}/optimize`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newItinerary = itinerary.map(d => d.id === dayId ? response.data : d);
      setItinerary(newItinerary);
      alert('Route optimized successfully! Activities have been reordered for the shortest path.');
    } catch (err) {
      console.error(err);
      alert('Failed to optimize route. Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setOptimizingDayId(null);
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      const token = await getToken();
      await api.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete trip');
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const token = await getToken();
      if (!trip.isPublic) {
        await api.put(`/api/trips/${id}/visibility`, { isPublic: true }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrip({ ...trip, isPublic: true });
      }
      const shareUrl = `${window.location.origin}/shared/trip/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to share trip');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const token = await getToken();
      const response = await api.post(`/api/trips/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push(`/dashboard/trips/${response.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to duplicate trip');
    }
  };

  const handleOptimizeTrip = async () => {
    setIsOptimizingTrip(true);
    try {
      const token = await getToken();
      const response = await api.post('/api/assistant/optimize', trip, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let rawContent = response.data;
      const startIdx = rawContent.indexOf('[');
      const endIdx = rawContent.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        rawContent = rawContent.substring(startIdx, endIdx + 1);
      }
      setOptimizationSuggestions(JSON.parse(rawContent));
    } catch (err) {
      console.error(err);
      alert('Failed to analyze itinerary. Try again.');
    } finally {
      setIsOptimizingTrip(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header Banner */}
      <div className="w-full rounded-[2rem] glass-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 opacity-50 pointer-events-none" />
        <div className="p-8 md:p-12 relative z-10 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-12">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10"
              >
                <Copy className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Duplicate</span>
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="inline-flex items-center text-sm font-semibold text-[#1CFEBA] hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10"
              >
                {isSharing ? <Loader2 className="h-4 w-4 md:mr-2 animate-spin" /> : isCopied ? <Check className="h-4 w-4 md:mr-2 text-green-400" /> : <Share2 className="h-4 w-4 md:mr-2" />}
                <span className="hidden md:inline">{isCopied ? "Link Copied" : "Share Blueprint"}</span>
              </button>
              <button
                onClick={handleDeleteTrip}
                className="inline-flex items-center text-sm font-semibold text-red-400 hover:text-white transition-colors bg-white/5 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-white/10"
              >
                <Trash2 className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Delete</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-5xl md:text-7xl font-heading font-black text-white mb-6 tracking-tighter">{trip.destination}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-300">
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                <Calendar className="h-4 w-4 text-gray-400" /> {format(startDate, 'MMM d, yyyy')} — {format(endDate, 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                <Users className="h-4 w-4 text-gray-400" /> {trip.travelers} Travelers
              </div>
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                <Wallet className="h-4 w-4 text-gray-400" /> {trip.budget}
              </div>
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl text-indigo-300">
                <Sparkles className="h-4 w-4" /> {trip.travelStyle}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Widget */}
      <WeatherWidget destination={trip.destination} />

      <div className="flex justify-end gap-4 mb-4">
        {!itinerary ? (
          <button
            onClick={() => generateAIItinerary()}
            disabled={isGenerating}
            className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold transition-all bg-white text-black hover:bg-gray-200 rounded-xl disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isGenerating ? <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Synthesizing...</> : <><Sparkles className="h-5 w-5 mr-3" /> Initialize Intelligence</>}
          </button>
        ) : (
          <button
            onClick={handleOptimizeTrip}
            disabled={isOptimizingTrip}
            className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold transition-all bg-[#1CFEBA] text-black hover:bg-[#15c592] rounded-xl disabled:opacity-70 shadow-[0_0_20px_rgba(28,254,186,0.2)]"
          >
            {isOptimizingTrip ? <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Analyzing vectors...</> : <><Sparkles className="h-5 w-5 mr-3" /> Global Optimization</>}
          </button>
        )}
      </div>

      {optimizationSuggestions && (
        <div className="mb-12 glass-panel border-indigo-500/30 p-8 rounded-[2rem] relative overflow-hidden">

          <div className="flex justify-between items-start mb-8 relative z-10">
            <h3 className="text-2xl font-heading font-black text-white flex items-center"><Sparkles className="h-6 w-6 mr-3 text-indigo-400" /> Intelligence Report</h3>
            <button onClick={() => setOptimizationSuggestions(null)} className="text-gray-400 hover:text-white text-sm bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Dismiss</button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 relative z-10">
            {optimizationSuggestions.map((sug, i) => (
              <div key={i} className="bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-indigo-400 font-bold text-sm tracking-wide uppercase">{sug.suggestion_type}</span>
                  <span className={`text-xs px-3 py-1 rounded-lg font-bold ${sug.impact === 'High' ? 'bg-[#FF3366]/20 text-[#FF3366]' : 'bg-[#1CFEBA]/20 text-[#1CFEBA]'}`}>{sug.impact} Impact</span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">{sug.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content - Itinerary */}
        <div className="lg:col-span-2 space-y-8">
          {!itinerary ? (
            <div className="p-20 rounded-[3rem] glass-panel text-center">
              <div className="mx-auto w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-xl">
                <Sparkles className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-3xl font-heading font-bold text-white mb-4">Awaiting Architecture</h3>
              <p className="text-gray-400 max-w-md mx-auto">Initialize our intelligence engine to construct your optimal timeline.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {itinerary.map((day, originalIdx) => {
                const displayDayNum = day.day_number || day.dayNumber || originalIdx + 1;
                day.computedDayNum = displayDayNum; 
                const isExpanded = selectedDayIndex === originalIdx;

                return (
                  <div key={originalIdx} className={`glass-panel rounded-[2rem] transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'hover:border-white/20'}`}>
                    <div
                      className="px-8 py-6 flex justify-between items-center cursor-pointer group"
                      onClick={() => setSelectedDayIndex(isExpanded ? null : originalIdx)}
                    >
                      <div>
                        <h3 className="text-2xl font-heading font-black text-white group-hover:text-indigo-400 transition-colors">Day {displayDayNum}</h3>
                        {day.date && <p className="text-sm font-medium text-gray-400 mt-1">{day.date}</p>}
                      </div>
                      {day.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOptimizeDay(day.id); }}
                          disabled={optimizingDayId === day.id}
                          className="text-sm font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-xl transition-colors flex items-center disabled:opacity-50 border border-white/5 hover:border-white/20"
                        >
                          {optimizingDayId === day.id ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-400" /> Calibrating...</>
                          ) : (
                            <><MapPin className="h-4 w-4 mr-2 text-indigo-400" /> Optimize Route</>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className={`transition-all duration-500 ease-in-out origin-top ${isExpanded ? 'opacity-100 max-h-[2000px] pb-8' : 'opacity-0 max-h-0'}`}>
                      <div className="px-8 relative">
                        {/* Glowing Timeline Line */}
                        <div className="absolute top-0 bottom-0 left-[2.25rem] w-px bg-gradient-to-b from-indigo-500/50 via-[#1CFEBA]/50 to-indigo-500/50" />
                        
                        <div className="space-y-10 mt-4">
                          {(day.activities || []).map((activity, aIdx) => (
                            <div key={aIdx} className="relative flex items-start group">
                              <div className="absolute -left-2 w-6 h-6 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center mt-1.5 shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-125 group-hover:bg-indigo-400 transition-all duration-300 z-10" />
                              
                              <div className="ml-10 w-full p-6 rounded-2xl bg-black/20 border border-white/5 group-hover:border-white/20 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg border border-indigo-400/20">{activity.time}</span>
                                  <span className="text-xs font-bold tracking-widest uppercase text-[#1CFEBA] bg-[#1CFEBA]/10 px-3 py-1.5 rounded-lg border border-[#1CFEBA]/20">{activity.cost_estimate}</span>
                                </div>
                                <h4 className="text-xl font-heading font-bold text-white mb-2">{activity.name}</h4>
                                <p className="text-base text-gray-400 leading-relaxed">{activity.notes}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Map */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 h-[700px] w-full glass-panel rounded-[2rem] overflow-hidden p-2 flex items-center justify-center relative shadow-2xl">
            {itinerary && itinerary.length > 0 ? (
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden border border-white/5">
                <MapComponent dayGroups={selectedDayIndex !== null ? [itinerary[selectedDayIndex]] : itinerary} defaultCenter={defaultCenter} />
              </div>
            ) : (
              <div className="text-center p-8 w-full h-full rounded-[1.5rem] bg-black/20 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <MapPin className="h-10 w-10 text-gray-600" />
                </div>
                <p className="text-gray-500 font-medium max-w-[200px]">Map visualization requires an active itinerary.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BudgetPlanner tripId={trip.id} initialBudgetStr={trip.budget} />
      <MediaGallery tripId={trip.id} />
    </div>
  );
}
