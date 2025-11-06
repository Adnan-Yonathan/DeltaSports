export default function FilesPage() {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6">
      <h3 className="text-xl font-semibold text-white">File Vault</h3>
      <p className="text-sm text-slate-300">
        Centralize CSV uploads, odds exports, and compliance documents for rapid retrieval.
      </p>
      <p className="text-xs text-slate-400">
        File syncing is on the roadmap. We’ll surface ingestion status, previews, and permissions soon.
      </p>
    </div>
  );
}
