import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCertificatePublic } from '../firebase/application.js';
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
    getCertificatePublic(id).then(app => {
      if (app) setApplication(app as Application);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-cream py-12 px-4 flex items-center justify-center text-text-muted">
        Loading certificate...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-cream py-12 px-4 flex items-center justify-center">
        <div className="bg-card-white p-8 rounded-2xl border border-card-border text-center max-w-md w-full shadow-sm">
          <AlertTriangle className="w-10 h-10 text-status-error mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-text-primary">Certificate Not Found</h2>
          <p className="text-sm text-text-muted mt-2">
            No application or certificate found for ID "{id}".
          </p>
          <Link
            to={role === 'officer' ? '/officer' : '/business'}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-sea-ink text-cream text-xs font-semibold rounded-lg hover:bg-sea-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (application.status !== 'Approved' || !application.certificateId) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-cream py-12 px-4 flex items-center justify-center">
        <div className="bg-card-white p-8 rounded-2xl border border-card-border text-center max-w-md w-full shadow-sm">
          <AlertTriangle className="w-10 h-10 text-status-pending mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-text-primary">Certificate Not Issued</h2>
          <p className="text-sm text-text-muted mt-2">
            This instrument application is currently in <strong>{application.status}</strong> status.
            A certificate is generated only upon successful verification.
          </p>
          <Link
            to={role === 'officer' ? `/review/${application.id}` : '/business'}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-sea-ink text-cream text-xs font-semibold rounded-lg hover:bg-sea-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
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

    // Outer decorative border — amber-gold
    doc.setDrawColor(216, 154, 43); // amber-gold
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, 277);

    // Inner thin border
    doc.setDrawColor(233, 223, 203); // card-border
    doc.setLineWidth(0.4);
    doc.rect(13, 13, pageWidth - 26, 271);

    // Top Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 42, 54); // sea-ink
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
    doc.setDrawColor(216, 154, 43); // amber-gold
    doc.setLineWidth(0.8);
    doc.line(20, 37, pageWidth - 20, 37);

    // Certificate Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(14, 42, 54); // sea-ink
    doc.text('CERTIFICATE OF VERIFICATION', pageWidth / 2, 47, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(107, 101, 90); // text-muted
    doc.text('[Under Section 24 of the Legal Metrology Act, 2009 & Rule 24 of General Rules]', pageWidth / 2, 53, {
      align: 'center',
    });

    // Certificate Number Box
    doc.setFillColor(251, 246, 236); // cream
    doc.setDrawColor(233, 223, 203);
    doc.roundedRect(20, 58, pageWidth - 40, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(216, 154, 43); // amber-gold
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
      doc.setTextColor(107, 101, 90);
      doc.text(label, leftCol, currentY);

      doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(isHighlight ? 14 : 27, isHighlight ? 42 : 27, isHighlight ? 54 : 24);
      doc.text(value, valCol, currentY, { maxWidth: pageWidth - valCol - 25 });

      currentY += 9;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 42, 54);
    doc.text('1. INSTRUMENT PARTICULARS', leftCol, currentY);
    currentY += 7;

    printRow('Instrument Name / Model:', application.instrumentName);
    printRow('Instrument Category:', `${application.instrumentType} (${cycleMonths}M validity)`);
    printRow('Serial Number (Manufacturer):', application.serialNumber);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 42, 54);
    doc.text('2. OWNER & PREMISES DETAILS', leftCol, currentY);
    currentY += 7;

    printRow('Owner / Commercial Entity:', application.ownerName);
    printRow('Contact Number:', application.ownerContact);
    printRow('Premises / Installation Address:', application.address);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 42, 54);
    doc.text('3. VERIFICATION & VALIDITY TIMEFRAME', leftCol, currentY);
    currentY += 7;

    printRow('Verification Officer:', application.verifiedBy || 'Inspector Legal Metrology');
    printRow('Issue Date:', issueDateFormatted);
    printRow('Valid Until (Computed Expiry):', expiryDateFormatted, true);
    printRow('Inspection Findings / Remarks:', application.remarks || 'Standard verified');

    // Bottom QR Code Note & Stamping Box
    currentY += 10;
    doc.setDrawColor(233, 223, 203);
    doc.setFillColor(251, 246, 236);
    doc.roundedRect(20, currentY, pageWidth - 40, 46, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(14, 42, 54);
    doc.text('DIGITAL STAMP & VERIFICATION SUMMARY', 25, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 101, 90);
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
    doc.setTextColor(14, 42, 54);
    doc.text('DIGITALLY AUTHORIZED BY', pageWidth - 80, currentY + 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(application.verifiedBy || 'Inspector of Legal Metrology', pageWidth - 80, currentY + 45);

    // Statutory Penalty Text at bottom
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(138, 59, 29); // rust
    doc.text('STATUTORY WARNING:', 20, 260);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 101, 90);
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
    <div className="min-h-[calc(100vh-100px)] bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to={role === 'officer' ? '/officer' : '/business'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>{role === 'officer' ? 'Back to Officer Queue' : 'Back to Dashboard'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to={`/verify?id=${application.certificateId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card-white border border-card-border hover:bg-cream text-text-primary text-xs sm:text-sm font-medium shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-gold" strokeWidth={1.5} />
              <span>Verify Online</span>
            </Link>

            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sea-ink hover:bg-sea-teal text-cream text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span>Download as PDF</span>
            </button>
          </div>
        </div>

        {/* Certificate Card Style UI */}
        <div
          ref={certificateCardRef}
          className="bg-card-white rounded-2xl border border-amber-gold shadow-md p-6 sm:p-10 relative overflow-hidden"
          style={{ boxShadow: 'inset 0 0 0 3px #FBF6EC, inset 0 0 0 4px #D89A2B' }}
        >
          {/* Subtle watermark background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Scale className="w-96 h-96 text-sea-ink" />
          </div>

          {/* National Emblem & Header */}
          <div className="text-center border-b-2 border-card-border pb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-gold/10 border border-amber-gold/30 text-amber-gold mb-2">
              <Scale className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-bold text-amber-gold uppercase tracking-widest">
              TulaSETU
            </p>
            <p className="text-xs text-text-muted font-medium">
              Government of India • Ministry of Consumer Affairs, Food & Public Distribution
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-2 tracking-tight">
              Certificate of Verification
            </h1>
            <p className="text-xs text-text-muted mt-0.5 italic">
              [Issued pursuant to Section 24 of the Legal Metrology Act, 2009 & Rule 24 of General Rules, 2011]
            </p>
          </div>

          {/* Certificate ID Banner & Status Badge */}
          <div className="mt-6 bg-cream border border-card-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-[0.15em] font-bold block">
                Official Certificate Number
              </span>
              <span className="text-lg font-mono font-bold text-amber-gold">
                {application.certificateId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-pending-bg text-status-pending border border-status-pending/30">
                  <span className="w-2 h-2 rounded-full bg-status-pending"></span>
                  <span>EXPIRED — Re-verification Required</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-success-bg text-status-success border border-status-success/30">
                  <span className="w-2 h-2 rounded-full bg-status-success"></span>
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
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] border-b border-card-border pb-1.5 mb-3 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
                  <span>Instrument Particulars</span>
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                  <div>
                    <dt className="text-text-muted text-xs">Instrument Name</dt>
                    <dd className="font-semibold text-text-primary mt-0.5">{application.instrumentName}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Category & Rule</dt>
                    <dd className="font-semibold text-text-primary mt-0.5">
                      {application.instrumentType} ({cycleMonths}M cycle)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Manufacturer Serial No.</dt>
                    <dd className="font-mono font-semibold text-text-primary mt-0.5">
                      {application.serialNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Application Reference</dt>
                    <dd className="font-mono text-text-muted mt-0.5">{application.id}</dd>
                  </div>
                </dl>
              </div>

              {/* Owner Details */}
              <div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] border-b border-card-border pb-1.5 mb-3 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
                  <span>Owner & Premises Information</span>
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                  <div>
                    <dt className="text-text-muted text-xs">Owner / Establishment</dt>
                    <dd className="font-semibold text-text-primary mt-0.5">{application.ownerName}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Contact Information</dt>
                    <dd className="text-text-primary mt-0.5">{application.ownerContact}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-text-muted text-xs">Physical Premises Address</dt>
                    <dd className="text-text-primary mt-0.5 text-xs leading-relaxed">
                      {application.address}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Verification & Validity Dates */}
              <div className="bg-cream p-4 rounded-xl border border-card-border">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
                  <span>Statutory Dates & Officer Sign-off</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-text-muted block text-xs">Issue Date:</span>
                    <span className="font-semibold text-text-primary">{issueDateFormatted}</span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-xs">Valid Until (Expiry Date):</span>
                    <span className="font-bold text-sea-ink text-base block">
                      {expiryDateFormatted}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      (Calculated according to {cycleMonths}-month reverification rule)
                    </span>
                  </div>

                  <div className="sm:col-span-2 border-t border-card-border pt-3">
                    <span className="text-text-muted block text-xs">Verified By:</span>
                    <span className="font-semibold text-text-primary">{application.verifiedBy}</span>
                    {application.remarks && (
                      <p className="text-xs text-text-muted mt-1 italic bg-card-white p-2 rounded-lg border border-card-border">
                        "{application.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Stamping Seal */}
            <div className="flex flex-col items-center justify-between border-t md:border-t-0 md:border-l border-card-border pt-6 md:pt-0 md:pl-8">
              {/* QR Code */}
              <div className="text-center w-full">
                <div className="p-3 bg-card-white border border-card-border rounded-xl inline-block shadow-xs">
                  <QRCodeSVG
                    id="certificate-qr-code"
                    value={verificationUrl}
                    size={135}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[11px] font-mono text-text-muted font-semibold mt-2">
                  {application.certificateId}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Scan QR code to verify validity instantly
                </p>
              </div>

              {/* Official Seal — green verified */}
              <div className="mt-6 p-4 rounded-full border-2 border-dashed border-status-success text-center w-36 h-36 flex flex-col items-center justify-center bg-status-success-bg">
                <Scale className="w-5 h-5 text-status-success mb-0.5" strokeWidth={1.5} />
                <span className="text-[10px] font-black uppercase text-status-success tracking-wider">
                  LEGAL METROLOGY
                </span>
                <span className="text-[9px] font-bold text-status-success">STAMPED & VERIFIED</span>
                <span className="text-[8px] font-mono text-text-muted mt-0.5">GOVT. OF INDIA</span>
              </div>
            </div>
          </div>

          {/* Legal Footer (PENALTY_TEXT) */}
          <div className="mt-8 pt-4 border-t border-card-border text-center">
            <p className="text-[11px] sm:text-xs text-text-muted font-medium leading-relaxed max-w-2xl mx-auto">
              {PENALTY_TEXT}
            </p>
            <p className="text-[10px] text-text-muted/60 mt-1">
              Statutory verification certificate generated pursuant to Legal Metrology General Rules, 2011.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
