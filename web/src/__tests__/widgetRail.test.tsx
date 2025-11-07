import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppQueryProvider } from "@/components/providers/QueryProvider";
import { WidgetRail } from "@/components/widgets/WidgetRail";
import { ChatSessionProvider } from "@/lib/chat/useChatSession";

describe("WidgetRail", () => {
  it("renders seed widgets", () => {
    render(
      <AppQueryProvider>
        <ChatSessionProvider>
          <WidgetRail />
        </ChatSessionProvider>
      </AppQueryProvider>
    );

    expect(screen.getByText(/Live widgets/i)).toBeInTheDocument();
  });
});
