import { ConversationPane } from "@/components/chat/ConversationPane";
import { WidgetRail } from "@/components/widgets/WidgetRail";
import { ChatSessionProvider } from "@/lib/chat/useChatSession";

export default function DashboardPage() {
  return (
    <ChatSessionProvider>
      <div className="flex h-full flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex flex-1">
          <ConversationPane />
        </div>
        <WidgetRail />
      </div>
    </ChatSessionProvider>
  );
}
