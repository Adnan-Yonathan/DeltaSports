"use client";

import { useEffect, useRef } from "react";

import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ConversationMessage, OddsFormat } from "./types";

type MessageListProps = {
  messages: readonly ConversationMessage[];
  oddsFormat: OddsFormat;
  isStreaming: boolean;
};

export function MessageList({ messages, oddsFormat, isStreaming }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-40 pt-24 sm:px-6 md:px-10"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} oddsFormat={oddsFormat} />
      ))}
      {isStreaming ? <TypingIndicator /> : null}
    </div>
  );
}

export default MessageList;
