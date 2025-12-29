import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, User, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await register(username, email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center text-indigo-600 font-bold text-xl mb-4">S</div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-indigo-100 mt-2 text-sm">Join SafeBunk to track your attendance</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="student@college.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Register <ArrowRight size={18} /></>}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}