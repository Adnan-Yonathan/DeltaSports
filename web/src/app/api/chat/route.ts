import { MessageRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { buildSystemPrompt, streamOpenAIChat } from "@/lib/llm/openai";
import { createSSEStream } from "@/lib/stream/sse";
import { createMessage } from "@/lib/repos/messages";
import { getChat, updateChat } from "@/lib/repos/chats";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationId, messages, model, temperature, tools } = body ?? {};

  if (!conversationId) {
    return new Response(JSON.stringify({ error: "conversationId is required" }), {
      status: 400,
    });
  }

  const conversation = await getChat(conversationId);
  if (!conversation) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
  }

  const userMessage = messages?.[messages.length - 1];
  if (!userMessage) {
    return new Response(JSON.stringify({ error: "No message provided" }), { status: 400 });
  }

  const { stream, emitter } = createSSEStream();

  queueMicrotask(async () => {
    try {
      await createMessage({
        conversationId,
        role: MessageRole.user,
        content: { text: userMessage.content },
      });
      await updateChat(conversationId, { updatedAt: new Date() });

      let assistantBuffer = "";

      await streamOpenAIChat({
        messages: [
          { role: MessageRole.system, content: buildSystemPrompt() },
          ...messages.map((message: any) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        model: model ?? conversation.model,
        temperature: temperature ?? 0.2,
        tools,
        onToken(token) {
          assistantBuffer += token;
          emitter.send("token", { delta: token });
        },
        onToolCall(name, args) {
          emitter.send("tool", { name, args });
        },
        onDone(metadata) {
          emitter.send("done", metadata ?? {});
        },
      });

      await createMessage({
        conversationId,
        role: MessageRole.assistant,
        content: {
          text: assistantBuffer.trim(),
          meta: { disclaimer: "Delta is informational only; not betting advice." },
        },
      });
      await updateChat(conversationId, { updatedAt: new Date() });
      emitter.close();
    } catch (error: any) {
      emitter.send("error", { message: error?.message ?? "Unknown error" });
      emitter.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
