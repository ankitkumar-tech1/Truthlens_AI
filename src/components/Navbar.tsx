import React from 'react';
import { Search, Image, Mic, Film, Bot, Puzzle, Database, HelpCircle, Shield } from 'lucide-react';

export type ActiveTab = 'claim' | 'image' | 'audio' | 'video' | 'chatbot' | 'extension' | 'models';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAboutModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAboutModal }) => {
  const navItems = [
    { id: 'claim', label: 'News & Claim Checker', icon: Search },
    { id: 'image', label: 'Image Forensics', icon: Image },
    { id: 'audio', label: 'Audio Voice Check', icon: Mic },
    { id: 'video', label: 'Video Deepfake', icon: Film },
    { id: 'chatbot', label: 'Fact-Check AI Assistant', icon: Bot },
    { id: 'extension', label: 'Browser Extension', icon: Puzzle },
    { id: 'models', label: 'Model Registry', icon: Database },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
      
      {/* Sidebar Header Brand */}
      <div className="p-5 sm:p-6 flex items-center justify-between md:justify-start gap-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('claim')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold tracking-tight text-lg">TruthLens</span>
              <span className="text-blue-400 font-bold text-lg">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Fact-Checking Platform</p>
          </div>
        </div>

        {/* Mobile Info Button */}
        <button
          onClick={onOpenAboutModal}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 border border-slate-700"
          title="Scoring Methodology"
        >
          <HelpCircle className="w-4 h-4 text-blue-400" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="p-3 sm:p-4 pt-0 md:pt-2 flex-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 hidden md:block">
          Forensic Modules
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap text-left ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="hidden md:block p-4 border-t border-slate-800 mt-auto bg-slate-900/60">
        <button
          onClick={onOpenAboutModal}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-xs text-slate-300"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-slate-200">Scoring Rules</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-mono">v1.0</span>
        </button>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 px-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online • RAG Grounded</span>
        </div>
      </div>

    </aside>
  );
};

