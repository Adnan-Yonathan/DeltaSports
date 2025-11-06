export default function SettingsPage() {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6">
      <h3 className="text-xl font-semibold text-white">Workspace Settings</h3>
      <p className="text-sm text-slate-300">
        Configure notifications, edge thresholds, and collaboration preferences for your team.
      </p>
      <p className="text-xs text-slate-400">
        Personalization controls are in progress. Soon you’ll tune alert cadence, tones, and integrations here.
      </p>
    </div>
  );
}
