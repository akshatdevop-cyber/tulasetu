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
    <div className="min-h-[calc(100vh-100px)] bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card-white p-6 rounded-2xl border border-card-border shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">Commercial User Portal</p>
            <h1 className="text-2xl font-bold text-text-primary mt-1">
              Instrument Verification Dashboard
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Manage your commercial weighing and measuring instruments and access digital verification certificates.
            </p>
          </div>

          <button
            id="new-application-btn"
            onClick={() => navigate('/apply')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sea-ink hover:bg-sea-teal text-cream text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>New Application</span>
          </button>
        </div>

        {/* Quick Stat Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card-white p-4 rounded-2xl border border-card-border flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">Pending Review</p>
              <p className="text-2xl font-bold text-status-pending mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-pending-bg flex items-center justify-center text-amber-gold">
              <Clock className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>

          <div className="bg-card-white p-4 rounded-2xl border border-card-border flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">Approved & Certified</p>
              <p className="text-2xl font-bold text-status-success mt-1">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-success-bg flex items-center justify-center text-status-success">
              <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>

          <div className="bg-card-white p-4 rounded-2xl border border-card-border flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">Rejected</p>
              <p className="text-2xl font-bold text-status-error mt-1">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-status-error-bg flex items-center justify-center text-status-error">
              <XCircle className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                id="search-applications-input"
                type="text"
                placeholder="Search instrument, serial number, certificate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-text-muted font-medium">Status:</span>
              <select
                id="status-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm border border-card-border rounded-lg bg-card-white focus:outline-none focus:ring-2 focus:ring-amber-gold/50"
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
            <div className="py-12 flex items-center justify-center text-text-muted">
              <Loader2 className="w-8 h-8 text-amber-gold animate-spin mr-3" />
              Loading applications...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-card-border mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-base font-medium text-text-primary">No applications found</p>
              <p className="text-xs text-text-muted mt-1">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try changing your search keywords or status filter.'
                  : 'Get started by creating your first instrument verification application.'}
              </p>
              <button
                onClick={() => navigate('/apply')}
                className="mt-4 px-4 py-2 bg-sea-ink text-cream rounded-lg text-xs font-semibold hover:bg-sea-teal transition-colors cursor-pointer"
              >
                Submit New Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-cream border-b border-card-border text-text-muted text-[11px] uppercase tracking-[0.1em] font-semibold">
                    <th className="py-3 px-4">Instrument Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/50 text-text-primary">
                  {filteredApps.map((app) => {
                    const submittedDateStr = new Date(app.submittedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={app.id} className="hover:bg-cream/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-text-primary">
                          <div>{app.instrumentName}</div>
                          <div className="text-[11px] text-text-muted font-normal">ID: {app.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-cream border border-card-border text-text-primary font-medium">
                            <Scale className="w-3 h-3 text-amber-gold" strokeWidth={1.5} />
                            {app.instrumentType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-text-muted">
                          {app.serialNumber}
                        </td>
                        <td className="py-3.5 px-4 text-text-muted">
                          {submittedDateStr}
                        </td>
                        <td className="py-3.5 px-4">
                          {app.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-success-bg text-status-success">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                              Approved
                            </span>
                          )}
                          {app.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-pending-bg text-status-pending">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-pending"></span>
                              Pending
                            </span>
                          )}
                          {app.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-error-bg text-status-error">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-error"></span>
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {app.status === 'Approved' ? (
                            <button
                              id={`view-cert-btn-${app.id}`}
                              onClick={() => navigate(`/certificate/${app.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sea-ink text-cream hover:bg-sea-teal font-medium text-xs transition-all cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>View Certificate</span>
                            </button>
                          ) : app.status === 'Pending' ? (
                            <span className="text-xs text-text-muted italic">Under Review</span>
                          ) : (
                            <span
                              className="text-xs text-status-error hover:underline cursor-help"
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
