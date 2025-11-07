'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

const SPORT_OPTIONS = [
  { value: 'basketball_nba', label: 'NBA' },
  { value: 'basketball_ncaab', label: 'NCAA Basketball' },
  { value: 'football_nfl', label: 'NFL' },
  { value: 'football_ncaaf', label: 'NCAA Football' },
  { value: 'baseball_mlb', label: 'MLB' },
  { value: 'hockey_nhl', label: 'NHL' },
  { value: 'soccer_epl', label: 'English Premier League' },
  { value: 'mma_ufc', label: 'UFC/MMA' },
] as const;

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
] as const;

export default function SettingsPage() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [preferredTimezone, setPreferredTimezone] = useState('UTC');
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [bankrollGoal, setBankrollGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userProfile) {
      setPreferredTimezone(userProfile.preferred_timezone);
      setFavoriteSports(userProfile.favorite_sports || []);
      setBankrollGoal(userProfile.bankroll_goal ? String(userProfile.bankroll_goal) : '');
    }
  }, [userProfile]);

  const handleSportToggle = useCallback((sportValue: string) => {
    setFavoriteSports((current) => {
      if (current.includes(sportValue)) {
        return current.filter((s) => s !== sportValue);
      }
      return [...current, sportValue];
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!userProfile) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const parsedBankrollGoal = bankrollGoal.trim() ? parseFloat(bankrollGoal) : null;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferred_timezone: preferredTimezone,
          favorite_sports: favoriteSports,
          bankroll_goal: parsedBankrollGoal,
        })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Failed to update profile', error);
        setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      } else {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error updating profile', error);
      setSaveMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [userProfile, supabase, preferredTimezone, favoriteSports, bankrollGoal]);

  if (!userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-white">Profile Settings</h3>
        <p className="mt-1 text-sm text-slate-300">
          Customize your betting preferences and display settings.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-white/5 bg-black/40 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-white">
              Preferred Timezone
            </label>
            <p className="mt-1 text-xs text-slate-400">
              All times in the app will be displayed in this timezone.
            </p>
            <select
              id="timezone"
              value={preferredTimezone}
              onChange={(e) => setPreferredTimezone(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Favorite Sports</label>
            <p className="mt-1 text-xs text-slate-400">
              Select sports you follow. This helps personalize your dashboard and alerts.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
              {SPORT_OPTIONS.map((sport) => {
                const isSelected = favoriteSports.includes(sport.value);
                return (
                  <button
                    key={sport.value}
                    type="button"
                    onClick={() => handleSportToggle(sport.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                        : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {sport.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="bankrollGoal" className="block text-sm font-medium text-white">
              Bankroll Goal (Optional)
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Set a target bankroll to track your progress over time.
            </p>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                id="bankrollGoal"
                type="number"
                min="0"
                step="100"
                value={bankrollGoal}
                onChange={(e) => setBankrollGoal(e.target.value)}
                placeholder="5000"
                className="w-full rounded-lg border border-white/10 bg-black/70 py-2 pl-8 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          {saveMessage ? (
            <p
              className={`text-sm font-medium ${
                saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {saveMessage.text}
            </p>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-brand-accent px-6 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <h4 className="text-lg font-semibold text-white">Account Information</h4>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Profile ID</span>
            <span className="font-mono text-xs text-white">{userProfile.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Account Created</span>
            <span className="text-white">
              {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last Updated</span>
            <span className="text-white">
              {new Date(userProfile.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
