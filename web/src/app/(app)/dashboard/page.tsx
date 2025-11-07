import { BankrollPreview } from '@/components/bankroll-preview';
import { ConversationPane } from "@/components/chat/ConversationPane";
import { EdgeOpportunities } from '@/components/odds/EdgeOpportunities';
import { SmartNudges } from '@/components/insights/SmartNudges';

const operations = [
  {
    title: "Latency",
    value: "742 ms",
    helper: "Avg. LLM response time over last 20 requests"
  },
  {
    title: "Win rate delta",
    value: "+6.3%",
    helper: "Performance vs. sportsbook closing lines"
  },
  {
    title: "Data providers",
    value: "2 / 2",
    helper: "All odds endpoints and backups responsive"
  }
] as const;

const analyticsSignals = [
  {
    title: "Prompt capture",
    description: "`chat_prompt_submitted` fires with token length and quick prompt metadata."
  },
  {
    title: "Format toggles",
    description: "`odds_format_toggled` records user preference shifts for odds rendering."
  },
  {
    title: "Streaming completion",
    description: "`llm.answer.stream_completed` captures latency and fallback usage."
  }
] as const;

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-6 lg:flex-row">
      <div className="flex flex-1">
        <ConversationPane />
      </div>
      <aside className="flex w-full max-w-sm flex-col gap-6">
        <SmartNudges />
        <EdgeOpportunities />
        <BankrollPreview />
      </aside>
    </div>
  );
}
