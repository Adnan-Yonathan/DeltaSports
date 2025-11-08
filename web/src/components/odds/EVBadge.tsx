/**
 * EV Badge Component
 * Shows expected value with color-coded tiers
 */

interface EVBadgeProps {
  evPercentage: number;
  size?: "sm" | "md" | "lg";
}

export function EVBadge({ evPercentage, size = "md" }: EVBadgeProps) {
  // Color coding based on EV percentage
  const getColorClass = () => {
    if (evPercentage >= 5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (evPercentage >= 2) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const getSizeClass = () => {
    if (size === "sm") return "text-xs px-2 py-0.5";
    if (size === "lg") return "text-base px-3 py-1.5";
    return "text-sm px-2.5 py-1";
  };

  const getIcon = () => {
    if (evPercentage >= 5) return "🟢";
    if (evPercentage >= 2) return "🟡";
    return "⚪";
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${getColorClass()} ${getSizeClass()}`}
      title={`Expected Value: ${evPercentage.toFixed(1)}%`}
    >
      <span className="text-xs">{getIcon()}</span>
      <span>{evPercentage >= 0 ? "+" : ""}{evPercentage.toFixed(1)}% EV</span>
    </span>
  );
}
