import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  Truck, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Package, 
  PlusCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReliefRequest, RequestStatus, ResourceType, UrgencyLevel } from '../types';

const RESOURCE_OPTIONS: ResourceType[] = [
  'Drinking Water & Purification Kits',
  'Emergency Medical Supplies & First Aid',
  'Dry Rations & Baby Food',
  'Tarpaulins & Flood Shelter Kits',
  'Search & Rescue Gear / Inflatable Boats',
  'High-Capacity Power Generators & Comms'
];

export const RequesterView: React.FC = () => {
  const { villages, requests, submitReliefRequest, selectedRequestId, setSelectedRequestId } = useApp();

  // Form State
  const [selectedVillageId, setSelectedVillageId] = useState(villages[0]?.id || '');
  const [resourceType, setResourceType] = useState<ResourceType>(RESOURCE_OPTIONS[0]);
  const [quantity, setQuantity] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('HIGH');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [detailsNote, setDetailsNote] = useState('');
  const [viewMode, setViewMode] = useState<'form' | 'tracking'>('tracking');
  const [submittedSuccessCode, setSubmittedSuccessCode] = useState<string | null>(null);

  // Filter requests submitted by requester/villagers
  const myRequests = requests.filter(r => r.submittedRole === 'villager' || r.submittedRole === 'official');
  const activeTrackedRequest = myRequests.find(r => r.id === selectedRequestId) || myRequests[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillageId || !quantity || !contactName) {
      alert('Please fill in village, resource quantity, and contact person.');
      return;
    }

    const newReq = submitReliefRequest({
      villageId: selectedVillageId,
      resourceType,
      quantity,
      urgency,
      contactName,
      contactPhone: contactPhone || '+91 98540-00000',
      detailsNote,
      isOfficialSubmission: false
    });

    setSubmittedSuccessCode(newReq.trackingCode);
    setViewMode('tracking');
  };

  // Helper for progress status steps
  const STATUS_STEPS: { key: RequestStatus; label: string; sub: string }[] = [
    { key: 'SUBMITTED', label: 'Request Received', sub: 'Logged in local intake register' },
    { key: 'VERIFIED', label: 'Verified', sub: 'Confirmed by Panchayat / DDMA' },
    { key: 'MATCHED', label: 'Matched', sub: 'Assigned to nearest staging depot' },
    { key: 'IN_TRANSIT', label: 'In Transit', sub: 'Relief convoy dispatched' },
    { key: 'DELIVERED', label: 'Delivered', sub: 'Handed over at village center' }
  ];

  const getStepProgressIndex = (status: RequestStatus): number => {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'VERIFIED': return 1;
      case 'MATCHED': return 2;
      case 'IN_TRANSIT': return 3;
      case 'DELIVERED': return 4;
      case 'REJECTED': return -1;
      default: return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Requester Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">Villager / Gaonburha Service</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Emergency Village Relief Assistance
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Submit your village's urgent supply requirements or track the real-time progress of your relief dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewMode('tracking'); setSubmittedSuccessCode(null); }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'tracking'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Track Relief Status ({myRequests.length})
            </button>
            <button
              onClick={() => { setViewMode('form'); setSubmittedSuccessCode(null); }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'form'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submittedSuccessCode && (
        <div className="mb-6 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-5 text-emerald-900 flex items-start gap-3.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-extrabold text-base text-emerald-950">
              Request Submitted Successfully!
            </div>
            <p className="text-sm text-emerald-800 mt-0.5">
              Your tracking reference is <strong className="font-mono bg-emerald-200/70 px-1.5 py-0.5 rounded text-emerald-950">{submittedSuccessCode}</strong>.
              Your request has been placed in the Government Verification Queue for priority processing.
            </p>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: FORM TO SUBMIT REQUEST */}
      {viewMode === 'form' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>New Emergency Resource Requisition Form</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your village location and specify the urgent supplies required for your residents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Village Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Affected Village / Habitation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <select
                    value={selectedVillageId}
                    onChange={(e) => setSelectedVillageId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.district}, {v.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Resource Type Needed <span className="text-rose-500">*</span>
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  {RESOURCE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Quantity / Scale */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Quantity / Families Affected <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 250 family water filter kits (1,200 people)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Urgency Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MEDIUM', 'HIGH', 'CRITICAL'] as UrgencyLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        urgency === lvl
                          ? lvl === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : lvl === 'HIGH'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Person Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Person (Gaonburha / Volunteer) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Biren Saikia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98540-12345"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Situation Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ground Situation Notes & Specific Landmark
              </label>
              <textarea
                rows={3}
                value={detailsNote}
                onChange={(e) => setDetailsNote(e.target.value)}
                placeholder="Mention any specific high-ground gathering points (e.g. Village Primary School, Embankment Shelter, Temple ground)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('tracking')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Emergency Request</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE 2: SIMPLE CLEAN TRACKER ONLY */
        <div className="space-y-6">
          
          {/* Request Selector Tabs if multiple requests exist */}
          {myRequests.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {myRequests.map(req => {
                const isSelected = activeTrackedRequest?.id === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono">{req.trackingCode}</span>
                    <span className="opacity-80">• {req.villageName.split('(')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTrackedRequest ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              
              {/* Top Details Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {activeTrackedRequest.trackingCode}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Submitted on {activeTrackedRequest.submissionTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    {activeTrackedRequest.villageName}
                  </h2>
                  <div className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600 inline" />
                    <strong>Resource:</strong> {activeTrackedRequest.resourceType}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Current Status</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                    {activeTrackedRequest.status === 'DELIVERED' 
                      ? 'Delivered to Village' 
                      : activeTrackedRequest.status === 'IN_TRANSIT' 
                      ? 'Convoy In Transit' 
                      : activeTrackedRequest.status === 'MATCHED'
                      ? 'Depot Matched'
                      : activeTrackedRequest.status === 'VERIFIED'
                      ? 'Government Verified'
                      : 'Pending Verification'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Quantity: {activeTrackedRequest.quantity}
                  </div>
                </div>
              </div>

              {/* Simple Clean Progress Bar (5 Steps) */}
              <div className="py-10">
                <div className="relative">
                  
                  {/* Progress Line */}
                  <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                  
                  <div 
                    className="hidden sm:block absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-700" 
                    style={{ 
                      width: `${Math.max(0, (getStepProgressIndex(activeTrackedRequest.status) / (STATUS_STEPS.length - 1)) * 100)}%` 
                    }}
                  />

                  {/* Step Circles */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
                    {STATUS_STEPS.map((step, idx) => {
                      const currentProgress = getStepProgressIndex(activeTrackedRequest.status);
                      const isCompleted = idx <= currentProgress;
                      const isCurrent = idx === currentProgress;

                      return (
                        <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:text-center">
                          
                          {/* Circle Icon */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-xs ${
                              isCompleted
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            } ${isCurrent ? 'scale-110 ring-4 ring-emerald-200' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          {/* Label */}
                          <div>
                            <div className={`text-xs font-bold ${isCurrent ? 'text-emerald-700 text-sm' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.label}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {step.sub}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status Update Details Box */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 text-sm">
                <div className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Latest Dispatch Status Update</span>
                </div>
                
                {activeTrackedRequest.status === 'DELIVERED' ? (
                  <p className="text-slate-700">
                    ✅ Relief consignment was confirmed successfully delivered to <strong>{activeTrackedRequest.villageName}</strong> at {activeTrackedRequest.deliveredTime}. Village distribution is complete.
                  </p>
                ) : activeTrackedRequest.status === 'IN_TRANSIT' ? (
                  <p className="text-slate-700">
                    🚚 Relief convoy has departed from <strong>{activeTrackedRequest.assignedDepotName}</strong> ({activeTrackedRequest.assignedVehicle}). Dispatched at {activeTrackedRequest.dispatchedTime}.
                  </p>
                ) : activeTrackedRequest.status === 'VERIFIED' ? (
                  <p className="text-slate-700">
                    🛡️ Verified by <strong>{activeTrackedRequest.verifiedBy || 'Disaster Management Authority'}</strong> at {activeTrackedRequest.verifiedTime}. Assigned for immediate vehicle matching.
                  </p>
                ) : (
                  <p className="text-slate-700">
                    📋 Request received and registered into the priority queue at {activeTrackedRequest.submissionTime}. Awaiting one-click validation by your local Panchayat / DDMA official.
                  </p>
                )}

                {activeTrackedRequest.detailsNote && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                    <strong>Your notes:</strong> {activeTrackedRequest.detailsNote}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Active Requests Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Submit a new emergency resource request to track live progress.
              </p>
              <button
                onClick={() => setViewMode('form')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Submit First Request
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
