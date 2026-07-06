"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/axios";
import { Image as ImageIcon, Upload, Loader2, Trash2, ShieldCheck, FileText, Ticket, Camera } from "lucide-react";

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
      e.target.value = null;
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
    <div className="bg-[#2A2B32] rounded-2xl border border-gray-700 overflow-hidden shadow-sm p-6 md:p-8 mt-8 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <ImageIcon className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Trip Vault</h2>
        </div>
        
        {media.length > 0 && (
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
              className="flex items-center cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-purple-500/20"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload File
            </label>
          </div>
        )}
      </div>

      {media.length === 0 ? (
        <div className="space-y-8">
          <div className="text-center mb-10 mt-6 relative z-10">
            <div className="inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-full mb-4 border border-purple-500/20">
              <ShieldCheck className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Secure Your Memories & Documents</h3>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">Your personal travel vault. Upload and access all your important trip files in one place, securely stored and always accessible.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
            {/* Tickets */}
            <div className="bg-[#202123] rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-colors group">
              <div className="h-32 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="Tickets" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202123] to-transparent"></div>
                <Ticket className="absolute bottom-3 left-4 h-6 w-6 text-purple-400" />
              </div>
              <div className="p-5 pt-2">
                <h4 className="font-bold text-white text-lg mb-1">Tickets & Passes</h4>
                <p className="text-sm text-gray-400">Keep boarding passes, train tickets, and event vouchers handy.</p>
              </div>
            </div>
            
            {/* Documents */}
            <div className="bg-[#202123] rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-colors group">
              <div className="h-32 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="Documents" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202123] to-transparent"></div>
                <FileText className="absolute bottom-3 left-4 h-6 w-6 text-purple-400" />
              </div>
              <div className="p-5 pt-2">
                <h4 className="font-bold text-white text-lg mb-1">Travel Documents</h4>
                <p className="text-sm text-gray-400">Secure digital copies of passports, visas, and insurance.</p>
              </div>
            </div>
            
            {/* Memories */}
            <div className="bg-[#202123] rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-colors group">
              <div className="h-32 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="Memories" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202123] to-transparent"></div>
                <Camera className="absolute bottom-3 left-4 h-6 w-6 text-purple-400" />
              </div>
              <div className="p-5 pt-2">
                <h4 className="font-bold text-white text-lg mb-1">Trip Memories</h4>
                <p className="text-sm text-gray-400">Store and organize your favorite photos from the journey.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center relative z-10">
            <label 
              htmlFor="media-upload-empty"
              className="flex items-center cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Upload className="h-6 w-6 mr-3" />}
              Upload Your First File
            </label>
            <input 
              type="file" 
              id="media-upload-empty" 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*,application/pdf" 
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative group block aspect-square bg-[#202123] rounded-xl overflow-hidden border border-gray-700 hover:border-purple-400 transition-colors shadow-sm">
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gradient-to-br from-[#202123] to-black/40">
                      <FileText className="h-10 w-10 text-purple-400/70 mb-3" />
                      <span className="text-sm text-gray-300 font-medium truncate w-full px-2">{item.fileName}</span>
                    </div>
                  )}
                </a>
                <button
                  onClick={(e) => handleDeleteMedia(item.id, e)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 border border-white/10"
                  title="Delete Media"
                >
                  {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700/50 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>All files are securely stored and encrypted.</span>
            </div>
            <span>{media.length} {media.length === 1 ? 'file' : 'files'} stored</span>
          </div>
        </>
      )}
    </div>
  );
}
