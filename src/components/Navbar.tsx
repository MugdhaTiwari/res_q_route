import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  BarChart3, 
  Bell, 
  CloudRain, 
  Compass, 
  FileText, 
  HelpCircle, 
  Layers, 
  LogOut, 
  RotateCcw, 
  ShieldCheck, 
  Truck, 
  UserCheck, 
  Users, 
  Zap 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab, UserRole } from '../types';

interface NavbarProps {
  onOpenDemoGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemoGuide }) => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    unreadAlertsCount,
    toggleWeatherSimulation,
    isWeatherSimulated,
    triggerAutoIsolationDemo,
    resetAllData
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSimulationMenuOpen, setIsSimulationMenuOpen] = useState(false);

  const ROLE_CONFIG: Record<UserRole, { label: string; sub: string; badgeColor: string; dotColor: string; icon: React.ReactNode }> = {
    requester: {
      label: 'Requester',
      sub: 'Villager / Local Rep',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
      dotColor: 'bg-emerald-500',
      icon: <Users className="w-4 h-4 text-emerald-700" />
    },
    provider: {
      label: 'Resource Provider',
      sub: 'Depot-01 Logistics',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
      dotColor: 'bg-emerald-500',
      icon: <Truck className="w-4 h-4 text-emerald-700" />
    },
    official: {
      label: 'Govt. Official',
      sub: 'DDMA / Panchayat',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
      dotColor: 'bg-purple-500',
      icon: <ShieldCheck className="w-4 h-4 text-purple-700" />
    },
    guest: {
      label: 'Public Commuter',
      sub: 'General Traveler',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
      dotColor: 'bg-blue-500',
      icon: <Compass className="w-4 h-4 text-slate-700" />
    }
  };

  const currentRoleConfig = ROLE_CONFIG[role];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs h-16 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          
          {/* Logo & Region Tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-800 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  ResQ<span className="text-emerald-600">Route</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
                  NER India
                </span>
              </div>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

            {/* Geometric Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium h-full">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`h-full flex items-center gap-1.5 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Operations</span>
              </button>

              <button
                onClick={() => setActiveTab('navigate')}
                className={`h-full flex items-center gap-1.5 transition-colors ${
                  activeTab === 'navigate'
                    ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Plan Route</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`h-full flex items-center gap-1.5 transition-colors ${
                  activeTab === 'ledger'
                    ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Public Ledger</span>
              </button>
            </nav>
          </div>

          {/* Mobile Nav Tabs */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-2 rounded-lg text-xs font-semibold ${
                activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('navigate')}
              className={`p-2 rounded-lg text-xs font-semibold ${
                activeTab === 'navigate' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'
              }`}
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`p-2 rounded-lg text-xs font-semibold ${
                activeTab === 'ledger' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Bar: Simulation Tools & Role Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Hackathon Simulation Trigger Menu */}
            <div className="relative">
              <button
                onClick={() => setIsSimulationMenuOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  isWeatherSimulated
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                title="Hackathon Demo & Simulation Controls"
              >
                <Zap className={`w-3.5 h-3.5 ${isWeatherSimulated ? 'text-rose-600' : 'text-amber-600'}`} />
                <span className="hidden sm:inline">Simulations</span>
              </button>

              {isSimulationMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in"
                  onClick={() => setIsSimulationMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Live Demo Simulations
                  </div>

                  <button
                    onClick={toggleWeatherSimulation}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <CloudRain className={`w-4 h-4 mt-0.5 ${isWeatherSimulated ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{isWeatherSimulated ? 'Reset Monsoon Storm' : 'Simulate Flash Flood'}</span>
                        {isWeatherSimulated && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isWeatherSimulated ? 'Restores NH-15 to open state' : 'Blocks NH-15 with 1.4m floodwater to test automatic re-routing'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={triggerAutoIsolationDemo}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Auto-Detect Silent Village</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Simulates 180-min check-in timeout to generate automated Level 2 mission
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={resetAllData}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Demo Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Geometric Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-2xs ${currentRoleConfig.badgeColor}`}
              >
                <span className={`w-2 h-2 rounded-full ${currentRoleConfig.dotColor} animate-pulse`}></span>
                <span className="font-bold tracking-tight uppercase text-[11px] sm:text-xs">
                  {currentRoleConfig.label}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isRoleDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in"
                  onClick={() => setIsRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Switch Active Role
                  </div>

                  {(['requester', 'provider', 'official', 'guest'] as UserRole[]).map(r => {
                    const cfg = ROLE_CONFIG[r];
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            {cfg.icon}
                          </div>
                          <div>
                            <div className="text-xs text-slate-800 font-bold">{cfg.label}</div>
                            <div className="text-[11px] text-slate-500">{cfg.sub}</div>
                          </div>
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
