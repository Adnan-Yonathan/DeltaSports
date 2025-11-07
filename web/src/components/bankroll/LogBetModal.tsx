'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type LogBetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedBankrollId?: string;
};

type BankrollAccount = {
  id: string;
  label: string;
  currency: string;
};

const MARKET_OPTIONS = [
  { value: 'moneyline', label: 'Moneyline (ML)' },
  { value: 'spread', label: 'Spread' },
  { value: 'total', label: 'Total (Over/Under)' },
  { value: 'prop', label: 'Player Prop' },
  { value: 'parlay', label: 'Parlay' },
  { value: 'futures', label: 'Futures' },
  { value: 'other', label: 'Other' },
] as const;

const BEHAVIORAL_TAGS = [
  { value: 'value_bet', label: 'Value Bet', description: 'Identified value opportunity', color: 'emerald' },
  { value: 'research', label: 'Research-Based', description: 'Thorough analysis', color: 'blue' },
  { value: 'sharp', label: 'Sharp Money', description: 'Following sharp action', color: 'purple' },
  { value: 'system', label: 'System Play', description: 'Part of betting system', color: 'cyan' },
  { value: 'hedge', label: 'Hedge', description: 'Hedging position', color: 'slate' },
  { value: 'confident', label: 'High Confidence', description: 'Strong conviction', color: 'green' },
  { value: 'public_fade', label: 'Public Fade', description: 'Fading public sentiment', color: 'indigo' },
  { value: 'impulse', label: 'Impulse', description: 'Quick decision', color: 'amber' },
  { value: 'tilt', label: 'Tilt', description: 'Emotional betting', color: 'red' },
  { value: 'chasing_losses', label: 'Chasing Losses', description: 'Trying to recover', color: 'orange' },
] as const;

export function LogBetModal({ isOpen, onClose, onSuccess, selectedBankrollId }: LogBetModalProps) {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [bankrolls, setBankrolls] = useState<BankrollAccount[]>([]);
  const [bankrollId, setBankrollId] = useState(selectedBankrollId || '');
  const [eventName, setEventName] = useState('');
  const [market, setMarket] = useState('moneyline');
  const [wagerAmount, setWagerAmount] = useState('');
  const [americanOdds, setAmericanOdds] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch bankrolls when modal opens
  useEffect(() => {
    const fetchBankrolls = async () => {
      if (!isOpen || !userProfile?.id) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bankroll_accounts')
          .select('id, label, currency')
          .eq('user_id', userProfile.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch bankrolls', error);
        } else {
          setBankrolls((data as BankrollAccount[]) || []);
          if (data && data.length > 0 && !bankrollId) {
            setBankrollId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching bankrolls', error);
      }
    };

    void fetchBankrolls();
  }, [isOpen, userProfile, supabase, bankrollId]);

  // Calculate decimal odds from American odds
  const decimalOdds = americanOdds
    ? (() => {
        const odds = parseInt(americanOdds);
        if (isNaN(odds)) return null;
        if (odds > 0) {
          return (odds / 100 + 1).toFixed(4);
        } else {
          return (100 / Math.abs(odds) + 1).toFixed(4);
        }
      })()
    : null;

  // Calculate potential payout
  const potentialPayout = wagerAmount && decimalOdds
    ? (parseFloat(wagerAmount) * parseFloat(decimalOdds)).toFixed(2)
    : null;

  const toggleTag = useCallback((tagValue: string) => {
    setSelectedTags((current) => {
      if (current.includes(tagValue)) {
        return current.filter((t) => t !== tagValue);
      }
      return [...current, tagValue];
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!userProfile?.id) {
        setError('User profile not found');
        return;
      }

      if (!bankrollId) {
        setError('Please select a bankroll');
        return;
      }

      if (!eventName.trim()) {
        setError('Event name is required');
        return;
      }

      const wager = parseFloat(wagerAmount);
      if (isNaN(wager) || wager <= 0) {
        setError('Wager amount must be a valid positive number');
        return;
      }

      const odds = parseInt(americanOdds);
      if (isNaN(odds)) {
        setError('American odds must be a valid number');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Insert bet
        const { data: betData, error: insertError } = await supabase
          .from('bets')
          .insert({
            user_id: userProfile.id,
            bankroll_id: bankrollId,
            event_name: eventName.trim(),
            market,
            wager_amount: wager,
            american_odds: odds,
            decimal_odds: decimalOdds ? parseFloat(decimalOdds) : null,
            notes: notes.trim() || null,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to log bet', insertError);
          setError('Failed to log bet. Please try again.');
          return;
        }

        // Insert behavioral tags if any selected
        if (betData && selectedTags.length > 0) {
          const tagInserts = selectedTags.map((tag) => ({
            bet_id: betData.id,
            tag,
          }));

          const { error: tagsError } = await supabase.from('bet_tags').insert(tagInserts);

          if (tagsError) {
            console.error('Failed to insert bet tags', tagsError);
            // Don't fail the whole operation if tags fail
          }
        }

        // Reset form
        setEventName('');
        setMarket('moneyline');
        setWagerAmount('');
        setAmericanOdds('');
        setNotes('');
        setSelectedTags([]);
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error logging bet', error);
        setError('An unexpected error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [userProfile, supabase, bankrollId, eventName, market, wagerAmount, americanOdds, decimalOdds, notes, selectedTags, onSuccess, onClose]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setEventName('');
      setMarket('moneyline');
      setWagerAmount('');
      setAmericanOdds('');
      setNotes('');
      setSelectedTags([]);
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-black/90 p-6">
        <h3 className="text-xl font-semibold text-white">Log Bet</h3>
        <p className="mt-1 text-sm text-slate-400">Record a new bet placed with a sportsbook.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="bankroll" className="block text-sm font-medium text-white">
              Bankroll Account
            </label>
            <select
              id="bankroll"
              value={bankrollId}
              onChange={(e) => setBankrollId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              disabled={isSubmitting || bankrolls.length === 0}
              required
            >
              {bankrolls.length === 0 ? (
                <option>No bankrolls available</option>
              ) : (
                bankrolls.map((br) => (
                  <option key={br.id} value={br.id}>
                    {br.label} ({br.currency})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-white">
              Event / Game
            </label>
            <input
              id="eventName"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Lakers vs Celtics, Patriots @ Chiefs"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="market" className="block text-sm font-medium text-white">
              Market Type
            </label>
            <select
              id="market"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              disabled={isSubmitting}
            >
              {MARKET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wagerAmount" className="block text-sm font-medium text-white">
                Wager Amount
              </label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  id="wagerAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full rounded-lg border border-white/10 bg-black/70 py-2 pl-8 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="americanOdds" className="block text-sm font-medium text-white">
                American Odds
              </label>
              <input
                id="americanOdds"
                type="number"
                value={americanOdds}
                onChange={(e) => setAmericanOdds(e.target.value)}
                placeholder="-110 or +150"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {decimalOdds && potentialPayout && (
            <div className="rounded-lg border border-brand-accent/20 bg-brand-accent/5 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Decimal Odds:</span>
                <span className="font-medium text-white">{decimalOdds}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-400">Potential Payout:</span>
                <span className="font-semibold text-brand-accent">${potentialPayout}</span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-white">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reasoning, context, or tags..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Behavioral Tags (Optional)
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Tag this bet to track betting patterns and psychology
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {BEHAVIORAL_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.value);
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    disabled={isSubmitting}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition disabled:opacity-50 ${
                      isSelected
                        ? 'border-brand-accent/60 bg-brand-accent/20 text-brand-accent'
                        : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                    title={tag.description}
                  >
                    <span className="block font-medium">{tag.label}</span>
                    <span className="mt-0.5 block text-[10px] opacity-70">{tag.description}</span>
                  </button>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2 text-xs text-slate-400">
                {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
              </div>
            )}
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
              disabled={isSubmitting || bankrolls.length === 0}
              className="flex-1 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Log Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
