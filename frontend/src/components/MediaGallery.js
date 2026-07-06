"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/axios";
import { Image as ImageIcon, Upload, Loader2, Trash2 } from "lucide-react";

export default function MediaGallery({ tripId }) {
  const { getToken } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const token = await getToken();
        const res = await api.get(`/api/trips/${tripId}/media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedia(res.data);
      } catch (err) {
        console.error("Failed to fetch media", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [tripId, getToken]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await getToken();
      const res = await api.post(`/api/trips/${tripId}/media`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMedia([...media, res.data]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload media. Check console.");
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleDeleteMedia = async (mediaId, e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this media?")) return;
    
    setDeletingId(mediaId);
    try {
      const token = await getToken();
      await api.delete(`/api/trips/${tripId}/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedia(media.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete media.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="bg-[#2A2B32] rounded-2xl border border-gray-700 overflow-hidden shadow-sm p-6 md:p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Trip Media</h2>
        </div>
        
        <div>
          <input 
            type="file" 
            id="media-upload" 
            className="hidden" 
            onChange={handleFileUpload}
            accept="image/*,application/pdf" 
          />
          <label 
            htmlFor="media-upload"
            className="flex items-center cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload File
          </label>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="p-12 text-center bg-[#202123] border border-gray-700 rounded-xl border-dashed">
          <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No media uploaded yet.</p>
          <p className="text-sm text-gray-500 mt-1">Upload tickets, confirmations, or trip photos here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.map((item) => (
            <div key={item.id} className="relative group block aspect-square bg-[#202123] rounded-xl overflow-hidden border border-gray-700 hover:border-purple-400 transition-colors">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full h-full block"
              >
                {item.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                  <img 
                    src={item.url} 
                    alt={item.fileName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-400 font-medium truncate w-full">{item.fileName}</span>
                  </div>
                )}
              </a>
              <button
                onClick={(e) => handleDeleteMedia(item.id, e)}
                disabled={deletingId === item.id}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                title="Delete Media"
              >
                {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
