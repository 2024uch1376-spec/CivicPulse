'use client';

import { Bot, Shield, User } from 'lucide-react';

interface TopHeaderProps {
  currentTab: 'dashboard' | 'map' | 'analytics' | 'community' | 'audit-ledger';
  userRole: 'admin' | 'citizen';
  setIsCopilotOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export default function TopHeader({
  currentTab,
  userRole,
  setIsCopilotOpen,
  searchQuery,
  setSearchQuery,
}: TopHeaderProps) {
  // Determine dynamic title based on active tab
  let title = "City Operations Center";
  let subtitle = "Track and fix city issues as they happen";

  if (currentTab === 'dashboard') {
    title = "City Overview";
    subtitle = "Key numbers on city safety and maintenance";
  } else if (currentTab === 'map') {
    title = "Live Issue Map";
    subtitle = "Find and report street, park, and utility problems";
  } else if (currentTab === 'analytics') {
    title = "AI Analytics Hub";
    subtitle = "Expected city risks and team workload";
  } else if (currentTab === 'community') {
    title = "Community Portal";
    subtitle = "See top helper citizens and claim rewards";
  } else if (currentTab === 'audit-ledger') {
    title = "System Activity Logs";
    subtitle = "Review recent automated decisions, system updates, and user actions.";
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0 transition-colors duration-300">
      
      {/* Title / Info block */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider leading-none">{title}</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{subtitle}</p>
        </div>
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border flex items-center gap-1 ${
          userRole === 'admin'
            ? 'bg-slate-150 border-slate-200 text-slate-650 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
            : 'bg-emerald-55 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
        }`}>
          {userRole === 'admin' ? (
            <>
              <Shield className="w-2.5 h-2.5" /> Admin Operations
            </>
          ) : (
            <>
              <User className="w-2.5 h-2.5" /> Citizen Hub
            </>
          )}
        </span>
      </div>

      {/* Action block - AI Copilot activator */}
      <div className="flex items-center gap-3">
        {userRole === 'admin' && (
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800/40 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            AI Copilot
          </button>
        )}
      </div>

    </header>
  );
}
