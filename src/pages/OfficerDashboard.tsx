import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAllApplicationsSnapshot } from '../firebase/application.js';
import { useAuth } from '../context/AuthContext';
import { Application } from '../types';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Search, Scale, FileCheck, ArrowRight, Loader2, Map as MapIcon } from 'lucide-react';
import { INSTRUMENT_CATEGORIES } from '../constants/legalMetrologyRules.js';
import { GISMap } from '../components/GISMap';

export const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'approved' | 'rejected' | 'all'>('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMap, setShowMap] = useState(true);
  const [route, setRoute] = useState<Array<[number, number]>>([]);

  useEffect(() => {
    const unsubscribe = onAllApplicationsSnapshot((apps) => {
      setAllApplications(apps as Application[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter applications assigned to the current officer
  const myAssigned = allApplications.filter(
    app => app.assignedOfficerId === user?.uid && (app.status === 'Pending' || app.status === 'under_review' || app.status === 'inspection_scheduled')
  );
  const myApproved = allApplications.filter(
    app => app.assignedOfficerId === user?.uid && app.status === 'Approved'
  );
  const myRejected = allApplications.filter(
    app => app.assignedOfficerId === user?.uid && app.status === 'Rejected'
  );

  const getTabApps = () => {
    switch (activeTab) {
      case 'assigned': return myAssigned;
      case 'approved': return myApproved;
      case 'rejected': return myRejected;
      case 'all': return allApplications;
    }
  };

  const displayedApps = getTabApps().filter((app) => {
    const term = searchTerm.toLowerCase();
    return (
      app.instrumentName.toLowerCase().includes(term) ||
      app.instrumentType.toLowerCase().includes(term) ||
      app.ownerName.toLowerCase().includes(term) ||
      app.serialNumber.toLowerCase().includes(term) ||
      app.id.toLowerCase().includes(term) ||
      (app.location?.district || '').toLowerCase().includes(term)
    );
  });

  const mapMarkers = displayedApps
    .filter(app => app.location && app.location.latitude && app.location.longitude)
    .map(app => ({
      id: app.id,
      position: [app.location!.latitude, app.location!.longitude] as [number, number],
      title: app.instrumentName,
      description: `${app.ownerName} — ${app.location?.district ?? ''} — ${app.status}`
    }));

  const handlePlanRoute = () => {
    if (mapMarkers.length < 2) {
      alert("Need at least 2 locations to plan a route.");
      return;
    }
    
    // Nearest neighbor simple routing implementation
    const unvisited = [...mapMarkers];
    const path: Array<[number, number]> = [];
    
    // Start with the first marker
    let current = unvisited.shift()!;
    path.push(current.position);

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        // Simple Euclidean distance since Turf requires more imports and we just want visual proximity
        const dLat = current.position[0] - unvisited[i].position[0];
        const dLng = current.position[1] - unvisited[i].position[1];
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      current = unvisited.splice(nearestIdx, 1)[0];
      path.push(current.position);
    }

    setRoute(path);
  };

  const tabs = [
    { key: 'assigned' as const, label: 'Assigned', count: myAssigned.length, icon: Clock },
    { key: 'approved' as const, label: 'Approved', count: myApproved.length, icon: CheckCircle2 },
    { key: 'rejected' as const, label: 'Rejected', count: myRejected.length, icon: XCircle },
    { key: 'all' as const, label: 'All', count: allApplications.length, icon: FileCheck },
  ];

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Officer Header */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                Official Inspection Portal
              </span>
              <span className="text-xs text-slate-500">Legal Metrology Officer Jurisdiction</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Field Verification & Inspection Queue
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Review submitted instruments, verify laboratory calibration reports or field test data, and issue certificates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-right">
              <span className="text-xs text-blue-800 font-medium block">My Assigned</span>
              <span className="text-2xl font-black text-blue-900 leading-none">
                {myAssigned.length}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-right">
              <span className="text-xs text-emerald-800 font-medium block">Completed</span>
              <span className="text-2xl font-black text-emerald-900 leading-none">
                {myApproved.length + myRejected.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 w-full sm:w-auto flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  id={`tab-${tab.key}-btn`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label} ({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Route Plan Button */}
              {showMap && mapMarkers.length > 1 && (
                <button
                  onClick={handlePlanRoute}
                  className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Plan Route
                </button>
              )}
              {/* Map Toggle */}
              <button
                onClick={() => setShowMap(!showMap)}
                className={`p-2 rounded-lg border text-xs font-medium transition-colors ${showMap ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search queue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Map View (collapsible) */}
          {showMap && mapMarkers.length > 0 && (
            <div className="border-b border-slate-200">
               <GISMap 
                 markers={mapMarkers} 
                 route={route}
                 className="h-72 w-full z-0" 
               />
            </div>
          )}

          {/* Applications Table */}
          {loading ? (
            <div className="py-14 flex items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
              Loading inspection queue...
            </div>
          ) : displayedApps.length === 0 ? (
            <div className="py-14 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-slate-800">
                {activeTab === 'assigned' ? 'No Assigned Applications' : activeTab === 'all' ? 'No applications found' : `No ${activeTab} applications`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {activeTab === 'assigned'
                  ? 'There are currently no instruments waiting for your verification.'
                  : 'No records matched your search query.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Application ID</th>
                    <th className="py-3 px-4">Instrument Details</th>
                    <th className="py-3 px-4">Category & Cycle</th>
                    <th className="py-3 px-4">Commercial Owner</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedApps.map((app) => {
                    const cycleMonths =
                      INSTRUMENT_CATEGORIES[app.instrumentType]?.reverificationMonths || 12;
                    const submittedDateStr = new Date(app.submittedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-blue-700">
                          {app.id.substring(0, 8)}…
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{app.instrumentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            SN: {app.serialNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 text-xs text-slate-800 font-medium">
                            <Scale className="w-3 h-3 text-blue-600" />
                            <span>{app.instrumentType}</span>
                          </div>
                          <div className="text-[11px] text-blue-700 font-medium">
                            {cycleMonths} Months Validity
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{app.ownerName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs" title={app.address}>
                            {app.address}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {app.location?.district ?? 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {submittedDateStr}
                        </td>
                        <td className="py-3.5 px-4">
                          {app.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {app.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {app.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {app.status === 'Pending' ? (
                            <button
                              id={`review-btn-${app.id}`}
                              onClick={() => navigate(`/review/${app.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              <span>Review</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (app.status === 'Approved') {
                                  navigate(`/certificate/${app.id}`);
                                } else {
                                  navigate(`/review/${app.id}`);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                            >
                              <span>{app.status === 'Approved' ? 'Certificate' : 'Details'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
