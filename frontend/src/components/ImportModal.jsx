import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Manual Selection
  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
      alert("Please upload a valid CSV file.");
      return;
    }
    setFile(selectedFile);
    setStatus(null);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file); // 'file' matches request.FILES['file'] in backend

    try {
      // Force the header to undefined so the browser sets the boundary automatically
      await api.post('attendance/import/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
      });
      
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Upload failed", error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setStatus(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="text-indigo-600" size={24} /> 
            Upload CSV
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Drop Zone */}
        {!file ? (
          <div 
            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer
              ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input 
              ref={inputRef}
              type="file" 
              accept=".csv, text/csv, application/csv, text/x-csv, application/x-csv, application/vnd.ms-excel, text/plain"
              className="hidden" 
              onChange={handleChange} 
            />
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-3">
              <UploadCloud size={32} />
            </div>
            <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-400 mt-1">CSV files only</p>
          </div>
        ) : (
          /* File Selected View */
          <div className="flex flex-col items-center justify-center w-full h-48 border border-slate-200 bg-slate-50 rounded-xl relative">
            <button onClick={() => setFile(null)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
              <X size={16} />
            </button>
            <FileSpreadsheet size={40} className="text-green-600 mb-3" />
            <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[80%]">{file.name}</p>
            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        )}

        {/* Status Messages */}
        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle size={18} /> Import Successful!
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={18} /> Upload Failed. Please try again.
          </div>
        )}

        {/* Action Button */}
        <button 
          onClick={handleSubmit}
          disabled={!file || isLoading || status === 'success'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Process Data"}
        </button>

      </div>
    </div>
  );
}