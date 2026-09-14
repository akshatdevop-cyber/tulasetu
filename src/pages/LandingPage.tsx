import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, Building2, ShieldCheck, Search, CheckCircle2, AlertTriangle, BookOpen, Loader2 } from 'lucide-react';
import { INSTRUMENT_CATEGORIES, PENALTY_TEXT } from '../constants/legalMetrologyRules.js';

const AuthForm: React.FC<{
  role: 'business' | 'officer',
  title: string,
  onSuccess: (actualRole: string) => void
}> = ({ role, title, onSuccess }) => {
  const { loginUser, signupUser, logoutUser, role: currentRole } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const actualRole = await loginUser(email, password);
        
        // Strict role validation: Ensure they are logging in at the correct portal
        if (actualRole && actualRole !== 'admin' && actualRole !== role) {
          await logoutUser();
          throw new Error(`Access Denied: This email is registered as a ${actualRole === 'business' ? 'Commercial User' : 'Legal Metrology Officer'}. Please use the correct login portal.`);
        }
        
        onSuccess(actualRole || role);
      } else {
        await signupUser(email, password, role, name);
        onSuccess(role);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-800 mb-3">{isLogin ? 'Login' : 'Create Account'} - {title}</h3>
      {error && <div className="mb-3 p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <input
            type="text"
            required
            placeholder={role === 'business' ? "Full Name / Establishment" : "Officer Name & Designation"}
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            role === 'business' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-900 hover:bg-slate-800'
          } disabled:opacity-70`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isLogin ? 'Login' : 'Sign Up'}</span>}
        </button>
      </form>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-50 flex flex-col justify-between">
      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14 w-full">
        {/* Header Badge */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold mb-4">
            <Scale className="w-3.5 h-3.5 text-blue-700" />
            <span>National Verification Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Tulasetu
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            Standardized verification, statutory re-verification tracking, and digital certificate issuing under Section 24 of the Legal Metrology Act, 2009.
          </p>
        </div>

        {/* Two Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {/* Business User Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Commercial / Business User</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Submit new instruments for mandatory verification, view active verification applications, and access downloadable digital certificates.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Register commercial weighing scales & fuel measures</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Download authentic stamped digital certificates</span>
                </li>
              </ul>
            </div>
            <AuthForm 
              role="business" 
              title="Business User" 
              onSuccess={(actualRole) => {
                if (actualRole === 'admin') navigate('/admin/officer-verification');
                else if (actualRole === 'officer') navigate('/officer');
                else navigate('/business');
              }} 
            />
          </div>

          {/* Legal Metrology Officer Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-5">
                <ShieldCheck className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Legal Metrology Officer</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Review submitted instruments, verify calibration accuracy, record physical inspection findings, and issue digitally signed certificates.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Review pending verification queues in real-time</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated statutory expiry calculation (12 / 24 months)</span>
                </li>
              </ul>
            </div>
            <AuthForm 
              role="officer" 
              title="Officer" 
              onSuccess={(actualRole) => {
                if (actualRole === 'admin') navigate('/admin/officer-verification');
                else if (actualRole === 'officer') navigate('/officer');
                else navigate('/business');
              }} 
            />
          </div>
        </div>

        {/* Public Certificate Verification Banner */}
        <div className="max-w-4xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Public Consumer & Field Verification</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Anyone can verify the authenticity and active validity of a stamped weight or measure without logging in.
              </p>
            </div>
          </div>
          <button
            id="public-verify-btn"
            onClick={() => navigate('/verify')}
            className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            Verify Certificate Now
          </button>
        </div>

        {/* Statutory Schedule & Legal Guidelines Information */}
        <div className="max-w-4xl mx-auto mt-10 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4 text-slate-900 font-semibold text-sm border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>Statutory Reverification Schedules (Legal Metrology General Rules, 2011)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(INSTRUMENT_CATEGORIES).map(([category, details]) => (
              <div key={category} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <span className="font-semibold text-slate-800 block truncate">{category}</span>
                <span className="text-blue-700 font-medium mt-1 inline-block">
                  Validity: {details.reverificationMonths} Months
                </span>
              </div>
            ))}
          </div>

          {/* Legal Notice */}
          <div className="mt-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold">Legal Notice:</strong> {PENALTY_TEXT}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© Tulasetu • Legal Metrology Division • Government of India</p>
      </footer>
    </div>
  );
};
