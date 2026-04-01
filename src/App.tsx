import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  History, 
  LayoutGrid, 
  FileUp, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Search,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import AnalyzerPage from './pages/AnalyzerPage';
import HistoryPage from './pages/HistoryPage';
import ComparisonPage from './pages/ComparisonPage';
import EmailDetectorPage from './pages/EmailDetectorPage';
import BulkUploadPage from './pages/BulkUploadPage';
import MonitoringPage from './pages/MonitoringPage';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Router>
      <div className={cn(
        "min-h-screen transition-colors duration-300",
        isDarkMode ? "bg-[#0A0A0A] text-white" : "bg-gray-50 text-gray-900"
      )}>
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isDarkMode ? "bg-[#121212] border-r border-white/10" : "bg-white border-r border-gray-200"
        )}>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">VeriProfile</h1>
            </div>

            <nav className="flex-1 space-y-2">
              <NavLink to="/" icon={<Search className="w-5 h-5" />} label="Analyzer" />
              <NavLink to="/history" icon={<History className="w-5 h-5" />} label="History" />
              <NavLink to="/comparison" icon={<Users className="w-5 h-5" />} label="Comparison" />
              <NavLink to="/email" icon={<Mail className="w-5 h-5" />} label="Email Detector" />
              <NavLink to="/bulk" icon={<FileUp className="w-5 h-5" />} label="Bulk Upload" />
              <NavLink to="/monitoring" icon={<Activity className="w-5 h-5" />} label="Monitoring" />
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
              <button
                onClick={toggleDarkMode}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-xl transition-all",
                  isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
                )}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-64 min-h-screen">
          {/* Header */}
          <header className={cn(
            "sticky top-0 z-30 h-16 flex items-center justify-between px-6 backdrop-blur-md",
            isDarkMode ? "bg-[#0A0A0A]/80 border-b border-white/5" : "bg-white/80 border-b border-gray-200"
          )}>
            <button onClick={toggleSidebar} className="lg:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
              )}>
                <Activity className="w-3 h-3" />
                System Active
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<AnalyzerPage isDarkMode={isDarkMode} />} />
              <Route path="/history" element={<HistoryPage isDarkMode={isDarkMode} />} />
              <Route path="/comparison" element={<ComparisonPage isDarkMode={isDarkMode} />} />
              <Route path="/email" element={<EmailDetectorPage isDarkMode={isDarkMode} />} />
              <Route path="/bulk" element={<BulkUploadPage isDarkMode={isDarkMode} />} />
              <Route path="/monitoring" element={<MonitoringPage isDarkMode={isDarkMode} />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all group",
        isActive 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-500/5"
      )}
    >
      <span className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
