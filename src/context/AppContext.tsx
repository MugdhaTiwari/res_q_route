import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ALL_LOCATIONS,
  calculateRiskAwareRoute,
  INITIAL_DEPOTS,
  INITIAL_ROAD_SEGMENTS,
  INITIAL_VILLAGES
} from '../data/nerGeography';
import {
  INITIAL_ALERTS,
  INITIAL_LEDGER,
  INITIAL_REQUESTS
} from '../data/initialData';
import {
  AlertNotification,
  CalculatedRoute,
  CompletedLedgerItem,
  Depot,
  MainTab,
  ReliefRequest,
  ResourceType,
  RoadSegment,
  RoadStatus,
  UrgencyLevel,
  UserRole,
  Village
} from '../types';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  
  // Data lists
  requests: ReliefRequest[];
  villages: Village[];
  depots: Depot[];
  roadSegments: RoadSegment[];
  alerts: AlertNotification[];
  ledger: CompletedLedgerItem[];
  
  // Selections
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  activeCalculatedRoute: CalculatedRoute | null;
  setActiveCalculatedRoute: (route: CalculatedRoute | null) => void;

  // Actions
  submitReliefRequest: (payload: {
    villageId: string;
    resourceType: ResourceType;
    quantity: string;
    urgency: UrgencyLevel;
    contactName: string;
    contactPhone: string;
    detailsNote?: string;
    isOfficialSubmission?: boolean;
  }) => ReliefRequest;

  verifyRequest: (requestId: string, verifiedBy?: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  dispatchRequest: (requestId: string, depotId: string, vehicleName: string) => void;
  markDelivered: (requestId: string) => void;

  // Alerts
  markAlertRead: (alertId: string) => void;
  unreadAlertsCount: number;

  // Road Network Simulation
  toggleWeatherSimulation: () => void;
  isWeatherSimulated: boolean;
  updateRoadStatus: (roadId: string, newStatus: RoadStatus, reason?: string) => void;

  // Demo Helpers
  resetAllData: () => void;
  triggerAutoIsolationDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'resqroute_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states with localStorage persistence
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'role');
    return (saved as UserRole) || 'requester';
  });

  const [activeTab, setActiveTabState] = useState<MainTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'activeTab');
    return (saved as MainTab) || 'dashboard';
  });

  const [requests, setRequests] = useState<ReliefRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'roads');
    return saved ? JSON.parse(saved) : INITIAL_ROAD_SEGMENTS;
  });

  const [villages, setVillages] = useState<Village[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'villages');
    return saved ? JSON.parse(saved) : INITIAL_VILLAGES;
  });

  const [depots] = useState<Depot[]>(INITIAL_DEPOTS);

  const [alerts, setAlerts] = useState<AlertNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [ledger, setLedger] = useState<CompletedLedgerItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeCalculatedRoute, setActiveCalculatedRoute] = useState<CalculatedRoute | null>(null);
  const [isWeatherSimulated, setIsWeatherSimulated] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'roads', JSON.stringify(roadSegments));
  }, [roadSegments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'villages', JSON.stringify(villages));
  }, [villages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'ledger', JSON.stringify(ledger));
  }, [ledger]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    // When switching role, if we are on general navigation or ledger, stay there, otherwise stay on dashboard
    if (activeTab !== 'navigate' && activeTab !== 'ledger') {
      setActiveTabState('dashboard');
    }
  };

  const setActiveTab = (tab: MainTab) => {
    setActiveTabState(tab);
  };

  // Submit a new relief request
  const submitReliefRequest = ({
    villageId,
    resourceType,
    quantity,
    urgency,
    contactName,
    contactPhone,
    detailsNote,
    isOfficialSubmission = false
  }: {
    villageId: string;
    resourceType: ResourceType;
    quantity: string;
    urgency: UrgencyLevel;
    contactName: string;
    contactPhone: string;
    detailsNote?: string;
    isOfficialSubmission?: boolean;
  }): ReliefRequest => {
    const targetVillage = villages.find(v => v.id === villageId) || villages[0];
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `RQ-2026-${codeNum}`;

    // Compute route and escalation level from nearest depot
    const nearestDepot = depots[0];
    const calculated = calculateRiskAwareRoute(
      nearestDepot.id,
      targetVillage.id,
      roadSegments,
      ALL_LOCATIONS
    );

    const newRequest: ReliefRequest = {
      id: `req-${Date.now()}`,
      trackingCode,
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      district: targetVillage.district,
      state: targetVillage.state,
      lat: targetVillage.lat,
      lng: targetVillage.lng,
      resourceType,
      quantity,
      urgency,
      status: isOfficialSubmission ? 'VERIFIED' : 'SUBMITTED',
      submittedBy: contactName,
      submittedRole: isOfficialSubmission ? 'official' : 'villager',
      contactPhone,
      detailsNote,
      submissionTime: timestampStr,
      verifiedTime: isOfficialSubmission ? timestampStr : undefined,
      verifiedBy: isOfficialSubmission ? 'Direct Official Submission (Panchayat / DDMA)' : undefined,
      assignedDepotId: isOfficialSubmission ? nearestDepot.id : undefined,
      assignedDepotName: isOfficialSubmission ? nearestDepot.name : undefined,
      escalationLevel: calculated.escalationLevel,
      relayDistanceKm: calculated.relayDistanceKm,
      relayMethod: calculated.relayMethod,
      totalDistanceKm: calculated.totalDistanceKm,
      estimatedDriveTimeMins: calculated.estimatedMinutes,
      autoDetected: false
    };

    setRequests(prev => [newRequest, ...prev]);
    setSelectedRequestId(newRequest.id);

    return newRequest;
  };

  // Government Official Verifies a request
  const verifyRequest = (requestId: string, verifiedBy = 'DDMA Regional Verification Cell') => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          // Assign closest depot
          const assignedDepot = depots[0];
          return {
            ...req,
            status: 'VERIFIED',
            verifiedTime: timestampStr,
            verifiedBy,
            assignedDepotId: assignedDepot.id,
            assignedDepotName: assignedDepot.name
          };
        }
        return req;
      })
    );
  };

  // Reject Request
  const rejectRequest = (requestId: string, reason: string) => {
    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'REJECTED',
            rejectionReason: reason
          };
        }
        return req;
      })
    );
  };

  // Resource Provider Dispatches
  const dispatchRequest = (requestId: string, depotId: string, vehicleName: string) => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const chosenDepot = depots.find(d => d.id === depotId) || depots[0];

    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'IN_TRANSIT',
            assignedDepotId: chosenDepot.id,
            assignedDepotName: chosenDepot.name,
            assignedVehicle: vehicleName,
            dispatchedTime: timestampStr
          };
        }
        return req;
      })
    );
  };

  // Mark Request as Delivered and record in Public Ledger
  const markDelivered = (requestId: string) => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'DELIVERED',
            deliveredTime: timestampStr
          };
        }
        return req;
      })
    );

    // Create entry in Public Ledger
    const ledgerItem: CompletedLedgerItem = {
      id: `led-${Date.now()}`,
      trackingCode: targetReq.trackingCode,
      villageName: targetReq.villageName,
      district: targetReq.district,
      state: targetReq.state,
      resource: targetReq.resourceType,
      quantity: targetReq.quantity,
      sourceDepot: targetReq.assignedDepotName || 'Tezpur Disaster Base',
      status: 'Delivered',
      dispatchedDate: targetReq.dispatchedTime || timestampStr,
      completedDate: timestampStr,
      beneficiariesCount: Math.floor(800 + Math.random() * 2500),
      transportMethod: targetReq.assignedVehicle || (targetReq.escalationLevel === 'LEVEL_3_AIRDROP' ? 'IAF Mi-17 Air-Drop' : '4x4 Rescue Truck & Boat Relay')
    };

    setLedger(prev => [ledgerItem, ...prev]);
  };

  const markAlertRead = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, read: true } : a))
    );
  };

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  const updateRoadStatus = (roadId: string, newStatus: RoadStatus, reason?: string) => {
    setRoadSegments(prev =>
      prev.map(r => {
        if (r.id === roadId) {
          return {
            ...r,
            status: newStatus,
            hazardReason: reason || r.hazardReason,
            lastUpdated: 'Just now'
          };
        }
        return r;
      })
    );
  };

  // Toggle dynamic monsoon weather simulation
  const toggleWeatherSimulation = () => {
    setIsWeatherSimulated(prev => {
      const next = !prev;
      if (next) {
        // Severe rainfall triggered: block NH-15 and make NH-6 risky
        setRoadSegments(current =>
          current.map(road => {
            if (road.id === 'road-tezpur-lakhimpur-direct') {
              return {
                ...road,
                status: 'BLOCKED',
                hazardReason: '🚨 Flash flood over-topping: 1.4m rushing water across Subansiri culvert.',
                lastUpdated: 'Just now'
              };
            }
            if (road.id === 'road-gh-nongpoh') {
              return {
                ...road,
                status: 'RISKY',
                hazardReason: '⚠️ Heavy mountain downpour; minor rock-shed on uphill carriage.',
                lastUpdated: 'Just now'
              };
            }
            return road;
          })
        );

        // Add weather alert
        const newAlert: AlertNotification = {
          id: `alt-${Date.now()}`,
          type: 'WEATHER',
          title: '🚨 SIMULATED FLASH FLOOD EVENT TRIGGERED',
          message: 'Heavy cloudburst in Subansiri catchment. NH-15 North Bank blocked. Navigation engine automatically calculating safe bypass corridors.',
          timestamp: 'Just now',
          severity: 'critical',
          read: false,
          requiresAction: true
        };
        setAlerts(a => [newAlert, ...a]);
      } else {
        // Reset roads to standard baseline
        setRoadSegments(INITIAL_ROAD_SEGMENTS);
      }
      return next;
    });
  };

  // Trigger automated check-in timeout isolation demo
  const triggerAutoIsolationDemo = () => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetVillage = villages.find(v => v.id === 'vil-majuli-jengraimukh') || villages[1];

    const autoReq: ReliefRequest = {
      id: `req-auto-${Date.now()}`,
      trackingCode: `RQ-2026-AUTO-${Math.floor(10 + Math.random() * 89)}`,
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      district: targetVillage.district,
      state: targetVillage.state,
      lat: targetVillage.lat,
      lng: targetVillage.lng,
      resourceType: 'Drinking Water & Purification Kits',
      quantity: '400 Emergency Water Filter Kits',
      urgency: 'CRITICAL',
      status: 'VERIFIED',
      submittedBy: 'ResQRoute Automated Check-In Sensor',
      submittedRole: 'auto_system',
      contactPhone: 'Automated Trigger (Village silent > 180 min)',
      detailsNote: 'Check-in beacon silent. Embankment sensor detected 1.3m water rise. Automatic emergency mission created.',
      submissionTime: timestampStr,
      verifiedTime: timestampStr,
      verifiedBy: 'System Auto-Verification (Hazard Protocol #9)',
      assignedDepotId: 'depot-jorhat',
      assignedDepotName: 'Jorhat Brahmaputra Riverine Base',
      escalationLevel: 'LEVEL_2_RELAY',
      relayDistanceKm: 28,
      relayMethod: 'boat',
      autoDetected: true
    };

    setRequests(prev => [autoReq, ...prev]);

    const newAlert: AlertNotification = {
      id: `alt-auto-${Date.now()}`,
      type: 'ISOLATION',
      title: `⚡ AUTO-DETECTED ISOLATION: ${targetVillage.name}`,
      message: `Village check-in signal lost for 180+ minutes in active flood zone. Auto-generated Level 2 relief mission for Jorhat base.`,
      timestamp: 'Just now',
      severity: 'critical',
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      read: false,
      requiresAction: true
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'requests');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'roads');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'villages');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'alerts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'ledger');
    
    setRequests(INITIAL_REQUESTS);
    setRoadSegments(INITIAL_ROAD_SEGMENTS);
    setVillages(INITIAL_VILLAGES);
    setAlerts(INITIAL_ALERTS);
    setLedger(INITIAL_LEDGER);
    setIsWeatherSimulated(false);
    setSelectedRequestId(null);
    setActiveCalculatedRoute(null);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        requests,
        villages,
        depots,
        roadSegments,
        alerts,
        ledger,
        selectedRequestId,
        setSelectedRequestId,
        activeCalculatedRoute,
        setActiveCalculatedRoute,
        submitReliefRequest,
        verifyRequest,
        rejectRequest,
        dispatchRequest,
        markDelivered,
        markAlertRead,
        unreadAlertsCount,
        toggleWeatherSimulation,
        isWeatherSimulated,
        updateRoadStatus,
        resetAllData,
        triggerAutoIsolationDemo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
