export function getErrorMessage(error: unknown, fallback = "Något gick fel. Försök igen."): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    // Some libraries throw non-Error objects with a message
    const maybeMsg = (error as any).message;
    if (typeof maybeMsg === "string") return maybeMsg;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}
