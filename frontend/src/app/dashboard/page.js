"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useTripStore } from "@/store/useTripStore";
import api from "@/lib/axios";
import { Plus, MapPin, Calendar, Users, Wallet, Loader2, Search, Filter, Copy, Globe, Plane, Activity, Sparkles, Map } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Trash2 } from "lucide-react";

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { trips, setTrips, isLoading, setLoading, error, setError } = useTripStore();
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStyle, setFilterStyle] = useState("All");
  const [duplicatingId, setDuplicatingId] = useState(null);

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        
        const [tripsRes, templatesRes] = await Promise.all([
          api.get('/api/trips', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/api/trips/templates', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTrips(tripsRes.data);
        setTemplates(templatesRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load your trips.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchTrips();
  }, [getToken, setTrips, setLoading, setError]);

  const stats = useMemo(() => {
    const upcoming = trips.filter(t => isAfter(new Date(t.startDate), new Date())).length;
    const destinations = new Set(trips.map(t => t.destination.split(',').pop().trim()));
    const totalBudgetStr = trips.reduce((acc, curr) => {
        const val = parseInt(curr.budget.replace(/[^0-9]/g, '')) || 0;
        return acc + val;
    }, 0);
    return { upcoming, countries: destinations.size, totalBudget: totalBudgetStr };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchesSearch = t.destination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = filterStyle === "All" || t.travelStyle === filterStyle;
      return matchesSearch && matchesStyle;
    });
  }, [trips, searchQuery, filterStyle]);

  const handleDuplicateTemplate = async (templateId) => {
    setDuplicatingId(templateId);
    try {
      const token = await getToken();
      const res = await api.post(`/api/trips/${templateId}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrips([res.data, ...trips]);
    } catch (err) {
      console.error(err);
      alert('Failed to duplicate template');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    
    const previousTrips = [...trips];
    setTrips(trips.filter(t => t.id !== id));
    
    try {
      const token = await getToken();
      await api.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      setTrips(previousTrips); 
      alert('Failed to delete trip');
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tighter text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2 font-medium">Orchestrate your upcoming adventures.</p>
        </div>
        <Link 
          href="/dashboard/trips/new"
          className="group inline-flex items-center justify-center px-6 py-3 text-sm font-bold transition-all bg-white text-black hover:bg-gray-200 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" /> Plan New Trip
        </Link>
      </div>

      {/* Glass Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Upcoming</p>
            <Plane className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-5xl font-heading font-black text-white">{stats.upcoming}</p>
        </div>
        
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#1CFEBA]/10 blur-2xl rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Destinations</p>
            <Globe className="h-5 w-5 text-[#1CFEBA]" />
          </div>
          <p className="text-5xl font-heading font-black text-white">{stats.countries}</p>
        </div>
        
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#FF3366]/10 blur-2xl rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Total Planned</p>
            <Activity className="h-5 w-5 text-[#FF3366]" />
          </div>
          <p className="text-5xl font-heading font-black text-white">{trips.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 glass-panel p-2 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search destinations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white border-none focus:ring-0 py-3 pl-12 pr-4 outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="w-full md:w-px h-[1px] md:h-8 bg-white/10 self-center" />
        <div className="relative md:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <select 
            value={filterStyle} 
            onChange={(e) => setFilterStyle(e.target.value)}
            className="w-full bg-transparent text-gray-300 border-none focus:ring-0 py-3 pl-10 pr-4 outline-none appearance-none cursor-pointer"
          >
            <option value="All" className="bg-[#1A1A1E]">All Styles</option>
            <option value="Relaxation" className="bg-[#1A1A1E]">Relaxation</option>
            <option value="Adventure" className="bg-[#1A1A1E]">Adventure</option>
            <option value="Cultural" className="bg-[#1A1A1E]">Cultural</option>
          </select>
        </div>
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl glass-panel border-red-500/20 text-red-400 font-semibold text-center">
          {error}
        </div>
      ) : filteredTrips.length === 0 && searchQuery === "" ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center rounded-3xl glass-panel">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
            <Map className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="text-3xl font-heading font-bold text-white mb-4">The canvas is blank</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-10">
            You haven't architected any trips yet. Begin your first masterpiece.
          </p>
          <Link href="/dashboard/trips/new" className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold transition-all bg-white text-black hover:bg-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1">
            <Plus className="h-4 w-4 mr-2" /> Start Planning
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Premium Templates Showcase */}
      {templates.length > 0 && (
        <div className="mt-24 pt-16 border-t border-white/5">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-heading font-black text-white">Curated Collections</h2>
            <Link href="/dashboard/recommendations" className="text-sm font-semibold text-[#1CFEBA] hover:text-white transition-colors flex items-center">
              AI Recommendations <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map(template => (
              <div key={template.id} className="glass-panel rounded-3xl overflow-hidden group flex flex-col hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="h-40 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 p-6 flex flex-col justify-end relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-heading font-bold text-white mb-1 truncate">{template.destination}</h3>
                    <p className="text-white/70 text-sm font-medium">{template.travelStyle}</p>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col bg-black/20">
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">Exquisitely pre-planned blueprint for {template.destination}.</p>
                  <button 
                    onClick={() => handleDuplicateTemplate(template.id)}
                    disabled={duplicatingId === template.id}
                    className="mt-auto w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-bold flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {duplicatingId === template.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Duplicate Blueprint
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

function TripCard({ trip, onDelete }) {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  return (
    <Link href={`/dashboard/trips/${trip.id}`} className="block group">
      <div className="flex flex-col h-full rounded-3xl glass-panel glass-panel-hover overflow-hidden relative">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/10 via-white/30 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="p-8 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-2xl font-heading font-bold text-white truncate pr-4">
              {trip.destination}
            </h3>
            <button 
              onClick={(e) => onDelete(trip.id, e)}
              className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors p-2 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
              {trip.travelStyle}
            </span>
          </div>
          
          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{format(startDate, 'MMM d, yyyy')} — {format(endDate, 'MMM d')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{trip.travelers} Travelers</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Wallet className="h-4 w-4 text-gray-500" />
              <span className="truncate text-white font-medium">{trip.budget}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
