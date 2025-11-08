/**
 * Odds Scanner Page
 * Route: /odds
 */

import { OddsScanner } from "@/components/odds/OddsScanner";

export default function OddsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <OddsScanner />
      </div>
    </div>
  );
}
