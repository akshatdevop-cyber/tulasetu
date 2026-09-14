import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApplicationById } from '../firebase/application.js';
import { Application } from '../types';
import { PENALTY_TEXT, INSTRUMENT_CATEGORIES } from '../constants/legalMetrologyRules.js';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Printer,
  Scale,
  ExternalLink,
  AlertTriangle,
  Building,
} from 'lucide-react';

export const CertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const certificateCardRef = useRef<HTMLDivElement>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getApplicationById(id).then(app => {
      if (app) setApplication(app as Application);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-12 px-4 flex items-center justify-center text-slate-500">
        Loading certificate...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md w-full shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
          <p className="text-sm text-slate-600 mt-2">
            No application or certificate found for ID "{id}".
          </p>
          <Link
            to={role === 'officer' ? '/officer' : '/business'}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (application.status !== 'Approved' || !application.certificateId) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md w-full shadow-xs">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Certificate Not Issued</h2>
          <p className="text-sm text-slate-600 mt-2">
            This instrument application is currently in <strong>{application.status}</strong> status.
            A certificate is generated only upon successful verification.
          </p>
          <Link
            to={role === 'officer' ? `/review/${application.id}` : '/business'}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{role === 'officer' ? 'Proceed to Review' : 'Back to Dashboard'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const issueDateFormatted = application.issueDate
    ? new Date(application.issueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  const expiryDateFormatted = application.expiryDate
    ? new Date(application.expiryDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  const isExpired = application.expiryDate ? new Date() > new Date(application.expiryDate) : false;
  const cycleMonths = INSTRUMENT_CATEGORIES[application.instrumentType]?.reverificationMonths || 12;

  // Generate clean PDF certificate using jsPDF
  const handleDownloadPDF = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Outer decorative border
    doc.setDrawColor(29, 78, 216); // blue-700
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, 277);

    // Inner thin border
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.rect(13, 13, pageWidth - 26, 271);

    // Top Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('GOVERNMENT OF INDIA', pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(10);
    doc.text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', pageWidth / 2, 28, {
      align: 'center',
    });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TULASETU • LEGAL METROLOGY DIVISION', pageWidth / 2, 33, {
      align: 'center',
    });

    // Divider
    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.8);
    doc.line(20, 37, pageWidth - 20, 37);

    // Certificate Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('CERTIFICATE OF VERIFICATION', pageWidth / 2, 47, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('[Under Section 24 of the Legal Metrology Act, 2009 & Rule 24 of General Rules]', pageWidth / 2, 53, {
      align: 'center',
    });

    // Certificate Number Box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(20, 58, pageWidth - 40, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    doc.text(`CERTIFICATE NUMBER: ${application.certificateId}`, pageWidth / 2, 67, {
      align: 'center',
    });

    // Main Body Details
    let currentY = 83;
    const leftCol = 22;
    const valCol = 78;

    const printRow = (label: string, value: string, isHighlight = false) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(label, leftCol, currentY);

      doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(isHighlight ? 29 : 15, isHighlight ? 78 : 23, isHighlight ? 216 : 42);
      doc.text(value, valCol, currentY, { maxWidth: pageWidth - valCol - 25 });

      currentY += 9;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. INSTRUMENT PARTICULARS', leftCol, currentY);
    currentY += 7;

    printRow('Instrument Name / Model:', application.instrumentName);
    printRow('Instrument Category:', `${application.instrumentType} (${cycleMonths}M validity)`);
    printRow('Serial Number (Manufacturer):', application.serialNumber);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. OWNER & PREMISES DETAILS', leftCol, currentY);
    currentY += 7;

    printRow('Owner / Commercial Entity:', application.ownerName);
    printRow('Contact Number:', application.ownerContact);
    printRow('Premises / Installation Address:', application.address);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. VERIFICATION & VALIDITY TIMEFRAME', leftCol, currentY);
    currentY += 7;

    printRow('Verification Officer:', application.verifiedBy || 'Inspector Legal Metrology');
    printRow('Issue Date:', issueDateFormatted);
    printRow('Valid Until (Computed Expiry):', expiryDateFormatted, true);
    printRow('Inspection Findings / Remarks:', application.remarks || 'Standard verified');

    // Bottom QR Code Note & Stamping Box
    currentY += 10;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, currentY, pageWidth - 40, 46, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('DIGITAL STAMP & VERIFICATION SUMMARY', 25, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Electronic Verification Token: ${application.certificateId}`, 25, currentY + 15);
    doc.text(`Status: ${isExpired ? 'EXPIRED (Re-verification overdue)' : 'VALID & CERTIFIED'}`, 25, currentY + 21);
    doc.text(`Public Online Verification: ${verificationUrl}`, 25, currentY + 27);
    doc.text(`Issuing Officer: ${application.verifiedBy || 'Inspector Legal Metrology'}`, 25, currentY + 33);

    // Embed QR code image in PDF
    try {
      const qrSvgElement = document.getElementById('certificate-qr-code') as unknown as SVGSVGElement;
      if (qrSvgElement) {
        const svgData = new XMLSerializer().serializeToString(qrSvgElement);
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx?.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(url);
            const pngData = canvas.toDataURL('image/png');
            doc.addImage(pngData, 'PNG', pageWidth - 55, currentY + 4, 28, 28);
            resolve();
          };
          img.onerror = () => resolve(); // Graceful fallback
          img.src = url;
        });
      }
    } catch (e) {
      console.warn('Could not embed QR in PDF:', e);
    }

    // Signature Placeholder
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('DIGITALLY AUTHORIZED BY', pageWidth - 80, currentY + 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(application.verifiedBy || 'Inspector of Legal Metrology', pageWidth - 80, currentY + 45);

    // Statutory Penalty Text at bottom
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('STATUTORY WARNING:', 20, 260);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(PENALTY_TEXT, 20, 265, { maxWidth: pageWidth - 40 });

    doc.setFontSize(7);
    doc.text(
      'This document is an electronic certificate issued under the Legal Metrology Act, 2009. Scan QR or visit the portal to verify.',
      pageWidth / 2,
      276,
      { align: 'center' }
    );

    doc.save(`Certificate_${application.certificateId}.pdf`);
  };

  const verificationUrl = `${window.location.origin}/verify?id=${application.certificateId}`;

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to={role === 'officer' ? '/officer' : '/business'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{role === 'officer' ? 'Back to Officer Queue' : 'Back to Dashboard'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to={`/verify?id=${application.certificateId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>Verify Online</span>
            </Link>

            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download as PDF</span>
            </button>
          </div>
        </div>

        {/* Certificate Card Style UI */}
        <div
          ref={certificateCardRef}
          className="bg-white rounded-xl border-2 border-blue-900 shadow-md p-6 sm:p-10 relative overflow-hidden"
        >
          {/* Subtle watermark background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Scale className="w-96 h-96 text-slate-900" />
          </div>

          {/* National Emblem & Header */}
          <div className="text-center border-b-2 border-slate-200 pb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-800 mb-2">
              <Scale className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Tulasetu
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Government of India • Ministry of Consumer Affairs, Food & Public Distribution
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Certificate of Verification
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 italic">
              [Issued pursuant to Section 24 of the Legal Metrology Act, 2009 & Rule 24 of General Rules, 2011]
            </p>
          </div>

          {/* Certificate ID Banner & Status Badge */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block">
                Official Certificate Number
              </span>
              <span className="text-lg font-mono font-bold text-blue-700">
                {application.certificateId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>EXPIRED — Re-verification Required</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>VALID & AUTHENTIC</span>
                </span>
              )}
            </div>
          </div>

          {/* Certificate Main Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Columns: Instrument & Owner Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Instrument Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-3 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Instrument Particulars</span>
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                  <div>
                    <dt className="text-slate-500 text-xs">Instrument Name</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{application.instrumentName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Category & Rule</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {application.instrumentType} ({cycleMonths}M cycle)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Manufacturer Serial No.</dt>
                    <dd className="font-mono font-semibold text-slate-800 mt-0.5">
                      {application.serialNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Application Reference</dt>
                    <dd className="font-mono text-slate-600 mt-0.5">{application.id}</dd>
                  </div>
                </dl>
              </div>

              {/* Owner Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-3 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Owner & Premises Information</span>
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                  <div>
                    <dt className="text-slate-500 text-xs">Owner / Establishment</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{application.ownerName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Contact Information</dt>
                    <dd className="text-slate-800 mt-0.5">{application.ownerContact}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500 text-xs">Physical Premises Address</dt>
                    <dd className="text-slate-800 mt-0.5 text-xs leading-relaxed">
                      {application.address}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Verification & Validity Dates */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Statutory Dates & Officer Sign-off</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Issue Date:</span>
                    <span className="font-semibold text-slate-900">{issueDateFormatted}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs">Valid Until (Expiry Date):</span>
                    <span className="font-bold text-blue-800 text-base block">
                      {expiryDateFormatted}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (Calculated according to {cycleMonths}-month reverification rule)
                    </span>
                  </div>

                  <div className="sm:col-span-2 border-t border-slate-200 pt-3">
                    <span className="text-slate-500 block text-xs">Verified By:</span>
                    <span className="font-semibold text-slate-900">{application.verifiedBy}</span>
                    {application.remarks && (
                      <p className="text-xs text-slate-600 mt-1 italic bg-white p-2 rounded border border-slate-200">
                        "{application.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Stamping Seal */}
            <div className="flex flex-col items-center justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-8">
              {/* QR Code */}
              <div className="text-center w-full">
                <div className="p-3 bg-white border border-slate-300 rounded-lg inline-block shadow-xs">
                  <QRCodeSVG
                    id="certificate-qr-code"
                    value={verificationUrl}
                    size={135}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[11px] font-mono text-slate-600 font-semibold mt-2">
                  {application.certificateId}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Scan QR code to verify validity instantly
                </p>
              </div>

              {/* Official Seal */}
              <div className="mt-6 p-4 rounded-full border-2 border-dashed border-blue-600 text-center w-36 h-36 flex flex-col items-center justify-center bg-blue-50/50">
                <Scale className="w-5 h-5 text-blue-700 mb-0.5" />
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                  LEGAL METROLOGY
                </span>
                <span className="text-[9px] font-bold text-blue-700">STAMPED & VERIFIED</span>
                <span className="text-[8px] font-mono text-slate-600 mt-0.5">GOVT. OF INDIA</span>
              </div>
            </div>
          </div>

          {/* Legal Footer (PENALTY_TEXT) */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              {PENALTY_TEXT}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Statutory verification certificate generated pursuant to Legal Metrology General Rules, 2011.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
