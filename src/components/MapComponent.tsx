import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  CalculatedRoute,
  Depot,
  LocationPoint,
  ReliefRequest,
  RoadSegment,
  RoadStatus,
  UserRole,
  Village
} from '../types';
import {
  Layers,
  Car,
  Compass,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  Key,
  Eye,
  Info,
  ShieldAlert,
  Navigation,
  Package,
  Boxes,
  Truck,
  Droplets,
  HeartPulse,
  Tent,
  LifeBuoy
} from 'lucide-react';

interface MapComponentProps {
  depots: Depot[];
  villages: Village[];
  roadSegments: RoadSegment[];
  activeRoute: CalculatedRoute | null;
  selectedSourceId?: string | null;
  selectedTargetId?: string | null;
  onSelectLocation?: (location: LocationPoint) => void;
  onSelectRoad?: (road: RoadSegment) => void;
  heightClass?: string;
  showAllVillages?: boolean;
  simplifiedView?: boolean;
  role?: UserRole;
  requests?: ReliefRequest[];
  travelerMarker?: {
    position: [number, number];
    bearing: number;
    isNavigating: boolean;
  } | null;
}

const STATUS_COLORS: Record<RoadStatus, { color: string; label: string; strokeOpacity: number; strokePattern?: number[] }> = {
  OPEN: { color: '#10b981', label: 'Open / Passable', strokeOpacity: 0.85 },
  RISKY: { color: '#f59e0b', label: 'Risky / Heavy Rain Caution', strokeOpacity: 0.9 },
  BLOCKED: { color: '#ef4444', label: 'Blocked / Flood Overflow', strokeOpacity: 0.95 },
  IMPASSABLE: { color: '#64748b', label: 'Impassable / Washed Out', strokeOpacity: 0.8 }
};

export function getDepotStockHealth(depot: Depot): { status: 'healthy' | 'low'; label: string; ringColor: string } {
  if (!depot.stockSummary) return { status: 'healthy', label: 'Stock Available', ringColor: '#10b981' };
  const s = depot.stockSummary;
  const isLow = s.waterKits < 2500 || s.medKits < 800 || s.rationsTons < 22 || s.boats < 4;
  if (isLow) {
    return { status: 'low', label: 'Stock Limited', ringColor: '#f59e0b' };
  }
  return { status: 'healthy', label: 'Well Stocked', ringColor: '#10b981' };
}

export function getVillageUrgencyStatus(village: Village, requestsList: ReliefRequest[] = []): {
  status: 'critical' | 'pending' | 'normal';
  label: string;
  ringColor: string;
  activeRequests: ReliefRequest[];
} {
  const vRequests = requestsList.filter(
    r => r.villageId === village.id && r.status !== 'DELIVERED' && r.status !== 'REJECTED'
  );
  const hasCritical = vRequests.some(r => r.urgency === 'CRITICAL') || village.isAutoDetectedIsolated;
  const hasPending = vRequests.length > 0;

  if (hasCritical) {
    return { status: 'critical', label: 'Critical Need', ringColor: '#ef4444', activeRequests: vRequests };
  }
  if (hasPending) {
    return { status: 'pending', label: 'Relief In Transit', ringColor: '#f59e0b', activeRequests: vRequests };
  }
  return { status: 'normal', label: 'Normal / Stable', ringColor: '#10b981', activeRequests: vRequests };
}

/**
 * Custom Polyline Overlays for Google Maps
 * Renders the road network and active route on the map instance.
 */
const MapOverlays: React.FC<{
  roadSegments: RoadSegment[];
  activeRoute: CalculatedRoute | null;
  onSelectRoad?: (road: RoadSegment) => void;
  simplifiedView?: boolean;
  onHoverRoad?: (road: RoadSegment | null, position?: { lat: number; lng: number }) => void;
}> = ({ roadSegments, activeRoute, onSelectRoad, simplifiedView, onHoverRoad }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  // Keep references to clean up polylines
  useEffect(() => {
    if (!map || !mapsLib) return;

    const polylines: google.maps.Polyline[] = [];

    // 1. Render all road segments
    roadSegments.forEach(road => {
      const isPartofActiveRoute = activeRoute?.segments.some(s => s.id === road.id);
      const styleConfig = STATUS_COLORS[road.status];
      const path = road.coordinates.map(([lat, lng]) => ({ lat, lng }));

      const isDashed = road.status === 'RISKY' || road.status === 'IMPASSABLE';

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: styleConfig.color,
        strokeOpacity: isDashed ? 0 : styleConfig.strokeOpacity,
        strokeWeight: isPartofActiveRoute ? 6 : (simplifiedView ? 3.5 : 4.5),
        icons: isDashed
          ? [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 3,
                  strokeColor: styleConfig.color
                },
                offset: '0',
                repeat: '12px'
              }
            ]
          : undefined,
        map
      });

      // Interactive Click & Hover
      polyline.addListener('click', () => {
        if (onSelectRoad) onSelectRoad(road);
      });

      polyline.addListener('mouseover', (e: google.maps.PolyMouseEvent) => {
        polyline.setOptions({
          strokeWeight: isPartofActiveRoute ? 8 : (simplifiedView ? 5 : 6.5),
          zIndex: 10
        });
        if (onHoverRoad && e.latLng) {
          onHoverRoad(road, { lat: e.latLng.lat(), lng: e.latLng.lng() });
        }
      });

      polyline.addListener('mouseout', () => {
        polyline.setOptions({
          strokeWeight: isPartofActiveRoute ? 6 : (simplifiedView ? 3.5 : 4.5),
          zIndex: 1
        });
        if (onHoverRoad) {
          onHoverRoad(null);
        }
      });

      polylines.push(polyline);
    });

    // 2. Render Active Calculated Route (Glowing corridor)
    if (activeRoute && activeRoute.pathCoordinates.length > 0) {
      const isLevel3 = activeRoute.escalationLevel === 'LEVEL_3_AIRDROP';
      const isLevel2 = activeRoute.escalationLevel === 'LEVEL_2_RELAY';
      const routePath = activeRoute.pathCoordinates.map(([lat, lng]) => ({ lat, lng }));

      // Glowing underlay
      const glowPolyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: isLevel3 ? '#8b5cf6' : (isLevel2 ? '#f59e0b' : '#3b82f6'),
        strokeOpacity: 0.35,
        strokeWeight: 12,
        zIndex: 20,
        map
      });
      polylines.push(glowPolyline);

      // Sharp primary route line
      const mainPolyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: isLevel3 ? '#7c3aed' : (isLevel2 ? '#d97706' : '#2563eb'),
        strokeOpacity: 0.95,
        strokeWeight: 5.5,
        zIndex: 21,
        icons: isLevel3
          ? [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 4,
                  strokeColor: '#7c3aed'
                },
                offset: '0',
                repeat: '16px'
              }
            ]
          : undefined,
        map
      });
      polylines.push(mainPolyline);

      // Auto fit bounds to active route
      try {
        const bounds = new google.maps.LatLngBounds();
        routePath.forEach(pt => bounds.extend(pt));
        map.fitBounds(bounds, {
          top: 60,
          bottom: 60,
          left: 60,
          right: 60
        });
      } catch (err) {
        console.error('Error fitting Google Maps bounds:', err);
      }
    }

    return () => {
      polylines.forEach(p => p.setMap(null));
    };
  }, [map, mapsLib, roadSegments, activeRoute, simplifiedView, onSelectRoad, onHoverRoad]);

  return null;
};

/**
 * Traffic Layer Component for Google Maps
 */
const TrafficOverlay: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || !enabled) return;

    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, mapsLib, enabled]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  depots,
  villages,
  roadSegments,
  activeRoute,
  selectedSourceId,
  selectedTargetId,
  onSelectLocation,
  onSelectRoad,
  heightClass = 'h-[540px] md:h-[620px]',
  showAllVillages = true,
  simplifiedView = false,
  role,
  requests = [],
  travelerMarker
}) => {
  const isPrivilegedRole = role === 'provider' || role === 'official';

  // Read configured Google Maps API Key or fallback
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      (typeof window !== 'undefined' && (window as any).__GOOGLE_MAPS_API_KEY) ||
      ''
    );
  });

  const [mapType, setMapType] = useState<string>('terrain');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [activeInfoWindow, setActiveInfoWindow] = useState<{
    type: 'depot' | 'village' | 'road' | 'traveler';
    data: any;
    position: { lat: number; lng: number };
  } | null>(null);

  const [hoveredRoadInfo, setHoveredRoadInfo] = useState<{
    road: RoadSegment;
    position: { lat: number; lng: number };
  } | null>(null);

  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');

  const handleSaveKey = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      if (typeof window !== 'undefined') {
        (window as any).__GOOGLE_MAPS_API_KEY = inputKey.trim();
      }
      setShowKeyModal(false);
    }
  };

  const handleHoverRoad = useCallback((road: RoadSegment | null, position?: { lat: number; lng: number }) => {
    if (road && position) {
      setHoveredRoadInfo({ road, position });
    } else {
      setHoveredRoadInfo(null);
    }
  }, []);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100`}>
      <APIProvider apiKey={apiKey} libraries={['maps', 'marker', 'routes', 'places']}>
        <Map
          id="resqroute-google-map"
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: 26.40, lng: 93.10 }}
          defaultZoom={8}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={true}
          fullscreenControl={true}
          className="w-full h-full"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Custom Polylines Overlay */}
          <MapOverlays
            roadSegments={roadSegments}
            activeRoute={activeRoute}
            onSelectRoad={onSelectRoad}
            simplifiedView={simplifiedView}
            onHoverRoad={handleHoverRoad}
          />

          {/* Real-Time Live Traffic Layer */}
          <TrafficOverlay enabled={showTraffic} />

          {/* 1. Depot Advanced Markers with Stock Health (Privileged Roles) */}
          {depots.map(depot => {
            const isSelected = selectedSourceId === depot.id;
            const stockHealth = getDepotStockHealth(depot);

            return (
              <AdvancedMarker
                key={depot.id}
                position={{ lat: depot.lat, lng: depot.lng }}
                title={`${depot.name} (${stockHealth.label})`}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'depot',
                    data: depot,
                    position: { lat: depot.lat, lng: depot.lng }
                  });
                  if (onSelectLocation) onSelectLocation(depot);
                }}
              >
                <div
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-md border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-800 text-white border-white scale-110 ring-4 ring-blue-300/80 z-30'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-white hover:scale-105 z-10'
                  }`}
                  style={{
                    transform: 'translate(-50%, -50%)',
                    boxShadow: isPrivilegedRole ? `0 0 0 2.5px ${stockHealth.ringColor}` : undefined
                  }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>{depot.name.split(' ')[0]} Hub</span>
                  {isPrivilegedRole && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        stockHealth.status === 'healthy' ? 'bg-emerald-300 ring-1 ring-white' : 'bg-amber-300 ring-1 ring-white animate-pulse'
                      }`}
                      title={stockHealth.label}
                    />
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 2. Village Advanced Markers with Urgency Rings (Privileged Roles) */}
          {showAllVillages &&
            villages.map(vil => {
              const isSelected = selectedTargetId === vil.id;
              const isIsolated = vil.isAutoDetectedIsolated;
              const urgencyInfo = getVillageUrgencyStatus(vil, requests);

              const badgeColor = isPrivilegedRole
                ? urgencyInfo.ringColor
                : (vil.riskZone === 'OPEN' ? '#10b981' : vil.riskZone === 'RISKY' ? '#f59e0b' : '#ef4444');

              return (
                <AdvancedMarker
                  key={vil.id}
                  position={{ lat: vil.lat, lng: vil.lng }}
                  title={`${vil.name} (${isPrivilegedRole ? urgencyInfo.label : vil.riskZone + ' ZONE'})`}
                  onClick={() => {
                    setActiveInfoWindow({
                      type: 'village',
                      data: { ...vil, _urgency: urgencyInfo },
                      position: { lat: vil.lat, lng: vil.lng }
                    });
                    if (onSelectLocation) onSelectLocation(vil);
                  }}
                >
                  <div
                    className={`px-2 py-1 rounded-full font-bold text-[11px] shadow-sm border-2 flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-900 text-white border-white scale-110 ring-4 ring-rose-400/60 z-30'
                        : isIsolated
                        ? 'bg-rose-600 text-white border-white animate-pulse z-20'
                        : 'bg-white text-slate-900 hover:bg-slate-50 z-10'
                    }`}
                    style={{
                      borderColor: badgeColor,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: isPrivilegedRole && urgencyInfo.status === 'critical' ? '0 0 10px rgba(239, 68, 68, 0.6)' : undefined
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: badgeColor }}
                    />
                    <span>{vil.name.split('(')[0].trim()}</span>
                    {isIsolated && (
                      <span className="text-[9px] bg-rose-950 text-rose-100 px-1 py-0.2 rounded font-black tracking-wider">
                        ISOLATED
                      </span>
                    )}
                    {isPrivilegedRole && urgencyInfo.activeRequests.length > 0 && (
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        urgencyInfo.status === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {urgencyInfo.activeRequests.length} need
                      </span>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* 3. Moving Traveler / Vehicle Marker (Feature A) */}
          {travelerMarker && travelerMarker.position && (
            <AdvancedMarker
              position={{ lat: travelerMarker.position[0], lng: travelerMarker.position[1] }}
              title="Current Vehicle Position (Live Navigation)"
              onClick={() => {
                setActiveInfoWindow({
                  type: 'traveler',
                  data: {
                    position: travelerMarker.position,
                    bearing: travelerMarker.bearing,
                    isNavigating: travelerMarker.isNavigating
                  },
                  position: { lat: travelerMarker.position[0], lng: travelerMarker.position[1] }
                });
              }}
            >
              <div
                className="relative flex items-center justify-center cursor-pointer z-40"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                {/* Pulsing Ripple Radar */}
                <div className="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping" />
                <div className="absolute w-8 h-8 rounded-full bg-blue-600/40 animate-pulse" />

                {/* Rotating Vehicle Heading Disc */}
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white border-2 border-white shadow-xl flex items-center justify-center transition-transform duration-75"
                  style={{ transform: `rotate(${travelerMarker.bearing}deg)` }}
                >
                  <Navigation className="w-4 h-4 fill-white text-white drop-shadow" />
                </div>

                {/* Live Floating Tag */}
                <div className="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-extrabold tracking-wide border border-slate-700 shadow-md">
                  🚗 Vehicle En Route
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* 4. Hazard Markers for Blocked / Impassable Roads */}
          {!simplifiedView &&
            roadSegments
              .filter(r => r.status === 'BLOCKED' || r.status === 'IMPASSABLE')
              .map(road => {
                const midIdx = Math.floor(road.coordinates.length / 2);
                const [lat, lng] = road.coordinates[midIdx];
                return (
                  <AdvancedMarker
                    key={`hazard-${road.id}`}
                    position={{ lat, lng }}
                    title={`Road Hazard: ${road.hazardReason}`}
                    onClick={() => {
                      setActiveInfoWindow({
                        type: 'road',
                        data: road,
                        position: { lat, lng }
                      });
                      if (onSelectRoad) onSelectRoad(road);
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full bg-rose-600 text-white border-2 border-white shadow-md flex items-center justify-center font-bold text-xs cursor-pointer hover:scale-110 transition-transform"
                      style={{ transform: 'translate(-50%, -50%)' }}
                    >
                      ✕
                    </div>
                  </AdvancedMarker>
                );
              })}

          {/* Active InfoWindow */}
          {activeInfoWindow && (
            <InfoWindow
              position={activeInfoWindow.position}
              onCloseClick={() => setActiveInfoWindow(null)}
              headerContent={
                <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {activeInfoWindow.type === 'depot'
                    ? 'Relief Staging Depot'
                    : activeInfoWindow.type === 'village'
                    ? 'Settlement Need & Vulnerability'
                    : activeInfoWindow.type === 'traveler'
                    ? 'Live Commuter / Dispatch Vehicle'
                    : 'Road Hazard Alert'}
                </div>
              }
            >
              <div className="p-1 min-w-[240px] max-w-xs text-xs text-slate-800 font-sans">
                {activeInfoWindow.type === 'depot' && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-extrabold text-sm text-blue-900">
                        {activeInfoWindow.data.name}
                      </h4>
                      {isPrivilegedRole && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          getDepotStockHealth(activeInfoWindow.data).status === 'healthy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {getDepotStockHealth(activeInfoWindow.data).label}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 mb-2">
                      {activeInfoWindow.data.district}, {activeInfoWindow.data.state}
                    </p>

                    {/* Stock Breakdown (Feature B) */}
                    {activeInfoWindow.data.stockSummary && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-2 space-y-1.5">
                        <div className="font-bold text-slate-700 text-[11px] flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5 text-blue-700" />
                            <span>Current Stock Inventory:</span>
                          </span>
                          <span className="text-blue-700 font-bold">{activeInfoWindow.data.capacityTonnes}t capacity</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-200">
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span>Water: <strong>{activeInfoWindow.data.stockSummary.waterKits.toLocaleString()}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Meds: <strong>{activeInfoWindow.data.stockSummary.medKits.toLocaleString()}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Rations: <strong>{activeInfoWindow.data.stockSummary.rationsTons}t</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Tent className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Tarps: <strong>{activeInfoWindow.data.stockSummary.shelterTarps.toLocaleString()}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 col-span-2">
                            <LifeBuoy className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Boats / Catamarans: <strong>{activeInfoWindow.data.stockSummary.boats} units</strong></span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div><strong>Commander:</strong> {activeInfoWindow.data.commanderName}</div>
                      <div><strong>Contact:</strong> {activeInfoWindow.data.contactNumber}</div>
                    </div>
                  </div>
                )}

                {activeInfoWindow.type === 'village' && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {activeInfoWindow.data.name}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                        style={{
                          backgroundColor:
                            activeInfoWindow.data.riskZone === 'OPEN'
                              ? '#d1fae5'
                              : activeInfoWindow.data.riskZone === 'RISKY'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            activeInfoWindow.data.riskZone === 'OPEN'
                              ? '#065f46'
                              : activeInfoWindow.data.riskZone === 'RISKY'
                              ? '#92400e'
                              : '#991b1b'
                        }}
                      >
                        {activeInfoWindow.data.riskZone}
                      </span>
                    </div>
                    <p className="text-slate-500 mb-2">
                      {activeInfoWindow.data.district}, {activeInfoWindow.data.state} • Pop: {activeInfoWindow.data.population?.toLocaleString()}
                    </p>

                    {/* Active Outstanding Need (Feature B) */}
                    {isPrivilegedRole && (
                      <div className="mb-2">
                        {requests.filter(r => r.villageId === activeInfoWindow.data.id && r.status !== 'DELIVERED' && r.status !== 'REJECTED').length > 0 ? (
                          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1 text-[11px]">
                            <div className="font-bold text-amber-900 flex items-center justify-between">
                              <span>🚨 Active Relief Request:</span>
                              <span className="font-mono text-[10px]">{requests.find(r => r.villageId === activeInfoWindow.data.id)?.trackingCode}</span>
                            </div>
                            {requests
                              .filter(r => r.villageId === activeInfoWindow.data.id && r.status !== 'DELIVERED' && r.status !== 'REJECTED')
                              .map(req => (
                                <div key={req.id} className="pt-1 border-t border-amber-200/60">
                                  <div className="font-semibold text-slate-900">{req.resourceType}</div>
                                  <div className="text-slate-600">Qty: <strong>{req.quantity}</strong> • Urgency: <strong className="text-rose-700">{req.urgency}</strong></div>
                                  <div className="text-amber-800 mt-0.5">Status: <strong>{req.status}</strong> {req.assignedVehicle ? `(${req.assignedVehicle})` : ''}</div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            <span>No outstanding emergency requests pending</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-[11px]">
                      <div><strong>Primary Hazard:</strong> {activeInfoWindow.data.vulnerabilityFactor}</div>
                      <div><strong>Contact:</strong> {activeInfoWindow.data.contactPerson} ({activeInfoWindow.data.phone})</div>
                      {activeInfoWindow.data.isAutoDetectedIsolated && (
                        <div className="text-rose-600 font-bold flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Auto-Detected Cut Off from Road Network</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeInfoWindow.type === 'traveler' && (
                  <div>
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1">
                      <Truck className="w-4 h-4" />
                      <span>Live Traveler / Dispatch Position</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                      Vehicle En Route
                    </h4>
                    <p className="text-slate-600 text-[11px] mb-2 leading-relaxed">
                      Coordinates: {activeInfoWindow.data.position[0].toFixed(4)}° N, {activeInfoWindow.data.position[1].toFixed(4)}° E
                    </p>
                    <div className="text-[11px] bg-blue-50 text-blue-900 p-2 rounded-lg border border-blue-200 font-medium">
                      Status: {activeInfoWindow.data.isNavigating ? 'Active navigation in progress' : 'Paused / At waypoint'}
                    </div>
                  </div>
                )}

                {activeInfoWindow.type === 'road' && (
                  <div>
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold mb-1">
                      <ShieldAlert className="w-4 h-4" />
                      <span>{activeInfoWindow.data.status} ROAD</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                      {activeInfoWindow.data.name}
                    </h4>
                    <p className="text-slate-600 bg-rose-50 border border-rose-200 p-2 rounded-lg text-[11px] mb-2">
                      ⚠️ {activeInfoWindow.data.hazardReason}
                    </p>
                    <div className="text-[11px] text-slate-500">
                      <strong>Distance:</strong> {activeInfoWindow.data.distanceKm} km
                    </div>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200 shadow-md">
        {/* Map Type Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setMapType('terrain')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              mapType === 'terrain' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terrain
          </button>
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              mapType === 'roadmap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              mapType === 'satellite' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Live Traffic Toggle */}
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
            showTraffic
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Google Maps Live Traffic"
        >
          <Car className="w-3.5 h-3.5" />
          <span>Traffic {showTraffic ? 'ON' : 'OFF'}</span>
        </button>

        {/* API Key / Demo Key Config Button */}
        <button
          onClick={() => setShowKeyModal(true)}
          className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 transition-all flex items-center gap-1"
          title="Google Maps Platform API Key configuration"
        >
          <Key className="w-3.5 h-3.5 text-emerald-600" />
          <span>Maps Key</span>
        </button>
      </div>

      {/* Floating Hover Card for Road Segments */}
      {hoveredRoadInfo && (
        <div className="absolute top-16 left-3 z-10 bg-slate-950/90 text-white backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl max-w-xs text-xs pointer-events-none animate-in fade-in">
          <div className="font-extrabold text-sm">{hoveredRoadInfo.road.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: STATUS_COLORS[hoveredRoadInfo.road.status].color }}
            />
            <span className="font-bold">{hoveredRoadInfo.road.status}</span>
            <span className="text-slate-400">• {hoveredRoadInfo.road.distanceKm} km</span>
          </div>
          {hoveredRoadInfo.road.status !== 'OPEN' && (
            <div className="text-rose-300 text-[11px] mt-1.5 font-medium">
              ⚠️ {hoveredRoadInfo.road.hazardReason}
            </div>
          )}
        </div>
      )}

      {/* Map Legend Overlay Bottom-Left */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs">
        <div className="font-bold text-slate-800 mb-1.5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>ResQRoute Network</span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Google Maps Powered
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
            <span>Open (Clear)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span>
            <span>Risky (Caution)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full inline-block"></span>
            <span>Blocked (Flood)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-slate-500 rounded-full inline-block border border-dashed border-slate-700"></span>
            <span>Impassable</span>
          </div>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Google Maps Platform Key</h3>
                  <p className="text-xs text-slate-500">Configure or test with custom API key</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                The map currently utilizes Google Maps Platform with <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">DEMO_MAP_ID</code>. You can paste your production Google Maps API Key or Maps Demo Key below.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Maps Platform API Key
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Maps Demo Key Quickstart</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  You can get a free Maps Demo Key with zero billing setup at{' '}
                  <a
                    href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold hover:text-emerald-950"
                  >
                    mapsplatform.google.com/maps-demo-key
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
              >
                Apply Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
