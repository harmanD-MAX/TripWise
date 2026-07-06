"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/axios";
import { MapPin, Calendar, Users, Wallet, Sparkles, Clock, Map as MapIcon, Loader2, Globe } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import WeatherWidget from "@/components/WeatherWidget";
import Link from "next/link";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

export default function PublicTripPage({ params }) {
  const { id } = use(params);
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [defaultCenter, setDefaultCenter] = useState([35.6764, 139.6500]);
  const [selectedDayId, setSelectedDayId] = useState(null);

  useEffect(() => {
    async function fetchPublicTrip() {
      try {
        const response = await api.get(`/api/public/trips/${id}`);
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
        }
      } catch (err) {
        console.error("Error fetching public trip:", err);
        setError("This trip is either private or does not exist.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicTrip();
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 glass-panel rounded-3xl flex items-center justify-center mb-8 shadow-xl">
          <Globe className="h-10 w-10 text-gray-500" />
        </div>
        <h2 className="text-4xl font-heading font-black text-white mb-4 tracking-tighter">Trip Not Available</h2>
        <p className="text-gray-400 mb-10 max-w-md">{error}</p>
        <Link href="/" className="px-8 py-4 bg-white text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          Explore TripWise
        </Link>
      </div>
    );
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Read-Only Banner */}
      <div className="bg-[#1CFEBA]/10 border border-[#1CFEBA]/20 text-[#1CFEBA] px-6 py-4 rounded-2xl flex items-center justify-center text-sm font-semibold mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(28,254,186,0.1)]">
        <Globe className="w-5 h-5 mr-3" /> This is a public, read-only view of a TripWise architectural blueprint.
      </div>

      {/* Header Banner */}
      <div className="w-full rounded-[2rem] glass-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 opacity-50 pointer-events-none" />
        <div className="p-8 md:p-12 relative z-10 flex flex-col justify-between h-full">
          <div>
            <h1 className="text-5xl md:text-7xl font-heading font-black text-white mb-6 tracking-tighter">{trip.destination}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-300">
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                <Calendar className="h-4 w-4 text-gray-400" /> {format(startDate, 'MMM d, yyyy')} — {format(endDate, 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                <Users className="h-4 w-4 text-gray-400" /> {trip.travelers} Travelers
              </div>
              <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-4 py-2 rounded-xl text-indigo-300">
                <Sparkles className="h-4 w-4" /> {trip.travelStyle}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WeatherWidget destination={trip.destination} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content - Itinerary */}
        <div className="lg:col-span-2 space-y-8">
          {!itinerary ? (
            <div className="p-20 rounded-[3rem] glass-panel text-center">
              <div className="mx-auto w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-xl">
                <Calendar className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-3xl font-heading font-bold text-white mb-4">No Timeline Constructed</h3>
              <p className="text-gray-400 max-w-md mx-auto">This blueprint does not have a generated timeline yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {itinerary.map((day, originalIdx) => {
                const displayDayNum = day.day_number || day.dayNumber || originalIdx + 1;
                day.computedDayNum = displayDayNum; 
                const isExpanded = selectedDayId === day.id;

                return (
                  <div key={originalIdx} className={`glass-panel rounded-[2rem] transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'hover:border-white/20'}`}>
                    <div
                      className="px-8 py-6 flex justify-between items-center cursor-pointer group"
                      onClick={() => setSelectedDayId(isExpanded ? null : day.id)}
                    >
                      <div>
                        <h3 className="text-2xl font-heading font-black text-white group-hover:text-indigo-400 transition-colors">Day {displayDayNum}</h3>
                        {day.date && <p className="text-sm font-medium text-gray-400 mt-1">{day.date}</p>}
                      </div>
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
                <MapComponent dayGroups={selectedDayId ? itinerary.filter(d => d.id === selectedDayId) : itinerary} defaultCenter={defaultCenter} />
              </div>
            ) : (
              <div className="text-center p-8 w-full h-full rounded-[1.5rem] bg-black/20 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <MapPin className="h-10 w-10 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
