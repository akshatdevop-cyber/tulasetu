import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, LogOut, ShieldCheck, FileText, User, CheckCircle2, RotateCcw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { role, logoutUser, userName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50">
      {/* Top National Portal Bar */}
      <div className="bg-sea-ink text-cream/70 text-xs px-4 py-1.5 flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-cream tracking-wide">GOVERNMENT OF INDIA</span>
          <span className="text-cream/30">•</span>
          <span>Ministry of Consumer Affairs, Food & Public Distribution</span>
          <span className="text-cream/30 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-amber-gold font-semibold">TulaSETU</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] mt-1 sm:mt-0">
          <span className="text-cream/40">Standard Time: IST</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-sea-ink border-b border-sea-teal/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Portal Title */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-amber-gold text-sea-ink flex items-center justify-center shadow-sm">
                <Scale className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-base font-bold text-cream leading-tight group-hover:text-amber-gold transition-colors">
                  TulaSETU
                </div>
                <div className="text-[11px] text-cream/50 font-medium">
                  Trusted verification for every scale
                </div>
              </div>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Link
                to="/verify"
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/verify')
                    ? 'bg-cream/10 text-amber-gold border-b-2 border-amber-gold'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                }`}
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span>Verify Certificate</span>
              </Link>

              {role === 'business' && (
                <>
                  <Link
                    to="/business"
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      isActive('/business')
                        ? 'bg-cream/10 text-amber-gold border-b-2 border-amber-gold'
                        : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                    }`}
                  >
                    My Dashboard
                  </Link>
                  <Link
                    to="/apply"
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      isActive('/apply')
                        ? 'bg-cream/10 text-amber-gold border-b-2 border-amber-gold'
                        : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                    }`}
                  >
                    New Application
                  </Link>
                </>
              )}

              {role === 'officer' && (
                <Link
                  to="/officer"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/officer')
                      ? 'bg-cream/10 text-amber-gold border-b-2 border-amber-gold'
                      : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                  }`}
                >
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  <span>Inspection Queue</span>
                </Link>
              )}

              {/* Role indicator & Logout */}
              {role ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-cream/15">
                  <span className="hidden md:inline-flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-cream leading-none">{userName}</span>
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sea-teal/60 text-cream/90 border border-cream/10">
                    <User className="w-3.5 h-3.5 text-amber-gold" strokeWidth={1.5} />
                    {role === 'business' ? 'Business User' : 'Metrology Officer'}
                  </span>
                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    className="px-2.5 py-1.5 text-xs sm:text-sm font-medium text-cream/60 hover:text-pin-red hover:bg-pin-red/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Logout and return to role selector"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-amber-gold hover:bg-amber-gold/10 rounded-lg"
                >
                  Switch Role
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
