import React, { useState } from 'react';
import { 
  FileUp, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Trash2,
  Table as TableIcon,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { analyzeProfile, AnalysisResult } from '../services/mlService';
import { cn } from '../lib/utils';

interface BulkUploadPageProps {
  isDarkMode: boolean;
}

export default function BulkUploadPage({ isDarkMode }: BulkUploadPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as string[][];
        const total = rows.length;
        const processed: AnalysisResult[] = [];

        for (let i = 0; i < total; i++) {
          const row = rows[i];
          const url = row[0]?.trim();
          const realName = row[1]?.trim(); // Optional second column

          if (url) {
            // Robust URL validation for bulk
            const patterns = {
              twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]{1,15}\/?$/,
              instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?$/,
              linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]{1,100}\/?$/,
              facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/(profile\.php\?id=\d+|[a-zA-Z0-9.]{5,})\/?$/
            };

            const isValid = Object.values(patterns).some(regex => regex.test(url));

            if (isValid) {
              const analysis = await analyzeProfile(url, 0, realName);
              processed.push(analysis);
            } else {
              // Create a special result for invalid URLs
              processed.push({
                id: Math.random().toString(36).substr(2, 9),
                url,
                username: 'Invalid URL',
                platform: 'Unknown',
                timestamp: Date.now(),
                features: {} as any,
                modelScores: { lstm: 0, xgboost: 0, randomForest: 0 },
                overallScore: 0,
                isFake: false,
                confidence: 0,
                flaggedReasons: ['Invalid URL format'],
                activityHistory: [],
                error: 'Invalid URL format' // Custom field for UI
              } as any);
            }
          }
          setProgress(Math.round(((i + 1) / total) * 100));
          // Small delay to simulate processing and prevent UI freeze
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setResults(processed);
        setIsProcessing(false);
        
        // Save to history
        const history = JSON.parse(localStorage.getItem('veri_profile_history') || '[]');
        localStorage.setItem('veri_profile_history', JSON.stringify([...processed, ...history].slice(0, 100)));
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
        setIsProcessing(false);
      }
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const downloadResults = () => {
    const csv = Papa.unparse(results.map(r => ({
      URL: r.url,
      Username: r.username,
      Platform: r.platform,
      'Account Created': r.accountCreationDate,
      Result: r.isFake ? 'FAKE' : 'REAL',
      Confidence: `${r.confidence.toFixed(2)}%`,
      OverallScore: r.overallScore.toFixed(4)
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `VeriProfile_Bulk_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 py-6">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Bulk Analysis</h1>
        <p className="opacity-60">
          Upload a CSV file containing a list of social media URLs to analyze 
          multiple profiles simultaneously.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="max-w-3xl mx-auto">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center",
            isDragging 
              ? "border-indigo-500 bg-indigo-500/5 scale-[1.02]" 
              : "border-white/10 hover:border-indigo-500/50 hover:bg-white/5",
            isDarkMode ? "bg-[#121212]" : "bg-white border-gray-200"
          )}
        >
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          
          <div className="space-y-4">
            <div className={cn(
              "w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-110",
              isProcessing && "animate-bounce"
            )}>
              {isProcessing ? <Loader2 className="w-10 h-10 animate-spin" /> : <FileUp className="w-10 h-10" />}
            </div>
            
            <div>
              <h3 className="text-xl font-bold">
                {isProcessing ? `Processing... ${progress}%` : 'Drop your CSV here'}
              </h3>
              <p className="text-sm opacity-50 mt-1">
                or click to browse files (Max 100 URLs per upload)
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-xs font-medium opacity-40">
                <FileText className="w-3 h-3" />
                CSV Format Only
              </div>
              <div className="flex items-center gap-2 text-xs font-medium opacity-40">
                <TableIcon className="w-3 h-3" />
                Col 1: URL, Col 2: Name (Opt)
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-rose-500/10 text-rose-500 flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Table */}
      <AnimatePresence>
        {results.length > 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Analysis Results ({results.length})
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={downloadResults}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button 
                  onClick={() => setResults([])}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={cn(
              "rounded-2xl border overflow-hidden",
              isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-lg"
            )}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/5">
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">Account Created</th>
                      <th className="px-6 py-4">Result</th>
                      <th className="px-6 py-4">Confidence</th>
                      <th className="px-6 py-4">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.map((item, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          {item.username === 'Invalid URL' ? (
                            <span className="text-rose-500 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Invalid URL
                            </span>
                          ) : (
                            `@${item.username}`
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm opacity-60">{item.platform}</td>
                        <td className="px-6 py-4 text-xs opacity-60">{item.accountCreationDate || '-'}</td>
                        <td className="px-6 py-4">
                          {item.username === 'Invalid URL' ? (
                            <span className="text-xs opacity-40 italic">N/A</span>
                          ) : (
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold",
                              item.isFake ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {item.isFake ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                              {item.isFake ? 'FAKE' : 'REAL'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">
                          {item.username === 'Invalid URL' ? '-' : `${item.confidence.toFixed(1)}%`}
                        </td>
                        <td className="px-6 py-4">
                          {item.username === 'Invalid URL' ? (
                            <span className="text-xs text-rose-500/60 font-medium">Invalid URL format</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full", item.isFake ? "bg-rose-500" : "bg-emerald-500")}
                                  style={{ width: `${item.overallScore * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] opacity-50">{item.overallScore.toFixed(2)}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
