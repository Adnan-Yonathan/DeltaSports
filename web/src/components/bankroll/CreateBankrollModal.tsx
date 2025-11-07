'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useState } from 'react';

type CreateBankrollModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
] as const;

export function CreateBankrollModal({ isOpen, onClose, onSuccess }: CreateBankrollModalProps) {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [label, setLabel] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!userProfile?.id) {
        setError('User profile not found');
        return;
      }

      if (!label.trim()) {
        setError('Bankroll name is required');
        return;
      }

      const balance = parseFloat(startingBalance);
      if (isNaN(balance) || balance < 0) {
        setError('Starting balance must be a valid positive number');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const { error: insertError } = await supabase.from('bankroll_accounts').insert({
          user_id: userProfile.id,
          label: label.trim(),
          currency,
          starting_balance: balance,
          current_balance: balance,
        });

        if (insertError) {
          console.error('Failed to create bankroll', insertError);
          setError('Failed to create bankroll. Please try again.');
        } else {
          setLabel('');
          setCurrency('USD');
          setStartingBalance('');
          onSuccess();
          onClose();
        }
      } catch (error) {
        console.error('Error creating bankroll', error);
        setError('An unexpected error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [userProfile, supabase, label, currency, startingBalance, onSuccess, onClose]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setLabel('');
      setCurrency('USD');
      setStartingBalance('');
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6">
        <h3 className="text-xl font-semibold text-white">Create New Bankroll</h3>
        <p className="mt-1 text-sm text-slate-400">
          Set up a new betting account to track your balance and performance.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-white">
              Bankroll Name
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Main Bankroll, DraftKings Account"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-white">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              disabled={isSubmitting}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startingBalance" className="block text-sm font-medium text-white">
              Starting Balance
            </label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                id="startingBalance"
                type="number"
                min="0"
                step="0.01"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="1000.00"
                className="w-full rounded-lg border border-white/10 bg-black/70 py-2 pl-8 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                disabled={isSubmitting}
                required
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Current balance will be set to this amount initially</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Bankroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
