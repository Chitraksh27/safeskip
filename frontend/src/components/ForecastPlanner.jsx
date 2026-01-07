import React, { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export default function ForecastPlanner({ currentGlobalPct, subjects = [] }) {
  const [selectedDate, setSelectedDate] = useState(0); 
  const [simulationActions, setSimulationActions] = useState({}); 

  // 1. Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      index: i,
      date: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isSunday: d.getDay() === 0
    };
  });

  // 2. Toggle Logic
  const cycleAction = (dayIndex, subjectId) => {
    const key = `${dayIndex}-${subjectId}`;
    setSimulationActions(prev => {
      const current = prev[key];
      const newState = { ...prev };
      if (!current) newState[key] = 'ATTEND';       
      else if (current === 'ATTEND') newState[key] = 'SKIP'; 
      else delete newState[key];                    
      return newState;
    });
  };

  // 3. The Math Engine (Now includes Global Calculations)
  const calculateImpact = () => {
    // A. Initialize Global Counters from current subjects data
    let globalAttended = subjects.reduce((acc, sub) => acc + sub.attended, 0);
    let globalConducted = subjects.reduce((acc, sub) => acc + sub.conducted, 0);
    
    // B. Calculate Subject-Level Changes
    const updatedSubjects = subjects.map(sub => {
      let addedAttended = 0;
      let addedConducted = 0;

      Object.keys(simulationActions).forEach(key => {
        const [dayIdx, subId] = key.split('-');
        if (parseInt(subId) === sub.id) {
          const action = simulationActions[key];
          const weight = sub.weight === 'Lab' ? 2 : 1; 

          if (action === 'ATTEND') {
            addedAttended += weight;
            addedConducted += weight;
            // Update Global Diffs
            globalAttended += weight;
            globalConducted += weight;
          } else if (action === 'SKIP') {
            addedConducted += weight;
            // Update Global Diffs
            globalConducted += weight;
          }
        }
      });

      const finalPct = (sub.attended + addedAttended) / (sub.conducted + addedConducted) * 100;
      
      return {
        ...sub,
        finalPct: isNaN(finalPct) ? 100 : finalPct,
        diff: (isNaN(finalPct) ? 100 : finalPct) - sub.percentage
      };
    });

    // C. Calculate Final Global Stats
    const finalGlobalPct = globalConducted > 0 ? (globalAttended / globalConducted) * 100 : 100;
    
    return {
      subjects: updatedSubjects,
      global: {
        before: currentGlobalPct,
        after: finalGlobalPct,
        diff: finalGlobalPct - currentGlobalPct
      }
    };
  };

  const { subjects: impactedSubjects, global: globalImpact } = calculateImpact();
  const currentDay = days[selectedDate];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* LEFT: CALENDAR (Unchanged) */}
      <div className="lg:w-1/2 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {days.map((day) => (
            <button
              key={day.index}
              onClick={() => setSelectedDate(day.index)}
              className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedDate === day.index 
                  ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                  : day.isSunday 
                    ? 'bg-slate-50 border border-slate-100 text-slate-300' 
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'
              }`}
            >
              <span className="text-xs font-medium uppercase">{day.dayName}</span>
              <span className="text-xl font-bold">{day.date.getDate()}</span>
              {Object.keys(simulationActions).some(k => k.startsWith(`${day.index}-`)) && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1"></div>
              )}
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[300px]">
          <h4 className="font-bold text-slate-700 mb-3 flex justify-between items-center">
            <span>Schedule for {currentDay.fullDate}</span>
            <span className="text-[10px] font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
              Tap to Cycle
            </span>
          </h4>
          
          {currentDay.isSunday ? (
             <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm italic">
               <div className="text-2xl mb-2">🛑</div>
               No classes on Sunday.
             </div>
          ) : (
            <div className="space-y-3">
              {subjects.map(sub => {
                const action = simulationActions[`${selectedDate}-${sub.id}`];
                let cardStyle = "border-slate-200 opacity-60 hover:opacity-100 bg-white";
                let btnContent = <><MinusCircle size={16} /> No Class</>;
                let btnStyle = "bg-slate-100 text-slate-500";

                if (action === 'ATTEND') {
                  cardStyle = "border-green-200 bg-green-50 opacity-100 ring-1 ring-green-200";
                  btnContent = <><CheckCircle2 size={16} /> Attending</>;
                  btnStyle = "bg-green-100 text-green-700";
                } else if (action === 'SKIP') {
                  cardStyle = "border-red-200 bg-red-50 opacity-100 ring-1 ring-red-200";
                  btnContent = <><XCircle size={16} /> Skipping</>;
                  btnStyle = "bg-red-100 text-red-700";
                }

                return (
                  <div key={sub.id} 
                       onClick={() => cycleAction(selectedDate, sub.id)}
                       className={`cursor-pointer flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all ${cardStyle}`}>
                    <div>
                      <div className="font-semibold text-slate-800">{sub.name}</div>
                      <div className="text-xs text-slate-500">{sub.weight}</div>
                    </div>
                    <button className={`pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${btnStyle}`}>
                      {btnContent}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: PROJECTED IMPACT */}
      <div className="lg:w-1/2 bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
           Projected Impact
           {Object.keys(simulationActions).length > 0 && (
             <span className="text-xs font-normal text-white bg-indigo-600 px-2 py-0.5 rounded-full">
               {Object.keys(simulationActions).length} Actions
             </span>
           )}
        </h4>

        {/* 1. NEW: GLOBAL IMPACT CARD */}
        <div className={`mb-4 p-4 rounded-xl border-l-4 shadow-sm ${
           Math.abs(globalImpact.diff) > 0.01 
             ? (globalImpact.diff > 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500')
             : 'bg-slate-50 border-slate-300'
        }`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Global Attendance</span>
                {Math.abs(globalImpact.diff) > 0.01 && (
                    <span className={`text-xs font-bold flex items-center gap-1 ${globalImpact.diff > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {globalImpact.diff > 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                        {Math.abs(globalImpact.diff).toFixed(2)}%
                    </span>
                )}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-800">{globalImpact.after.toFixed(1)}%</span>
                <span className="text-sm text-slate-400 mb-1 line-through">{globalImpact.before.toFixed(1)}%</span>
            </div>
        </div>

        {/* 2. SUBJECT LIST */}
        <div className="flex-grow space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
          {impactedSubjects.map(sub => {
            const isChanged = Math.abs(sub.diff) > 0.01;
            const isDanger = sub.finalPct < 75;
            
            return (
              <div key={sub.id} className={`p-4 rounded-xl border transition-all ${
                isChanged ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">{sub.name}</span>
                  {isChanged && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      sub.diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.diff > 0 ? '+' : ''}{sub.diff.toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                     <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Now</div>
                     <div className="text-xl font-bold text-slate-600">{sub.percentage.toFixed(1)}%</div>
                  </div>
                  <div className="text-slate-300"><ArrowRight size={20} /></div>
                  <div className="text-center">
                     <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">After</div>
                     <div className={`text-xl font-bold ${isDanger ? 'text-red-600' : 'text-green-600'}`}>
                       {sub.finalPct.toFixed(1)}%
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}