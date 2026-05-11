export function normalizeEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();

  return normalized || null;
}

export function normalizeDevAuthCode(code: string | null | undefined) {
  const normalized = code?.trim();

  return normalized || null;
}
