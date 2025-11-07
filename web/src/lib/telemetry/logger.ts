export type LoggerInstance = {
  info: (payload: unknown, message?: string) => void;
  warn: (payload: unknown, message?: string) => void;
  error: (payload: unknown, message?: string) => void;
};

let cachedLogger: LoggerInstance | null = null;

const log = (level: "info" | "warn" | "error", payload: unknown, message?: string) => {
  const prefix = "[delta-command-center]";
  const text = message ? `${prefix} ${message}` : prefix;
  const entry = payload ?? {};

  switch (level) {
    case "info":
      console.info(text, entry);
      break;
    case "warn":
      console.warn(text, entry);
      break;
    case "error":
      console.error(text, entry);
      break;
    default:
      console.log(text, entry);
  }
};

export const getLogger = (): LoggerInstance => {
  if (!cachedLogger) {
    cachedLogger = {
      info: (payload, message) => log("info", payload, message),
      warn: (payload, message) => log("warn", payload, message),
      error: (payload, message) => log("error", payload, message),
    };
  }

  return cachedLogger;
};
