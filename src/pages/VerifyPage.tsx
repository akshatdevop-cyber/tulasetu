import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyCertificate } from '../firebase/application.js';
import { Application } from '../types';
import { PENALTY_TEXT, INSTRUMENT_CATEGORIES } from '../constants/legalMetrologyRules.js';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
export const VerifyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputCertId, setInputCertId] = useState(searchParams.get('id') || '');
  const [searchedId, setSearchedId] = useState<string | null>(searchParams.get('id') || null);
  const [matchedApplication, setMatchedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync if query param changes
  useEffect(() => {
    const idFromParam = searchParams.get('id');
    if (idFromParam) {
      setInputCertId(idFromParam);
      setSearchedId(idFromParam);
      performSearch(idFromParam);
    }
  }, [searchParams]);

  const performSearch = async (certId: string) => {
    setLoading(true);
    setMatchedApplication(null);
    try {
      const result = await verifyCertificate(certId);
      if (result) setMatchedApplication(result as Application);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCertId.trim();
    if (!clean) return;
    setSearchedId(clean);
    setSearchParams({ id: clean });
    performSearch(clean);
  };

  // Check if certificate is valid or expired
  let isExpired = false;
  let issueDateStr = '';
  let expiryDateStr = '';
  let cycleMonths = 12;

  if (matchedApplication && matchedApplication.expiryDate) {
    const today = new Date();
    const expiry = new Date(matchedApplication.expiryDate);
    isExpired = today > expiry;

    if (matchedApplication.issueDate) {
      issueDateStr = new Date(matchedApplication.issueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }

    expiryDateStr = expiry.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    cycleMonths =
      INSTRUMENT_CATEGORIES[matchedApplication.instrumentType]?.reverificationMonths || 12;
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-cream py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sea-ink/10 text-sea-ink text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-gold" strokeWidth={1.5} />
            <span>Public Verification Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Verify Instrument Certificate
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
            Verify the statutory legal metrology certification of any weighing or measuring instrument across commercial establishments in India.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-card-white rounded-2xl border border-card-border shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="cert-search-input"
                className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2"
              >
                Enter Certificate ID <span className="text-amber-gold">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                  <input
                    id="cert-search-input"
                    type="text"
                    value={inputCertId}
                    onChange={(e) => setInputCertId(e.target.value)}
                    placeholder="e.g. CERT-LM748291"
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-mono uppercase tracking-wider border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
                  />
                </div>
                <button
                  type="submit"
                  id="search-cert-btn"
                  className="px-6 py-2.5 bg-sea-ink hover:bg-sea-teal text-cream text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Verify Now
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Verification Results Section */}
        {loading ? (
          <div className="mt-6 p-8 text-center bg-card-white rounded-2xl border border-card-border shadow-sm text-text-muted">
            Verifying certificate...
          </div>
        ) : searchedId && (
          <div className="mt-6">
            {matchedApplication && matchedApplication.status === 'Revoked' ? (
              <div
                id="revoked-message"
                className="bg-card-white rounded-2xl border-2 border-status-error p-8 text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-status-error-bg text-status-error flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-black text-status-error tracking-tight uppercase">
                  CERTIFICATE REVOKED
                </h3>
                <p className="text-sm font-medium text-text-primary mt-1">
                  The certificate for ID: <span className="font-mono font-bold text-status-error">{searchedId}</span> has been legally revoked.
                </p>
                <p className="text-xs text-text-muted mt-2 max-w-md mx-auto">
                  This instrument is no longer authorized for commercial use under the Legal Metrology Act, 2009.
                </p>
              </div>
            ) : matchedApplication && matchedApplication.status === 'Approved' ? (
              /* MATCHED CERTIFICATE CARD */
              <div className="bg-card-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
                {/* Result Header Banner */}
                <div
                  className={`p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isExpired ? 'bg-status-pending-bg border-status-pending/30' : 'bg-status-success-bg border-status-success/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isExpired ? 'bg-status-pending/10 text-status-pending' : 'bg-status-success/10 text-status-success'
                      }`}
                    >
                      {isExpired ? (
                        <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
                      ) : (
                        <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
                      )}
                    </div>
                    <div>
                      {/* Prominent Badges */}
                      {isExpired ? (
                        <span
                          id="badge-expired"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-status-pending-bg text-status-pending border border-status-pending/30 uppercase tracking-wider"
                        >
                          <span className="w-2 h-2 rounded-full bg-status-pending"></span>
                          EXPIRED — Re-verification Required
                        </span>
                      ) : (
                        <span
                          id="badge-valid"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-status-success-bg text-status-success border border-status-success/30 uppercase tracking-wider"
                        >
                          <span className="w-2 h-2 rounded-full bg-status-success"></span>
                          VALID
                        </span>
                      )}
                      <p className="text-xs text-text-muted mt-1 font-mono font-semibold">
                        Certificate Number: {matchedApplication.certificateId}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/certificate/${matchedApplication.applicationId || matchedApplication.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-card-white border border-card-border text-xs font-semibold text-text-primary hover:bg-cream transition-colors shadow-xs"
                  >
                    <span>Full Certificate View</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
                  </Link>
                </div>

                {/* Read-Only Inspection Particulars */}
                <div className="p-6 space-y-5 text-xs sm:text-sm">
                  {/* Validity Callout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-cream border border-card-border">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase font-bold tracking-[0.1em] block">
                        Issue Date
                      </span>
                      <span className="text-sm font-semibold text-text-primary mt-0.5 block">
                        {issueDateStr || 'Verified on Record'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-muted uppercase font-bold tracking-[0.1em] block">
                        Valid Until (Expiry Date)
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 block ${
                          isExpired ? 'text-status-pending' : 'text-status-success'
                        }`}
                      >
                        {expiryDateStr || 'Computed per Category Rule'}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        Cycle: {cycleMonths} Months ({matchedApplication.instrumentType})
                      </span>
                    </div>
                  </div>

                  {/* Instrument & Owner Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <h4 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.15em] border-b border-card-border pb-1.5">
                        Instrument Information
                      </h4>
                      <div>
                        <span className="text-text-muted text-xs block">Instrument Name / Model:</span>
                        <span className="font-semibold text-text-primary">{matchedApplication.instrumentName}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs block">Category:</span>
                        <span className="font-medium text-text-primary">{matchedApplication.instrumentType}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs block">Serial Number:</span>
                        <span className="font-mono font-medium text-text-primary bg-cream px-1.5 py-0.5 rounded border border-card-border">
                          {matchedApplication.serialNumber}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.15em] border-b border-card-border pb-1.5">
                        Commercial Establishment
                      </h4>
                      <div>
                        <span className="text-text-muted text-xs block">Owner / Trade Name:</span>
                        <span className="font-semibold text-text-primary">{matchedApplication.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs block">Contact Phone:</span>
                        <span className="text-text-primary">{matchedApplication.ownerContact || 'Protected (Privacy Act)'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs block">Installation Premises:</span>
                        <span className="text-text-primary text-xs leading-relaxed">{matchedApplication.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Sign-Off */}
                  <div className="border-t border-card-border pt-4 text-xs">
                    <span className="text-text-muted block text-xs">Verified By:</span>
                    <span className="font-semibold text-text-primary">
                      {matchedApplication.verifiedBy || 'Inspector Legal Metrology'}
                    </span>
                    {matchedApplication.remarks && (
                      <p className="text-text-muted mt-1 italic">
                        Inspection Remarks: "{matchedApplication.remarks}"
                      </p>
                    )}
                  </div>

                  {/* Penalty Notice */}
                  <div className="p-3 bg-status-pending-bg border border-status-pending/20 rounded-xl text-xs text-text-primary flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-status-pending shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span>{PENALTY_TEXT}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* NO MATCH: RED NOT FOUND MESSAGE */
              <div
                id="not-found-message"
                className="bg-card-white rounded-2xl border-2 border-status-error/40 p-8 text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-status-error-bg text-status-error flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-black text-status-error tracking-tight uppercase">
                  NOT FOUND
                </h3>
                <p className="text-sm font-medium text-text-primary mt-1">
                  No certificate record exists for ID: <span className="font-mono font-bold text-status-error">{searchedId}</span>
                </p>
                <p className="text-xs text-text-muted mt-2 max-w-md mx-auto">
                  Please verify that the certificate reference was typed correctly. Unstamped or unregistered instruments are subject to regulatory seizure under the Legal Metrology Act, 2009.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
