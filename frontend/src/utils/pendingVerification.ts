const STORAGE_KEY = "pendingVerificationEmail";

export function setPendingVerificationEmail(email: string) {
  sessionStorage.setItem(STORAGE_KEY, email);
}

export function getPendingVerificationEmail(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearPendingVerificationEmail() {
  sessionStorage.removeItem(STORAGE_KEY);
}
