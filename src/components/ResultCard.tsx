import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult } from '../services/mlService';
import { cn } from '../lib/utils';

interface ResultCardProps {
  result: AnalysisResult;
  isDarkMode: boolean;
  onFeedback: (correct: boolean) => void;
}

export default function ResultCard({ result, isDarkMode, onFeedback }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scoreColor, setScoreColor] = useState('text-emerald-500');
  const [scoreBg, setScoreBg] = useState('stroke-emerald-500');

  useEffect(() => {
    if (result.overallScore > 60) {
      setScoreColor('text-rose-500');
      setScoreBg('stroke-rose-500');
    } else if (result.overallScore > 30) {
      setScoreColor('text-amber-500');
      setScoreBg('stroke-amber-500');
    } else {
      setScoreColor('text-emerald-500');
      setScoreBg('stroke-emerald-500');
    }
  }, [result.overallScore]);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSignalStatus = (score: number) => {
    if (score > 60) return { label: 'Fake Signal', color: 'text-rose-500', bg: 'bg-rose-500/10', bar: 'bg-rose-500' };
    if (score > 30) return { label: 'Suspicious', color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-amber-500' };
    return { label: 'Safe', color: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' };
  };

  const signalGroups = [
    { name: 'Behavioral', weight: 0.25, keys: ['postingFrequency', 'sleepPattern', 'replyRatio', 'hashtagOveruse', 'firstPostSpam', 'postTiming'] },
    { name: 'Identity', weight: 0.20, keys: ['usernamePattern', 'profilePhoto', 'nameUsernameMismatch', 'bioLength', 'fakeLocation', 'suspiciousLink', 'bioSpam'] },
    { name: 'Network', weight: 0.20, keys: ['followerSpike', 'ghostFollowers', 'followUnfollow', 'mutualConnections'] },
    { name: 'Content', weight: 0.15, keys: ['repetition', 'genericComments', 'externalLinks', 'topicDiversity'] },
    { name: 'History', weight: 0.10, keys: ['accountAge', 'dormancy', 'deletedPosts', 'profileEdits'] },
    { name: 'Cross Platform', weight: 0.10, keys: ['presence', 'followerMismatch', 'joinDateCluster'] },
  ];

  const circleRadius = 45;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (result.overallScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 max-w-4xl mx-auto",
        isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200"
      )}
    >
      {/* Header Section */}
      <div className={cn(
        "p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-b",
        isDarkMode ? "border-white/5" : "border-gray-100"
      )}>
        <div className="flex items-center gap-5">
          <div className={cn(
            "p-4 rounded-2xl shadow-lg",
            result.isFake ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
          )}>
            {result.isFake ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {result.isFake ? 'Potential Fake Profile' : 'Verified Real Profile'}
            </h2>
            <p className="text-sm opacity-60 font-mono mt-1">@{result.username} • {result.platform}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={copyJson}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
              isDarkMode ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
            )}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied JSON' : 'Copy Raw JSON'}
          </button>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Score Meter */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r={circleRadius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className={isDarkMode ? "text-white/5" : "text-gray-100"}
              />
              <motion.circle
                cx="96"
                cy="96"
                r={circleRadius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={scoreBg}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-5xl font-black tracking-tighter", scoreColor)}>
                {Math.round(result.overallScore)}%
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Risk Score</span>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <div className={cn(
              "px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-block",
              result.isFake ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
            )}>
              {result.suspicionLevel} Risk
            </div>
            <p className="text-sm opacity-60">
              Confidence: <span className="font-bold">{result.confidenceLevel}</span>
            </p>
          </div>
        </div>

        {/* Right: Summary & Feedback */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Analysis Summary
            </h3>
            <div className="space-y-3">
              {result.isFake ? (
                result.flaggedReasons.map((reason, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-2xl text-sm border",
                      isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                    )}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{reason}</span>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-2xl text-sm bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">No major red flags detected. Profile behavior appears consistent with authentic user patterns.</span>
                </div>
              )}
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4",
            isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
          )}>
            <span className="text-sm font-bold opacity-70">Was this accurate?</span>
            <div className="flex gap-2">
              <button 
                onClick={() => onFeedback(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button 
                onClick={() => onFeedback(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold"
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Table Section */}
      <div className={cn(
        "border-t",
        isDarkMode ? "border-white/5" : "border-gray-100"
      )}>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-sm font-black uppercase tracking-widest opacity-60">Detailed Signal Breakdown</span>
          {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-8 space-y-8">
                {signalGroups.map((group) => {
                  const groupSignals = group.keys
                    .map(key => ({ key, ...result.signals[key] }))
                    .filter(s => s.name); // Only show existing signals

                  if (groupSignals.length === 0) return null;

                  const groupScore = groupSignals.reduce((acc, s) => acc + (s.score * s.weight), 0);
                  const groupMaxWeight = group.weight * 100;

                  return (
                    <div key={group.name} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-[10px] uppercase font-black tracking-widest opacity-40">{group.name} Analysis</h4>
                        <span className="text-[10px] font-bold opacity-40">Weight: {(group.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                        {groupSignals.map((signal) => {
                          const status = getSignalStatus(signal.score);
                          return (
                            <div key={signal.key} className="space-y-1.5 group/signal">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium opacity-80 group-hover/signal:opacity-100 transition-opacity">{signal.name}</span>
                                <span className={cn("font-bold", status.color)}>{signal.score}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${signal.score}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={cn("absolute top-0 left-0 h-full rounded-full", status.bar)}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[9px] opacity-40 font-bold uppercase tracking-tighter">
                                <span>{status.label}</span>
                                <span>Impact: {(signal.score * signal.weight).toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
