const STORAGE_KEY = "deltasports:chat:session";

export type StoredChatSession<TMessage> = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: readonly TMessage[];
  distinctId: string | null;
};

export const readStoredSession = <TMessage>(): StoredChatSession<TMessage> | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredChatSession<TMessage> | undefined;
    if (!parsed || !parsed.id || !Array.isArray(parsed.messages)) {
      return null;
    }

    return parsed;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to read chat session from storage", error);
    }
    return null;
  }
};

export const persistStoredSession = <TMessage>(session: StoredChatSession<TMessage>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to persist chat session", error);
    }
  }
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to clear chat session", error);
    }
  }
};
