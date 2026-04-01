import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Download, Search, Filter, Calendar, History as HistoryIcon, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult } from '../services/mlService';
import { cn } from '../lib/utils';

interface HistoryPageProps {
  isDarkMode: boolean;
}

export default function HistoryPage({ isDarkMode }: HistoryPageProps) {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('veri_profile_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      localStorage.removeItem('veri_profile_history');
      setHistory([]);
    }
  };

  const deleteItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem('veri_profile_history', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const filteredHistory = history.filter(item => 
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="opacity-60">Review and manage your past profile scans.</p>
        </div>
        <button 
          onClick={clearHistory}
          disabled={history.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      {/* Filters */}
      <div className={cn(
        "p-4 rounded-2xl border flex flex-col sm:flex-row gap-4",
        isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-200 shadow-sm"
      )}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input 
            type="text" 
            placeholder="Search by username or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 pl-10 pr-4 py-2 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Platform
          </button>
          <button className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Date
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className={cn(
        "rounded-2xl border overflow-hidden",
        isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-lg"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={cn(
                "text-xs font-bold uppercase tracking-widest opacity-50 border-b",
                isDarkMode ? "border-white/5" : "border-gray-100"
              )}>
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Monitoring</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <motion.tr 
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "group transition-colors",
                        isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">@{item.username}</span>
                          <span className="text-xs opacity-50 truncate max-w-[200px]">{item.url}</span>
                          <span className="text-[10px] text-indigo-500 font-medium mt-1">Created: {item.accountCreationDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          isDarkMode ? "bg-white/10" : "bg-gray-100"
                        )}>
                          {item.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                          item.isFake 
                            ? "bg-rose-500/10 text-rose-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", item.isFake ? "bg-rose-500" : "bg-emerald-500")} />
                          {item.isFake ? 'FAKE' : 'REAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${item.confidence}%` }} 
                          />
                        </div>
                        <span className="text-[10px] opacity-50 mt-1 block">{item.confidence.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.isTracked ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase bg-indigo-500/10 px-2 py-1 rounded-md w-fit">
                            <Eye className="w-3 h-3" />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-30 uppercase px-2 py-1 rounded-md w-fit">
                            <EyeOff className="w-3 h-3" />
                            Static
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm opacity-60">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-indigo-500/10 hover:text-indigo-500 rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center opacity-40">
                      <div className="flex flex-col items-center gap-3">
                        <HistoryIcon className="w-10 h-10" />
                        <p>No analysis history found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
