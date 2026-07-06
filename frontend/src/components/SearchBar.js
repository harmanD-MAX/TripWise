"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { Search, MapPin, Loader2 } from "lucide-react";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(typeof res.data === 'string' ? JSON.parse(res.data) : res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (place) => {
    setQuery("");
    setIsOpen(false);
    if (onSelectLocation) {
      onSelectLocation({
        name: place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon)
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-gray-400" />
        <input 
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search destinations..."
          className="w-full bg-[#202123] border border-gray-700 text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#1CFEBA] transition-colors shadow-sm"
        />
        {loading && <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-gray-400" />}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#202123] border border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {results.map((place, idx) => (
            <button 
              key={idx}
              onClick={() => handleSelect(place)}
              className="w-full text-left px-4 py-3 hover:bg-[#2A2B32] transition-colors border-b border-gray-700/50 last:border-0 flex items-start gap-3 group"
            >
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5 group-hover:text-[#1CFEBA] shrink-0 transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2">
                {place.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
