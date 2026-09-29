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
    <div className="mt-6 pt-6 border-t border-card-border">
      <h3 className="text-sm font-bold text-text-primary mb-3">{isLogin ? 'Login' : 'Create Account'} — {title}</h3>
      {error && <div className="mb-3 p-2.5 text-xs text-status-error bg-status-error-bg border border-status-error/20 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <input
            type="text"
            required
            placeholder={role === 'business' ? "Full Name / Establishment" : "Officer Name & Designation"}
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-card-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-amber-gold/50 focus:border-amber-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-sea-ink hover:bg-sea-teal text-cream font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isLogin ? 'Login' : 'Sign Up'}</span>}
        </button>
      </form>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-text-muted hover:text-sea-ink underline cursor-pointer"
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
    <div className="min-h-[calc(100vh-100px)] bg-cream flex flex-col justify-between">
      {/* ─── Dark Hero Section ─── */}
      <div className="bg-gradient-to-b from-deep-brown via-rust/80 to-sea-ink relative overflow-hidden">
        <div className="absolute inset-0 topo-pattern"></div>
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream/10 border border-cream/15 text-cream/90 text-xs font-semibold mb-5 backdrop-blur-sm">
            <Scale className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
            <span>National Verification Standard</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-cream tracking-tight leading-tight">
            TulaSETU
          </h1>
          <p className="mt-2 text-base sm:text-lg text-cream/60 leading-relaxed max-w-2xl mx-auto">
            Trusted verification for every scale — Statutory re-verification tracking and digital certificate issuing under Section 24 of the Legal Metrology Act, 2009.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => document.getElementById('role-cards')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 rounded-lg bg-amber-gold text-sea-ink font-semibold text-sm hover:bg-amber-gold/90 shadow-md transition-colors cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/verify')}
              className="px-6 py-3 rounded-lg bg-cream/10 border border-cream/20 text-cream font-semibold text-sm hover:bg-cream/20 transition-colors cursor-pointer backdrop-blur-sm"
            >
              Verify a Certificate
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14 w-full">
        {/* Two Role Selection Cards */}
        <div id="role-cards" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {/* Business User Card */}
          <div className="bg-card-white border border-card-border rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cream border border-card-border flex items-center justify-center text-amber-gold mb-5">
                <Building2 className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">For Businesses</p>
              <h2 className="text-xl font-bold text-text-primary">Commercial / Business User</h2>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Submit new instruments for mandatory verification, view active verification applications, and access downloadable digital certificates.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-text-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" strokeWidth={1.5} />
                  <span>Register commercial weighing scales & fuel measures</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" strokeWidth={1.5} />
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
          <div className="bg-card-white border border-card-border rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cream border border-card-border flex items-center justify-center text-amber-gold mb-5">
                <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">For Officers</p>
              <h2 className="text-xl font-bold text-text-primary">Legal Metrology Officer</h2>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Review submitted instruments, verify calibration accuracy, record physical inspection findings, and issue digitally signed certificates.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-text-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" strokeWidth={1.5} />
                  <span>Review pending verification queues in real-time</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" strokeWidth={1.5} />
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
        <div className="max-w-4xl mx-auto bg-sea-ink rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-gold text-sea-ink rounded-xl shrink-0 mt-0.5">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-cream">Public Consumer & Field Verification</h3>
              <p className="text-xs sm:text-sm text-cream/60 mt-0.5">
                Anyone can verify the authenticity and active validity of a stamped weight or measure without logging in.
              </p>
            </div>
          </div>
          <button
            id="public-verify-btn"
            onClick={() => navigate('/verify')}
            className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-gold text-sea-ink hover:bg-amber-gold/90 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
          >
            Verify Certificate Now
          </button>
        </div>

        {/* Statutory Schedule & Legal Guidelines Information */}
        <div className="max-w-4xl mx-auto mt-10 bg-card-white border border-card-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 text-text-primary font-semibold text-sm border-b border-card-border pb-3">
            <BookOpen className="w-4 h-4 text-amber-gold" strokeWidth={1.5} />
            <span>Statutory Reverification Schedules (Legal Metrology General Rules, 2011)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(INSTRUMENT_CATEGORIES).map(([category, details]) => (
              <div key={category} className="p-3 bg-cream rounded-xl border border-card-border text-xs">
                <span className="font-semibold text-text-primary block truncate">{category}</span>
                <span className="text-amber-gold font-bold mt-1 inline-block">
                  Validity: {details.reverificationMonths} Months
                </span>
              </div>
            ))}
          </div>

          {/* Legal Notice */}
          <div className="mt-5 p-3.5 rounded-xl bg-status-pending-bg border border-status-pending/20 flex items-start gap-2.5 text-xs text-text-primary">
            <AlertTriangle className="w-4 h-4 text-status-pending shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="leading-relaxed">
              <strong className="font-semibold">Legal Notice:</strong> {PENALTY_TEXT}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border bg-card-white py-4 text-center text-xs text-text-muted">
        <p>© TulaSETU • Legal Metrology Division • Government of India</p>
      </footer>
    </div>
  );
};
