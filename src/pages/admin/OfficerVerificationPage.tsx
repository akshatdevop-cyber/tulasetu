import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingRegistrations, approveOfficerRegistration, rejectOfficerRegistration } from '../../firebase/admin';
import { OfficerRegistration, Officer, Application } from '../../types';
import { ShieldAlert, Check, X, UserSearch, LayoutDashboard, Map as MapIcon, Users, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { onAllApplicationsSnapshot } from '../../firebase/application.js';
import { GISMap } from '../../components/GISMap';
import toast from 'react-hot-toast';

export const OfficerVerificationPage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'workload' | 'heatmap'>('queue');
  
  const [registrations, setRegistrations] = useState<OfficerRegistration[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'admin') {
      loadData();
    }
  }, [role]);

  const loadData = async () => {
    try {
      // Load pending registrations
      const regs = await getPendingRegistrations();
      setRegistrations(regs);
      
      // Load all officers for workload
      const offSnapshot = await getDocs(collection(db, 'officers'));
      setOfficers(offSnapshot.docs.map(d => d.data() as Officer));
      
      // Subscribe to all applications for heatmap
      onAllApplicationsSnapshot((apps) => {
        setApplications(apps as Application[]);
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    if (!user) return;
    try {
      await approveOfficerRegistration(uid, user.uid);
      setRegistrations(registrations.filter(r => r.uid !== uid));
      toast.success('Officer approved successfully');
      loadData(); // refresh officers list
    } catch (err) {
      toast.error("Failed to approve: " + err);
    }
  };

  const handleReject = async (uid: string) => {
    if (!user) return;
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await rejectOfficerRegistration(uid, user.uid, reason);
      setRegistrations(registrations.filter(r => r.uid !== uid));
      toast.success('Officer rejected');
    } catch (err) {
      toast.error("Failed to reject: " + err);
    }
  };

  if (role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access Denied: Administrators only.</div>;
  }

  if (loading) return (
    <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span>Loading Admin Dashboard...</span>
    </div>
  );

  // Prepare Heatmap markers
  // For the MVP, we use standard Leaflet markers with varying colors based on status, to simulate a heatmap.
  const heatmapMarkers = applications
    .filter(app => app.location && app.location.latitude && app.location.longitude)
    .map(app => {
      // Determine urgency/status for "Heat"
      let urgencyDesc = 'Normal';
      if (app.status === 'Pending' || app.status === 'under_review') urgencyDesc = 'Pending/Review (High Heat)';
      if (app.status === 'Approved') urgencyDesc = 'Approved (Low Heat)';
      
      return {
        id: app.id,
        position: [app.location!.latitude, app.location!.longitude] as [number, number],
        title: `${app.instrumentName} - ${urgencyDesc}`,
        description: `Status: ${app.status} | District: ${app.location?.district}`
      };
    });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <LayoutDashboard className="w-8 h-8 text-blue-700" />
          <h1 className="text-2xl font-bold text-slate-900">Administrator Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-1 gap-1 mb-6">
          <button 
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${activeTab === 'queue' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ShieldAlert className="w-4 h-4" /> Verification Queue ({registrations.length})
          </button>
          <button 
            onClick={() => setActiveTab('workload')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${activeTab === 'workload' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" /> Officer Workload
          </button>
          <button 
            onClick={() => setActiveTab('heatmap')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${activeTab === 'heatmap' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MapIcon className="w-4 h-4" /> Application Heatmap
          </button>
        </div>

        {/* Tab: Queue */}
        {activeTab === 'queue' && (
          <div>
            {registrations.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl border border-slate-200">
                <UserSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No pending officer registrations.</p>
              </div>
            ) : (
              registrations.map(reg => (
                <div key={reg.uid} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 mb-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900">{reg.name} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded ml-2">ID: {reg.officerId}</span></h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <p><strong>Email:</strong> {reg.email}</p>
                      <p><strong>Department:</strong> {reg.department}</p>
                      <p><strong>Designation:</strong> {reg.designation}</p>
                      <p><strong>Jurisdiction:</strong> {reg.district}, {reg.state}</p>
                    </div>
                  </div>
                  <div className="w-48 shrink-0">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Submitted ID Card</p>
                    <img src={reg.idCardImageUrl} alt="ID Card" className="w-full h-auto rounded border border-slate-300 shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-3 justify-center shrink-0 border-l border-slate-100 pl-6">
                    <button onClick={() => handleApprove(reg.uid)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(reg.uid)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-sm flex items-center gap-2">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Workload */}
        {activeTab === 'workload' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">ID / Department</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Current Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officers.map(off => (
                  <tr key={off.uid} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{off.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{off.officerId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{off.jurisdiction?.district || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {off.available ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-xs font-semibold">Available</span>
                      ) : (
                        <span className="text-rose-700 bg-rose-100 px-2 py-1 rounded text-xs font-semibold">Unavailable</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg font-bold text-blue-700">{off.workload}</span>
                    </td>
                  </tr>
                ))}
                {officers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No approved officers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Heatmap */}
        {activeTab === 'heatmap' && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Application Distribution</h3>
            {heatmapMarkers.length > 0 ? (
              <GISMap markers={heatmapMarkers} className="w-full h-[500px] rounded border border-slate-200 z-0" />
            ) : (
              <div className="py-12 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg">
                No geo-located applications available for heatmap.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
