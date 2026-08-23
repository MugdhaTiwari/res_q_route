import React, { useState } from 'react';
import { 
  Compass, 
  HelpCircle, 
  Layers, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Users 
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { RequesterView } from './components/RequesterView';
import { ResourceProviderView } from './components/ResourceProviderView';
import { GovernmentOfficialView } from './components/GovernmentOfficialView';
import { GeneralNavigationView } from './components/GeneralNavigationView';
import { PublicLedgerView } from './components/PublicLedgerView';
import { DemoGuideModal } from './components/DemoGuideModal';

const AppContent: React.FC = () => {
  const { role, activeTab, setRole, setActiveTab } = useApp();
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-dot-pattern text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Global Header */}
      <Navbar onOpenDemoGuide={() => setIsDemoGuideOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 pb-20">
        {activeTab === 'navigate' ? (
          <GeneralNavigationView />
        ) : activeTab === 'ledger' ? (
          <PublicLedgerView />
        ) : (
          /* Role Dashboard Router */
          <>
            {role === 'requester' && <RequesterView />}
            {role === 'provider' && <ResourceProviderView />}
            {role === 'official' && <GovernmentOfficialView />}
            {role === 'guest' && <GeneralNavigationView />}
          </>
        )}
      </main>

      {/* Bottom Floating Quick Demo Bar (Geometric Balance Pill) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-slate-800 flex items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline px-1">Demo Quick-Switch:</span>

        <button
          onClick={() => { setRole('requester'); setActiveTab('dashboard'); }}
          className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
            role === 'requester' && activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Requester</span>
        </button>

        <button
          onClick={() => { setRole('official'); setActiveTab('dashboard'); }}
          className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
            role === 'official' && activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official</span>
        </button>

        <button
          onClick={() => { setRole('provider'); setActiveTab('dashboard'); }}
          className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
            role === 'provider' && activeTab === 'dashboard'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Provider</span>
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1 hidden sm:block"></div>

        <button
          onClick={() => setIsDemoGuideOpen(true)}
          className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </button>
      </div>

      {/* Demo Guide Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
