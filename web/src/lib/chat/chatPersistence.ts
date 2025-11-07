import { getSupabaseClient } from '@/lib/supabaseClient';
import type { ConversationMessage, AssistantMessage, UserMessage } from '@/components/chat/types';

export type ChatSession = {
  id: string;
  user_id: string;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: any;
  created_at: string;
};

/**
 * Create a new chat session in the database
 */
export async function createChatSession(userId: string, title?: string): Promise<ChatSession | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title: title ?? null,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create chat session', error);
    return null;
  }

  return data as ChatSession;
}

/**
 * Update a chat session's last message timestamp and optionally title
 */
export async function updateChatSession(
  sessionId: string,
  updates: { title?: string; last_message_at?: string }
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('chat_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update chat session', error);
  }
}

/**
 * Save a message to the database
 */
export async function saveChatMessage(
  sessionId: string,
  message: ConversationMessage
): Promise<ChatMessage | null> {
  const supabase = getSupabaseClient();

  // Prepare metadata based on message role
  let metadata: any = {};
  if (message.role === 'assistant') {
    const assistantMsg = message as AssistantMessage;
    metadata = {
      headline: assistantMsg.headline,
      summary: assistantMsg.summary,
      odds: assistantMsg.odds,
      sections: assistantMsg.sections,
      sources: assistantMsg.sources,
      warnings: assistantMsg.warnings,
      status: assistantMsg.status,
      error: assistantMsg.error,
    };
  }

  const content = message.role === 'user' ? (message as UserMessage).content : '';

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role: message.role,
      content,
      metadata: metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save chat message', error);
    return null;
  }

  return data as ChatMessage;
}

/**
 * Load all chat sessions for a user
 */
export async function loadUserChatSessions(userId: string): Promise<ChatSession[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to load chat sessions', error);
    return [];
  }

  return (data as ChatSession[]) || [];
}

/**
 * Load messages for a specific chat session
 */
export async function loadChatMessages(sessionId: string): Promise<ConversationMessage[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load chat messages', error);
    return [];
  }

  const messages = (data as ChatMessage[]) || [];

  // Convert database messages to ConversationMessage format
  return messages.map((msg) => {
    if (msg.role === 'user') {
      return {
        id: msg.id,
        role: 'user',
        content: msg.content,
        createdAt: new Date(msg.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        }) + ' ET',
      } as UserMessage;
    } else {
      const metadata = msg.metadata || {};
      return {
        id: msg.id,
        role: 'assistant',
        createdAt: new Date(msg.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        }) + ' ET',
        headline: metadata.headline ?? 'Short answer',
        summary: metadata.summary ?? '',
        odds: metadata.odds ?? {},
        sections: metadata.sections ?? [],
        sources: metadata.sources ?? [],
        warnings: metadata.warnings ?? [],
        status: metadata.status ?? 'complete',
        error: metadata.error,
      } as AssistantMessage;
    }
  });
}

/**
 * Generate a title for a chat session based on the first user message
 */
export function generateSessionTitle(firstUserMessage: string): string {
  // Truncate to first 50 characters and add ellipsis if needed
  if (firstUserMessage.length <= 50) {
    return firstUserMessage;
  }
  return firstUserMessage.substring(0, 50).trim() + '...';
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  // Messages will be cascade deleted due to foreign key constraint
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to delete chat session', error);
    return false;
  }

  return true;
}
