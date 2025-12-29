import React, { useState } from 'react';
import { X, Upload, Loader2, FileText } from 'lucide-react';
import api from '../services/api';

export default function ImportModal({ isOpen, onClose, onSuccess }) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!text.trim()) return;
    setIsLoading(true); setStatus(null);
    try {
      await api.post('attendance/import/', { csv_data: text });
      setStatus('success');
      setTimeout(() => { onSuccess(); onClose(); setText(''); setStatus(null); }, 1000);
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center text-indigo-900">
          <h3 className="font-bold flex items-center gap-2"><Upload size={20} /> Import Attendance</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <textarea 
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Subject,Type,Date,Status&#10;OS,Lecture,2025-10-01,Present"
          className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono resize-none"
        />
        {status === 'error' && <div className="text-red-600 text-xs text-center font-bold">Import Failed</div>}
        {status === 'success' && <div className="text-green-600 text-xs text-center font-bold">Success!</div>}
        <button onClick={handleImport} disabled={isLoading || !text} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Process Data'}
        </button>
      </div>
    </div>
  );
}