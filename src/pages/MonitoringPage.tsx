import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeProfile, AnalysisResult } from '../services/mlService';
import { cn } from '../lib/utils';

interface MonitoringPageProps {
  isDarkMode: boolean;
}

export default function MonitoringPage({ isDarkMode }: MonitoringPageProps) {
  const [watchlist, setWatchlist] = useState<AnalysisResult[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('veri_profile_history') || '[]');
    setWatchlist(history.filter((item: AnalysisResult) => item.isTracked));
  }, []);

  const refreshAll = async () => {
    setIsRefreshing(true);
    const newWatchlist = await Promise.all(watchlist.map(async (item) => {
      // Simulate a new scan with a slight seed offset to show "tracking" over time
      const newScan = await analyzeProfile(item.url, Math.random());
      return { 
        ...newScan, 
        isTracked: true,
        previousScore: item.overallScore
      };
    }));
    
    // Update local storage
    const history = JSON.parse(localStorage.getItem('veri_profile_history') || '[]');
    const updatedHistory = history.map((item: AnalysisResult) => {
      const updated = newWatchlist.find(w => w.url.replace(/\/$/, '').toLowerCase() === item.url.replace(/\/$/, '').toLowerCase());
      return updated || item;
    });
    localStorage.setItem('veri_profile_history', JSON.stringify(updatedHistory));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setWatchlist(newWatchlist);
    setIsRefreshing(false);
  };

  const untrack = (id: string) => {
    const history = JSON.parse(localStorage.getItem('veri_profile_history') || '[]');
    const updatedHistory = history.map((item: AnalysisResult) => 
      item.id === id ? { ...item, isTracked: false } : item
    );
    localStorage.setItem('veri_profile_history', JSON.stringify(updatedHistory));
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  const getScoreChange = (item: AnalysisResult) => {
    if (item.previousScore === undefined) return null;
    const delta = item.overallScore - item.previousScore;
    return delta;
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Watchlist & Monitoring</h1>
          <p className="opacity-60">Track suspicious accounts over time to detect behavioral shifts.</p>
        </div>
        <button 
          onClick={refreshAll}
          disabled={isRefreshing || watchlist.length === 0}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
            isRefreshing 
              ? "bg-indigo-500/20 text-indigo-500 cursor-not-allowed" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95"
          )}
        >
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Refreshing Data...' : 'Refresh All Data'}
        </button>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {watchlist.map((item) => {
              const delta = getScoreChange(item);
              const isSignificant = delta !== null && Math.abs(delta) >= 5;
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "p-6 rounded-3xl border flex flex-col gap-6 group relative overflow-hidden transition-all duration-500",
                    isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-lg",
                    isSignificant && (delta > 0 ? "border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/50" : "border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/50")
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest",
                    item.isFake ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                  )}>
                    {item.isFake ? 'Flagged' : 'Verified'}
                  </div>

                  {/* Significant Change Indicator */}
                  {isSignificant && (
                    <div className={cn(
                      "absolute top-8 right-0 px-3 py-1 rounded-l-full text-[9px] font-black flex items-center gap-1 shadow-lg",
                      delta > 0 ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {delta > 0 ? 'SIGNIFICANT SPIKE' : 'SIGNIFICANT DROP'}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      item.isFake ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {item.isFake ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">@{item.username}</h3>
                      <p className="text-xs opacity-50 truncate max-w-[150px]">{item.platform}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] uppercase opacity-40 font-bold block mb-1">Risk Score</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xl font-black", item.isFake ? "text-rose-500" : "text-emerald-500")}>
                          {Math.round(item.overallScore)}%
                        </span>
                        {delta !== null && delta !== 0 && (
                          <span className={cn(
                            "text-[10px] font-bold flex items-center",
                            delta > 0 ? "text-rose-500" : "text-emerald-500"
                          )}>
                            {delta > 0 ? '+' : ''}{Math.round(delta)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] uppercase opacity-40 font-bold block mb-1">Confidence</span>
                      <span className="text-xl font-black text-indigo-500">
                        {item.confidenceLevel}
                      </span>
                    </div>
                  </div>

                  {/* Flagged Reasons - Only for Fake IDs */}
                  {item.isFake && item.flaggedReasons.length > 0 && (
                    <div className="space-y-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                      <span className="text-[10px] uppercase text-rose-500 font-bold block">Risk Indicators</span>
                      <div className="space-y-1">
                        {item.flaggedReasons.slice(0, 2).map((reason, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] opacity-70">
                            <AlertCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                        {item.flaggedReasons.length > 2 && (
                          <p className="text-[9px] opacity-40 italic">+{item.flaggedReasons.length - 2} more reasons</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs opacity-60">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Created</span>
                      <span>{item.accountCreationDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-60">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last Scan</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => untrack(item.id)}
                      className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Untrack
                    </button>
                    <button className="p-2 rounded-xl bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className={cn(
          "p-20 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center gap-4",
          isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
        )}>
          <div className="p-6 rounded-full bg-indigo-500/10 text-indigo-500">
            <Activity className="w-12 h-12" />
          </div>
          <div className="max-w-md">
            <h3 className="text-xl font-bold mb-2">No accounts being monitored</h3>
            <p className="opacity-60">
              Start tracking accounts from the Analyzer or History pages to monitor their risk scores and behavioral patterns over time.
            </p>
          </div>
          <button className="mt-4 px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold">
            Go to Analyzer
          </button>
        </div>
      )}
    </div>
  );
}
