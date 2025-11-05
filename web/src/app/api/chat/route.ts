import { NextRequest } from "next/server";
import { createSseResponse } from "@/lib/stream/sse";
import {
  planSportsTool,
  streamDeltaResponse,
  type DeltaChatMessage,
} from "@/lib/llm/openai";
import {
  fetchSportsData,
  type NormalizedSportsData,
  type SportsQuery,
} from "@/lib/tools/sports";
import { createChat, getChat, updateChat } from "@/lib/repos/chats";
import { prisma } from "@/lib/db";

interface ChatPayload {
  conversationId?: string;
  messages: DeltaChatMessage[];
  model: string;
  temperature?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatPayload;
  const { model, temperature } = body;
  let conversationId = body.conversationId;
  let conversation = conversationId ? await getChat(conversationId) : null;

  if (!conversation) {
    const titleSource =
      body.messages.find((m) => m.role === "user")?.content ?? "New chat";
    conversation = await createChat({
      title: titleSource.slice(0, 60),
      model,
    });
    conversationId = conversation.id;
  }

  const lastUser = [...body.messages]
    .reverse()
    .find((message) => message.role === "user");

  let sportsData: NormalizedSportsData | undefined;

  if (lastUser) {
    const plannedTool = planSportsTool(lastUser.content);
    if (plannedTool) {
      const sportsQuery: SportsQuery = {
        intent: plannedTool.intent,
        query: lastUser.content,
        league: plannedTool.league,
        market: plannedTool.market,
        team: plannedTool.team,
        player: plannedTool.player,
      };
      const response = await fetchSportsData(sportsQuery);
      sportsData = response.data;
    }
  }

  if (lastUser) {
    await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: lastUser.content,
      },
    });
  }

  const streamMessages: DeltaChatMessage[] = [
    {
      role: "system",
      content:
        "You are Delta, an informational sports betting assistant. Cite sources and include timestamps. Do not guarantee outcomes.",
    },
    ...body.messages,
  ];

  return createSseResponse(async ({ send, close }) => {
    try {
      if (sportsData) {
        send("tool", {
          name: "fetchSportsData",
          data: sportsData,
        });
      }

      let finalText = "";
      for await (const event of streamDeltaResponse(streamMessages, {
        model,
        temperature,
        sportsData,
      })) {
        if (event.type === "token") {
          finalText += event.value;
          send("token", event.value);
        } else if (event.type === "metadata") {
          send("metadata", event.value);
        } else if (event.type === "tool") {
          send("tool", event.value);
        } else if (event.type === "end") {
          finalText = event.value.text ?? finalText;
          send("done", {
            text: finalText,
            json: event.value.json,
            conversationId,
          });
        }
      }

      if (finalText.trim().length) {
        await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: finalText,
          },
        });
        await updateChat(conversationId!, {
          model,
        });
      }
    } catch (error) {
      send("error", { message: String(error) });
    } finally {
      close();
    }
  });
}
