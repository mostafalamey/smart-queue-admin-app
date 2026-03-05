// ─── User identity stored across the session ────────────────────────────────
const USER_KEY = "sq_user";

export interface StoredUser {
  id: string;
  email: string;
  name?: string | null;
  role: "ADMIN" | "IT" | "MANAGER" | "STAFF";
  departmentId?: string;
  mustChangePassword: boolean;
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}
