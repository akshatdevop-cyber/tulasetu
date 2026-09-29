import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfigErrorScreenProps {
  message: string;
}

export const ConfigErrorScreen: React.FC<ConfigErrorScreenProps> = ({ message }) => (
  <div className="min-h-screen bg-cream flex items-center justify-center px-4">
    <div className="max-w-lg w-full bg-card-white border border-card-border rounded-2xl shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-status-pending-bg text-status-pending flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-bold text-text-primary">Configuration required</h1>
      <p className="mt-2 text-sm text-text-muted leading-relaxed">{message}</p>
      <p className="mt-4 text-xs text-text-muted">
        Copy <code className="font-mono bg-cream px-1 py-0.5 rounded border border-card-border">.env.example</code> to <code className="font-mono bg-cream px-1 py-0.5 rounded border border-card-border">.env</code> for local
        development. On Vercel, set the same <code className="font-mono bg-cream px-1 py-0.5 rounded border border-card-border">VITE_FIREBASE_*</code> names for Production
        and Redeploy.
      </p>
    </div>
  </div>
);
