export type OpsLogLevel = "info" | "warn" | "error";

const log = (level: OpsLogLevel, message: string, context?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...(context ? { context } : {}) };
  const serialized = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    default:
      console.info(serialized);
  }
};

export const logToolEvent = (
  level: OpsLogLevel,
  message: string,
  context?: Record<string, unknown>
) => {
  log(level, message, context);
};

export const logGuardrailEvent = (
  level: OpsLogLevel,
  message: string,
  context?: Record<string, unknown>
) => {
  log(level, message, context);
};
