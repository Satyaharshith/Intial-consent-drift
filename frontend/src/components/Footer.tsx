import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-xs text-slate-500 space-x-2">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
        <p className="text-center font-medium">
          Findings are potential discrepancies based on submitted evidence. They are not proof of misuse or a legal violation.
        </p>
      </div>
    </footer>
  );
};
