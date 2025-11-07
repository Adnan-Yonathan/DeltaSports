import pino from "pino";

type LoggerInstance = ReturnType<typeof pino>;

let cachedLogger: LoggerInstance | null = null;

export const getLogger = (): LoggerInstance => {
  if (cachedLogger) {
    return cachedLogger;
  }

  cachedLogger = pino({
    name: "delta-command-center",
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    redact: {
      paths: ["req.headers.authorization", "apiKey"],
      remove: true,
    },
  });

  return cachedLogger;
};
