import React, { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function ForecastPlanner({ currentGlobalPct, subjects = [] }) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); 
  const [simulationActions, setSimulationActions] = useState({}); 

  // 1. Generate Next 7 Days
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

  // 2. Toggle Logic (Key = "DayIndex-SubjectID")
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

  // 3. The Math Engine 🧮
  const calculateImpact = () => {
    // A. Initialize counters from current stats
    let globalAttended = subjects.reduce((acc, sub) => acc + parseFloat(sub.attended_hours || sub.attended || 0), 0);
    let globalConducted = subjects.reduce((acc, sub) => acc + parseFloat(sub.conducted_hours || sub.conducted || 0), 0);
    
    // B. Calculate Subject-Level Changes
    const updatedSubjects = subjects.map(sub => {
      let addedAttended = 0;
      let addedConducted = 0;

      // Check actions for this specific subject across all days
      Object.keys(simulationActions).forEach(key => {
        const [_, subIdStr] = key.split('-');
        if (parseInt(subIdStr) === sub.id) {
          const action = simulationActions[key];
          // Default Weight: Lab = 2 hours, Lecture = 1 hour (customize as needed)
          const weight = (sub.type || '').toLowerCase().includes('lab') ? 2 : 1; 

          if (action === 'ATTEND') {
            addedAttended += weight;
            addedConducted += weight;
            globalAttended += weight;
            globalConducted += weight;
          } else if (action === 'SKIP') {
            addedConducted += weight;
            globalConducted += weight;
          }
        }
      });

      const currentAtt = parseFloat(sub.attended_hours || sub.attended || 0);
      const currentCond = parseFloat(sub.conducted_hours || sub.conducted || 0);
      const newAtt = currentAtt + addedAttended;
      const newCond = currentCond + addedConducted;
      
      const finalPct = newCond > 0 ? (newAtt / newCond) * 100 : 100;
      const currentPct = sub.percentage || (currentCond > 0 ? (currentAtt / currentCond) * 100 : 0);

      return {
        ...sub,
        finalPct: finalPct,
        diff: finalPct - currentPct
      };
    });

    // C. Calculate Final Global Stats
    const finalGlobalPct = globalConducted > 0 ? (globalAttended / globalConducted) * 100 : 100;
    
    return {
      subjects: updatedSubjects.sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff)), 
      global: {
        before: currentGlobalPct,
        after: finalGlobalPct,
        diff: finalGlobalPct - currentGlobalPct
      }
    };
  };

  const { subjects: impactedSubjects, global: globalImpact } = calculateImpact();
  const currentDay = days[selectedDateIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* LEFT: CALENDAR & LIST */}
      <div className="lg:w-1/2 space-y-6">
        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
          {days.map((day) => (
            <button
              key={day.index}
              onClick={() => setSelectedDateIndex(day.index)}
              className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedDateIndex === day.index 
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

        {/* The Subject List (All Subjects) */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[350px]">
          <h4 className="font-bold text-slate-700 mb-3 flex justify-between items-center">
            <span>Schedule for {currentDay.fullDate}</span>
            <span className="text-[10px] font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
              Tap to Cycle
            </span>
          </h4>
          
          {subjects.length === 0 ? (
             <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-sm italic">
               No subjects found. Import data first.
             </div>
          ) : (
            <div className="space-y-3">
              {subjects.map(sub => {
                const action = simulationActions[`${selectedDateIndex}-${sub.id}`];
                
                let cardStyle = "border-slate-200 opacity-60 hover:opacity-100 bg-white";
                let btnContent = <><MinusCircle size={16} /> No Action</>;
                let btnStyle = "bg-slate-100 text-slate-500";

                if (action === 'ATTEND') {
                  cardStyle = "border-green-200 bg-green-50 opacity-100 ring-1 ring-green-200 shadow-sm";
                  btnContent = <><CheckCircle2 size={16} /> Attending</>;
                  btnStyle = "bg-green-100 text-green-700";
                } else if (action === 'SKIP') {
                  cardStyle = "border-red-200 bg-red-50 opacity-100 ring-1 ring-red-200 shadow-sm";
                  btnContent = <><XCircle size={16} /> Skipping</>;
                  btnStyle = "bg-red-100 text-red-700";
                }

                return (
                  <div key={sub.id} 
                       onClick={() => cycleAction(selectedDateIndex, sub.id)}
                       className={`cursor-pointer flex items-center justify-between p-3 rounded-lg border transition-all active:scale-[0.98] ${cardStyle}`}>
                    <div>
                      <div className="font-semibold text-slate-800">{sub.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                            {sub.type || 'Lecture'}
                        </span>
                      </div>
                    </div>
                    <button className={`pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${btnStyle}`}>
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
      <div className="lg:w-1/2 bg-white rounded-xl border border-slate-200 p-5 flex flex-col h-[500px]">
        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
           Projected Impact
           {Object.keys(simulationActions).length > 0 && (
             <span className="text-xs font-normal text-white bg-indigo-600 px-2 py-0.5 rounded-full">
               {Object.keys(simulationActions).length} Actions
             </span>
           )}
        </h4>

        {/* Global Stats Card */}
        <div className={`mb-4 p-4 rounded-xl border-l-4 shadow-sm flex-shrink-0 ${
           Math.abs(globalImpact.diff) > 0.01 
             ? (globalImpact.diff > 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500')
             : 'bg-slate-50 border-slate-300'
        }`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Global Attendance</span>
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

        {/* Subject List */}
        <div className="flex-grow space-y-3 overflow-y-auto pr-2 scrollbar-thin">
          {impactedSubjects.length === 0 ? (
             <div className="text-center text-slate-400 py-10 text-sm">Add subjects to see impact.</div>
          ) : (
             impactedSubjects.map(sub => {
                const isChanged = Math.abs(sub.diff) > 0.01;
                const isDanger = sub.finalPct < 75;
                
                return (
                  <div key={sub.id} className={`p-4 rounded-xl border transition-all ${
                    isChanged ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]">{sub.name}</span>
                      {isChanged && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                          sub.diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {sub.diff > 0 ? '+' : ''}{sub.diff.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current</div>
                          <div className="text-lg font-bold text-slate-600">{sub.percentage?.toFixed(1) || "0.0"}%</div>
                      </div>
                      <div className="text-slate-300"><ArrowRight size={18} /></div>
                      <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Future</div>
                          <div className={`text-lg font-bold ${isDanger ? 'text-red-600' : 'text-green-600'}`}>
                            {sub.finalPct.toFixed(1)}%
                          </div>
                      </div>
                    </div>
                  </div>
                );
             })
          )}
        </div>
      </div>
    </div>
  );
}