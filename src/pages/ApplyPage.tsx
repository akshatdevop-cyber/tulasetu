import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitApplication } from '../firebase/application.js';
import { autoAllocateApplication } from '../firebase/allocation';
import { INSTRUMENT_CATEGORIES, PENALTY_TEXT } from '../constants/legalMetrologyRules.js';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Scale, AlertTriangle, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import { GISMap } from '../components/GISMap';

export const ApplyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const categoryKeys = Object.keys(INSTRUMENT_CATEGORIES);

  const [formData, setFormData] = useState({
    instrumentName: '',
    instrumentType: categoryKeys[0] || 'Weighing Scale',
    serialNumber: '',
    ownerName: '',
    ownerContact: '',
    address: '',
    district: '',
    state: '',
    latitude: 20.5937,
    longitude: 78.9629,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [assignedOfficerName, setAssignedOfficerName] = useState<string | null>(null);

  const selectedCategoryRules = INSTRUMENT_CATEGORIES[formData.instrumentType];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Helper: checks if a string looks like readable text (has vowels, spaces, or recognizable patterns)
  const looksLikeReadableText = (text: string, minLength = 3): boolean => {
    if (text.trim().length < minLength) return false;
    const vowels = text.match(/[aeiouAEIOU]/g);
    const ratio = vowels ? vowels.length / text.replace(/\s/g, '').length : 0;
    return ratio >= 0.15; // Real words typically have at least 15% vowels
  };

  const isValidPhone = (phone: string): boolean => {
    // Accept formats like +91 98765 43210, 9876543210, 098-7654-3210
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?\d{10,13}$/.test(cleaned);
  };

  const isValidSerialNumber = (sn: string): boolean => {
    // Serial numbers are alphanumeric with dashes/dots, e.g. SN-WS-2024-9982, ET-2026-1234
    return /^[A-Za-z0-9][\w\-\.\/]{2,}$/.test(sn.trim()) && sn.trim().length >= 3;
  };

  const isValidName = (name: string): boolean => {
    // Must contain at least 2 words or be a known single-word entity, and look readable
    return name.trim().length >= 3 && looksLikeReadableText(name) && /[a-zA-Z]/.test(name);
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    // Instrument Name
    if (!formData.instrumentName.trim()) {
      errs.instrumentName = 'Instrument name is required';
    } else if (formData.instrumentName.trim().length < 5) {
      errs.instrumentName = 'Instrument name must be at least 5 characters';
    } else if (!looksLikeReadableText(formData.instrumentName, 5)) {
      errs.instrumentName = 'Please enter a valid instrument name (e.g. "Electronic Tabletop Scale 15kg")';
    }

    // Instrument Type
    if (!formData.instrumentType) errs.instrumentType = 'Instrument type is required';

    // Serial Number
    if (!formData.serialNumber.trim()) {
      errs.serialNumber = 'Serial number is required';
    } else if (!isValidSerialNumber(formData.serialNumber)) {
      errs.serialNumber = 'Enter a valid serial number (e.g. SN-WS-2024-9982)';
    }

    // Owner Name
    if (!formData.ownerName.trim()) {
      errs.ownerName = 'Owner/Firm name is required';
    } else if (!isValidName(formData.ownerName)) {
      errs.ownerName = 'Enter a valid business or owner name (e.g. "Sharma Grocery Stores")';
    }

    // Contact Phone
    if (!formData.ownerContact.trim()) {
      errs.ownerContact = 'Contact phone number is required';
    } else if (!isValidPhone(formData.ownerContact)) {
      errs.ownerContact = 'Enter a valid phone number (e.g. +91 98765 43210)';
    }

    // Address
    if (!formData.address.trim()) {
      errs.address = 'Physical installation address is required';
    } else if (formData.address.trim().length < 15) {
      errs.address = 'Address must be at least 15 characters with full details';
    } else if (!looksLikeReadableText(formData.address, 10)) {
      errs.address = 'Please enter a valid address (e.g. "Shop 102, G.T. Road, Kanpur 208001")';
    }

    // District
    if (!formData.district.trim()) {
      errs.district = 'District is required';
    } else if (!looksLikeReadableText(formData.district)) {
      errs.district = 'Enter a valid district name (e.g. "Kanpur Nagar")';
    }

    // State
    if (!formData.state.trim()) {
      errs.state = 'State is required';
    } else if (!looksLikeReadableText(formData.state)) {
      errs.state = 'Enter a valid state name (e.g. "Uttar Pradesh")';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const appId = await submitApplication(
        {
          instrumentName: formData.instrumentName.trim(),
          instrumentType: formData.instrumentType,
          serialNumber: formData.serialNumber.trim(),
          ownerName: formData.ownerName.trim(),
          ownerContact: formData.ownerContact.trim(),
          address: formData.address.trim(),
          location: {
            address: formData.address.trim(),
            district: formData.district.trim(),
            state: formData.state.trim(),
            latitude: formData.latitude,
            longitude: formData.longitude,
          }
        },
        user.uid
      );

      // Trigger automatic officer allocation
      const allocationResult = await autoAllocateApplication(appId, formData.district.trim(), formData.instrumentType, formData.latitude, formData.longitude);
      
      if (allocationResult) {
        toast.success(`Application submitted & assigned to ${allocationResult.name}`);
        setAssignedOfficerName(allocationResult.name);
      } else {
        toast.success('Application submitted successfully (Pending Assignment)');
      }

      setSubmittedAppId(appId);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (submittedAppId) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your verification request has been successfully recorded in Tulasetu.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Application ID</p>
            <p className="font-mono text-base font-bold text-blue-700">{submittedAppId}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Status</p>
              {assignedOfficerName ? (
                <p className="text-sm text-slate-800">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Assigned to <span className="font-semibold">{assignedOfficerName}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-800">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  Pending Officer Assignment
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/business')}
            className="w-full py-3 px-4 bg-blue-700 text-white font-semibold rounded-lg shadow-xs hover:bg-blue-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/business"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Card Header */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              Form 1 - Verification Request
            </span>
            <span className="text-xs text-slate-500">Legal Metrology Act, 2009 (Rule 24)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Application for Instrument Verification & Stamping
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Submit your weight, measure, or weighing/measuring instrument for mandatory government verification and issuance of stamp certificate.
          </p>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Instrument Name */}
            <div>
              <label htmlFor="instrumentName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Instrument Name / Model <span className="text-rose-500">*</span>
              </label>
              <input
                id="instrumentName"
                name="instrumentName"
                type="text"
                value={formData.instrumentName}
                onChange={handleInputChange}
                placeholder="e.g. Precision Electronic Tabletop Scale 30kg"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.instrumentName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.instrumentName && (
                <p className="text-xs text-rose-600 mt-1">{errors.instrumentName}</p>
              )}
            </div>

            {/* Instrument Type (Dropdown from INSTRUMENT_CATEGORIES keys) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="instrumentType" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Instrument Category / Type <span className="text-rose-500">*</span>
                </label>
                {selectedCategoryRules && (
                  <span className="text-xs text-blue-700 font-medium">
                    Statutory Cycle: {selectedCategoryRules.reverificationMonths} Months validity
                  </span>
                )}
              </div>
              <select
                id="instrumentType"
                name="instrumentType"
                value={formData.instrumentType}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {categoryKeys.map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {catKey} ({INSTRUMENT_CATEGORIES[catKey].reverificationMonths} Months Validity)
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Category automatically dictates statutory re-verification intervals pursuant to Legal Metrology General Rules.
              </p>
            </div>

            {/* Serial Number */}
            <div>
              <label htmlFor="serialNumber" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Manufacturer Serial Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                value={formData.serialNumber}
                onChange={handleInputChange}
                placeholder="e.g. SN-WS-2024-9982"
                className={`w-full px-3.5 py-2.5 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.serialNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.serialNumber && (
                <p className="text-xs text-rose-600 mt-1">{errors.serialNumber}</p>
              )}
            </div>

            {/* Owner Name & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ownerName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner / Commercial Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="e.g. Sharma Grocery Stores"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.ownerName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.ownerName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.ownerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="ownerContact" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Mobile / Telephone <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ownerContact"
                  name="ownerContact"
                  type="text"
                  value={formData.ownerContact}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.ownerContact ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.ownerContact && (
                  <p className="text-xs text-rose-600 mt-1">{errors.ownerContact}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Physical Installation Address / Premises <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full address of the shop, trade premise, warehouse, or petrol retail outlet where instrument is used..."
                className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.address && (
                <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="district" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  District <span className="text-rose-500">*</span>
                </label>
                <input
                  id="district"
                  name="district"
                  type="text"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="e.g. Kanpur Nagar"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.district ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.district && (
                  <p className="text-xs text-rose-600 mt-1">{errors.district}</p>
                )}
              </div>
              <div>
                <label htmlFor="state" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Uttar Pradesh"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.state ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.state && (
                  <p className="text-xs text-rose-600 mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Select Exact Location on Map</h3>
              </div>
              <GISMap 
                selectable 
                selectedLocation={[formData.latitude, formData.longitude]} 
                onLocationSelect={(lat, lng) => setFormData(p => ({ ...p, latitude: lat, longitude: lng }))}
              />
            </div>

            {/* Legal compliance notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>{PENALTY_TEXT}</p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate('/business')}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-application-btn"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Verification</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
