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
      <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-12 px-4 flex items-center justify-center text-slate-500">
        Loading application details...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md w-full shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Application Not Found</h2>
          <p className="text-sm text-slate-600 mt-2">
            No application was found matching reference ID "{id}".
          </p>
          <Link
            to="/officer"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
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
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/officer"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Officer Queue</span>
          </Link>

          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-semibold">
            REF: {application.id}
          </span>
        </div>

        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                  Statutory Field Inspection
                </span>
                <span className="text-xs text-slate-500">Legal Metrology Act, 2009 (Rule 24)</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                Instrument Review & Verification
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Current Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  application.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : application.status === 'Rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {application.status}
              </span>
            </div>
          </div>

          {/* Read-Only Application Details */}
          <div className="mt-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Application Details (Read-Only)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs sm:text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-xs">Instrument Name & Model:</span>
                  <span className="font-semibold text-slate-900">{application.instrumentName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Instrument Category:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    {application.instrumentType}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Statutory Reverification Cycle: {validityMonths} Months
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Manufacturer Serial Number:</span>
                  <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {application.serialNumber}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-xs">Commercial Owner / Establishment:</span>
                  <span className="font-semibold text-slate-900">{application.ownerName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Contact Information:</span>
                  <span className="text-slate-800">{application.ownerContact}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Premises / Installation Address:</span>
                  <span className="text-slate-800 block text-xs leading-relaxed">{application.address}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Submission Date:</span>
                  <span className="text-slate-800 text-xs font-medium">{submittedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Officer Verification Form */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Officer Inspection Findings & Determination
            </h2>
            <p className="text-xs text-slate-600 mb-5">
              Record laboratory comparison / dead-weight test outcomes. Select Pass to approve and generate a digitally timestamped certificate.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Inspection Result Radio/Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Inspection Result <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      inspectionResult === 'Pass'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
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
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Pass (Standard Met)</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      inspectionResult === 'Fail'
                        ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
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
                      className="text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Fail (Non-Compliant)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Verified By */}
              <div>
                <label htmlFor="verifiedBy" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verified By (Officer Name & Designation) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="verifiedBy"
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  placeholder="e.g. Insp. R. K. Verma, Legal Metrology Officer"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Remarks */}
              <div>
                <label htmlFor="remarks" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inspection Remarks & Stamping Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="remarks"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Note test weight readings, physical stamp identifier, seal integrity, or specific reasons for failure..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Prospective Validity Preview if Pass selected */}
              {inspectionResult === 'Pass' && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-1 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                    <Award className="w-4 h-4 text-blue-700" />
                    <span>Statutory Expiry Calculation</span>
                  </div>
                  <p>
                    Category: <strong className="font-semibold">{application.instrumentType}</strong> ({validityMonths} months reverification period)
                  </p>
                  <p>
                    Issue Date: <strong className="font-semibold">Today ({now.toLocaleDateString('en-IN')})</strong>
                  </p>
                  <p>
                    Computed Expiry Date: <strong className="font-bold text-blue-800">{formattedProspectiveExpiry}</strong>
                  </p>
                </div>
              )}

              {/* Penalty Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{PENALTY_TEXT}</span>
              </div>

              {/* Action Buttons as per Prompt */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/officer')}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* Reject Button: only if Fail selected */}
                {inspectionResult === 'Fail' && (
                  <button
                    type="button"
                    id="reject-btn"
                    onClick={handleReject}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
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
                      ? 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
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
