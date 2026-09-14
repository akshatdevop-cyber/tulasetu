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

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      {/* Top National Portal Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white tracking-wide">GOVERNMENT OF INDIA</span>
          <span className="text-slate-500">•</span>
          <span>Ministry of Consumer Affairs, Food & Public Distribution</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-blue-300">Tulasetu</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] mt-1 sm:mt-0">
          <span className="text-slate-400">Standard Time: IST</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                Tulasetu
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Standard Weights & Measures Inspection System
              </div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/verify"
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${
                location.pathname === '/verify'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Verify Certificate</span>
            </Link>

            {role === 'business' && (
              <>
                <Link
                  to="/business"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors ${
                    location.pathname === '/business'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  to="/apply"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors ${
                    location.pathname === '/apply'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  New Application
                </Link>
              </>
            )}

            {role === 'officer' && (
              <Link
                to="/officer"
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/officer'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Inspection Queue</span>
              </Link>
            )}

            {/* Role indicator & Logout */}
            {role ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <span className="hidden md:inline-flex flex-col items-end mr-2">
                  <span className="text-xs font-bold text-slate-900 leading-none">{userName}</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {role === 'business' ? 'Business User' : 'Metrology Officer'}
                </span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                  title="Logout and return to role selector"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 hover:bg-blue-50 rounded"
              >
                Switch Role
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
