import React, { useState, useContext, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { LogOut, RefreshCw, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ImportModal from '../components/ImportModal';
import ForecastPlanner from '../components/ForecastPlanner';
import api from '../services/api';

// --- SAFER DONUT COMPONENT (Unchanged) ---
const DonutRing = ({ percentage, color, size = 80 }) => {
  const validPct = percentage || 0; 
  const safePct = Math.min(Math.max(validPct, 0), 100);
  const data = [{ value: safePct }, { value: 100 - safePct }];

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute font-bold text-slate-700" style={{ fontSize: size / 4 }}>
        {validPct.toFixed(1)}%
      </div>
      <PieChart width={size} height={size}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={size/2-5} outerRadius={size/2} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
          <Cell fill={color} />
          <Cell fill="#e2e8f0" />
        </Pie>
      </PieChart>
    </div>
  );
};

export default function Dashboard() {
  const { logout } = useContext(AuthContext);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({ global: { attended: 0, conducted: 0, percentage: 100 }, subjects: [] });
  const [threshold, setThreshold] = useState(75);
  
  // 🔑 NEW: Key to force ForecastPlanner to reload after import
  const [plannerKey, setPlannerKey] = useState(0); 

  const fetchDashboardData = async () => {
    try {
        const response = await api.get('attendance/dashboard/');
        setDashboardData(response.data);
    } catch (error) { console.error("Fetch failed", error); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // 🔑 NEW: Handler to update everything after Import
  const handleImportSuccess = () => {
      fetchDashboardData();        // 1. Update stats (Donuts)
      setPlannerKey(prev => prev + 1); // 2. Force ForecastPlanner to re-fetch Schedule
  };

  // --- LOGIC (Unchanged) ---
  const getAdvice = (attended, conducted) => {
    if (conducted === 0) return { status: 'SAFE', hours: 0 };
    const currentPct = (attended / conducted);
    const targetPct = threshold / 100;
    if (currentPct >= targetPct) {
      const maxBunks = Math.floor((attended / targetPct) - conducted);
      return { status: 'SAFE', hours: maxBunks >= 0 ? maxBunks : 0 };
    } else {
      if (targetPct >= 1) return { status: 'RISK', hours: '∞' };
      const num = (targetPct * conducted) - attended;
      const den = 1 - targetPct;
      return { status: 'RISK', hours: Math.ceil(num / den) };
    }
  };

  const globalAdvice = getAdvice(dashboardData.global.attended, dashboardData.global.conducted);
  const getStatusColor = (pct) => pct >= threshold ? '#22c55e' : '#ef4444';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div><span className="text-xl font-bold text-indigo-900">SafeSkip</span></div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100"><RefreshCw size={16} /> Import Data</button>
          <button onClick={logout} className="text-slate-400 hover:text-red-500"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-900">Global Attendance</h2>
              <p className="text-slate-500">You have attended <b>{dashboardData.global.attended}h</b> out of {dashboardData.global.conducted}h conducted.</p>
              <div className="mt-4 flex items-center gap-3 bg-slate-50 p-3 rounded-lg w-fit"><Settings size={16} className="text-slate-400" /><input type="range" min="50" max="95" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-24 h-2 bg-slate-200 rounded-lg appearance-none accent-indigo-600" /><span className="text-sm font-bold text-indigo-600">{threshold}%</span></div>
            </div>
            <DonutRing percentage={dashboardData.global.percentage} color={getStatusColor(dashboardData.global.percentage)} size={160} />
            <div className={`px-6 py-4 rounded-xl border-l-4 shadow-sm flex flex-col items-center md:items-end ${globalAdvice.status === 'SAFE' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <span className={`text-sm font-bold uppercase ${globalAdvice.status === 'SAFE' ? 'text-green-700' : 'text-red-700'}`}>{globalAdvice.status === 'SAFE' ? 'Safe Zone' : 'Danger Zone'}</span>
                <span className="text-2xl font-bold text-slate-900 mt-1">{globalAdvice.hours}h</span>
                <span className="text-xs text-slate-500 mt-0.5 font-medium">{globalAdvice.status === 'SAFE' ? 'Safe to Skip' : 'Must Attend'}</span>
            </div>
        </section>

        {/* Subjects Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.subjects.map((sub) => {
              const advice = getAdvice(sub.attended, sub.conducted);
              return (
                <div key={sub.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{sub.name}</h4>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">{sub.type || 'Lecture'}</span>
                    </div>
                    <DonutRing percentage={sub.percentage} color={getStatusColor(sub.percentage)} size={50} />
                  </div>
                  <div className={`text-xs px-2 py-1.5 rounded flex justify-center font-medium ${advice.status === 'SAFE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                       {advice.status === 'SAFE' ? `Skippable: ${advice.hours}h` : `Recover: +${advice.hours}h`}
                  </div>
                </div>
              );
            })}
        </section>

        {/* Forecast Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><CalendarIcon size={20} /></div><h3 className="text-lg font-bold text-slate-800">Attendance Forecast</h3></div>
          
          {/* 🔑 THIS IS THE KEY FIX: The 'key' prop forces reload */}
          <ForecastPlanner 
             key={plannerKey} 
             currentGlobalPct={dashboardData.global.percentage} 
             subjects={dashboardData.subjects} 
          />
        </section>
      </main>

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onSuccess={handleImportSuccess} />
    </div>
  );
}