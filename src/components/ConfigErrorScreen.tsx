import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfigErrorScreenProps {
  message: string;
}

export const ConfigErrorScreen: React.FC<ConfigErrorScreenProps> = ({ message }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Configuration required</h1>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
      <p className="mt-4 text-xs text-slate-500">
        Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code> for local
        development. On Vercel, set the same <code className="font-mono">VITE_FIREBASE_*</code> names for Production
        and Redeploy.
      </p>
    </div>
  </div>
);
