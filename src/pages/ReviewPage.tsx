import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApplicationById, approveApplication, rejectApplication } from '../firebase/application.js';
import { Application } from '../types';
import { calculateExpiryDate, INSTRUMENT_CATEGORIES, PENALTY_TEXT } from '../constants/legalMetrologyRules.js';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  FileCheck,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
export const ReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [inspectionResult, setInspectionResult] = useState<'Pass' | 'Fail' | ''>('');
  const [remarks, setRemarks] = useState(
    'Physical inspection conducted at premises. Maximum permissible error (MPE) verified within Class III tolerance. Standard stamping mark and lead seal applied.'
  );
  const [verifiedBy, setVerifiedBy] = useState(
    'Insp. R. K. Verma, Legal Metrology Officer (Zone 4)'
  );
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    getApplicationById(id).then((app) => {
      if (app) {
        setApplication(app as Application);
        if (app.inspectionResult) setInspectionResult(app.inspectionResult);
        if (app.remarks) setRemarks(app.remarks);
        if (app.verifiedBy) setVerifiedBy(app.verifiedBy);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-cream py-12 px-4 flex items-center justify-center text-text-muted">
        Loading application details...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-cream py-12 px-4 flex items-center justify-center">
        <div className="bg-card-white p-8 rounded-2xl border border-card-border text-center max-w-md w-full shadow-sm">
          <AlertTriangle className="w-10 h-10 text-status-error mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-text-primary">Application Not Found</h2>
          <p className="text-sm text-text-muted mt-2">
            No application was found matching reference ID "{id}".
          </p>
          <Link
            to="/officer"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-sea-ink text-cream text-xs font-semibold rounded-lg hover:bg-sea-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>Return to Inspection Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  const categoryRule = INSTRUMENT_CATEGORIES[application.instrumentType];
  const validityMonths = categoryRule?.reverificationMonths || 12;

  // Calculate prospective expiry date using the required rule function
  const now = new Date();
  const prospectiveExpiry = calculateExpiryDate(now, application.instrumentType);
  const formattedProspectiveExpiry = prospectiveExpiry.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleApprove = async () => {
    if (!verifiedBy.trim()) {
      setErrorMsg('Officer name/designation is required');
      return;
    }
    if (!remarks.trim()) {
      setErrorMsg('Inspection remarks must be provided');
      return;
    }
    if (!application) return;

    setSubmitting(true);
    try {
      await approveApplication(application.id, application.instrumentType, verifiedBy.trim(), remarks.trim());
      toast.success('Application approved & Certificate generated!');
      navigate(`/certificate/${application.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve application');
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      setErrorMsg('Please specify the rejection reasons in the remarks field.');
      return;
    }
    if (!application) return;

    setSubmitting(true);
    try {
      await rejectApplication(application.id, remarks.trim(), verifiedBy.trim() || 'Inspector Legal Metrology');
      toast.success('Application rejected');
      navigate('/officer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject application');
      setSubmitting(false);
    }
  };

  const submittedDate = new Date(application.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-[calc(100vh-100px)] bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/officer"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>Back to Officer Queue</span>
          </Link>

          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cream border border-card-border text-text-muted font-semibold">
            REF: {application.id}
          </span>
        </div>

        {/* Top Header Card */}
        <div className="bg-card-white p-6 rounded-2xl border border-card-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-card-border pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">Statutory Field Inspection</p>
              <h1 className="text-2xl font-bold text-text-primary mt-1">
                Instrument Review & Verification
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Current Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  application.status === 'Approved'
                    ? 'bg-status-success-bg text-status-success'
                    : application.status === 'Rejected'
                    ? 'bg-status-error-bg text-status-error'
                    : 'bg-status-pending-bg text-status-pending'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  application.status === 'Approved'
                    ? 'bg-status-success'
                    : application.status === 'Rejected'
                    ? 'bg-status-error'
                    : 'bg-status-pending'
                }`}></span>
                {application.status}
              </span>
            </div>
          </div>

          {/* Read-Only Application Details */}
          <div className="mt-6">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-3">
              Application Details (Read-Only)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-cream p-4 rounded-xl border border-card-border text-xs sm:text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-text-muted block text-xs">Instrument Name & Model:</span>
                  <span className="font-semibold text-text-primary">{application.instrumentName}</span>
                </div>

                <div>
                  <span className="text-text-muted block text-xs">Instrument Category:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sea-ink">
                    <Scale className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
                    {application.instrumentType}
                  </span>
                  <span className="text-xs text-text-muted block mt-0.5">
                    Statutory Reverification Cycle: {validityMonths} Months
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block text-xs">Manufacturer Serial Number:</span>
                  <span className="font-mono font-semibold text-text-primary bg-card-white px-2 py-0.5 rounded-lg border border-card-border inline-block">
                    {application.serialNumber}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-text-muted block text-xs">Commercial Owner / Establishment:</span>
                  <span className="font-semibold text-text-primary">{application.ownerName}</span>
                </div>

                <div>
                  <span className="text-text-muted block text-xs">Contact Information:</span>
                  <span className="text-text-primary">{application.ownerContact}</span>
                </div>

                <div>
                  <span className="text-text-muted block text-xs">Premises / Installation Address:</span>
                  <span className="text-text-primary block text-xs leading-relaxed">{application.address}</span>
                </div>

                <div>
                  <span className="text-text-muted block text-xs">Submission Date:</span>
                  <span className="text-text-primary text-xs font-medium">{submittedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Officer Verification Form */}
          <div className="mt-8 border-t border-card-border pt-6">
            <h2 className="text-base font-bold text-text-primary mb-1">
              Officer Inspection Findings & Determination
            </h2>
            <p className="text-xs text-text-muted mb-5">
              Record laboratory comparison / dead-weight test outcomes. Select Pass to approve and generate a digitally timestamped certificate.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-status-error-bg border border-status-error/20 text-xs text-status-error font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Inspection Result Radio/Select */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2">
                  Inspection Result <span className="text-pin-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      inspectionResult === 'Pass'
                        ? 'border-status-success bg-status-success-bg text-status-success font-semibold'
                        : 'border-card-border hover:border-text-muted text-text-primary'
                    }`}
                  >
                    <input
                      id="result-pass"
                      type="radio"
                      name="inspectionResult"
                      value="Pass"
                      checked={inspectionResult === 'Pass'}
                      onChange={() => {
                        setInspectionResult('Pass');
                        setErrorMsg('');
                      }}
                      className="text-status-success focus:ring-status-success w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-status-success" strokeWidth={1.5} />
                      <span>Pass (Standard Met)</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      inspectionResult === 'Fail'
                        ? 'border-status-error bg-status-error-bg text-status-error font-semibold'
                        : 'border-card-border hover:border-text-muted text-text-primary'
                    }`}
                  >
                    <input
                      id="result-fail"
                      type="radio"
                      name="inspectionResult"
                      value="Fail"
                      checked={inspectionResult === 'Fail'}
                      onChange={() => {
                        setInspectionResult('Fail');
                        setErrorMsg('');
                      }}
                      className="text-status-error focus:ring-status-error w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-status-error" strokeWidth={1.5} />
                      <span>Fail (Non-Compliant)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Verified By */}
              <div>
                <label htmlFor="verifiedBy" className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1.5">
                  Verified By (Officer Name & Designation) <span className="text-pin-red">*</span>
                </label>
                <input
                  id="verifiedBy"
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  placeholder="e.g. Insp. R. K. Verma, Legal Metrology Officer"
                  className="w-full px-3.5 py-2.5 text-sm border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
                />
              </div>

              {/* Remarks */}
              <div>
                <label htmlFor="remarks" className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1.5">
                  Inspection Remarks & Stamping Details <span className="text-pin-red">*</span>
                </label>
                <textarea
                  id="remarks"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Note test weight readings, physical stamp identifier, seal integrity, or specific reasons for failure..."
                  className="w-full px-3.5 py-2.5 text-sm border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
                />
              </div>

              {/* Prospective Validity Preview if Pass selected */}
              {inspectionResult === 'Pass' && (
                <div className="p-4 rounded-xl bg-sea-ink/5 border border-sea-ink/10 space-y-1 text-xs text-sea-ink">
                  <div className="flex items-center gap-2 font-bold text-sm text-sea-ink">
                    <Award className="w-4 h-4 text-amber-gold" strokeWidth={1.5} />
                    <span>Statutory Expiry Calculation</span>
                  </div>
                  <p>
                    Category: <strong className="font-semibold">{application.instrumentType}</strong> ({validityMonths} months reverification period)
                  </p>
                  <p>
                    Issue Date: <strong className="font-semibold">Today ({now.toLocaleDateString('en-IN')})</strong>
                  </p>
                  <p>
                    Computed Expiry Date: <strong className="font-bold text-sea-ink">{formattedProspectiveExpiry}</strong>
                  </p>
                </div>
              )}

              {/* Penalty Notice */}
              <div className="p-3 bg-cream border border-card-border rounded-xl text-xs text-text-muted flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-status-pending shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{PENALTY_TEXT}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-5 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => navigate('/officer')}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-text-muted hover:bg-cream rounded-lg transition-colors cursor-pointer border border-card-border"
                >
                  Cancel
                </button>

                {/* Reject Button: only if Fail selected */}
                {inspectionResult === 'Fail' && (
                  <button
                    type="button"
                    id="reject-btn"
                    onClick={handleReject}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-status-error hover:bg-status-error/90 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" strokeWidth={1.5} />
                    <span>Reject Application</span>
                  </button>
                )}

                {/* Approve & Generate Certificate: only enabled if Pass selected */}
                <button
                  type="button"
                  id="approve-generate-cert-btn"
                  disabled={inspectionResult !== 'Pass' || submitting}
                  onClick={handleApprove}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors ${
                    inspectionResult === 'Pass' && !submitting
                      ? 'bg-sea-ink hover:bg-sea-teal text-cream cursor-pointer'
                      : 'bg-card-border text-text-muted cursor-not-allowed'
                  }`}
                >
                  <FileCheck className="w-4 h-4" strokeWidth={1.5} />
                  <span>{submitting ? 'Processing...' : 'Approve & Generate Certificate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
