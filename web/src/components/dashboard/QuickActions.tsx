'use client';

import { useState } from 'react';
import { LogBetModal } from '@/components/bankroll/LogBetModal';
import Link from 'next/link';

export function QuickActions() {
  const [showLogBetModal, setShowLogBetModal] = useState(false);

  const actions = [
    {
      id: 'log-bet',
      label: 'Log Bet',
      description: 'Quick bet entry',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => setShowLogBetModal(true),
    },
    {
      id: 'scan-odds',
      label: 'Scan Odds',
      description: 'Find value bets',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      href: '/odds-scanner',
    },
    {
      id: 'view-reports',
      label: 'Reports',
      description: 'Performance summary',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/reports',
    },
    {
      id: 'bankroll',
      label: 'Bankroll',
      description: 'Manage accounts',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/bankroll',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 sm:grid-cols-4">
        {actions.map((action) =>
          action.href ? (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 p-4 text-center transition hover:border-brand-accent/40 hover:bg-brand-accent/10"
            >
              <div className="rounded-lg bg-brand-accent/20 p-2 text-brand-accent">{action.icon}</div>
              <p className="mt-2 text-sm font-semibold text-white">{action.label}</p>
              <p className="text-xs text-slate-400">{action.description}</p>
            </Link>
          ) : (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 p-4 text-center transition hover:border-brand-accent/40 hover:bg-brand-accent/10"
            >
              <div className="rounded-lg bg-brand-accent/20 p-2 text-brand-accent">{action.icon}</div>
              <p className="mt-2 text-sm font-semibold text-white">{action.label}</p>
              <p className="text-xs text-slate-400">{action.description}</p>
            </button>
          )
        )}
      </div>

      <LogBetModal
        isOpen={showLogBetModal}
        onClose={() => setShowLogBetModal(false)}
        onSuccess={() => {
          // Optionally refresh data
        }}
      />
    </>
  );
}
