import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Globe2, 
  Package, 
  Search, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompletedLedgerItem } from '../types';

export const PublicLedgerView: React.FC = () => {
  const { ledger } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Unique districts for filtering
  const districts = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(item => set.add(item.district));
    return ['ALL', ...Array.from(set)];
  }, [ledger]);

  // Filtered ledger entries
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      const matchSearch =
        item.villageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceDepot.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDistrict = selectedDistrict === 'ALL' || item.district === selectedDistrict;

      return matchSearch && matchDistrict;
    });
  }, [ledger, searchTerm, selectedDistrict]);

  // Download CSV export helper
  const handleExportCSV = () => {
    const headers = ['Tracking Code', 'Village Name', 'District', 'State', 'Resource', 'Quantity', 'Source Depot', 'Status', 'Date Completed', 'Beneficiaries Served'];
    const rows = filteredLedger.map(i => [
      i.trackingCode,
      `"${i.villageName}"`,
      i.district,
      i.state,
      `"${i.resource}"`,
      `"${i.quantity}"`,
      `"${i.sourceDepot}"`,
      i.status,
      `"${i.completedDate}"`,
      i.beneficiariesCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ResQRoute_Relief_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                Public Transparency Portal
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Delivered Missions Only
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Emergency Relief Public Transparency Ledger
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Open public audit log of all completed disaster relief operations across Assam, Meghalaya, and the North Eastern Region.
            </p>
          </div>

          <div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by village, resource, depot, or tracking code..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* District Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {districts.map(d => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Districts' : d}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Public Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Village / District</th>
                <th className="px-5 py-4">Resource Delivered</th>
                <th className="px-5 py-4">Source Depot</th>
                <th className="px-5 py-4">Transport Mode</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No completed relief missions match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Village */}
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900">{item.villageName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.district}, {item.state} • <span className="font-mono text-[11px]">{item.trackingCode}</span>
                      </div>
                    </td>

                    {/* Resource & Quantity */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{item.resource}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.quantity}</div>
                    </td>

                    {/* Source Depot */}
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                      {item.sourceDepot}
                    </td>

                    {/* Transport */}
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {item.transportMethod}
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>Delivered</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {item.completedDate}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing <strong>{filteredLedger.length}</strong> delivered relief records</span>
          <span className="font-bold text-slate-700">Audit Source: Assam SDRF / Meghalaya DDMA Relief Cell</span>
        </div>
      </div>

    </div>
  );
};
