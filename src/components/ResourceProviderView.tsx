import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Bell, 
  Check, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Compass, 
  CornerDownRight, 
  Eye, 
  Flame, 
  Layers, 
  LifeBuoy, 
  MapPin, 
  Navigation, 
  Package, 
  Radio, 
  Send, 
  ShieldCheck, 
  Truck, 
  Zap,
  Boxes,
  Droplets,
  HeartPulse,
  Tent
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_LOCATIONS, calculateRiskAwareRoute, INITIAL_ROAD_SEGMENTS } from '../data/nerGeography';
import { CalculatedRoute, Depot, EscalationLevel, ReliefRequest, RoadSegment, Village } from '../types';
import { MapComponent } from './MapComponent';
import { useLiveNavigation } from '../hooks/useLiveNavigation';
import { LiveNavigationPanel } from './LiveNavigationPanel';

export const ResourceProviderView: React.FC = () => {
  const {
    depots,
    villages,
    roadSegments,
    requests,
    alerts,
    markAlertRead,
    dispatchRequest,
    markDelivered,
    selectedRequestId,
    setSelectedRequestId,
    updateRoadStatus,
    role
  } = useApp();

  // Active Selected Depot (Source)
  const [selectedDepotId, setSelectedDepotId] = useState<string>(depots[1]?.id || depots[0]?.id);
  const activeDepot = depots.find(d => d.id === selectedDepotId) || depots[0];

  // Active Selected Target Village / Request
  const [selectedTargetVillageId, setSelectedTargetVillageId] = useState<string>(villages[0]?.id);
  const activeVillage = villages.find(v => v.id === selectedTargetVillageId) || villages[0];

  // Filter or tab in operational queue: 'pending' | 'in_transit' | 'all'
  const [queueTab, setQueueTab] = useState<'pending' | 'in_transit' | 'all'>('pending');
  const [showAlertsPanel, setShowAlertsPanel] = useState<boolean>(false);
  const [selectedRoadModal, setSelectedRoadModal] = useState<RoadSegment | null>(null);

  // Filter verified / active requests
  const activeOperationalRequests = useMemo(() => {
    return requests.filter(r => {
      if (queueTab === 'pending') return r.status === 'VERIFIED';
      if (queueTab === 'in_transit') return r.status === 'IN_TRANSIT';
      return r.status !== 'REJECTED';
    });
  }, [requests, queueTab]);

  // Current calculated base route for the selected source depot + target village
  const baseCalculatedRoute: CalculatedRoute = useMemo(() => {
    return calculateRiskAwareRoute(
      selectedDepotId,
      selectedTargetVillageId,
      roadSegments,
      ALL_LOCATIONS
    );
  }, [selectedDepotId, selectedTargetVillageId, roadSegments]);

  // Live Navigation Hook for Provider Dispatch Tracking (Feature A)
  const {
    isNavigating,
    isPaused,
    progress,
    speedMultiplier,
    setSpeedMultiplier,
    currentCoord,
    currentBearing,
    distanceTraveledKm,
    currentStepIndex,
    activeNavRoute,
    isRecalculating,
    rerouteNotice,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
    triggerSimulateRoadUpdate
  } = useLiveNavigation({
    initialRoute: baseCalculatedRoute,
    roadSegments,
    allLocations: ALL_LOCATIONS,
    targetId: selectedTargetVillageId,
    updateRoadStatus
  });

  // Handle selecting a request from the list
  const handleSelectRequest = (req: ReliefRequest) => {
    if (isNavigating) resetNavigation();
    setSelectedRequestId(req.id);
    setSelectedTargetVillageId(req.villageId);
    if (req.assignedDepotId) {
      setSelectedDepotId(req.assignedDepotId);
    }
  };

  const handleResetRoads = () => {
    INITIAL_ROAD_SEGMENTS.forEach(r => {
      updateRoadStatus(r.id, r.status, r.hazardReason);
    });
    resetNavigation();
  };

  // Helper to render plain-language escalation level badge
  const renderEscalationBadge = (level: EscalationLevel, relayKm?: number, relayMethod?: string) => {
    if (level === 'LEVEL_1_VEHICLE') {
      return (
        <div className="bg-emerald-600/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-800 flex items-start gap-2 text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Level 1: Vehicle ground route available direct to village</span>
        </div>
      );
    }
    if (level === 'LEVEL_2_RELAY') {
      return (
        <div className="bg-amber-600/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-900 flex items-start gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Level 2: Ground vehicle reaches staging point — relay needed for final {relayKm || 8} km via {relayMethod || 'boat / porter'}</span>
        </div>
      );
    }
    return (
      <div className="bg-red-600/10 p-2.5 rounded-lg border border-red-500/20 text-red-900 flex items-start gap-2 text-xs font-semibold">
        <Zap className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <span>Level 3: Impassable terrain — escalate immediately for emergency air-drop</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Header & Alert Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Resource Provider Operations
            </span>
            <span className="text-xs text-slate-500 font-medium">Relief Logistics & Risk Navigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            Relief Convoy & Dispatch Hub
          </h1>
        </div>

        {/* Source Depot Picker & Alerts Notification Bell */}
        <div className="flex items-center gap-3">
          
          {/* Active Depot Picker */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs text-xs">
            <span className="font-bold text-slate-500">Staging Base:</span>
            <select
              value={selectedDepotId}
              onChange={(e) => {
                if (isNavigating) resetNavigation();
                setSelectedDepotId(e.target.value);
              }}
              className="bg-transparent font-bold text-emerald-700 focus:outline-none cursor-pointer"
            >
              {depots.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name.split('(')[0]} ({d.district})
                </option>
              ))}
            </select>
          </div>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsPanel(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                alerts.some(a => !a.read)
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alerts</span>
              {alerts.filter(a => !a.read).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                  {alerts.filter(a => !a.read).length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Panel */}
            {showAlertsPanel && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-500 animate-ping" />
                    <span>Real-Time Terrain & Isolation Alerts</span>
                  </div>
                  <button
                    onClick={() => setShowAlertsPanel(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertRead(alert.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        alert.severity === 'critical'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      } ${!alert.read ? 'ring-1 ring-rose-400' : 'opacity-80'}`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          {alert.type === 'ISOLATION' ? '⚡ ' : '⚠️ '}
                          {alert.title}
                        </span>
                        <span className="text-[10px] font-normal text-slate-500">{alert.timestamp}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-700">{alert.message}</p>
                      {alert.villageId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isNavigating) resetNavigation();
                            setSelectedTargetVillageId(alert.villageId!);
                            setShowAlertsPanel(false);
                          }}
                          className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <span>Focus Village on Operational Map</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Grid: Left Operational Panel & Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Incoming Verified Requests & Live Navigation (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Requests Queue Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Operational Requisitions Queue</span>
              </div>

              {/* Queue Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setQueueTab('pending')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    queueTab === 'pending'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Verified ({requests.filter(r => r.status === 'VERIFIED').length})
                </button>
                <button
                  onClick={() => setQueueTab('in_transit')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    queueTab === 'in_transit'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  In Transit ({requests.filter(r => r.status === 'IN_TRANSIT').length})
                </button>
              </div>
            </div>

            {/* Request Cards List */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {activeOperationalRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No requests in this queue currently.
                </div>
              ) : (
                activeOperationalRequests.map(req => {
                  const isSelected = selectedTargetVillageId === req.villageId;
                  return (
                    <div
                      key={req.id}
                      onClick={() => handleSelectRequest(req)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-xs ring-2 ring-emerald-100'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-slate-600">{req.trackingCode}</span>
                            {req.autoDetected && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                ⚡ Auto-Detected
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {req.urgency}
                            </span>
                          </div>
                          <div className="font-extrabold text-sm text-slate-900 mt-1">
                            {req.villageName}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            <strong>Need:</strong> {req.resourceType} ({req.quantity})
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {req.totalDistanceKm || 45} km
                          </span>
                        </div>
                      </div>

                      {/* Escalation Level */}
                      <div className="mt-2.5">
                        {renderEscalationBadge(req.escalationLevel, req.relayDistanceKm, req.relayMethod)}
                      </div>

                      {/* Action Button: Dispatch or Mark Delivered */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          {req.status === 'IN_TRANSIT' ? `Dispatched at ${req.dispatchedTime}` : `Verified: ${req.verifiedBy || 'DDMA'}`}
                        </span>

                        {req.status === 'VERIFIED' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatchRequest(req.id, activeDepot.id, '4x4 Relief Unit & Supply Team (AS-01-T-8821)');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                          >
                            <Send className="w-3 h-3" />
                            <span>Accept & Dispatch</span>
                          </button>
                        ) : req.status === 'IN_TRANSIT' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markDelivered(req.id);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Confirm Delivered</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* FEATURE A: Live Navigation Simulator & Mid-Journey Reroute Controls (Reused component) */}
          <LiveNavigationPanel
            isNavigating={isNavigating}
            isPaused={isPaused}
            progress={progress}
            speedMultiplier={speedMultiplier}
            setSpeedMultiplier={setSpeedMultiplier}
            distanceTraveledKm={distanceTraveledKm}
            activeNavRoute={activeNavRoute}
            isRecalculating={isRecalculating}
            rerouteNotice={rerouteNotice}
            startNavigation={startNavigation}
            pauseNavigation={pauseNavigation}
            resumeNavigation={resumeNavigation}
            resetNavigation={resetNavigation}
            triggerSimulateRoadUpdate={triggerSimulateRoadUpdate}
            onResetRoads={handleResetRoads}
            modeLabel="Dispatch Convoy Navigation"
          />

          {/* Working Navigation Step-by-Step Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                <span>Turn-by-Turn Route Guidance</span>
              </div>
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                {activeNavRoute.totalDistanceKm} km • ~{activeNavRoute.estimatedMinutes} mins
              </div>
            </div>

            {/* Route Summary Metrics */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span><strong>Origin:</strong> {activeNavRoute.sourceName}</span>
                <span><strong>Target:</strong> {activeNavRoute.targetName}</span>
              </div>

              {activeNavRoute.warningMessage && !rerouteNotice && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold mb-2.5 flex items-start gap-2 ${
                  activeNavRoute.overallRisk === 'IMPASSABLE'
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{activeNavRoute.warningMessage}</span>
                </div>
              )}
            </div>

            {/* Steps List with Live Step Highlighting */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {activeNavRoute.steps.map((step, idx) => {
                const isCurrentStep = isNavigating && idx === currentStepIndex;
                const isPastStep = isNavigating && idx < currentStepIndex;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                      isCurrentStep
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-200'
                        : isPastStep
                        ? 'bg-slate-50/60 border-slate-100 opacity-60'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                        isCurrentStep
                          ? 'bg-emerald-700 text-white animate-bounce'
                          : isPastStep
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPastStep ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`leading-snug ${isCurrentStep ? 'font-black text-emerald-950' : 'font-semibold text-slate-800'}`}>
                        {step.instruction}
                      </div>
                      {step.hazardNote && (
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                          ⚠️ {step.hazardNote}
                        </div>
                      )}
                    </div>
                    {step.distanceKm > 0 && (
                      <span className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                        {step.distanceKm} km
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Operational Map with Feature B Stock/Need Indicators (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Destination Selector Bar & Get Route Action */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Target Village:
              </span>
              <select
                value={selectedTargetVillageId}
                onChange={(e) => {
                  if (isNavigating) resetNavigation();
                  setSelectedTargetVillageId(e.target.value);
                }}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {villages.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.riskZone} Zone)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  if (isNavigating) resetNavigation();
                  setSelectedTargetVillageId(selectedTargetVillageId);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Draw & Highlight Route</span>
              </button>
            </div>
          </div>

          {/* Interactive Map with Feature B Visual Badges & Moving Vehicle */}
          <div className="relative">
            <MapComponent
              depots={depots}
              villages={villages}
              roadSegments={roadSegments}
              activeRoute={activeNavRoute}
              selectedSourceId={selectedDepotId}
              selectedTargetId={selectedTargetVillageId}
              role={role}
              requests={requests}
              travelerMarker={{
                position: currentCoord,
                bearing: currentBearing,
                isNavigating
              }}
              onSelectLocation={(loc) => {
                if (isNavigating) resetNavigation();
                if (loc.type === 'depot') setSelectedDepotId(loc.id);
                if (loc.type === 'village') setSelectedTargetVillageId(loc.id);
              }}
              onSelectRoad={(road) => setSelectedRoadModal(road)}
              heightClass="h-[540px] sm:h-[640px]"
            />
          </div>

        </div>

      </div>

    </div>
  );
};

