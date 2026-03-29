import React, { useState } from 'react';
import SeasonalPromotions from './SeasonalPromotions';
import DailyDiscounts from './DailyDiscounts';
import MyProfile from '../MyProfile';
import { Tag, Calendar, UserCircle, LogOut } from 'lucide-react';

const PromotionManager = ({ user, setUser }) => {
  const [activePage, setActivePage] = useState('seasonal');

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 shadow-xl">
        <div className="mb-10 text-center">
          <div className="inline-block p-3 bg-blue-600 rounded-xl mb-3 shadow-lg shadow-blue-900/20">
             <span className="text-white text-xl font-black tracking-tighter">ST</span>
          </div>
          <h1 className="text-white font-bold text-lg tracking-tight uppercase">Smart Tray</h1>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Promotion Manager</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActivePage('seasonal')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activePage === 'seasonal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Calendar size={20} />
            <span className="font-bold text-sm">Seasonal Promos</span>
          </button>

          <button 
            onClick={() => setActivePage('daily')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activePage === 'daily' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Tag size={20} />
            <span className="font-bold text-sm">Daily Discounts</span>
          </button>

          <button 
            onClick={() => setActivePage('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activePage === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <UserCircle size={20} />
            <span className="font-bold text-sm">My Profile</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">
              {user?.staff_id}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.staff_name || user?.username}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Promotion Manager</p>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)} 
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 p-3.5 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={16} /> Logout System
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8">
        {activePage === 'seasonal' && <SeasonalPromotions />}
        {activePage === 'daily' && <DailyDiscounts />}
        {activePage === 'profile' && (
          <MyProfile user={user} onRefresh={setUser} />
        )}
      </main>
    </div>
  );
};

export default PromotionManager;