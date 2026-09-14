import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserApplications } from '../firebase/application.js';
import { Application } from '../types';
import { Plus, Award, Clock, XCircle, CheckCircle2, Search, FileText, ArrowUpRight, Scale, Loader2 } from 'lucide-react';
export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getUserApplications(user.uid, (apps) => {
      setApplications(apps as Application[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.instrumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.instrumentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.certificateId && app.certificateId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' || app.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                Commercial User Portal
              </span>
              <span className="text-xs text-slate-500">Legal Metrology Act, 2009</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Instrument Verification Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Manage your commercial weighing and measuring instruments and access digital verification certificates.
            </p>
          </div>

          <button
            id="new-application-btn"
            onClick={() => navigate('/apply')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>

        {/* Quick Stat Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved & Certified</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-applications-input"
                type="text"
                placeholder="Search instrument, serial number, certificate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                id="status-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
              Loading applications...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-700">No applications found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try changing your search keywords or status filter.'
                  : 'Get started by creating your first instrument verification application.'}
              </p>
              <button
                onClick={() => navigate('/apply')}
                className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors"
              >
                Submit New Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Instrument Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredApps.map((app) => {
                    const submittedDateStr = new Date(app.submittedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>{app.instrumentName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">ID: {app.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800 font-medium">
                            <Scale className="w-3 h-3 text-blue-600" />
                            {app.instrumentType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {app.serialNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {submittedDateStr}
                        </td>
                        <td className="py-3.5 px-4">
                          {app.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {app.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {app.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {app.status === 'Approved' ? (
                            <button
                              id={`view-cert-btn-${app.id}`}
                              onClick={() => navigate(`/certificate/${app.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white font-medium text-xs border border-blue-200 hover:border-blue-700 transition-all cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>View Certificate</span>
                            </button>
                          ) : app.status === 'Pending' ? (
                            <span className="text-xs text-slate-400 italic">Under Review</span>
                          ) : (
                            <span
                              className="text-xs text-rose-600 hover:underline cursor-help"
                              title={app.remarks || 'Rejected during physical testing'}
                            >
                              Rejected ({app.remarks?.slice(0, 20) || 'Fail'}...)
                            </span>
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
