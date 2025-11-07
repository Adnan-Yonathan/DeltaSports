"use client";

import { useEffect, useRef } from "react";

import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ConversationMessage } from "./types";

type MessageListProps = {
  messages: readonly ConversationMessage[];
  isStreaming: boolean;
};

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6 pb-32">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isStreaming ? <TypingIndicator /> : null}
    </div>
  );
}

export default MessageList;
