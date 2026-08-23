import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  HelpCircle, 
  Layers, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Users, 
  X, 
  Zap 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
  const { setRole, setActiveTab, toggleWeatherSimulation, triggerAutoIsolationDemo } = useApp();

  if (!isOpen) return null;

  const jumpToRole = (role: UserRole) => {
    setRole(role);
    setActiveTab('dashboard');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                Hackathon Demo Guide
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              ResQRoute End-to-End Walkthrough
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Demo Flow Cards */}
        <div className="space-y-3.5 mb-8">
          
          {/* Step 1: Requester */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                  Role 1: Requester (Villager)
                </div>
                <button
                  onClick={() => jumpToRole('requester')}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Switch to Requester</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                Submit an urgent village request. See the clean 5-step progress tracker ("Received → Verified → Matched → In Transit → Delivered") with zero clutter.
              </p>
            </div>
          </div>

          {/* Step 2: Government Official */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-purple-950 uppercase tracking-wider">
                  Role 2: Government Official (DDMA)
                </div>
                <button
                  onClick={() => jumpToRole('official')}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <span>Switch to Official</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-purple-900 mt-1 leading-relaxed">
                Review the submission in the Verification Queue and click <strong>"Verify Request"</strong> (or issue a pre-verified official requisition).
              </p>
            </div>
          </div>

          {/* Step 3: Resource Provider */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-blue-950 uppercase tracking-wider">
                  Role 3: Resource Provider (Depot)
                </div>
                <button
                  onClick={() => jumpToRole('provider')}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>Switch to Provider</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-blue-900 mt-1 leading-relaxed">
                Inspect the Google-Maps style risk map, check the Level 1/2/3 plain-language escalation, and click <strong>"Accept & Dispatch"</strong>. Then click <strong>"Confirm Delivered"</strong>!
              </p>
            </div>
          </div>

          {/* Step 4: Public Ledger */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  Public Ledger (Transparency)
                </div>
                <button
                  onClick={() => { setActiveTab('ledger'); onClose(); }}
                  className="text-xs font-bold text-slate-800 hover:underline flex items-center gap-1"
                >
                  <span>Open Public Ledger</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Open the audit ledger (no login required) to see the newly completed relief mission automatically recorded with date and beneficiaries.
              </p>
            </div>
          </div>

          {/* Step 5: Everyday Commuter Navigation */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              5
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-cyan-950 uppercase tracking-wider">
                  Everyday Commuter Navigator
                </div>
                <button
                  onClick={() => { setActiveTab('navigate'); onClose(); }}
                  className="text-xs font-bold text-cyan-800 hover:underline flex items-center gap-1"
                >
                  <span>Open Commuter Map</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-cyan-900 mt-1 leading-relaxed">
                Select any starting point and destination in the North-East to test automatic alternate detour calculation when NH-15 is flooded.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            ResQRoute • Built for North-East India Hackathon
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800"
          >
            Got It, Let's Demo
          </button>
        </div>

      </div>
    </div>
  );
};
