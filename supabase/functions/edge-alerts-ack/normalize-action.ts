export function normalizeAction(action?: string): string {
  if (!action) {
    return "acknowledged";
  }
  const trimmed = action.trim();
  return trimmed.length > 0 ? trimmed : "acknowledged";
}
