import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadIdCard, submitOfficerRegistration } from '../firebase/officer';
import { ShieldCheck, Upload, AlertTriangle, ArrowRight } from 'lucide-react';

export const OfficerSignup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    officerId: '',
    department: '',
    designation: '',
    district: '',
    state: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to register.");
      return;
    }
    if (!file) {
      setError("Official ID Card upload is required.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const idCardImageUrl = await uploadIdCard(user.uid, file);
      await submitOfficerRegistration(user.uid, {
        ...formData,
        idCardImageUrl
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] bg-cream py-12 px-4 flex items-center justify-center">
      <div className="bg-card-white p-8 rounded-2xl border border-card-border shadow-sm max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-gold/10 text-amber-gold mb-3">
            <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Officer Registration</h2>
          <p className="text-sm text-text-muted mt-1">Submit your official credentials for administrator verification.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-status-error-bg border border-status-error/20 text-status-error text-sm flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">Official Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">Officer ID (e.g. LM-001)</label>
              <input type="text" required value={formData.officerId} onChange={e => setFormData({...formData, officerId: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">Department</label>
              <input type="text" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">Designation</label>
              <input type="text" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">District</label>
              <input type="text" required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1">State</label>
            <input type="text" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2.5 border border-card-border rounded-lg bg-cream/50 focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold focus:outline-none text-sm" />
          </div>
          
          <div className="pt-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2">Official ID Card Image</label>
            <div className="border-2 border-dashed border-card-border rounded-xl p-6 text-center hover:bg-cream transition-colors">
              <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
              <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-gold/10 file:text-sea-ink hover:file:bg-amber-gold/20" />
            </div>
            <p className="text-[10px] text-text-muted mt-1">Upload a clear photo of your govt-issued Legal Metrology ID (Max 5MB).</p>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-sea-ink hover:bg-sea-teal text-cream rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? 'Submitting...' : <><span>Submit for Verification</span> <ArrowRight className="w-4 h-4" strokeWidth={1.5} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};
