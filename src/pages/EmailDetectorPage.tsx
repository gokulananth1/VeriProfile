import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, ShieldAlert, ShieldCheck, Info, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeEmail, EmailAnalysisResult } from '../services/mlService';
import { cn } from '../lib/utils';

interface EmailDetectorPageProps {
  isDarkMode: boolean;
}

export default function EmailDetectorPage({ isDarkMode }: EmailDetectorPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    if (!email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    // Simulate network delay for "AI analysis" feel
    setTimeout(() => {
      try {
        const analysis = analyzeEmail(email);
        setResult(analysis);
      } catch (err) {
        setError("An error occurred during analysis.");
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-10 py-6">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-bold uppercase tracking-widest">
          <Mail className="w-4 h-4" />
          Email Authenticity Check
        </div>
        <h1 className="text-4xl font-black tracking-tight leading-tight">
          Fake <span className="text-indigo-600">Email</span> Detector
        </h1>
        <p className="text-lg opacity-60">
          Analyze email addresses for bot patterns, disposable domains, and suspicious metadata.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className={cn(
            "flex items-center p-2 rounded-2xl border transition-all duration-300",
            isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-lg"
          )}>
            <div className="pl-4 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address to analyze"
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-lg outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !email}
              className={cn(
                "px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2",
                isLoading || !email 
                  ? "bg-gray-500/20 text-gray-500 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95"
              )}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
            </button>
          </div>
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
                "p-8 rounded-3xl border grid grid-cols-1 md:grid-cols-2 gap-8 items-center",
                result.isFake 
                  ? "bg-rose-500/5 border-rose-500/20" 
                  : "bg-emerald-500/5 border-emerald-500/20"
              )}>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    result.isFake ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                  )}>
                    {result.isFake ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">
                      {result.isFake ? 'Likely Fake' : 'Likely Authentic'}
                    </h2>
                    <p className="opacity-60 mt-1 font-medium">
                      Risk Score: <span className={cn("font-bold", result.isFake ? "text-rose-500" : "text-emerald-500")}>{result.score}%</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Analysis Details</h3>
                  <div className="space-y-2">
                    {result.details.length > 0 ? (
                      result.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span className="opacity-80">{detail}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="opacity-80">No suspicious patterns detected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Signal Breakdown */}
              <div className={cn(
                "p-8 rounded-3xl border space-y-6",
                isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-200 shadow-xl"
              )}>
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Technical Signals
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SignalItem label="Disposable Domain" active={result.signals.disposableDomain} />
                  <SignalItem label="High Username Entropy" active={result.signals.highEntropy} />
                  <SignalItem label="Suspicious Characters" active={result.signals.suspiciousCharacters} />
                  <SignalItem label="Bot-like Numeric Suffix" active={result.signals.numericSuffix} />
                  <SignalItem label="Length Violation" active={result.signals.lengthViolation} />
                  <SignalItem label="Common Bot Pattern" active={result.signals.commonFakePattern} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SignalItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all",
      active 
        ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
    )}>
      <span className="text-sm font-bold">{label}</span>
      {active ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
    </div>
  );
}
