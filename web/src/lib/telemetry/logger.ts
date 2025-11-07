import pino from "pino";

let cachedLogger: pino.Logger | null = null;

export const getLogger = (): pino.Logger => {
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
