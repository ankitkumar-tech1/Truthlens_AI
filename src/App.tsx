import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ClaimFactChecker } from './components/ClaimFactChecker';
import { ImageInspector } from './components/ImageInspector';
import { AudioInspector } from './components/AudioInspector';
import { VideoInspector } from './components/VideoInspector';
import { FactCheckChatbot } from './components/FactCheckChatbot';
import { BrowserExtensionSimulator } from './components/BrowserExtensionSimulator';
import { ModelRegistry } from './components/ModelRegistry';
import { ScoringModal } from './components/ScoringModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('claim');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAboutModal={() => setIsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Main Content View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'claim' && <ClaimFactChecker />}
          {activeTab === 'image' && <ImageInspector />}
          {activeTab === 'audio' && <AudioInspector />}
          {activeTab === 'video' && <VideoInspector />}
          {activeTab === 'chatbot' && <FactCheckChatbot />}
          {activeTab === 'extension' && <BrowserExtensionSimulator />}
          {activeTab === 'models' && <ModelRegistry />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">TruthLens AI</span>
              <span>—</span>
              <span>Professional Multimodal Fact-Checking & Forensics</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsModalOpen(true)} className="hover:text-blue-600 transition font-medium">
                Scoring Methodology
              </button>
              <button onClick={() => setActiveTab('models')} className="hover:text-blue-600 transition font-medium">
                MODELS.md Audit
              </button>
            </div>
          </div>
        </footer>

      </div>

      {/* Scoring Architecture Modal */}
      <ScoringModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
}

