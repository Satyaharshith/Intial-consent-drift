import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Persistent Specification Disclaimer Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-3 px-4 text-center text-[11px] text-slate-500 shrink-0">
          Findings are potential discrepancies based on submitted evidence. They are not proof of misuse or a legal violation.
        </footer>
      </div>
    </div>
  );
};
