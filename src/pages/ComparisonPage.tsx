import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, ShieldAlert, ShieldCheck, Users, ArrowRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeProfile, compareProfiles, ComparisonResult } from '../services/mlService';
import { cn } from '../lib/utils';

interface ComparisonPageProps {
  isDarkMode: boolean;
}

export default function ComparisonPage({ isDarkMode }: ComparisonPageProps) {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url1 || !url2) return;

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const [res1, res2] = await Promise.all([
        analyzeProfile(url1),
        analyzeProfile(url2)
      ]);

      // In a real app, we'd get the bio from the analyzeProfile response
      // For now we'll mock it if not present
      const comparison = compareProfiles(res1, res2, "Bio for " + res1.username, "Bio for " + res2.username);
      setResult(comparison);
    } catch (err) {
      setError("Failed to analyze one or both profiles. Please check the URLs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-6">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-bold uppercase tracking-widest">
          <Users className="w-4 h-4" />
          Duplicate Account Detection
        </div>
        <h1 className="text-4xl font-black tracking-tight leading-tight">
          Compare <span className="text-indigo-600">Profiles</span>
        </h1>
        <p className="text-lg opacity-60">
          Analyze two accounts to detect if they are duplicates or part of a bot network.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleCompare} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Account 1 URL</label>
              <div className={cn(
                "flex items-center p-2 rounded-2xl border transition-all duration-300",
                isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-lg"
              )}>
                <div className="pl-4 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url1}
                  onChange={(e) => setUrl1(e.target.value)}
                  placeholder="Profile 1 URL"
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-base outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Account 2 URL</label>
              <div className={cn(
                "flex items-center p-2 rounded-2xl border transition-all duration-300",
                isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-lg"
              )}>
                <div className="pl-4 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url2}
                  onChange={(e) => setUrl2(e.target.value)}
                  placeholder="Profile 2 URL"
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-base outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url1 || !url2}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
              isLoading || !url1 || !url2 
                ? "bg-gray-500/20 text-gray-500 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Comparing Profiles...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Detect Duplicates
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-8"
            >
              {/* Verdict Card */}
              <div className={cn(
                "p-8 rounded-3xl border flex flex-col items-center text-center gap-6",
                result.isDuplicate 
                  ? "bg-rose-500/5 border-rose-500/20" 
                  : "bg-emerald-500/5 border-emerald-500/20"
              )}>
                <div className={cn(
                  "p-4 rounded-2xl",
                  result.isDuplicate ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  {result.isDuplicate ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">
                    {result.isDuplicate ? 'Duplicate Detected' : 'Unique Profiles'}
                  </h2>
                  <p className="opacity-60 mt-2">
                    Confidence: <span className="font-bold">{result.confidence}</span> • Overall Similarity: {result.overallSimilarity}%
                  </p>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <AccountSummary account={result.account1} isDarkMode={isDarkMode} />
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-full h-px bg-white/10 hidden md:block" />
                  <div className="p-3 rounded-full bg-white/5 border border-white/10">
                    <ArrowRight className="w-6 h-6 opacity-40" />
                  </div>
                  <div className="w-full h-px bg-white/10 hidden md:block" />
                </div>
                <AccountSummary account={result.account2} isDarkMode={isDarkMode} />
              </div>

              {/* Detailed Metrics */}
              <div className={cn(
                "p-8 rounded-3xl border space-y-8",
                isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-200 shadow-xl"
              )}>
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Similarity Metrics
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <MetricBar label="Username Similarity" value={result.usernameSimilarity} />
                  <MetricBar label="Bio Similarity" value={result.bioSimilarity} />
                  <MetricBar label="Feature Similarity" value={result.featureSimilarity} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AccountSummary({ account, isDarkMode }: { account: any; isDarkMode: boolean }) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border space-y-3",
      isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">
          {account.username[0].toUpperCase()}
        </div>
        <div>
          <h4 className="font-bold">@{account.username}</h4>
          <p className="text-[10px] uppercase opacity-40 font-black tracking-tighter">{account.platform}</p>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value > 80 ? 'bg-rose-500' : value > 50 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = value > 80 ? 'text-rose-500' : value > 50 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="opacity-60">{label}</span>
        <span className={textColor}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
