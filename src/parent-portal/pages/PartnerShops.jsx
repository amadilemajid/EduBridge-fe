import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  Search, MapPin, Navigation, Star, ShieldCheck, ChevronLeft
} from 'lucide-react';

const CATEGORIES = ['All', 'Uniforms', 'Textbooks', 'Stationery', 'Footwear'];

const PartnerShops = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/v1/supplies/shops').catch(() => ({
          data: [
            { id: 1, name: 'Bata Shoes Kampala', location: 'Kampala Road', categories: ['Footwear', 'Uniforms'], distance: '1.2 km', rating: 4.8 },
            { id: 2, name: 'Aristoc Booklex', location: 'Acacia Mall', categories: ['Textbooks', 'Stationery'], distance: '2.5 km', rating: 4.9 },
            { id: 3, name: 'Picfare Industries', location: 'Namanve', categories: ['Stationery'], distance: '5.0 km', rating: 4.5 },
            { id: 4, name: 'Kikubo Uniforms', location: 'Downtown Kampala', categories: ['Uniforms'], distance: '0.8 km', rating: 4.2 },
            { id: 5, name: 'Mukwano Books', location: 'Wandegeya', categories: ['Textbooks', 'Stationery'], distance: '3.1 km', rating: 4.6 },
          ]
        }));
        setShops(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not load partner shops.");
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || shop.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || shop.categories.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans max-w-md mx-auto relative pb-safe">
      {/* Search Header */}
      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-20 shadow-sm">
        <div className="flex gap-3 mb-3 items-center text-slate-900 border-b border-slate-100 pb-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Partner Shops</h1>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search shops or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-slate-100 border-transparent rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mt-4 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <LoadingSpinner variant="full" />
        ) : (
          <div className="space-y-4 pb-20">
            {filteredShops.length > 0 ? (
              filteredShops.map(shop => (
                <div key={shop.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-[15px] max-w-[70%] leading-tight">{shop.name}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                      <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" /> {shop.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{shop.location}</span>
                    <span className="text-slate-300 mx-1">•</span>
                    <Navigation className="w-3 h-3" />
                    <span className="font-medium text-emerald-600">{shop.distance}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {shop.categories.map(cat => (
                      <span key={cat} className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> EduBridge Verified
                    </div>
                    <button 
                      onClick={() => navigate('/parent/supplies/transaction')}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Pay Here
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-medium">No partner shops found.</p>
                <p className="text-sm mt-1">Try resolving your search filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PartnerShops;
