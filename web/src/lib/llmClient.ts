export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type AssistantMessage = {
  role: "assistant";
  content: string | null;
  tool_calls?: ToolCall[];
};

export type UserMessage = {
  role: "user";
  content: string;
};

export type ToolMessage = {
  role: "tool";
  content: string;
  tool_call_id: string;
};

export type Message =
  | UserMessage
  | AssistantMessage
  | ToolMessage
  | { role: "system"; content: string };

export type AssistantResponse = {
  message: AssistantMessage;
};

export type ToolHandler = (args: {
  id: string;
  name: string;
  arguments: string;
  message: ToolCall["function"];
}) => Promise<string> | string;

export type LlmClientOptions = {
  callModel: (messages: readonly Message[]) => Promise<AssistantResponse>;
  tools?: Record<string, ToolHandler>;
  initialMessages?: readonly Message[];
};

export class LlmClient {
  private readonly callModel: LlmClientOptions["callModel"];
  private readonly tools: Record<string, ToolHandler>;
  private readonly messages: Message[];

  constructor({ callModel, tools, initialMessages }: LlmClientOptions) {
    this.callModel = callModel;
    this.tools = tools ? { ...tools } : {};
    this.messages = initialMessages ? [...initialMessages] : [];
  }

  get history(): readonly Message[] {
    return this.messages;
  }

  async send(content: string): Promise<AssistantMessage> {
    const userMessage: UserMessage = { role: "user", content };
    this.messages.push(userMessage);

    let response = await this.callModel([...this.messages]);

    while (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: response.message.content,
        tool_calls: response.message.tool_calls,
      };
      this.messages.push(assistantMessage);

      for (const toolCall of response.message.tool_calls) {
        const handler = this.tools[toolCall.function.name];
        if (!handler) {
          throw new Error(`No handler registered for tool ${toolCall.function.name}`);
        }

        const result = await handler({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
          message: toolCall.function,
        });

        const toolMessage: ToolMessage = {
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        };
        this.messages.push(toolMessage);
      }

      response = await this.callModel([...this.messages]);
    }

    const finalAssistantMessage: AssistantMessage = {
      role: "assistant",
      content: response.message.content,
      tool_calls: response.message.tool_calls,
    };
    this.messages.push(finalAssistantMessage);

    return finalAssistantMessage;
  }
}
