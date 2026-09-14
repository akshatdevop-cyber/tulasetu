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
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Public Verification Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Instrument Certificate
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Verify the statutory legal metrology certification of any weighing or measuring instrument across commercial establishments in India.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="cert-search-input"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Enter Certificate ID <span className="text-blue-700">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="cert-search-input"
                    type="text"
                    value={inputCertId}
                    onChange={(e) => setInputCertId(e.target.value)}
                    placeholder="e.g. CERT-LM748291"
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-mono uppercase tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  id="search-cert-btn"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Verify Now
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Verification Results Section */}
        {loading ? (
          <div className="mt-6 p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500">
            Verifying certificate...
          </div>
        ) : searchedId && (
          <div className="mt-6">
            {matchedApplication && matchedApplication.status === 'Revoked' ? (
              <div
                id="revoked-message"
                className="bg-white rounded-xl border-2 border-rose-600 p-8 text-center shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-rose-800 tracking-tight uppercase">
                  CERTIFICATE REVOKED
                </h3>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  The certificate for ID: <span className="font-mono font-bold text-rose-700">{searchedId}</span> has been legally revoked.
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                  This instrument is no longer authorized for commercial use under the Legal Metrology Act, 2009.
                </p>
              </div>
            ) : matchedApplication && matchedApplication.status === 'Approved' ? (
              /* MATCHED CERTIFICATE CARD */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Result Header Banner */}
                <div
                  className={`p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isExpired ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isExpired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isExpired ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      {/* Prominent Badges as per prompt */}
                      {isExpired ? (
                        <span
                          id="badge-expired"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-200 text-amber-900 border border-amber-400 uppercase tracking-wider"
                        >
                          EXPIRED — Re-verification Required
                        </span>
                      ) : (
                        <span
                          id="badge-valid"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-200 text-emerald-950 border border-emerald-400 uppercase tracking-wider"
                        >
                          VALID
                        </span>
                      )}
                      <p className="text-xs text-slate-600 mt-1 font-mono font-semibold">
                        Certificate Number: {matchedApplication.certificateId}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/certificate/${matchedApplication.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <span>Full Certificate View</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  </Link>
                </div>

                {/* Read-Only Inspection Particulars */}
                <div className="p-6 space-y-5 text-xs sm:text-sm">
                  {/* Validity Callout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold block">
                        Issue Date
                      </span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                        {issueDateStr || 'Verified on Record'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold block">
                        Valid Until (Expiry Date)
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 block ${
                          isExpired ? 'text-amber-800' : 'text-emerald-800'
                        }`}
                      >
                        {expiryDateStr || 'Computed per Category Rule'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cycle: {cycleMonths} Months ({matchedApplication.instrumentType})
                      </span>
                    </div>
                  </div>

                  {/* Instrument & Owner Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b pb-1">
                        Instrument Information
                      </h4>
                      <div>
                        <span className="text-slate-500 text-xs block">Instrument Name / Model:</span>
                        <span className="font-semibold text-slate-900">{matchedApplication.instrumentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Category:</span>
                        <span className="font-medium text-slate-800">{matchedApplication.instrumentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Serial Number:</span>
                        <span className="font-mono font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {matchedApplication.serialNumber}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b pb-1">
                        Commercial Establishment
                      </h4>
                      <div>
                        <span className="text-slate-500 text-xs block">Owner / Trade Name:</span>
                        <span className="font-semibold text-slate-900">{matchedApplication.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Contact Phone:</span>
                        <span className="text-slate-800">{matchedApplication.ownerContact || 'Protected (Privacy Act)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Installation Premises:</span>
                        <span className="text-slate-800 text-xs leading-relaxed">{matchedApplication.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Sign-Off */}
                  <div className="border-t border-slate-200 pt-4 text-xs">
                    <span className="text-slate-500 block text-xs">Verified By:</span>
                    <span className="font-semibold text-slate-900">
                      {matchedApplication.verifiedBy || 'Inspector Legal Metrology'}
                    </span>
                    {matchedApplication.remarks && (
                      <p className="text-slate-600 mt-1 italic">
                        Inspection Remarks: "{matchedApplication.remarks}"
                      </p>
                    )}
                  </div>

                  {/* Penalty Notice */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{PENALTY_TEXT}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* NO MATCH: RED NOT FOUND MESSAGE as required by prompt */
              <div
                id="not-found-message"
                className="bg-white rounded-xl border-2 border-rose-300 p-8 text-center shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-rose-700 tracking-tight uppercase">
                  NOT FOUND
                </h3>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  No certificate record exists for ID: <span className="font-mono font-bold text-rose-700">{searchedId}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
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
